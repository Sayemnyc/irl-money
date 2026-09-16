"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Pause, Play, Radio, Sparkles, Users, X, Zap } from "lucide-react";
import { scenarios } from "@/content/scenarios";
import { buildDemoClass } from "@/content/teacherDemo";
import { makeRoomCode, openRoom, type Difficulty, type Metrics, type Room, type RoomConfig, type RoomMessage } from "@/classroom/room";
import { money } from "@/engine/finance";
import { Button } from "@/components/ui/Button";
import { cx } from "@/lib/format";

type Live = { name: string; metrics?: Metrics; current?: string | null; phase?: string; decisions: Record<string, string> };

const dayOf = (s: (typeof scenarios)[number]) => (s.when && "day" in s.when ? s.when.day : s.when ? s.when.between[0] : 99);
const timeline = scenarios.filter((s) => s.choices.length > 0 && s.when).sort((a, b) => dayOf(a) - dayOf(b));
const twists = [
  { id: "phone_repair", label: "Cracked screen — $160" },
  { id: "hours_cut", label: "Hours cut at work" },
  { id: "small_surprise", label: "Small surprise charge" },
  { id: "bonus", label: "Surprise bonus" },
];

export function TeacherDashboard() {
  const demo = useMemo(() => buildDemoClass(), []);
  const [focus, setFocus] = useState(0);
  const [config, setConfig] = useState<RoomConfig | null>(null);
  const [setup, setSetup] = useState(false);
  const [paused, setPaused] = useState(false);
  const [live, setLive] = useState<Record<string, Live>>({});
  const [room, setRoom] = useState<Room | null>(null);
  const [twistOpen, setTwistOpen] = useState(false);
  const sc = timeline[focus];

  useEffect(() => () => room?.close(), [room]);

  const startClass = (minutes: number, difficulty: Difficulty) => {
    const cfg: RoomConfig = { code: makeRoomCode(), minutes, difficulty, scenario: "first-paycheck" };
    room?.close();
    const r = openRoom(cfg.code);
    r.subscribe((m: RoomMessage) => {
      if (m.type === "hello") { setLive((l) => ({ ...l, [m.student]: l[m.student] ?? { name: m.student, decisions: {} } })); r.send({ type: "config", config: cfg }); }
      if (m.type === "metrics") setLive((l) => ({ ...l, [m.student]: { ...(l[m.student] ?? { name: m.student, decisions: {} }), metrics: m.metrics, current: m.current, phase: m.phase } }));
      if (m.type === "decision") {
        setLive((l) => ({ ...l, [m.student]: { ...(l[m.student] ?? { name: m.student, decisions: {} }), decisions: { ...(l[m.student]?.decisions ?? {}), [m.scenario]: m.choice } } }));
        const i = timeline.findIndex((t) => t.id === m.scenario);
        if (i >= 0) setFocus(i);
      }
    });
    setRoom(r); setConfig(cfg); setSetup(false); setLive({});
  };
  const togglePause = () => { const p = !paused; setPaused(p); room?.send({ type: "pause", paused: p }); };
  const sendTwist = (id: string) => { room?.send({ type: "twist", scenario: id }); setTwistOpen(false); const i = timeline.findIndex((t) => t.id === id); if (i >= 0) setFocus(i); };

  const liveList = Object.values(live);
  const hasLive = liveList.length > 0;
  // Decision tallies: live students when present, otherwise the demo class.
  const picks = hasLive ? liveList.map((l) => l.decisions[sc.id]).filter(Boolean) : demo.map((d) => d.decisions.find((x) => x.scenario === sc.id)?.choice).filter(Boolean);
  const tally = sc.choices.map((c) => ({ id: c.id, label: c.label, n: picks.filter((p) => p === c.id).length }));
  const total = picks.length || 1;

  const pct = (pred: (d: Record<string, string>) => boolean) => {
    const pool = hasLive ? liveList.map((l) => l.decisions) : demo.map((d) => Object.fromEntries(d.decisions.map((x) => [x.scenario, x.choice])));
    return Math.round((pool.filter(pred).length / (pool.length || 1)) * 100);
  };
  const insights = [
    { n: pct((d) => d.phone_repair === "credit" || d.phone_dies === "credit"), text: "put the emergency repair on credit" },
    { n: pct((d) => d.scam_dm === "send"), text: "replied to the scam message" },
    { n: pct((d) => d.savings_nudge === "auto" || d.savings_nudge === "now"), text: "chose to save before the emergency" },
    { n: pct((d) => d.streaming_renewal === "keep" && d.forgotten_sub === "keep"), text: "kept both subscriptions running" },
    { n: pct((d) => d.bnpl_headphones === "bnpl"), text: "used pay-in-4" },
    { n: pct((d) => d.concert === "cheaper"), text: "found the cheaper concert option" },
  ];
  const finished = demo.map((d) => d.state);
  const outcomes = [
    { label: "Avg. checking", value: money(finished.reduce((a, s) => a + s.checking, 0) / finished.length) },
    { label: "Ended in debt", value: `${Math.round((finished.filter((s) => s.debt > 0).length / finished.length) * 100)}%` },
    { label: "Avg. life", value: `${Math.round(finished.reduce((a, s) => a + s.life, 0) / finished.length)}/100` },
    { label: "Avg. savings", value: money(finished.reduce((a, s) => a + s.savings, 0) / finished.length) },
  ];

  return (
    <div className="min-h-dvh bg-bg text-text">
      <header className="sticky top-0 z-10 glass border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <Link href="/" className="font-bold tracking-tight text-lg"><span className="brand-text">IRL Money</span> <span className="text-muted font-medium">· Teacher</span></Link>
          <div className="ml-auto flex items-center gap-2">
            {config ? (
              <>
                <span className="hidden sm:inline-flex items-center gap-2 rounded-full bg-surface-2 border border-line px-3 h-10 text-sm"><Radio className="w-4 h-4 text-money" /> Room <strong className="tabular tracking-wider">{config.code}</strong> · {liveList.length} live</span>
                <Button variant={paused ? "primary" : "secondary"} onClick={togglePause}>{paused ? <><Play className="w-4 h-4" /> Resume</> : <><Pause className="w-4 h-4" /> Pause class</>}</Button>
                <div className="relative">
                  <Button variant="secondary" onClick={() => setTwistOpen((v) => !v)}><Zap className="w-4 h-4" /> Plot twist</Button>
                  {twistOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-surface-2 border border-line shadow-2xl p-1.5 z-20">
                      {twists.map((t) => <button key={t.id} onClick={() => sendTwist(t.id)} className="w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-white/5">{t.label}</button>)}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Button onClick={() => setSetup(true)}><Users className="w-4 h-4" /> Start class</Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="space-y-5 min-w-0">
          {!config && (
            <div className="rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-accent shrink-0" />
              <span>Showing a <strong>demo class of 24 fictional students</strong>. Start a class to see live decisions from students who join with your room code.</span>
            </div>
          )}

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none -mx-1 px-1 py-1">
            {timeline.map((t, i) => (
              <button key={t.id} onClick={() => setFocus(i)} className={cx("shrink-0 rounded-full px-3 h-9 text-sm border transition-colors", i === focus ? "bg-accent text-white border-accent" : "bg-surface-2 border-line text-muted hover:text-text")}>
                <span className="tabular opacity-70 mr-1.5">D{t.when && "day" in t.when ? t.when.day : `${t.when!.between[0]}+`}</span>{t.title}
              </button>
            ))}
          </div>

          <div className="rounded-3xl bg-surface border border-line p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.3em] text-muted">Now playing</div>
                <h1 className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight">{sc.title}</h1>
                <div className="mt-2 inline-flex items-center rounded-full bg-accent/15 text-accent px-3 py-1 text-sm font-semibold">Concept: {sc.teacher.concept}</div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button aria-label="Previous scenario" onClick={() => setFocus((f) => Math.max(0, f - 1))} className="p-2 rounded-xl bg-surface-2 hover:bg-surface-3"><ChevronLeft className="w-5 h-5" /></button>
                <button aria-label="Next scenario" onClick={() => setFocus((f) => Math.min(timeline.length - 1, f + 1))} className="p-2 rounded-xl bg-surface-2 hover:bg-surface-3"><ChevronRight className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted">Learning objective</div>
                <p className="mt-1.5 text-[15px] text-text/90">{sc.teacher.objective}</p>
                <div className="mt-5 text-xs uppercase tracking-wider text-muted">Discussion question</div>
                <p className="mt-1.5 text-xl sm:text-2xl font-semibold leading-snug">“{sc.teacher.discussion}”</p>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted">Class decisions {hasLive ? `· ${picks.length} of ${liveList.length} answered` : "· demo"}</div>
                <div className="mt-3 space-y-3">
                  {tally.map((t) => (
                    <div key={t.id}>
                      <div className="flex justify-between text-sm mb-1"><span className="font-medium">{t.label}</span><span className="tabular text-muted">{Math.round((t.n / total) * 100)}%</span></div>
                      <div className="h-3 rounded-full bg-white/10 overflow-hidden"><div className="h-full rounded-full brand-gradient transition-[width] duration-500" style={{ width: `${(t.n / total) * 100}%` }} /></div>
                    </div>
                  ))}
                  {picks.length === 0 && <p className="text-sm text-muted">No decisions yet for this event.</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-surface border border-line p-6">
              <h2 className="font-semibold">Class insights</h2>
              <p className="text-xs text-muted mt-0.5">Computed from decisions {hasLive ? "in this room" : "in the demo class"}.</p>
              <ul className="mt-4 space-y-3">
                {insights.map((i) => (
                  <li key={i.text} className="flex items-center gap-3"><span className="w-14 text-2xl font-bold tabular shrink-0">{i.n}%</span><span className="text-sm text-text/85">{i.text}</span></li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl bg-surface border border-line p-6">
              <h2 className="font-semibold">End-of-month outcomes</h2>
              <p className="text-xs text-muted mt-0.5">Demo class · same month, different lives.</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {outcomes.map((o) => <div key={o.label} className="rounded-2xl bg-surface-2 p-3"><div className="text-xs text-muted">{o.label}</div><div className="text-xl font-bold tabular">{o.value}</div></div>)}
              </div>
              <p className="mt-4 text-sm text-muted">Ask: two students with the same checking balance — which month would you rather have lived?</p>
            </div>
          </div>
        </section>

        <aside className="rounded-3xl bg-surface border border-line p-5 h-fit lg:sticky lg:top-22">
          <div className="flex items-center justify-between"><h2 className="font-semibold">Class</h2><span className="text-xs text-muted">{hasLive ? `${liveList.length} live` : "24 demo"}</span></div>
          <ul className="mt-3 divide-y divide-line max-h-[60dvh] overflow-y-auto scrollbar-none">
            {(hasLive ? liveList.map((l) => ({ name: l.name, m: l.metrics, live: true, done: l.phase === "results" })) : demo.map((d) => ({ name: d.name, m: d.state, live: false, done: true }))).map((s) => (
              <li key={s.name} className="py-2.5 flex items-center gap-3">
                <span className={cx("w-2 h-2 rounded-full shrink-0", s.live ? "bg-money" : "bg-muted/40")} aria-hidden />
                <span className="text-sm font-medium w-16 truncate">{s.name}</span>
                {s.m ? (
                  <span className="flex-1 grid grid-cols-3 gap-2 text-xs tabular">
                    <span className={cx(s.m.checking < 50 ? "text-danger" : "text-money")}>{money(s.m.checking)}</span>
                    <span className={s.m.debt > 0 ? "text-danger" : "text-muted"}>{s.m.debt > 0 ? `owes ${money(s.m.debt)}` : "no debt"}</span>
                    <span className="text-life">life {s.m.life}</span>
                  </span>
                ) : <span className="text-xs text-muted">joining…</span>}
              </li>
            ))}
          </ul>
        </aside>
      </main>

      {setup && (
        <div className="fixed inset-0 z-30 bg-bg/80 backdrop-blur-sm grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="setup-title">
          <SetupCard onClose={() => setSetup(false)} onStart={startClass} />
        </div>
      )}
      {config && !hasLive && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-2xl glass border border-line px-4 py-3 text-sm shadow-2xl max-w-[92vw]">
          Students join at <strong>/?room={config.code}</strong> or enter <strong className="tabular">{config.code}</strong> on the start screen. <span className="text-muted">(Works across tabs on this device; connect a realtime backend for the whole room.)</span>
        </div>
      )}
    </div>
  );
}

function Opt<T extends string | number>({ value, current, set, label, sub }: { value: T; current: T; set: (v: T) => void; label: string; sub: string }) {
  return (
    <button onClick={() => set(value)} aria-pressed={current === value} className={cx("flex-1 rounded-2xl border p-3 text-left transition-colors", current === value ? "border-accent bg-accent/15" : "border-line bg-surface-2 hover:bg-surface-3")}>
      <div className="font-semibold text-sm">{label}</div><div className="text-xs text-muted">{sub}</div>
    </button>
  );
}

function SetupCard({ onClose, onStart }: { onClose: () => void; onStart: (minutes: number, difficulty: Difficulty) => void }) {
  const [minutes, setMinutes] = useState(20);
  const [difficulty, setDifficulty] = useState<Difficulty>("standard");
  return (
    <div className="w-full max-w-lg rounded-3xl bg-surface border border-line p-6 shadow-2xl">
      <div className="flex items-start justify-between"><h2 id="setup-title" className="text-2xl font-bold tracking-tight">Start class</h2><button onClick={onClose} aria-label="Close" className="p-2 rounded-xl hover:bg-white/5"><X className="w-5 h-5" /></button></div>
      <div className="mt-5 text-xs uppercase tracking-wider text-muted">Class length</div>
      <div className="mt-2 flex gap-2">
        <Opt value={10} current={minutes} set={setMinutes} label="10 min" sub="Quick run" />
        <Opt value={20} current={minutes} set={setMinutes} label="20 min" sub="Play + discuss" />
        <Opt value={30} current={minutes} set={setMinutes} label="30 min" sub="Play, discuss, replay" />
      </div>
      <div className="mt-5 text-xs uppercase tracking-wider text-muted">Scenario</div>
      <div className="mt-2 flex gap-2">
        <Opt value="first-paycheck" current="first-paycheck" set={() => {}} label="First Paycheck" sub="One month, one phone, real consequences" />
        <div className="flex-1 rounded-2xl border border-dashed border-line p-3 text-xs text-muted">More lives coming: Moving Out, First Car.</div>
      </div>
      <div className="mt-5 text-xs uppercase tracking-wider text-muted">Difficulty</div>
      <div className="mt-2 flex gap-2">
        <Opt value="gentle" current={difficulty} set={setDifficulty} label="Gentle" sub="$180 to start" />
        <Opt value="standard" current={difficulty} set={setDifficulty} label="Standard" sub="$60 to start" />
        <Opt value="tough" current={difficulty} set={setDifficulty} label="Tough" sub="$0 to start" />
      </div>
      <Button size="lg" className="w-full mt-6" onClick={() => onStart(minutes, difficulty)}>Create room code</Button>
    </div>
  );
}
