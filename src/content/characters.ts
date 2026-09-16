import type { CharacterId } from "@/engine/types";

export const characters: Record<CharacterId, { name: string; role: string; initials: string; hue: number }> = {
  maya: { name: "Maya", role: "Friend", initials: "M", hue: 330 },
  jordan: { name: "Jordan", role: "Friend", initials: "J", hue: 200 },
  alex: { name: "Alex", role: "Manager · Cornerstone Café", initials: "A", hue: 40 },
  mom: { name: "Mom", role: "Family", initials: "Mo", hue: 150 },
  bank: { name: "Northlake Bank", role: "Automated alerts", initials: "N", hue: 220 },
  unknown: { name: "Unknown", role: "Not in contacts", initials: "?", hue: 0 },
  shop: { name: "Dropp", role: "Shopping", initials: "D", hue: 280 },
  feed: { name: "Feed", role: "Social", initials: "F", hue: 15 },
  you: { name: "You", role: "", initials: "Y", hue: 260 },
};
