# IRL Money — First Paycheck

*Your first real life. Try not to go broke.*

**Live:** https://irl-money.vercel.app · Teacher mode: https://irl-money.vercel.app/teacher

A financial-life simulation for middle-school students. You get a paycheck, life arrives through a fictional phone (texts, bank alerts, drops, bills), and every choice has an immediate effect and often a delayed one. Nobody says "wrong answer" — the month just plays out.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build && npm start   # production
npm test                     # engine tests (vitest)
npm run lint && npm run typecheck
```

No environment variables. No accounts. No external APIs. Progress persists in `localStorage`.

Routes: `/` student experience · `/teacher` teacher mode.

## How to use it

### As a student (or to try it yourself)

1. Open the app. Tap **Start my life**, type the name your friends use, pick a color. That's the whole signup.
2. It's **Day 1** and your first paycheck lands. From here, life arrives as notifications on the phone: texts from Maya, Jordan, Mom and your manager Alex, bank alerts, drops from the Dropp shop, posts on Feed.
3. Every notification opens to a screen. Read it, then pick a choice. Some choices are greyed out with a reason ("Only $42 in checking") — that's the game telling you an earlier decision closed a door.
4. Watch the top strip: **Checking** (spendable now), **Savings**, **Owed** (appears once you owe anything) and **Life** (how the month feels). Chips like `−$145 checking` and `+10 life` show exactly what your choice did.
5. Some events are timed. If the countdown runs out, the drop closes without you.
6. Tap **Apps** at any point to look around:
   - **Messages** — every thread so far
   - **Bank** — balances and every transaction
   - **Bills** — everything that auto-charges you. You can **Cancel** a subscription here before it renews.
   - **Savings** — your cushion and a Resilience meter
   - **Work** — your next paycheck and messages from Alex
   Tap **Now** to get back to the current event.
7. On **Day 30** you get your month: six numbers, a short story about what kind of month you built, and the two-to-four decisions that mattered most.
8. **Replay the month** rolls a fresh month (different surprises, different friend behavior). **Same month, different choices** replays the exact same month so you can test a different strategy.

Tips that the game never says out loud: the phone breaks on Day 14, the day *before* your second paycheck. What you have in savings on Day 13 decides how bad that is.

Sound: subtle pings only, toggle with the speaker icon. Progress is saved on the device, so closing the tab doesn't lose your month.

### As a teacher

Open **`/teacher`** (there's a "Teacher mode" link on the start screen). It works immediately with a demo class of 24 fictional students, so you can preview a lesson without any setup.

**Running a class**

1. Click **Start class**. Choose a class length (10 / 20 / 30 min), the scenario (First Paycheck), and a difficulty (changes how much money students start with). Click **Create room code**.
2. Put the code on the board. Students open the app, tap **Have a class code?**, enter it, and start. (They can also open `/?room=CODE` directly.)
3. As students play, the dashboard follows the class: the **Now playing** card shows the concept, the learning objective, a **discussion question** big enough for a projector, and the live split of what students chose. The roster on the right shows each student's checking, debt and life.
4. **Pause class** freezes every student's phone with a "Paused for discussion" screen. Click **Resume** when you're done.
5. **Plot twist** sends an event to everyone right now — the cracked screen is the classic one: same $160 emergency, wildly different situations. Then ask the discussion question.
6. The clock next to the room code counts down the class length you picked. Reloading the teacher tab keeps the class (same code, roster and pause state); **End class** clears it.
7. Use the timeline chips (D2 Phone bill → D25 Bonus) to jump to any event's teaching notes, before or after students reach it.
8. **Class insights** ("41% put the emergency repair on credit") and **End-of-month outcomes** are good closers. The demo numbers are fictional; live rooms replace them with real ones.

A good 20-minute shape: 8 minutes of play → pause at the cracked screen → 5 minutes of discussion → finish the month → compare two students with the same checking balance and different months.

> Live rooms currently sync between tabs/windows on **one device** (see *Connecting real multiplayer* below). For a whole classroom on separate devices today, run it in demo mode and have students play individually — the teaching notes and discussion questions work the same way.

## Sharing it online

The app is static-friendly (no server, no database, no keys), so any Next.js host works. Easiest path:

**Vercel (free tier is fine)**

1. Push the folder to a GitHub repo.
2. Go to [vercel.com/new](https://vercel.com/new), import the repo, keep the defaults (framework: Next.js), click **Deploy**.
3. You get a URL like `https://irl-money.vercel.app` — send that to students. Every push to `main` redeploys.

Or from the terminal: `npm i -g vercel && vercel login && vercel --prod`.

Netlify, Cloudflare Pages and Render all work the same way (import repo → Next.js preset). No environment variables are needed anywhere.

## Architecture

```
src/
  engine/       Pure game logic. No React.
    types.ts      GameState, Scenario, Choice, Effect
    engine.ts     newGame · nextEvent · choose · applyEffects
    rng.ts        seeded PRNG (mulberry32) — replays are reproducible
    finance.ts    money helpers, resilience score, credit labels
    results.ts    end-of-month narrative + "what changed your outcome"
    engine.test.ts
  content/      Data. Editing here changes the game.
    scenarios.ts  every event in First Paycheck
    characters.ts cast
    teacherDemo.ts simulates a 24-student demo class through the real engine
  store/        zustand store: wires engine → UI, persists, talks to the room
  classroom/    room transport (BroadcastChannel today; Supabase-shaped)
  components/
    phone/      PhoneFrame, StatusBar, MetricsStrip, HomeScreen, Apps (Messages/Bank/Bills/…)
    game/       Play (event sequencing), EventScreen (chat/bank/shop/feed cards, choices, timer)
    intro/ results/ teacher/ ui/
  lib/          sound (WebAudio, no assets), formatting
```

The engine is pure functions over a serializable `GameState`. The UI never mutates state directly; it calls store actions which call `choose` / `nextEvent`.

## How a month works

1. `newGame(content, seed)` builds a timeline: every scenario with a `when` gets a day (fixed, or seeded-random within a range; `chance` can leave it out entirely).
2. `nextEvent` pops the next queued event whose `condition` passes, applies its `autoEffects` (payday, auto-charges), and makes it `current`.
3. The player picks a `Choice`; its `effects` apply; `pending` holds the deltas and the character's reply for the feedback screen.
4. `Continue` → `nextEvent` again. When the `ends` event is dismissed (Day 30) the phase becomes `results`.

## Adding a scenario

Append to `src/content/scenarios.ts`:

```ts
{
  id: "gym_membership",
  title: "Gym trial ending",
  category: "subscription",
  app: "bank", from: "bank", visual: "bank",
  when: { between: [16, 19] },            // omit `when` for scheduled-only events
  condition: (s) => !s.flags.cancelledGym, // optional
  amount: -29.99,
  lines: ["Your free trial ends tomorrow.", "Then it's $29.99/month."],
  choices: [
    { id: "keep", label: "Keep it", effects: [{ type: "recurring", op: "add", item: { id: "gym", name: "Gym", amount: 29.99, kind: "subscription" } }] },
    { id: "cancel", label: "Cancel", effects: [{ type: "flag", key: "cancelledGym", value: true }], tone: "primary" },
  ],
  teacher: { concept: "Free trials", objective: "…", discussion: "…" },
}
```

Effects a choice (or `autoEffects`) can use: `checking`, `savings`, `transfer`, `debt`, `life`, `credit`, `income`, `flag`, `schedule`, `cancel`, `recurring`, `message`. Effects can also be a function `(state, rng) => Effect[]` for state-dependent or random outcomes. `requires` returns a reason string to show a choice disabled (e.g. "Only $42 in checking").

## Delayed consequences

Two mechanisms, both in data:

- **`schedule`** puts a scenario on the queue N days out. `friend_borrow` schedules `friend_repays` *or* `friend_ghosts` (rolled with the seeded rng). `bnpl_headphones` schedules three `bnpl_payment`s. `phone_repair → wait` schedules `phone_dies`.
- **`flags` + `condition`/state-reading `lines`** let later events react. `hours_cut` only fires if you didn't take the extra shift; `bonus` only if you did and weren't late; `credit_bill` reads `flags.cardBalance`.

`engine.test.ts` covers scheduling, cancellation, branching, replay determinism, and the design intent (an all-in spender is cornered on Day 14; a saver isn't).

## Teacher Mode (`/teacher`)

- Shows the current scenario's **concept, learning objective, discussion question**, and the class decision split.
- Loads a **demo class of 24 fictional students** (generated by running the engine with different play styles) so it's useful with zero setup. Insights ("X% put the emergency on credit") are computed from those decisions.
- **Start class** → choose length, scenario, difficulty → room code. Students enter the code on the start screen (or open `/?room=CODE`). The teacher can **pause** everyone, **send a plot twist** (e.g. the cracked screen lands right now), and watch decisions arrive live.

Today the room runs over `BroadcastChannel`, so it works across tabs/windows on one device — enough to demo the full loop. See below to make it cross-device.

## Connecting real multiplayer

`src/classroom/room.ts` defines the message types (`hello`, `config`, `decision`, `metrics`, `pause`, `twist`) and a tiny transport (`send`, `subscribe`, `close`). Swap `openRoom()` for a Supabase Realtime channel (`supabase.channel(code).on('broadcast', …)`) and nothing else changes — the store and the dashboard only speak in those messages. Persisting aggregates would be a second step (a `decisions` table keyed by room + scenario).

## Roadmap-friendly bits

- Difficulty changes starting checking (`classroom/room.ts`). Scenario packs are just more arrays of `Scenario`.
- Results narrative is rule-based in `engine/results.ts`; an AI-written variant could slot in behind the same `Summary` type without touching gameplay.
- Sound is synthesized (no assets), respects mute, and never plays before a user gesture. Motion respects `prefers-reduced-motion`.
