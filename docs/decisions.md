# Product decisions

What is settled so far. Any of it can change once the beta shows what people actually do.

## What Clocked is

- A social feed for discipline. The only thing anyone can post is proof they did a habit. A tough-love coach, Sarge, runs alongside.
- An installable web app (PWA) for iPhone, Android and Mac. No native apps.

## First version

- Personal tracking: work, habits, streaks, sleep and diet.
- Friends' challenge rooms with a shared goal, like 100 pushups a day or losing 5 kg.
- A free beta comes first. Paid plans come later, once we know how many groups are still logging on day 30.

## Logging

- Logging lives on the Clock in tab, the + in the middle of the tab bar: one big tile per habit. Tap to add. Hold to set an exact number. Or type a sentence.
- Any habit, any unit, any daily goal.
- Each habit has its own days. A planned rest day does not break the streak.
- Whole life areas (fitness, sleep, diet, work, mind) can be switched off.

## Sarge, the coach

- One persona for everyone. The only setting is his tone: Gentle, or Brutal (swears, lets nothing slide).
- He comes to you with a morning plan, an evening call-out and next-day follow-ups, all by phone notification.
- He is hard on effort and never on bodies or food. There is a calorie floor, a cap on weight-loss pace, an adults-only rule, and he drops the tough act when someone sounds distressed.
- He remembers goals, promises and excuses. You can see and delete everything he remembers.
- He is not based on any real person. No real names, voices or catchphrases.

## Squads

- 3 to 5 friends. Each squad sets:
  - the challenge type and length: reps a day, a streak, kilos lost or any habit, over 7, 30 or 90 days
  - proof rules: take each other's word, or a photo with every log
  - stakes: none, loser buys coffee, or a dare
  - recap time and how spicy the gossip gets
- Each person picks which stats the squad can see. Weight and meals start private.
- The nightly gossip is written only from those shared stats, and everyone in the squad sees it.

## Notifications

- Phone notifications come from the web app. On iPhone they only work after "Add to Home Screen", so setup walks people through it.

## Decided 24 Oct 2026

| Decision | Choice |
| --- | --- |
| How people log | Tap and type only. No voice in the first version |
| Diet | People type their own calories. The calorie floor still applies |
| AI model for the coach | Claude Haiku 5.5 (changed on 2 Nov from free Groq models). About $1 a month for 5 testers, paid from a $5 prepaid balance |
| Sign-in | A code sent to any email. No passwords |
| Web address | clocked.kanishv.in |

## Decided 2 Nov 2026

The app became a feed. The prototype in `design/prototype.html` shows all of this, from sign-in to the end of a challenge.

### Screens

- Tabs: Home, Crews, Clock in (+), Board, Profile. Activity and Messages sit in Home's top corner. Sarge is pinned in Messages.
- Home: story rings for each friend's day, then your day, then the feed. A ring fills as that friend clocks in. After 8 pm with nothing logged it goes dashed and says AWOL.
- Posting: finishing a habit offers a post. The app makes the card and Sarge writes the caption. A photo is optional.
- Who sees photos: your squad sees photos. Crews and Instagram stories get the card only.
- Crews: public groups around one discipline, with a creed, a daily roll call and a weekly crew war. They open after the beta, once there are enough people to fill one.
- Journal: dropped from the first version.

### Safety numbers

- Calorie floor: 1,200 kcal a day. Below it, Sarge warns kindly in both tones.
- Weight-loss challenges can target at most 1 kg a week.
- Sign-up asks "Are you 18 or older?". Under 18 can't continue.
- When someone sounds upset, Sarge drops the act for the rest of the day. He shows Tele-MANAS (14416) in India and findahelpline.com elsewhere. Call-outs, squad notes and backup stop that day.

### What Sarge does on his own

- Calls in backup: the 8:30 pm call-out, then a note to the squad at 9:15, then at 9:30 a friend who has finished and opted in nudges you. Each person opts in to being backup. A friend is asked at most once a day.
- A weekly review that spots one pattern and offers one change you accept with a tap.
- Raises a goal after a clean week. Offers a minimum to save the streak when you're sliding.
- Builds a plan from a goal like "run 10k by March", within the safety numbers.

### The coaches together

- Duels: one-on-one for tomorrow, settled at the debrief. Declining is allowed, and the debrief says so.
- Bounties: first to a number before 8 am takes the crown for the day.
- When a challenge ends, the coaches suggest the next one from the squad's weak spots.

### The game

- Ranks: Recruit, Private at 7, Corporal at 30, Sergeant at 90 clocked days. You drop a rank only after a full week with nothing clocked.
- Squad health bar: -10 for each miss, +15 when everyone clocks in. At zero the whole squad pays the stakes, and it refills to 100.
- MVP and Slacker of the night show on their rings until the next debrief.
- The debrief's heat is picked by the squad: mild, spicy or savage. Only savage swears. Everyone gets the same debrief.

### From the market check

- Pause: up to 7 days, once a month, for travel or illness. Your streak freezes, Sarge goes quiet, and your misses don't hit the squad's health bar. A comeback you were owing carries over to your first day back.
- Slacker of the night has limits. Never the same person two nights running. Never someone on pause. Only someone who was nudged and still didn't do it.
- Sign-up doesn't pre-pick Sarge's tone. People choose Gentle or Brutal themselves.
- Backup needs both people to agree. Sign-up asks "Let Sarge send a friend after me" and "Sarge can ask me to nudge friends". Both can be changed in Settings.

### Pricing

- Free for now, with nothing behind a paywall. The old idea of $1 to join a challenge is dropped, because the market check found apps that charge for the social part stop growing.
- If we charge later, the likely candidate is Sarge as a personal coach: chat, plans, weekly reviews and backup. Logging, squads, challenges and the debrief stay free.

### Rules

| Case | Rule |
| --- | --- |
| Logging after midnight | The day ends at 4 am. Earlier logs count for the day before |
| Debrief time zone | The time zone of whoever started the squad |
| Fixing a past day | Up to 2 days back. The squad sees it was edited |
| An accidental tap | Every tap shows Undo for 5 seconds |
| No signal | Logs wait on the phone and send when it's back |
| Sarge is down | Taps still log. He answers later |
| Skip today | It counts as a miss. One comeback a week saves the streak if you finish everything the next day |
| A challenge's habit | Can't be deleted or have its area switched off until the challenge ends |
| Squad size | A challenge needs 3 people. Squads stop at 5 |
| Removing people | The squad's captain can remove people. Anyone can leave |
| Sleep | Any hours and minutes, plus wake time |
| Notifications | 7 am plan, 8:30 pm call-out, both changeable, plus quiet hours |

## Tech stack

- App: Next.js, TypeScript and Tailwind, installable as a PWA (Serwist).
- Notifications: Web Push.
- Database: Supabase (Postgres) on the free plan, changed on 2 Nov from Neon. Supabase also gives live updates for story rings and chat, with no monthly limit on how long the database runs. The free plan pauses a project after a week with no use.
- Sign-in: Supabase Auth with email codes, sent through Resend because Supabase's own email limit is too low.
- Coach and typed logs: Claude Haiku 5.5 (`claude-haiku-5-5`) through the official Anthropic TypeScript SDK (`@anthropic-ai/sdk`). If the balance runs out or the API is down, taps still log and Sarge falls back to fixed lines.
- Photo proof for squads: Supabase Storage (1 GB free), kept for 7 days. Photos are shrunk to about 100 KB so scrolling stays inside the free plan's 5 GB of downloads a month.
- Scheduler: a Cloudflare Worker every 15 minutes, because Vercel's free plan runs scheduled jobs only once a day.
- Tracing and cost: Langfuse.
- Tests: Vitest, Playwright and the hand-written Sarge test set, in GitHub Actions.
- Hosting: Vercel's free plan for the beta. It doesn't allow commercial use, so charging means Vercel Pro or another host.
