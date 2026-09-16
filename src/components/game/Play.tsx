"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { LayoutGrid, MessageSquareDot, Pause } from "lucide-react";
import { content, useGame } from "@/store/gameStore";
import { lines as linesOf } from "@/engine/engine";
import { StatusBar } from "@/components/phone/StatusBar";
import { MetricsStrip } from "@/components/phone/MetricsStrip";
import { HomeScreen, apps } from "@/components/phone/HomeScreen";
import { AppScreen } from "@/components/phone/Apps";
import { EventScreen } from "./EventScreen";
import { characters } from "@/content/characters";
import { dayName } from "@/lib/format";
import type { GameState } from "@/engine/types";

type Stage = "day" | "banner" | "open";

export function Play({ game }: { game: GameState }) {
  const reduced = useReducedMotion();
  const view = useGame((s) => s.view);
  const setView = useGame((s) => s.setView);
  const paused = useGame((s) => s.paused);
  const sc = game.current ? content.byId[game.current] : null;
  const eventKey = `${game.current}@${game.day}@${game.seen.length}`;

  // Each new event: (day card if the day changed) → notification banner over the home screen → open.
  const dayChanged = useGame((s) => s.dayChanged);
  const [stageFor, setStageFor] = useState<{ key: string; stage: Stage }>({ key: "", stage: "open" });
  const stage: Stage = stageFor.key === eventKey ? stageFor.stage : reduced ? "open" : dayChanged ? "day" : "banner";
  const setStage = (stage: Stage) => setStageFor({ key: eventKey, stage });
  useEffect(() => {
    if (reduced) return;
    const dayMs = dayChanged ? 900 : 0;
    const t1 = setTimeout(() => setStageFor({ key: eventKey, stage: "banner" }), dayMs);
    const t2 = setTimeout(() => setStageFor({ key: eventKey, stage: "open" }), dayMs + 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [eventKey, dayChanged, reduced]);

  const showingEvent = view === "event" && stage === "open" && sc;
  const app = sc ? apps.find((a) => a.id === sc.app) : null;

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      <StatusBar day={game.day} />
      <MetricsStrip />
      <div className="flex-1 flex flex-col min-h-0 relative">
        {view === "event" || view === "home" ? (
          showingEvent ? (
            <motion.div key={eventKey} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="flex-1 flex flex-col min-h-0">
              <EventScreen key={eventKey} game={game} sc={sc} />
            </motion.div>
          ) : (
            <HomeScreen badge={sc?.app ?? null} />
          )
        ) : (
          <AppScreen id={view} game={game} />
        )}

        {/* Notification banner */}
        <AnimatePresence>
          {stage === "banner" && sc && app && (
            <motion.button
              key="banner"
              initial={{ y: -80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              onClick={() => setStage("open")}
              className="absolute top-2 left-3 right-3 z-20 glass border border-white/10 rounded-2xl px-3 py-2.5 text-left shadow-xl shadow-black/40 flex items-center gap-3"
              aria-label={`Open notification from ${characters[sc.from].name}`}
            >
              <span className={`grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br ${app.color} text-white shrink-0`}><app.Icon className="w-5 h-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="flex justify-between text-xs text-muted"><span>{app.name} · {characters[sc.from].name}</span><span>now</span></span>
                <span className="block text-sm font-medium truncate">{linesOf(sc, game)[0]}</span>
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Day card */}
        <AnimatePresence>
          {stage === "day" && (
            <motion.div key="day" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="absolute inset-0 z-30 grid place-items-center bg-bg/95">
              <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-center">
                <div className="text-xs uppercase tracking-[0.3em] text-muted">{dayName(game.day)}</div>
                <div className="text-5xl font-bold tracking-tight mt-1">Day {game.day}</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Teacher pause */}
        <AnimatePresence>
          {paused && (
            <motion.div key="pause" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-40 grid place-items-center bg-bg/90 backdrop-blur-sm p-8 text-center" role="dialog" aria-label="Paused">
              <div>
                <Pause className="w-8 h-8 mx-auto text-accent" />
                <div className="mt-3 text-xl font-semibold">Paused for discussion</div>
                <div className="mt-1 text-sm text-muted">Your teacher will resume the simulation.</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dock */}
      <div className="flex justify-center gap-2 px-4 pb-[max(env(safe-area-inset-bottom),0.6rem)] pt-1.5 border-t border-line">
        <button onClick={() => setView(view === "home" ? "event" : "home")} aria-label={view === "home" ? "Back to now" : "Home"} className="flex items-center gap-2 h-9 px-4 rounded-full bg-white/5 hover:bg-white/10 text-sm">
          <LayoutGrid className="w-4 h-4" /> {view === "home" ? "Back" : "Apps"}
        </button>
        {view !== "event" && sc && (
          <button onClick={() => setView("event")} className="flex items-center gap-2 h-9 px-4 rounded-full bg-accent/20 text-accent hover:bg-accent/30 text-sm font-medium">
            <MessageSquareDot className="w-4 h-4" /> Now
          </button>
        )}
      </div>
    </div>
  );
}
