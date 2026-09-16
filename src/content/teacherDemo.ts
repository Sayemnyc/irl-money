import { choose, indexContent, newGame, nextEvent } from "@/engine/engine";
import { makeRng } from "@/engine/rng";
import type { Decision, GameState } from "@/engine/types";
import { scenarios } from "@/content/scenarios";

export type DemoStudent = { name: string; style: string; state: GameState; decisions: Decision[] };

const names = ["Ava", "Liam", "Noor", "Mateo", "Zoe", "Kai", "Priya", "Eli", "Sofia", "Jayden", "Amara", "Theo", "Lena", "Omar", "Ruby", "Isaac", "Nia", "Leo", "Hana", "Marcus", "Ines", "Caleb", "Yara", "Finn"];

// Each fictional student leans one way but still rolls dice, so tallies look like a real class.
const styles: Record<string, Record<string, string[]>> = {
  spender: { mom_phone_bill: ["later", "pay"], concert: ["buy", "buy", "cheaper"], sneaker_drop: ["buy", "pass"], savings_nudge: ["not"], bnpl_headphones: ["bnpl", "full"], scam_dm: ["send", "ignore"], phone_repair: ["credit", "checking"], credit_bill: ["min", "full"] },
  saver: { mom_phone_bill: ["pay"], concert: ["skip", "cheaper"], sneaker_drop: ["pass"], savings_nudge: ["auto", "now"], bnpl_headphones: ["skip"], scam_dm: ["report", "ignore"], phone_repair: ["savings", "checking"], credit_bill: ["full"] },
  balanced: { mom_phone_bill: ["pay"], concert: ["cheaper", "buy"], sneaker_drop: ["pass", "buy"], savings_nudge: ["auto", "not"], bnpl_headphones: ["bnpl", "skip"], scam_dm: ["ignore", "report", "send"], phone_repair: ["checking", "credit"], credit_bill: ["full", "min"] },
};

export function buildDemoClass(count = 24, seed = 2026): DemoStudent[] {
  const content = indexContent(scenarios);
  const rng = makeRng(seed);
  return names.slice(0, count).map((name, i) => {
    const style = ["spender", "saver", "balanced", "balanced"][i % 4];
    const prefs = styles[style];
    let s = nextEvent(content, newGame(content, rng.int(1, 1e6), name));
    while (s.phase === "playing") {
      const sc = content.byId[s.current!];
      if (sc.choices.length) {
        const ok = sc.choices.filter((c) => !(c.requires && c.requires(s)));
        const wanted = prefs[sc.id] ? rng.pick(prefs[sc.id]) : rng.pick(ok).id;
        s = choose(content, s, (ok.find((c) => c.id === wanted) ?? rng.pick(ok)).id);
      }
      s = nextEvent(content, s);
    }
    return { name, style, state: s, decisions: s.decisions };
  });
}
