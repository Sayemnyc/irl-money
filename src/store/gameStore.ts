"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { act, choose, indexContent, newGame, nextEvent } from "@/engine/engine";
import type { AppId, GameState } from "@/engine/types";
import { scenarios } from "@/content/scenarios";
import { openRoom, startingChecking, type Difficulty, type Room } from "@/classroom/room";
import { sounds, type SoundName } from "@/lib/sound";

export const content = indexContent(scenarios);
export type View = "event" | "home" | AppId;

type Store = {
  game: GameState | null;
  name: string;
  avatar: number;
  view: View;
  thread: string | null;
  /** True when the current event landed on a new day (drives the "Day N" card). */
  dayChanged: boolean;
  muted: boolean;
  paused: boolean;
  roomCode: string | null;
  difficulty: Difficulty;
  start: (name: string, avatar: number) => void;
  choose: (choiceId: string) => void;
  next: () => void;
  cancelRecurring: (id: string) => void;
  setView: (v: View, thread?: string | null) => void;
  toggleMute: () => void;
  setPaused: (p: boolean) => void;
  joinRoom: (code: string | null) => void;
  setDifficulty: (d: Difficulty) => void;
  twist: (scenario: string) => void;
  replay: (sameSeed: boolean) => void;
  reset: () => void;
};

let room: Room | null = null;

export const useGame = create<Store>()(
  persist(
    (set, get) => {
      const play = (name: SoundName) => { if (!get().muted) sounds[name](); };
      const broadcast = (g: GameState) => {
        if (!room) return;
        const { checking, savings, debt, credit, life, day } = g;
        room.send({ type: "metrics", student: get().name, metrics: { checking, savings, debt, credit, life, day }, current: g.current, phase: g.phase });
      };
      const arrive = (g: GameState) => {
        const sc = g.current ? content.byId[g.current] : null;
        if (sc) play(sc.category === "income" ? "cash" : sc.category === "emergency" ? "alert" : "ping");
        broadcast(g);
        set({ game: g, view: "event", thread: null, dayChanged: g.day !== get().game?.day });
      };
      const begin = (seed: number) => {
        const g = newGame(content, seed, get().name || "You");
        arrive(nextEvent(content, { ...g, checking: startingChecking[get().difficulty] }));
      };
      return {
        game: null, name: "", avatar: 0, view: "event", thread: null, dayChanged: true, muted: false, paused: false, roomCode: null, difficulty: "standard",
        start: (name, avatar) => {
          sounds.unlock();
          set({ name: name.trim() || "You", avatar });
          room?.send({ type: "hello", student: get().name });
          begin(Math.floor(Math.random() * 1e9));
        },
        choose: (choiceId) => {
          const g = get().game;
          if (!g || g.pending) return;
          const n = choose(content, g, choiceId);
          if (n === g) return;
          play("tap");
          const d = n.decisions.at(-1)!;
          room?.send({ type: "decision", student: get().name, scenario: d.scenario, choice: d.choice, label: d.label, day: d.day, deltas: d.deltas });
          set({ game: n });
        },
        next: () => {
          const g = get().game;
          if (!g) return;
          const n = nextEvent(content, g);
          if (n.phase === "results") { broadcast(n); set({ game: n }); } else arrive(n);
        },
        cancelRecurring: (id) => {
          const g = get().game;
          if (!g) return;
          const item = g.recurring.find((r) => r.id === id);
          if (!item) return;
          set({ game: act(g, [{ type: "recurring", op: "remove", id }, { type: "flag", key: `cancelled_${id}`, value: true }], `Cancelled ${item.name}`) });
        },
        setView: (view, thread = null) => set({ view, thread }),
        toggleMute: () => set({ muted: !get().muted }),
        setPaused: (paused) => set({ paused }),
        setDifficulty: (difficulty) => set({ difficulty }),
        joinRoom: (code) => {
          room?.close();
          room = null;
          set({ roomCode: code, paused: false });
          if (!code) return;
          room = openRoom(code);
          room.subscribe((m) => {
            if (m.type === "pause") set({ paused: m.paused });
            if (m.type === "config") set({ difficulty: m.config.difficulty });
            if (m.type === "twist") get().twist(m.scenario);
          });
          if (get().name) room.send({ type: "hello", student: get().name });
        },
        // A class-wide plot twist lands as the very next event.
        twist: (scenario) => {
          const g = get().game;
          if (!g || g.phase !== "playing" || !content.byId[scenario]) return;
          set({ game: act(g, [{ type: "cancel", scenario }, { type: "schedule", scenario, inDays: 0 }], "Class event") });
        },
        replay: (sameSeed) => {
          const g = get().game;
          begin(sameSeed && g ? g.seed : Math.floor(Math.random() * 1e9));
        },
        reset: () => set({ game: null, view: "event", thread: null, paused: false }),
      };
    },
    {
      name: "irl-money",
      partialize: (s) => ({ game: s.game, name: s.name, avatar: s.avatar, muted: s.muted, roomCode: s.roomCode, difficulty: s.difficulty }),
      onRehydrateStorage: () => (s) => { if (s?.roomCode) s.joinRoom(s.roomCode); },
    },
  ),
);

// Dev-only handle for driving the game from the console / e2e scripts.
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") (window as unknown as { __irl: typeof useGame }).__irl = useGame;
