"use client";
import { useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { useGame } from "@/store/gameStore";
import { PhoneFrame } from "@/components/phone/PhoneFrame";
import { Intro } from "@/components/intro/Intro";
import { Play } from "./Play";
import { Results } from "@/components/results/Results";

export function Game() {
  const game = useGame((s) => s.game);
  const params = useSearchParams();
  // Avoid hydration mismatch: the persisted game only exists on the client.
  const ready = useSyncExternalStore(() => () => {}, () => true, () => false);

  return (
    <PhoneFrame>
      {!ready ? (
        <div className="flex-1 grid place-items-center text-muted text-sm">Loading your life…</div>
      ) : !game ? (
        <Intro initialRoom={params.get("room")} />
      ) : game.phase === "results" ? (
        <Results game={game} />
      ) : (
        <Play game={game} />
      )}
    </PhoneFrame>
  );
}
