import { Suspense } from "react";
import { Game } from "@/components/game/Game";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <Game />
    </Suspense>
  );
}
