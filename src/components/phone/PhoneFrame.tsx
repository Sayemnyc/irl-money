"use client";
import type { ReactNode } from "react";

/** Full-bleed on phones; a device-shaped frame on tablets/desktop. */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 flex items-center justify-center md:p-6 bg-bg md:bg-[radial-gradient(80%_60%_at_50%_0%,rgba(124,108,255,0.18),transparent_60%),radial-gradient(60%_50%_at_100%_100%,rgba(255,107,169,0.12),transparent_60%)]">
      <div className="relative w-full h-[100dvh] md:h-[min(860px,calc(100dvh-3rem))] md:w-[400px] md:rounded-phone md:border md:border-white/10 md:bg-surface md:shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9),inset_0_0_0_1px_rgba(255,255,255,0.04)] md:p-2.5">
        <div className="relative h-full w-full overflow-hidden bg-bg md:rounded-[2.2rem] flex flex-col">{children}</div>
      </div>
    </div>
  );
}
