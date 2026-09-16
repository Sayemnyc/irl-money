"use client";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import { characters } from "@/content/characters";
import type { AppId, CharacterId, GameState } from "@/engine/types";
import { money, resilience, EMERGENCY_BENCHMARK } from "@/engine/finance";
import { useGame } from "@/store/gameStore";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { cx, dayName } from "@/lib/format";
import { apps } from "./HomeScreen";

function Shell({ title, onBack, children, right }: { title: string; onBack: () => void; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center gap-1 px-2 py-2 border-b border-line">
        <button onClick={onBack} aria-label="Back" className="p-2 rounded-lg hover:bg-white/5"><ChevronLeft className="w-5 h-5" /></button>
        <h2 className="font-semibold text-[15px] flex-1">{title}</h2>
        {right}
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-none">{children}</div>
    </div>
  );
}

const Row = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cx("flex items-center justify-between gap-3 px-5 py-3 border-b border-line last:border-0", className)}>{children}</div>
);

export function AppScreen({ id, game }: { id: AppId; game: GameState }) {
  const setView = useGame((s) => s.setView);
  const thread = useGame((s) => s.thread);
  const cancelRecurring = useGame((s) => s.cancelRecurring);
  const back = () => setView("home");
  const meta = apps.find((a) => a.id === id)!;

  if (id === "messages") {
    if (thread) {
      const c = characters[thread as CharacterId];
      const msgs = game.threads[thread as CharacterId] ?? [];
      return (
        <Shell title={c.name} onBack={() => setView("messages")}>
          <div className="px-4 py-4 space-y-2">
            {msgs.map((m, i) => (
              <div key={i} className={cx("flex", m.from === "you" ? "justify-end" : "justify-start")}>
                <div className={cx("max-w-[80%] rounded-2xl px-3.5 py-2 text-[14px] leading-snug", m.from === "you" ? "bg-accent text-white rounded-br-md" : "bg-surface-3 rounded-bl-md")}>{m.text}</div>
              </div>
            ))}
          </div>
        </Shell>
      );
    }
    const threads = (Object.keys(game.threads) as CharacterId[]).filter((k) => k !== "you" && k !== "bank" && k !== "shop" && k !== "feed");
    return (
      <Shell title="Messages" onBack={back}>
        {threads.length === 0 && <p className="p-6 text-center text-muted text-sm">No messages yet.</p>}
        {threads.reverse().map((k) => {
          const last = game.threads[k]!.at(-1)!;
          return (
            <button key={k} onClick={() => setView("messages", k)} className="w-full text-left flex items-center gap-3 px-5 py-3 border-b border-line hover:bg-white/5">
              <Avatar id={k} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2"><span className="font-semibold text-[15px]">{characters[k].name}</span><span className="text-xs text-muted">{dayName(last.day)}</span></div>
                <div className="text-sm text-muted truncate">{last.from === "you" ? "You: " : ""}{last.text}</div>
              </div>
            </button>
          );
        })}
      </Shell>
    );
  }

  if (id === "bank") {
    const tx = [...game.transactions].reverse().filter((t) => t.account !== "debt");
    return (
      <Shell title="Northlake Bank" onBack={back}>
        <div className="grid grid-cols-2 gap-3 p-4">
          <div className="rounded-2xl bg-gradient-to-br from-sky-500/20 to-blue-700/10 border border-sky-400/20 p-4">
            <div className="text-xs text-muted">Checking</div>
            <div className={cx("text-2xl font-bold tabular", game.checking < 50 ? "text-danger" : "")}>{money(game.checking)}</div>
          </div>
          <div className="rounded-2xl bg-surface-2 border border-line p-4">
            <div className="text-xs text-muted">Savings</div>
            <div className="text-2xl font-bold tabular text-savings">{money(game.savings)}</div>
          </div>
        </div>
        <div className="px-5 pb-2 text-xs uppercase tracking-wider text-muted">Activity</div>
        {tx.length === 0 && <p className="px-5 text-sm text-muted">Nothing yet.</p>}
        {tx.map((t, i) => (
          <Row key={i}>
            <div><div className="text-sm font-medium">{t.label}</div><div className="text-xs text-muted">Day {t.day} · {t.account}</div></div>
            <div className={cx("tabular font-semibold", t.amount < 0 ? "text-text" : "text-money")}>{money(t.amount, { sign: true })}</div>
          </Row>
        ))}
      </Shell>
    );
  }

  if (id === "bills") {
    const total = game.recurring.reduce((a, r) => a + r.amount, 0);
    return (
      <Shell title="Bills & subscriptions" onBack={back}>
        <div className="p-4">
          <div className="rounded-2xl bg-surface-2 border border-line p-4 flex justify-between items-end">
            <div><div className="text-xs text-muted">Auto-charges every month</div><div className="text-2xl font-bold tabular">{money(total)}</div></div>
            {game.debt > 0 && <div className="text-right"><div className="text-xs text-muted">You owe</div><div className="text-lg font-bold tabular text-danger">{money(game.debt)}</div></div>}
          </div>
        </div>
        {game.recurring.map((r) => (
          <Row key={r.id}>
            <div><div className="text-sm font-medium">{r.name}</div><div className="text-xs text-muted">{r.kind === "subscription" ? "Subscription · renews monthly" : "Bill · monthly"}</div></div>
            <div className="flex items-center gap-3">
              <span className="tabular font-semibold">{money(r.amount)}</span>
              {r.kind === "subscription" && <Button variant="danger" className="h-8 px-3 text-xs rounded-lg" onClick={() => cancelRecurring(r.id)}>Cancel</Button>}
            </div>
          </Row>
        ))}
        {game.recurring.length === 0 && <p className="p-6 text-center text-muted text-sm">Nothing auto-charges you. Rare.</p>}
      </Shell>
    );
  }

  if (id === "savings") {
    const res = resilience(game);
    return (
      <Shell title="Savings" onBack={back}>
        <div className="p-4 space-y-3">
          <div className="rounded-2xl bg-gradient-to-br from-teal-400/20 to-cyan-700/10 border border-teal-300/20 p-4">
            <div className="text-xs text-muted">Saved</div>
            <div className="text-3xl font-bold tabular text-savings">{money(game.savings)}</div>
            <div className="text-xs text-muted mt-1">{game.flags.autosave ? `Auto-save on: ${money(game.flags.autosave as number)} every payday` : "Auto-save is off"}</div>
          </div>
          <div className="rounded-2xl bg-surface-2 border border-line p-4">
            <div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="w-4 h-4 text-money" /> Resilience</div>
            <div className="text-xs text-muted mt-1">How much of a {money(EMERGENCY_BENCHMARK)} cushion do you have after what you owe?</div>
            <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-money to-savings transition-[width] duration-700" style={{ width: `${res}%` }} /></div>
            <div className="mt-1 text-sm tabular">{res}/100</div>
          </div>
        </div>
      </Shell>
    );
  }

  if (id === "work") {
    const msgs = game.threads.alex ?? [];
    return (
      <Shell title="Cornerstone Café" onBack={back}>
        <div className="p-4">
          <div className="rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-700/10 border border-amber-300/20 p-4">
            <div className="text-xs text-muted">Next paycheck</div>
            <div className="text-2xl font-bold tabular">{money(game.income)}</div>
            <div className="text-xs text-muted mt-1">Part-time · paid on the 1st and 15th · Manager: Alex</div>
          </div>
        </div>
        <div className="px-5 pb-2 text-xs uppercase tracking-wider text-muted">From Alex</div>
        {msgs.length === 0 && <p className="px-5 text-sm text-muted">Nothing yet.</p>}
        {msgs.filter((m) => m.from !== "you").map((m, i) => <Row key={i}><div className="text-sm">{m.text}</div><span className="text-xs text-muted shrink-0">Day {m.day}</span></Row>)}
      </Shell>
    );
  }

  if (id === "shop") {
    const items = [
      { name: "Court Low ‘Ash’", price: 89, own: !!game.flags.sneakers },
      { name: "Pulse ANC headphones", price: 140, own: game.flags.headphones === "full" || game.flags.headphones === "bnpl" },
      { name: "Nightshift hoodie", price: 54, own: false },
      { name: "Desk lamp · warm", price: 32, own: false },
    ];
    return (
      <Shell title="Dropp" onBack={back}>
        <div className="grid grid-cols-2 gap-3 p-4">
          {items.map((it) => (
            <div key={it.name} className="rounded-2xl bg-surface-2 border border-line p-3">
              <div className="aspect-square rounded-xl bg-gradient-to-br from-fuchsia-500/30 to-purple-800/20 mb-2" aria-hidden />
              <div className="text-sm font-medium leading-tight">{it.name}</div>
              <div className="text-sm tabular text-muted">{it.own ? "Owned" : money(it.price)}</div>
            </div>
          ))}
        </div>
        <p className="px-5 pb-6 text-xs text-muted text-center">Drops show up as notifications. Nothing to buy right now.</p>
      </Shell>
    );
  }

  const feed = game.threads.feed ?? [];
  return (
    <Shell title={meta.name} onBack={back}>
      <div className="p-4 space-y-3">
        {[...feed].reverse().map((m, i) => (
          <div key={i} className="rounded-2xl bg-surface-2 border border-line p-4">
            <div className="flex items-center gap-2 mb-2"><Avatar id="feed" size={24} /><span className="text-xs text-muted">Day {m.day}</span></div>
            <div className="text-sm">{m.text}</div>
          </div>
        ))}
        <div className="rounded-2xl bg-surface-2 border border-line p-4">
          <div className="flex items-center gap-2 mb-2"><Avatar id="maya" size={24} /><span className="text-sm font-medium">Maya</span></div>
          <div className="text-sm">first paycheck week for like half of us 💸</div>
        </div>
        <div className="rounded-2xl bg-surface-2 border border-line p-4">
          <div className="flex items-center gap-2 mb-2"><Avatar id="jordan" size={24} /><span className="text-sm font-medium">Jordan</span></div>
          <div className="text-sm">why does every app want $9.99 a month</div>
        </div>
      </div>
    </Shell>
  );
}
