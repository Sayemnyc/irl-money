import { characters } from "@/content/characters";
import type { CharacterId } from "@/engine/types";
import { Bell, Building2, ShoppingBag, Sparkles, UserRound } from "lucide-react";

const icons: Partial<Record<CharacterId, React.ComponentType<{ className?: string }>>> = {
  bank: Building2, shop: ShoppingBag, feed: Sparkles, unknown: UserRound,
};

export function Avatar({ id, size = 36, hue }: { id: CharacterId; size?: number; hue?: number }) {
  const c = characters[id];
  const Icon = icons[id] ?? (id === "bank" ? Bell : null);
  const h = hue ?? c.hue;
  return (
    <div
      aria-hidden
      className="grid place-items-center rounded-full font-semibold text-white shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4, background: `linear-gradient(135deg, hsl(${h} 70% 55%), hsl(${h + 30} 70% 40%))` }}
    >
      {Icon ? <Icon className="w-[55%] h-[55%]" /> : c.initials}
    </div>
  );
}
