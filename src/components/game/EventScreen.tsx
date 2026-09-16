"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Clock3, Landmark, ShoppingBag, Sparkles, BriefcaseBusiness } from "lucide-react";
import type { Deltas, GameState, Scenario } from "@/engine/types";
import { amountOf, choiceReason, lines as linesOf } from "@/engine/engine";
import { money } from "@/engine/finance";
import { characters } from "@/content/characters";
import { useGame } from "@/store/gameStore";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { cx } from "@/lib/format";

const LINE_DELAY = 750;

export function EventScreen({ game, sc }: { game: GameState; sc: Scenario }) {
  const reduced = useReducedMotion();
  const choose = useGame((s) => s.choose);
  const next = useGame((s) => s.next);
  const paused = useGame((s) => s.paused);
  const lines = useMemo(() => linesOf(sc, game), [sc, game]);
  const pending = game.pending;
  const [revealed, setRevealed] = useState(reduced ? lines.length : 0);
  const shown = pending ? lines.length : revealed; // a decision already made means everything was read
  const ready = shown >= lines.length;

  // Reveal lines one at a time so the screen reads like a live conversation.
  useEffect(() => {
    if (ready) return;
    const t = setTimeout(() => setRevealed((n) => n + 1), shown === 0 ? 350 : LINE_DELAY);
    return () => clearTimeout(t);
  }, [shown, ready]);

  // Countdown for time-pressure events.
  const [left, setLeft] = useState(sc.timePressure ?? 0);
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    if (!sc.timePressure || !ready || pending || paused || left <= 0) return;
    const t = setTimeout(() => {
      if (left > 1) return setLeft(left - 1);
      setLeft(0); setExpired(true); choose(sc.defaultChoice ?? sc.choices[0].id);
    }, 1000);
    return () => clearTimeout(t);
  }, [sc, ready, pending, paused, left, choose]);

  const isChat = sc.visual === "chat" || sc.visual === "work";
  const c = characters[sc.from];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header sc={sc} />
      <div className="flex-1 overflow-y-auto scrollbar-none px-4 py-4">
        {isChat ? (
          <div className="space-y-2">
            {lines.slice(0, shown).map((t, i) => (
              <Bubble key={i} side="left" delay={0}>{t}</Bubble>
            ))}
            {!ready && <Typing />}
            {pending && (
              <>
                <Bubble side="right">{sc.choices.find((x) => x.id === pending.choice)?.label}</Bubble>
                {pending.reply.map((t, i) => <Bubble key={`r${i}`} side="left" delay={0.35 + i * 0.45}>{t}</Bubble>)}
              </>
            )}
          </div>
        ) : (
          <Card sc={sc} game={game} lines={lines.slice(0, shown)} ready={ready} />
        )}
        {expired && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-sm text-muted">Time’s up. The drop closed while you were deciding.</motion.p>}
        {pending && <DeltaChips deltas={pending.deltas} />}
        {!isChat && ready && !pending && c.role && sc.visual !== "alert" && <p className="sr-only">From {c.name}</p>}
      </div>

      <div className="px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-2 space-y-2 border-t border-line glass">
        <AnimatePresence mode="wait" initial={false}>
          {!ready ? (
            <motion.div key="wait" className="h-12" />
          ) : pending || sc.choices.length === 0 ? (
            <motion.div key="continue" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Button size="lg" className="w-full" onClick={next} autoFocus>
                {sc.ends ? "See my month" : "Continue"} <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          ) : (
            <motion.div key="choices" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
              {sc.timePressure && (
                <div className="flex items-center gap-2 text-xs text-muted" aria-live="polite">
                  <Clock3 className="w-3.5 h-3.5" />
                  <span className="tabular w-8">{left}s</span>
                  <span className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden"><span className="block h-full bg-danger rounded-full transition-[width] duration-1000 ease-linear" style={{ width: `${(left / sc.timePressure) * 100}%` }} /></span>
                </div>
              )}
              {sc.choices.map((ch) => {
                const reason = choiceReason(ch, game);
                return (
                  <button
                    key={ch.id}
                    disabled={!!reason || paused}
                    onClick={() => choose(ch.id)}
                    className={cx(
                      "w-full text-left rounded-2xl px-4 py-3 border transition-[transform,background-color] active:scale-[0.985] disabled:opacity-45 disabled:active:scale-100",
                      ch.tone === "primary" ? "bg-accent/15 border-accent/40 hover:bg-accent/25" : ch.tone === "risky" ? "bg-surface-2 border-danger/30 hover:bg-danger/10" : "bg-surface-2 border-line hover:bg-surface-3",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-[15px]">{ch.label}</span>
                      {(reason ?? ch.hint) && <span className={cx("text-xs shrink-0", reason ? "text-danger" : "text-muted")}>{reason ?? ch.hint}</span>}
                    </div>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Header({ sc }: { sc: Scenario }) {
  const c = characters[sc.from];
  const app = { bank: ["Northlake Bank", Landmark], shop: ["Dropp", ShoppingBag], feed: ["Feed", Sparkles], work: ["Work", BriefcaseBusiness], alert: ["Alert", AlertTriangle], chat: ["Messages", null] }[sc.visual] as [string, React.ComponentType<{ className?: string }> | null];
  const Icon = app[1];
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-line">
      {sc.visual === "chat" || sc.visual === "work" ? <Avatar id={sc.from} size={36} /> : <span className={cx("grid place-items-center w-9 h-9 rounded-xl", sc.visual === "alert" ? "bg-danger/20 text-danger" : "bg-accent/20 text-accent")}>{Icon && <Icon className="w-5 h-5" />}</span>}
      <div className="min-w-0">
        <div className="font-semibold text-[15px] leading-tight truncate">{sc.visual === "chat" || sc.visual === "work" ? c.name : app[0]}</div>
        <div className="text-xs text-muted truncate">{sc.visual === "chat" || sc.visual === "work" ? c.role : sc.title}</div>
      </div>
    </div>
  );
}

function Bubble({ side, children, delay = 0 }: { side: "left" | "right"; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.22, delay }} className={cx("flex", side === "right" ? "justify-end" : "justify-start")}>
      <div className={cx("max-w-[82%] rounded-2xl px-3.5 py-2 text-[15px] leading-snug", side === "right" ? "bg-accent text-white rounded-br-md" : "bg-surface-3 rounded-bl-md")}>{children}</div>
    </motion.div>
  );
}

const Typing = () => (
  <div className="flex"><div className="typing rounded-2xl rounded-bl-md bg-surface-3 px-3.5 py-2.5 flex gap-1" aria-label="typing"><span className="w-1.5 h-1.5 rounded-full bg-muted" /><span className="w-1.5 h-1.5 rounded-full bg-muted" /><span className="w-1.5 h-1.5 rounded-full bg-muted" /></div></div>
);

function Card({ sc, game, lines, ready }: { sc: Scenario; game: GameState; lines: string[]; ready: boolean }) {
  const amount = amountOf(sc, game);
  const isShop = sc.visual === "shop";
  const isFeed = sc.visual === "feed";
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={cx("rounded-3xl border p-5 overflow-hidden relative", sc.visual === "alert" ? "border-danger/30 bg-gradient-to-b from-danger/15 to-surface-2" : isShop ? "border-fuchsia-400/20 bg-gradient-to-b from-fuchsia-500/15 to-surface-2" : isFeed ? "border-rose-400/20 bg-surface-2" : "border-sky-400/20 bg-gradient-to-b from-sky-500/15 to-surface-2")}>
      {isShop && <div className="aspect-[2/1] -mx-5 -mt-5 mb-4 bg-[radial-gradient(60%_60%_at_50%_40%,rgba(255,255,255,0.18),transparent_70%),linear-gradient(135deg,#6d28d9,#c026d3)] relative"><span className="absolute top-3 left-3 text-[10px] font-bold tracking-widest uppercase bg-black/50 rounded-md px-2 py-1">Limited</span></div>}
      {isFeed && <div className="flex items-center gap-2 mb-3"><Avatar id="feed" size={28} /><span className="text-sm font-semibold">{sc.title}</span></div>}
      {amount !== undefined && !isFeed && (
        <div className={cx("text-4xl font-bold tabular tracking-tight mb-1", amount > 0 && !isShop ? "text-money" : sc.visual === "alert" ? "text-danger" : "text-text")}>{isShop ? money(amount) : money(amount, { sign: true })}</div>
      )}
      {!isFeed && <div className="text-xs uppercase tracking-[0.12em] text-muted mb-3">{sc.title}</div>}
      <div className="space-y-2">
        {lines.map((t, i) => (
          <motion.p key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className={cx("leading-snug", i === 0 && !isFeed ? "text-[15px] font-medium" : "text-[15px] text-text/85")}>{t}</motion.p>
        ))}
        {!ready && <div className="h-5" />}
      </div>
      {isFeed && <div className="mt-3 text-xs text-muted">♥ {2100 + (game.seed % 900)} · 128 comments</div>}
    </motion.div>
  );
}

export function DeltaChips({ deltas }: { deltas: Deltas }) {
  const chips = [
    deltas.checking !== 0 && { text: `${money(deltas.checking, { sign: true })} checking`, tone: deltas.checking > 0 ? "text-money bg-money/10" : "text-text bg-white/10" },
    deltas.savings !== 0 && { text: `${money(deltas.savings, { sign: true })} savings`, tone: "text-savings bg-savings/10" },
    deltas.debt !== 0 && { text: `${money(deltas.debt, { sign: true })} owed`, tone: deltas.debt > 0 ? "text-danger bg-danger/10" : "text-money bg-money/10" },
    deltas.life !== 0 && { text: `${deltas.life > 0 ? "+" : "−"}${Math.abs(deltas.life)} life`, tone: "text-life bg-life/10" },
    deltas.credit !== 0 && { text: `${deltas.credit > 0 ? "+" : "−"}${Math.abs(deltas.credit)} credit`, tone: deltas.credit > 0 ? "text-money bg-money/10" : "text-danger bg-danger/10" },
  ].filter(Boolean) as { text: string; tone: string }[];
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-4" aria-live="polite">
      {chips.map((ch, i) => (
        <motion.span key={ch.text} initial={{ opacity: 0, y: 6, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.15 + i * 0.08 }} className={cx("rounded-full px-3 py-1 text-xs font-semibold tabular", ch.tone)}>{ch.text}</motion.span>
      ))}
    </div>
  );
}
