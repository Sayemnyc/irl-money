"use client";
import { motion } from "motion/react";
import { RefreshCw, Shuffle, GraduationCap } from "lucide-react";
import Link from "next/link";
import type { GameState } from "@/engine/types";
import { creditLabel, money, resilience } from "@/engine/finance";
import { summarize } from "@/engine/results";
import { useGame } from "@/store/gameStore";
import { Button } from "@/components/ui/Button";
import { StatusBar } from "@/components/phone/StatusBar";
import { cx } from "@/lib/format";

export function Results({ game }: { game: GameState }) {
  const replay = useGame((s) => s.replay);
  const sum = summarize(game);
  const res = resilience(game);
  const metrics = [
    { label: "Checking", value: money(game.checking), pct: Math.min(100, (game.checking / 800) * 100), color: game.checking < 50 ? "bg-danger" : "bg-money" },
    { label: "Savings", value: money(game.savings), pct: Math.min(100, (game.savings / 500) * 100), color: "bg-savings" },
    { label: "Debt", value: money(game.debt), pct: Math.min(100, (game.debt / 300) * 100), color: "bg-danger" },
    { label: "Credit", value: `${game.credit} · ${creditLabel(game.credit)}`, pct: ((game.credit - 300) / 550) * 100, color: "bg-accent" },
    { label: "Life", value: `${game.life}/100`, pct: game.life, color: "bg-life" },
    { label: "Resilience", value: `${res}/100`, pct: res, color: "bg-gradient-to-r from-money to-savings" },
  ];
  const stagger = { show: { transition: { staggerChildren: 0.06 } } };
  const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <StatusBar day={30} />
      <div className="flex-1 overflow-y-auto scrollbar-none px-5 pb-6">
        <motion.div initial="hidden" animate="show" variants={stagger} className="space-y-5">
          <motion.div variants={item} className="pt-2">
            <div className="text-[11px] uppercase tracking-[0.3em] text-muted">Month one · {game.name}</div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight leading-tight">{sum.headline}</h1>
            <p className="mt-3 text-[15px] text-text/85 leading-relaxed">{sum.story}</p>
          </motion.div>

          <motion.div variants={item} className="grid grid-cols-2 gap-2.5">
            {metrics.map((m) => (
              <div key={m.label} className="rounded-2xl bg-surface-2 border border-line p-3.5">
                <div className="text-[10px] uppercase tracking-[0.12em] text-muted">{m.label}</div>
                <div className="text-lg font-bold tabular mt-0.5 truncate">{m.value}</div>
                <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(0, m.pct)}%` }} transition={{ duration: 0.8, delay: 0.3 }} className={cx("h-full rounded-full", m.color)} /></div>
              </div>
            ))}
          </motion.div>

          <motion.div variants={item}>
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">What changed your outcome most</h2>
            <div className="mt-3 space-y-2">
              {sum.moments.map((m) => (
                <div key={m.title} className="rounded-2xl bg-surface-2 border border-line p-4 flex gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[15px]">{m.title}</div>
                    <div className="text-sm text-muted mt-0.5">{m.detail}</div>
                  </div>
                  {m.amount !== undefined && m.amount !== 0 && <div className={cx("tabular font-semibold shrink-0", m.amount > 0 ? "text-money" : "text-text/70")}>{money(m.amount, { sign: true })}</div>}
                </div>
              ))}
              {sum.moments.length === 0 && <p className="text-sm text-muted">A quiet month. Try saying yes to more next time — or no.</p>}
            </div>
          </motion.div>

          <motion.div variants={item} className="rounded-2xl border border-accent/30 bg-accent/10 p-4 text-sm">
            <div className="font-semibold">Think about it</div>
            <div className="text-text/80 mt-1">Same $160 emergency, same paycheck. What would you do differently on Day 3?</div>
          </motion.div>

          <motion.div variants={item} className="space-y-2 pt-1">
            <Button size="lg" className="w-full" onClick={() => replay(false)}><RefreshCw className="w-4 h-4" /> Replay the month</Button>
            <Button size="lg" variant="secondary" className="w-full" onClick={() => replay(true)}><Shuffle className="w-4 h-4" /> Same month, different choices</Button>
            <Link href="/teacher" className="flex items-center justify-center gap-2 h-11 text-sm text-muted hover:text-text"><GraduationCap className="w-4 h-4" /> Teacher view</Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
