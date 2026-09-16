export const MONTH_DAYS = 30;
export const EMERGENCY_BENCHMARK = 1000; // ≈ two months of this life's fixed costs

export const r2 = (n: number) => Math.round(n * 100) / 100;
export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export const money = (n: number, opts: { sign?: boolean } = {}) => {
  const abs = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (opts.sign) return `${n < 0 ? "−" : "+"}$${abs}`;
  return `${n < 0 ? "−" : ""}$${abs}`;
};

/** 0–100: how much of a two-month cushion exists after debt. */
export function resilience(s: { checking: number; savings: number; debt: number }) {
  const cushion = s.savings + Math.max(0, s.checking) - s.debt;
  return clamp(Math.round((cushion / EMERGENCY_BENCHMARK) * 100), 0, 100);
}

export function creditLabel(score: number) {
  if (score >= 740) return "Excellent";
  if (score >= 700) return "Good";
  if (score >= 650) return "Fair";
  return "Needs work";
}
