"use client";
import { animate, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { money } from "@/engine/finance";

export function AnimatedMoney({ value, className, sign }: { value: number; className?: string; sign?: boolean }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    if (reduced) return;
    const controls = animate(prev.current, value, { duration: 0.7, ease: "easeOut", onUpdate: (v) => setShown(v) });
    prev.current = value;
    return () => controls.stop();
  }, [value, reduced]);
  return <span className={`tabular ${className ?? ""}`}>{money(reduced ? value : shown, { sign })}</span>;
}
