"use client";
import { useGame } from "@/store/gameStore";
import { AnimatedMoney } from "@/components/ui/AnimatedNumber";
import { cx } from "@/lib/format";

const Cell = ({ label, children, onClick, className }: { label: string; children: React.ReactNode; onClick?: () => void; className?: string }) => (
  <button onClick={onClick} aria-label={`${label}: open details`} className={cx("flex-1 min-w-0 text-left rounded-xl px-3 py-2 hover:bg-white/5 transition-colors", className)}>
    <div className="text-[10px] uppercase tracking-[0.12em] text-muted">{label}</div>
    <div className="text-[15px] font-semibold leading-tight truncate">{children}</div>
  </button>
);

export function MetricsStrip() {
  const game = useGame((s) => s.game);
  const setView = useGame((s) => s.setView);
  if (!game) return null;
  return (
    <div className="flex items-stretch gap-1 px-3 pb-2">
      <Cell label="Checking" onClick={() => setView("bank")}>
        <AnimatedMoney value={game.checking} className={game.checking < 50 ? "text-danger" : "text-money"} />
      </Cell>
      <Cell label="Savings" onClick={() => setView("savings")}>
        <AnimatedMoney value={game.savings} className="text-savings" />
      </Cell>
      {game.debt > 0 && (
        <Cell label="Owed" onClick={() => setView("bills")}>
          <AnimatedMoney value={game.debt} className="text-danger" />
        </Cell>
      )}
      <Cell label="Life" onClick={() => setView("feed")}>
        <div className="flex items-center gap-2">
          <span className="tabular text-life">{game.life}</span>
          <span className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden" aria-hidden>
            <span className="block h-full rounded-full bg-life transition-[width] duration-700" style={{ width: `${game.life}%` }} />
          </span>
        </div>
      </Cell>
    </div>
  );
}
