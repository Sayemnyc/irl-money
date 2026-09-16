export type Account = "checking" | "savings";
export type AppId = "messages" | "bank" | "work" | "shop" | "feed" | "bills" | "savings";
export type CharacterId = "maya" | "jordan" | "alex" | "mom" | "bank" | "unknown" | "shop" | "feed" | "you";
export type FlagValue = boolean | number | string;
export type Visual = "chat" | "bank" | "shop" | "feed" | "work" | "alert";
export type Category =
  | "income" | "bill" | "social" | "shopping" | "subscription" | "work" | "lending"
  | "credit" | "emergency" | "scam" | "saving" | "transport" | "family" | "outcome";

export type Recurring = { id: string; name: string; amount: number; kind: "bill" | "subscription" };

export type Effect =
  | { type: "checking"; amount: number }
  | { type: "savings"; amount: number }
  | { type: "transfer"; from: Account; to: Account; amount: number }
  | { type: "debt"; amount: number }
  | { type: "life"; amount: number }
  | { type: "credit"; amount: number }
  | { type: "income"; amount: number }
  | { type: "flag"; key: string; value: FlagValue }
  | { type: "schedule"; scenario: string; inDays: number }
  | { type: "cancel"; scenario: string }
  | { type: "recurring"; op: "add"; item: Recurring }
  | { type: "recurring"; op: "remove"; id: string }
  | { type: "message"; from: CharacterId; text: string };

export type Rng = { next: () => number; int: (min: number, max: number) => number; pick: <T>(xs: T[]) => T };
export type EffectsFn = Effect[] | ((s: GameState, rng: Rng) => Effect[]);

export type Choice = {
  id: string;
  label: string;
  hint?: string;
  effects: EffectsFn;
  reply?: string | string[] | ((s: GameState) => string | string[]);
  /** Returns a reason string when the choice is unavailable, null when it can be picked. */
  requires?: (s: GameState) => string | null;
  tone?: "primary" | "neutral" | "risky";
};

export type Scenario = {
  id: string;
  title: string;
  category: Category;
  app: AppId;
  from: CharacterId;
  visual: Visual;
  lines: string[] | ((s: GameState) => string[]);
  /** Headline amount shown on bank/shop cards. */
  amount?: number | ((s: GameState) => number);
  choices: Choice[];
  autoEffects?: EffectsFn;
  /** Seconds before defaultChoice is applied automatically. */
  timePressure?: number;
  defaultChoice?: string;
  when?: { day: number } | { between: [number, number] };
  /** Probability (0–1) the event is placed on the timeline at all. Rolled once per game. */
  chance?: number;
  /** Reaching this event ends the month after it's dismissed. */
  ends?: boolean;
  condition?: (s: GameState) => boolean;
  teacher: { concept: string; objective: string; discussion: string };
  reflection?: string;
};

export type Message = { from: CharacterId; text: string; day: number };
export type Transaction = { day: number; label: string; amount: number; account: Account | "debt" };
export type Queued = { scenario: string; day: number; order: number };

export type Deltas = { checking: number; savings: number; debt: number; life: number; credit: number };
export type Decision = {
  day: number;
  scenario: string;
  choice: string;
  label: string;
  deltas: Deltas;
};

export type Pending = { deltas: Deltas; reply: string[]; choice: string } | null;

export type GameState = {
  seed: number;
  rngState: number;
  name: string;
  day: number;
  phase: "playing" | "results";
  checking: number;
  savings: number;
  debt: number;
  credit: number;
  life: number;
  income: number;
  recurring: Recurring[];
  flags: Record<string, FlagValue>;
  decisions: Decision[];
  queue: Queued[];
  seen: string[];
  current: string | null;
  pending: Pending;
  threads: Partial<Record<CharacterId, Message[]>>;
  transactions: Transaction[];
};
