import type { Rng } from "./types";

// mulberry32: tiny seeded PRNG, state is a single uint32 so it serializes with the game.
export function makeRng(state: number): Rng & { readonly state: number } {
  let a = state >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (xs) => xs[Math.floor(next() * xs.length)],
    get state() {
      return a;
    },
  };
}
