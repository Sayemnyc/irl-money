export { money } from "@/engine/finance";
export const dayName = (day: number) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][(day + 1) % 7];
export const cx = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(" ");
