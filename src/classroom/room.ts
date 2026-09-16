import type { Deltas } from "@/engine/types";

/**
 * Classroom transport. Today: BroadcastChannel, so teacher + student tabs on one device form a room.
 * ponytail: swap `open()` for a Supabase Realtime channel (same message shapes) to go cross-device.
 */
export type Difficulty = "gentle" | "standard" | "tough";
export type RoomConfig = { code: string; minutes: number; difficulty: Difficulty; scenario: "first-paycheck" };

export type Metrics = { checking: number; savings: number; debt: number; credit: number; life: number; day: number };

export type RoomMessage =
  | { type: "hello"; student: string }
  | { type: "config"; config: RoomConfig }
  | { type: "decision"; student: string; scenario: string; choice: string; label: string; day: number; deltas: Deltas }
  | { type: "metrics"; student: string; metrics: Metrics; current: string | null; phase: "playing" | "results" }
  | { type: "pause"; paused: boolean }
  | { type: "twist"; scenario: string };

export type Room = { send: (m: RoomMessage) => void; subscribe: (fn: (m: RoomMessage) => void) => () => void; close: () => void };

export function openRoom(code: string): Room {
  if (typeof BroadcastChannel === "undefined") return { send: () => {}, subscribe: () => () => {}, close: () => {} };
  const ch = new BroadcastChannel(`irl-money:${code.toUpperCase()}`);
  return {
    send: (m) => ch.postMessage(m),
    subscribe: (fn) => {
      const h = (e: MessageEvent<RoomMessage>) => fn(e.data);
      ch.addEventListener("message", h);
      return () => ch.removeEventListener("message", h);
    },
    close: () => ch.close(),
  };
}

export const makeRoomCode = () => `MNY-${Math.floor(1000 + Math.random() * 9000)}`;
export const startingChecking: Record<Difficulty, number> = { gentle: 180, standard: 60, tough: 0 };
