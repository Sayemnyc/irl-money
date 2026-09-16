import type { CharacterId, Choice, Deltas, Effect, EffectsFn, GameState, Rng, Scenario } from "./types";
import { makeRng } from "./rng";
import { MONTH_DAYS, clamp, r2 } from "./finance";

export type Content = { scenarios: Scenario[]; byId: Record<string, Scenario> };

export function indexContent(scenarios: Scenario[]): Content {
  return { scenarios, byId: Object.fromEntries(scenarios.map((s) => [s.id, s])) };
}

const zeroDeltas = (): Deltas => ({ checking: 0, savings: 0, debt: 0, life: 0, credit: 0 });

export function newGame(content: Content, seed: number, name = "You"): GameState {
  const rng = makeRng(seed);
  const queue = content.scenarios.flatMap((sc, order) => {
    if (!sc.when) return [];
    if (sc.chance !== undefined && rng.next() >= sc.chance) return [];
    const day = "day" in sc.when ? sc.when.day : rng.int(sc.when.between[0], sc.when.between[1]);
    return [{ scenario: sc.id, day, order }];
  });
  return {
    seed,
    rngState: rng.state,
    name,
    day: 0,
    phase: "playing",
    checking: 60,
    savings: 100,
    debt: 0,
    credit: 680,
    life: 70,
    income: 842.17,
    recurring: [
      { id: "phone", name: "Phone plan", amount: 80, kind: "bill" },
      { id: "lunch", name: "Lunch account auto-reload", amount: 45, kind: "bill" },
      { id: "streamly", name: "Streamly", amount: 18.99, kind: "subscription" },
      { id: "cloudsave", name: "CloudSave+", amount: 4.99, kind: "subscription" },
    ],
    flags: {},
    decisions: [],
    queue: sortQueue(queue),
    seen: [],
    current: null,
    pending: null,
    threads: {},
    transactions: [],
  };
}

const sortQueue = (q: GameState["queue"]) => [...q].sort((a, b) => a.day - b.day || a.order - b.order);

function resolve(fx: EffectsFn, s: GameState, rng: Rng): Effect[] {
  return typeof fx === "function" ? fx(s, rng) : fx;
}

/** Pure: returns a new state with effects applied, plus the metric deltas they caused. */
export function applyEffects(s: GameState, effects: Effect[], label: string): { state: GameState; deltas: Deltas } {
  const d = zeroDeltas();
  let n: GameState = { ...s, flags: { ...s.flags }, recurring: [...s.recurring], queue: [...s.queue], threads: { ...s.threads }, transactions: [...s.transactions] };
  const tx = (account: "checking" | "savings" | "debt", amount: number) => {
    if (amount !== 0) n.transactions.push({ day: n.day, label, amount: r2(amount), account });
  };
  for (const e of effects) {
    switch (e.type) {
      case "checking":
        n.checking = r2(n.checking + e.amount); d.checking += e.amount; tx("checking", e.amount); break;
      case "savings":
        n.savings = r2(n.savings + e.amount); d.savings += e.amount; tx("savings", e.amount); break;
      case "transfer": {
        n[e.from] = r2(n[e.from] - e.amount); n[e.to] = r2(n[e.to] + e.amount);
        d[e.from] -= e.amount; d[e.to] += e.amount; tx(e.from, -e.amount); tx(e.to, e.amount); break;
      }
      case "debt":
        n.debt = r2(Math.max(0, n.debt + e.amount)); d.debt += e.amount; tx("debt", e.amount); break;
      case "life": {
        const before = n.life; n.life = clamp(n.life + e.amount, 0, 100); d.life += n.life - before; break;
      }
      case "credit": {
        const before = n.credit; n.credit = clamp(n.credit + e.amount, 300, 850); d.credit += n.credit - before; break;
      }
      case "income":
        n.income = r2(n.income + e.amount); break;
      case "flag":
        n.flags[e.key] = e.value; break;
      case "schedule":
        n.queue = sortQueue([...n.queue, { scenario: e.scenario, day: n.day + e.inDays, order: 1000 + n.queue.length }]); break;
      case "cancel":
        n.queue = n.queue.filter((q) => q.scenario !== e.scenario); break;
      case "recurring":
        n.recurring = e.op === "add" ? [...n.recurring, e.item] : n.recurring.filter((r) => r.id !== e.id); break;
      case "message":
        n = pushMessage(n, e.from, e.text); break;
    }
  }
  d.checking = r2(d.checking); d.savings = r2(d.savings); d.debt = r2(d.debt);
  return { state: n, deltas: d };
}

function pushMessage(s: GameState, from: CharacterId, text: string): GameState {
  const thread = [...(s.threads[from] ?? []), { from, text, day: s.day }];
  return { ...s, threads: { ...s.threads, [from]: thread } };
}

export const lines = (sc: Scenario, s: GameState) => (typeof sc.lines === "function" ? sc.lines(s) : sc.lines);
export const amountOf = (sc: Scenario, s: GameState) => (typeof sc.amount === "function" ? sc.amount(s) : sc.amount);

/** Advances to the next eligible queued event (applying its auto effects), or ends the month. */
export function nextEvent(content: Content, s: GameState): GameState {
  let n: GameState = { ...s, current: null, pending: null, queue: [...s.queue] };
  if (s.current && content.byId[s.current]?.ends) return { ...n, day: MONTH_DAYS, phase: "results" };
  while (n.queue.length) {
    const item = n.queue.shift()!;
    const sc = content.byId[item.scenario];
    if (!sc || item.day > MONTH_DAYS) continue;
    n = { ...n, day: Math.max(n.day, item.day) };
    if (sc.condition && !sc.condition(n)) continue;
    n.seen = [...n.seen, sc.id];
    n.current = sc.id;
    const rng = makeRng(n.rngState);
    // Auto effects run first so the lines (which may read rolled amounts) match what the player sees.
    if (sc.autoEffects) n = applyEffects(n, resolve(sc.autoEffects, n, rng), sc.title).state;
    for (const text of lines(sc, n)) n = pushMessage(n, sc.from, text);
    return { ...n, rngState: rng.state };
  }
  return { ...n, day: MONTH_DAYS, phase: "results" };
}

export function choose(content: Content, s: GameState, choiceId: string): GameState {
  if (!s.current) return s;
  const sc = content.byId[s.current];
  const choice = sc.choices.find((c) => c.id === choiceId);
  if (!choice || (choice.requires && choice.requires(s))) return s;
  const rng = makeRng(s.rngState);
  let n = pushMessage(s, "you", choice.label);
  const applied = applyEffects(n, resolve(choice.effects, n, rng), sc.title);
  n = applied.state;
  const replyRaw = typeof choice.reply === "function" ? choice.reply(n) : choice.reply;
  const reply = replyRaw ? (Array.isArray(replyRaw) ? replyRaw : [replyRaw]) : [];
  for (const text of reply) n = pushMessage(n, sc.from, text);
  return {
    ...n,
    rngState: rng.state,
    decisions: [...n.decisions, { day: n.day, scenario: sc.id, choice: choice.id, label: choice.label, deltas: applied.deltas }],
    pending: { deltas: applied.deltas, reply, choice: choice.id },
  };
}

/** Lets the player act outside an event (e.g. cancel a subscription from the Bills app). */
export function act(s: GameState, effects: Effect[], label: string): GameState {
  return applyEffects(s, effects, label).state;
}

export const choiceReason = (c: Choice, s: GameState) => (c.requires ? c.requires(s) : null);
