"use client";
import { motion } from "motion/react";
import { CreditCard, Landmark, MessageCircle, PiggyBank, ShoppingBag, Sparkles, BriefcaseBusiness } from "lucide-react";
import type { AppId } from "@/engine/types";
import { useGame } from "@/store/gameStore";

export const apps: { id: AppId; name: string; Icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { id: "messages", name: "Messages", Icon: MessageCircle, color: "from-emerald-400 to-emerald-600" },
  { id: "bank", name: "Bank", Icon: Landmark, color: "from-sky-400 to-blue-600" },
  { id: "work", name: "Work", Icon: BriefcaseBusiness, color: "from-amber-400 to-orange-600" },
  { id: "shop", name: "Dropp", Icon: ShoppingBag, color: "from-fuchsia-400 to-purple-600" },
  { id: "feed", name: "Feed", Icon: Sparkles, color: "from-rose-400 to-pink-600" },
  { id: "bills", name: "Bills", Icon: CreditCard, color: "from-slate-300 to-slate-500" },
  { id: "savings", name: "Savings", Icon: PiggyBank, color: "from-teal-300 to-cyan-600" },
];

export function HomeScreen({ badge }: { badge?: AppId | null }) {
  const setView = useGame((s) => s.setView);
  const game = useGame((s) => s.game);
  const debt = game?.debt ?? 0;
  return (
    <div className="flex-1 flex flex-col px-6 pt-4 pb-6">
      <div className="grid grid-cols-4 gap-x-4 gap-y-6 mt-2">
        {apps.map(({ id, name, Icon, color }, i) => (
          <motion.button
            key={id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, duration: 0.25 }}
            onClick={() => setView(id)}
            className="group flex flex-col items-center gap-1.5 rounded-xl focus-visible:outline-none"
            aria-label={`Open ${name}`}
          >
            <span className={`relative grid place-items-center w-[58px] h-[58px] rounded-[18px] bg-gradient-to-br ${color} text-white shadow-lg shadow-black/40 group-active:scale-95 transition-transform`}>
              <Icon className="w-7 h-7" />
              {(badge === id || (id === "bills" && debt > 0)) && (
                <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-danger text-[11px] font-bold grid place-items-center ring-2 ring-bg">
                  {id === "bills" && debt > 0 && badge !== id ? "!" : 1}
                </span>
              )}
            </span>
            <span className="text-[11px] text-text/90">{name}</span>
          </motion.button>
        ))}
      </div>
      <div className="mt-auto text-center text-xs text-muted">Tap an app to look around. Life keeps moving.</div>
    </div>
  );
}
