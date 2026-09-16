import { describe, expect, it } from "vitest";
import { applyEffects, choose, indexContent, newGame, nextEvent } from "./engine";
import { scenarios } from "@/content/scenarios";
import { resilience } from "./finance";
import { summarize } from "./results";
import { makeRng } from "./rng";

const content = indexContent(scenarios);
const start = (seed = 1) => nextEvent(content, newGame(content, seed));

/** Plays until `id` is the current event (or the month ends), choosing `pick(id)` along the way. */
function playUntil(seed: number, id: string, pick: (id: string) => string = () => "") {
  let s = start(seed);
  while (s.phase === "playing" && s.current !== id) {
    const sc = content.byId[s.current!];
    if (sc.choices.length) {
      const wanted = pick(sc.id);
      const c = sc.choices.find((x) => x.id === wanted && !(x.requires && x.requires(s))) ?? sc.choices.find((x) => !(x.requires && x.requires(s)))!;
      s = choose(content, s, c.id);
    }
    s = nextEvent(content, s);
  }
  return s;
}

describe("rng", () => {
  it("is deterministic for a seed", () => {
    const a = makeRng(42), b = makeRng(42);
    expect([a.next(), a.next(), a.int(1, 6)]).toEqual([b.next(), b.next(), b.int(1, 6)]);
  });
});

describe("applyEffects", () => {
  it("moves money, records transactions and deltas", () => {
    const s = newGame(content, 1);
    const { state, deltas } = applyEffects(s, [{ type: "checking", amount: -80 }, { type: "transfer", from: "checking", to: "savings", amount: 50 }], "test");
    expect(state.checking).toBe(-70);
    expect(state.savings).toBe(150);
    expect(deltas).toMatchObject({ checking: -130, savings: 50 });
    expect(state.transactions).toHaveLength(3);
    expect(s.checking).toBe(60); // pure
  });
  it("clamps life and credit and floors debt at zero", () => {
    const s = newGame(content, 1);
    const { state } = applyEffects(s, [{ type: "life", amount: 200 }, { type: "credit", amount: -999 }, { type: "debt", amount: -50 }], "t");
    expect(state.life).toBe(100);
    expect(state.credit).toBe(300);
    expect(state.debt).toBe(0);
  });
  it("schedules and cancels queued scenarios", () => {
    const s = { ...newGame(content, 1), day: 5 };
    const a = applyEffects(s, [{ type: "schedule", scenario: "credit_bill", inDays: 3 }], "t").state;
    expect(a.queue.find((q) => q.scenario === "credit_bill")?.day).toBe(8);
    const b = applyEffects(a, [{ type: "cancel", scenario: "credit_bill" }], "t").state;
    expect(b.queue.find((q) => q.scenario === "credit_bill")).toBeUndefined();
  });
});

describe("timeline", () => {
  it("starts with payday and pays the player", () => {
    const s = start();
    expect(s.current).toBe("payday1");
    expect(s.day).toBe(1);
    expect(s.checking).toBeCloseTo(60 + 842.17);
  });
  it("is deterministic per seed and varies across seeds", () => {
    const order = (seed: number) => newGame(content, seed).queue.map((q) => `${q.scenario}@${q.day}`).join(",");
    expect(order(7)).toBe(order(7));
    const seeds = [1, 2, 3, 4, 5, 6, 7, 8].map(order);
    expect(new Set(seeds).size).toBeGreaterThan(1); // hours_cut chance roll differs
  });
  it("skips events whose condition fails", () => {
    const s = playUntil(3, "hours_cut", (id) => (id === "extra_shift" ? "take" : ""));
    // extraShift blocks hours_cut, so we run to the end without ever seeing it
    expect(s.seen).not.toContain("hours_cut");
  });
  it("ends in results after end_of_month", () => {
    const s = playUntil(1, "end_of_month");
    expect(s.current).toBe("end_of_month");
    const done = nextEvent(content, s);
    expect(done.phase).toBe("results");
    expect(done.day).toBe(30);
  });
});

describe("choices", () => {
  it("rejects unavailable choices", () => {
    const s = playUntil(1, "phone_repair", () => "buy"); // spend freely
    const savingsChoice = content.byId.phone_repair.choices.find((c) => c.id === "savings")!;
    expect(savingsChoice.requires!(s)).toMatch(/Only/);
    expect(choose(content, s, "savings")).toBe(s);
  });
  it("records decisions and pending feedback", () => {
    const s = playUntil(1, "concert");
    const after = choose(content, s, "buy");
    expect(after.checking).toBeCloseTo(s.checking - 145);
    expect(after.decisions.at(-1)).toMatchObject({ scenario: "concert", choice: "buy" });
    expect(after.pending?.deltas.life).toBe(10);
    expect(after.threads.maya?.at(-1)?.text).toContain("best night");
  });
});

describe("delayed consequences", () => {
  it("deferring the phone bill charges a late fee and dents credit later", () => {
    const s = playUntil(1, "phone_bill_late", (id) => (id === "mom_phone_bill" ? "later" : ""));
    expect(s.current).toBe("phone_bill_late");
    expect(s.day).toBe(8);
    expect(s.flags.phoneLate).toBe(true);
    expect(s.credit).toBeLessThan(680);
  });
  it("BNPL creates debt and three future installments", () => {
    const s = playUntil(1, "bnpl_headphones");
    const after = choose(content, s, "bnpl");
    expect(after.debt).toBe(105);
    expect(after.queue.filter((q) => q.scenario === "bnpl_payment").map((q) => q.day)).toEqual([17, 24, 31]);
    const done = playUntil(1, "end_of_month", (id) => (id === "bnpl_headphones" ? "bnpl" : ""));
    expect(done.seen.filter((x) => x === "bnpl_payment")).toHaveLength(2); // day 31 falls off the month
  });
  it("credit repair schedules a statement that can be paid in full", () => {
    const s = playUntil(1, "credit_bill", (id) => (id === "phone_repair" ? "credit" : id === "savings_nudge" ? "auto" : ""));
    expect(s.current).toBe("credit_bill");
    expect(s.debt).toBe(160);
    const paid = choose(content, s, "full");
    expect(paid.debt).toBe(0);
    expect(paid.flags.cardBalance).toBe(0);
  });
  it("lending resolves to repayment or ghosting depending on the seed", () => {
    const outcomes = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((seed) => playUntil(seed, "end_of_month", (id) => (id === "friend_borrow" ? "lend" : "")).flags.repaid ? "repaid" : "ghosted"));
    expect(outcomes.size).toBe(2);
  });
});

describe("results", () => {
  it("computes resilience from cushion minus debt", () => {
    expect(resilience({ checking: 600, savings: 400, debt: 0 })).toBe(100);
    expect(resilience({ checking: 100, savings: 100, debt: 100 })).toBe(10);
    expect(resilience({ checking: -20, savings: 0, debt: 300 })).toBe(0);
  });
  it("tells a story that reflects the flags", () => {
    const spender = nextEvent(content, playUntil(1, "end_of_month", (id) => ({ concert: "buy", sneaker_drop: "buy", bnpl_headphones: "bnpl", phone_repair: "credit", credit_bill: "min" })[id] ?? ""));
    const sum = summarize(spender);
    expect(spender.debt).toBeGreaterThan(0);
    expect(sum.moments.some((m) => m.title.includes("concert"))).toBe(true);
    expect(sum.moments.some((m) => m.title.includes("credit"))).toBe(true);
  });
  it("replay with the same seed reproduces the same month", () => {
    const a = playUntil(9, "end_of_month", () => "buy"), b = playUntil(9, "end_of_month", () => "buy");
    expect(a.checking).toBe(b.checking);
    expect(a.seen).toEqual(b.seen);
  });
});

describe("balance design", () => {
  const spender = { mom_phone_bill: "later", concert: "buy", sneaker_drop: "buy", food_run: "go", savings_nudge: "not", extra_shift: "pass", friend_borrow: "lend", bnpl_headphones: "full", scam_dm: "ignore", forgotten_sub: "keep", family_contribution: "pay" };
  const saver = { mom_phone_bill: "pay", concert: "skip", sneaker_drop: "pass", food_run: "home", savings_nudge: "now", extra_shift: "take", friend_borrow: "no", bnpl_headphones: "skip", scam_dm: "report", forgotten_sub: "cancel", family_contribution: "pay" };
  const pick = (plan: Record<string, string>) => (id: string) => plan[id] ?? "";
  it("an all-in spender is cornered by the phone repair", () => {
    for (const seed of [1, 2, 3]) {
      const s = playUntil(seed, "phone_repair", pick(spender));
      expect(s.current).toBe("phone_repair");
      expect(s.checking).toBeLessThan(160);
      expect(s.savings).toBeLessThan(160);
    }
  });
  it("a saver can cover the repair from savings and ends the month without debt", () => {
    const s = playUntil(1, "phone_repair", pick(saver));
    expect(s.savings).toBeGreaterThanOrEqual(160);
    const end = nextEvent(content, playUntil(1, "end_of_month", (id) => (id === "phone_repair" ? "savings" : pick(saver)(id))));
    expect(end.debt).toBe(0);
    expect(end.life).toBeLessThan(70); // the tradeoff is real
    expect(summarize(end).headline).toMatch(/quiet|balance|solid/i);
  });
});
