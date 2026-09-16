import type { GameState } from "./types";
import { money, resilience } from "./finance";

export type KeyMoment = { title: string; detail: string; amount?: number };

export type Summary = {
  headline: string;
  story: string;
  moments: KeyMoment[];
  resilience: number;
};

/** Rule-based narrative: every branch reads the flags the scenarios set. */
export function summarize(s: GameState): Summary {
  const f = s.flags;
  const res = resilience(s);
  const spentOnFun = s.decisions
    .filter((d) => ["concert", "sneaker_drop", "sneaker_restock", "food_run", "food_run_2", "bnpl_headphones"].includes(d.scenario))
    .reduce((sum, d) => sum + Math.max(0, -d.deltas.checking), 0);
  const repair = f.repair as string | undefined;

  let headline: string;
  let story: string;
  if (s.debt >= 100 && s.life < 55) {
    headline = "A rough month.";
    story = `You ended owing ${money(s.debt)} and still didn't get much out of it. Spending went out early, the surprise landed, and borrowing filled the gap.`;
  } else if (s.debt >= 100) {
    headline = "You had fun. It cost more than it looked.";
    story = `You spent ${money(spentOnFun)} on things you wanted before the phone broke, so the repair went on credit. You end the month owing ${money(s.debt)}.`;
  } else if (res >= 70 && s.life < 60) {
    headline = "Financially solid. Socially quiet.";
    story = `You protected your money — ${money(s.savings)} saved, no debt — but you turned down most of what your friends invited you to. Some months that's the right call. Every month, it wears on you.`;
  } else if (res >= 70) {
    headline = "You found the balance.";
    story = `You said yes to some things, no to others, and still had a cushion when the phone broke. ${money(s.savings)} saved, no debt, and a month you actually enjoyed.`;
  } else if (res >= 35) {
    headline = "You made it. Barely.";
    story = `No debt, but there's not much left either — ${money(s.checking + s.savings)} between checking and savings. One more surprise and this month goes a different way.`;
  } else {
    headline = "Running on empty.";
    story = `You finished with ${money(s.checking)} in checking. The month worked out, but only because nothing else broke.`;
  }

  const moments: KeyMoment[] = [];
  const concert = f.concert as string | undefined;
  if (concert === "full") moments.push({ title: "The $145 concert", detail: repair === "credit" || repair === "wait" ? "Great night — and the reason the phone repair had to wait or go on credit." : "Your biggest want of the month. You covered it without borrowing.", amount: -145 });
  if (concert === "lawn") moments.push({ title: "Lawn seats", detail: "Same concert, $85 cheaper. Maya still found you.", amount: -60 });
  if (concert === "skip") moments.push({ title: "Skipping the concert", detail: `Saved $145. Cost you a night everyone else still talks about.` });
  if (repair === "savings") moments.push({ title: "Emergency fund, used as intended", detail: "Savings absorbed the $160 repair. That's exactly the job it had.", amount: -160 });
  if (repair === "credit") moments.push({ title: "Repair on credit", detail: f.creditPaidFull ? "You paid the card off in full. No interest, small credit boost." : f.creditMinimum ? "You paid the minimum. Interest is now growing the balance." : f.creditMissed ? "You skipped the payment. Fees, interest, and a 25-point credit hit." : "The bill is still open.", amount: -160 });
  if (repair === "wait" || repair?.endsWith("-late")) moments.push({ title: "Waiting on the repair", detail: "$160 became $210, plus missed shifts and a lost bonus.", amount: -210 });
  if (repair === "checking") moments.push({ title: "Covered the repair from checking", detail: "You had enough on hand. Notice what you'd already said no to." , amount: -160 });
  if (f.usedBNPL) moments.push({ title: "Pay-in-4 headphones", detail: f.bnplLate ? "One installment bounced: $7 fee and a credit hit. 'Interest-free' isn't free when you're short." : "Every installment cleared, but $35 kept leaving each week whether you'd planned for it or not.", amount: -140 });
  if (f.scammed) moments.push({ title: "The message from 'Unknown'", detail: `Cost ${money(f.scamLoss as number)} and a lot of trust. Urgency plus guaranteed money is the pattern.`, amount: -(f.scamLoss as number) });
  if (f.scamReported) moments.push({ title: "Reported the scam", detail: "You spotted the pressure and didn't bite." });
  if (f.autosave) moments.push({ title: "Auto-save", detail: "Money you never saw in checking was there when it mattered.", amount: 50 });
  if (f.lent && f.repaid) moments.push({ title: "Lending Jordan money", detail: "Paid back in full. This time.", amount: 0 });
  if (f.lent && !f.repaid) moments.push({ title: "Lending Jordan money", detail: `${money(f.lent as number)} that hasn't come back. A loan to a friend is a gift until it isn't.`, amount: -(f.lent as number) });
  if (f.phoneLate) moments.push({ title: "Late phone bill", detail: "'Later' cost $10 and 12 credit points.", amount: -10 });
  if (f.cancelled_streamly || f.cancelled_cloudsave) moments.push({ title: "Cancelled subscriptions", detail: `Stopped ${[f.cancelled_streamly && "Streamly", f.cancelled_cloudsave && "CloudSave+"].filter(Boolean).join(" and ")} from auto-charging next month.` });
  if (f.extraShift) moments.push({ title: "Saturday shift", detail: f.bonus ? "$96 extra, then a $75 bonus for showing up." : "$96 extra on your second check.", amount: f.bonus ? 171 : 96 });
  if (f.hoursCut) moments.push({ title: "Hours cut", detail: "Income isn't a promise. Your second check was $130 lighter.", amount: -130 });

  return { headline, story, moments: moments.slice(0, 4), resilience: res };
}
