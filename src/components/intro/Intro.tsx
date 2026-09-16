"use client";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ArrowRight, Users } from "lucide-react";
import { useGame } from "@/store/gameStore";
import { Button } from "@/components/ui/Button";
import { cx } from "@/lib/format";
import Link from "next/link";

const avatars = ["from-violet-500 to-fuchsia-500", "from-emerald-400 to-teal-600", "from-amber-400 to-rose-500", "from-sky-400 to-indigo-600"];

export function Intro({ initialRoom }: { initialRoom?: string | null }) {
  const start = useGame((s) => s.start);
  const joinRoom = useGame((s) => s.joinRoom);
  const roomCode = useGame((s) => s.roomCode);
  const [step, setStep] = useState<0 | 1>(0);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(0);
  const [code, setCode] = useState(initialRoom ?? roomCode ?? "");
  const [showCode, setShowCode] = useState(!!(initialRoom ?? roomCode));

  const go = () => {
    joinRoom(code.trim() ? code.trim().toUpperCase() : null);
    start(name, avatar);
  };

  return (
    <div className="flex-1 flex flex-col px-7 pt-[max(env(safe-area-inset-top),2.5rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)] bg-[radial-gradient(90%_50%_at_50%_-10%,rgba(124,108,255,0.35),transparent_60%)]">
      <AnimatePresence mode="wait">
        {step === 0 ? (
          <motion.div key="hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }} className="flex-1 flex flex-col">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-10">
              <div className="text-[11px] font-semibold tracking-[0.35em] uppercase text-muted">First Paycheck</div>
              <h1 className="mt-3 text-5xl font-bold tracking-tight leading-[0.95]">IRL<br /><span className="brand-text">Money</span></h1>
              <p className="mt-4 text-muted text-base">Your first real life.<br />Try not to go broke.</p>
            </motion.div>
            <motion.ul initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.12, delayChildren: 0.4 } } }} className="mt-10 space-y-3 text-[17px] font-medium">
              {["You’re getting your first paycheck.", "Your decisions are yours.", "Your consequences are too."].map((t) => (
                <motion.li key={t} variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}>{t}</motion.li>
              ))}
            </motion.ul>
            <div className="mt-auto space-y-3">
              <Button size="lg" className="w-full" onClick={() => setStep(1)}>Start my life <ArrowRight className="w-4 h-4" /></Button>
              <div className="flex justify-between text-xs text-muted">
                <button className="hover:text-text inline-flex items-center gap-1" onClick={() => setShowCode((v) => !v)}><Users className="w-3.5 h-3.5" /> Have a class code?</button>
                <Link href="/teacher" className="hover:text-text">Teacher mode</Link>
              </div>
              {showCode && (
                <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="MNY-0000" aria-label="Class code" className="w-full h-11 rounded-xl bg-surface-2 border border-line px-4 text-sm uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal" />
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div key="setup" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
            <div className="mt-6 text-xs uppercase tracking-[0.3em] text-muted">Quick setup</div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">What do your friends call you?</h2>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value.slice(0, 16))} onKeyDown={(e) => e.key === "Enter" && go()} placeholder="Your name" aria-label="Your name" className="mt-6 w-full h-14 rounded-2xl bg-surface-2 border border-line px-5 text-lg" />
            <div className="mt-6 text-sm text-muted">Pick a vibe</div>
            <div className="mt-3 flex gap-3">
              {avatars.map((g, i) => (
                <button key={g} onClick={() => setAvatar(i)} aria-label={`Avatar ${i + 1}`} aria-pressed={avatar === i} className={cx("w-14 h-14 rounded-full bg-gradient-to-br transition-transform", g, avatar === i ? "ring-2 ring-white ring-offset-2 ring-offset-bg scale-105" : "opacity-70 hover:opacity-100")} />
              ))}
            </div>
            <div className="mt-auto space-y-3">
              <div className="rounded-2xl bg-surface-2 border border-line p-4 text-sm text-muted">
                You just started at Cornerstone Café. Paid twice a month. Phone bill’s in your name now. Everything else is up to you.
              </div>
              <Button size="lg" className="w-full" onClick={go}>Let’s go <ArrowRight className="w-4 h-4" /></Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
