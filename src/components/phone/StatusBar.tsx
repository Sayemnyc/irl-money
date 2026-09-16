"use client";
import { Volume2, VolumeX } from "lucide-react";
import { useGame } from "@/store/gameStore";
import { dayName } from "@/lib/format";

export function StatusBar({ day }: { day?: number }) {
  const muted = useGame((s) => s.muted);
  const toggleMute = useGame((s) => s.toggleMute);
  return (
    <div className="flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),0.75rem)] pb-1 text-[13px] font-medium text-muted">
      <span className="tabular text-text">{day ? `${dayName(day)} · Day ${day}` : "IRL Money"}</span>
      <div className="flex items-center gap-2">
        <span className="w-4 h-2 rounded-[2px] border border-muted/70 relative after:absolute after:inset-[1.5px] after:right-[3px] after:bg-muted/70 after:rounded-[1px]" aria-hidden />
        <button onClick={toggleMute} aria-label={muted ? "Unmute sounds" : "Mute sounds"} className="p-1 -m-1 rounded-md hover:text-text">
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
