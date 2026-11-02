# Build plan

How the first real version of Clocked gets built, in order. It follows `docs/decisions.md` and the prototype in `design/prototype.html`. The target is a working app for 5 testers, not the full public launch.

Each step ends with a "Done when" check. A step isn't done until that check passes on a real phone.

## Why this order

The riskiest thing goes first: whether Sarge's notifications reach iPhones at all. After that comes the daily loop people repeat every day: clock in, post, see friends' rings fill. Squads come next, and Sarge's timed messages come last, because they need everything before them.

## What Kanish sets up

These accounts are needed before step 2. Step 1 needs only the first two.

| Account | What it's for | Cost |
| --- | --- | --- |
| Vercel | Hosts the app | Free |
| Supabase | Database, sign-in, live updates, photos | Free |
| Cloudflare | The 15-minute timer that sends Sarge's messages | Free |
| Resend | Sends the sign-in codes | Free |
| Anthropic | Sarge's replies (Claude Haiku 5.5) | The $5 balance |
| DNS for kanishv.in | Points clocked.kanishv.in at the app | Already owned |

The keys go into Vercel's settings. They never go into the code or into git.

## Step 1: The iPhone notification test

A one-page app that does only one thing.

- The page walks you through adding Clocked to the Home Screen.
- A button asks for notification permission. iPhones only ask when you tap something.
- Your phone's address for notifications is saved in Supabase.
- Every night at 8:30 pm, a short Sarge message goes to everyone who signed up.
- A "Send me one now" button sends a notification on the spot, so we can tell a slow timer apart from a slow phone.
- The page logs when each message was sent. Each tester notes when it arrived.

The timer runs inside Supabase (its built-in timer), not on Vercel. Vercel's free plan runs a timed job only somewhere within the hour, which would muddy the test. Using Supabase's timer also means the test needs no Cloudflare account. Setup steps are in `docs/push-test.md`.

**Done when:** 5 people have had it on their phones for 7 nights. Most messages arrived within 5 minutes of 8:30 pm. If they didn't, we package the app for the App Store before building anything else.

## Step 2: The empty app

- A Next.js app in TypeScript with Tailwind, using the colours, fonts and tab bar from the prototype.
- It installs as an app on phones (a PWA) and works on a laptop.
- It's online at clocked.kanishv.in.
- Every change to the main branch goes live by itself after the tests pass.

**Done when:** you can install it from clocked.kanishv.in and tap through the five empty tabs.

## Step 3: Sign-in and setup

- Sign in with a 6-digit email code, sent through Resend. Wrong code, expired code and resend all work like the prototype.
- "Are you 18 or older?" Under 18 can't continue.
- Profile: name, username and colour.
- Oath, first habits and a plan built from a goal.
- Sarge's tone, with nothing picked in advance.
- Home Screen steps, notifications, and the two backup questions.
- Start a squad, or land in one from an invite link.
- Crews stay hidden. They open after the beta.

**Done when:** a new tester can go from the link to Home in under 2 minutes, and signing out and back in keeps everything.

## Step 4: Clock in

- Habits with any name, unit, goal and days. Rest days and life areas work.
- Tap to add, hold for an exact number, and Undo for 5 seconds.
- Typed logs like "40 pushups, 2 glasses". Sarge reads them.
- Meals with typed calories and the 1,200 kcal floor warning.
- Sleep with hours, minutes and wake time. A private weigh-in.
- The day ends at 4 am.
- With no signal, logs wait on the phone and send when it's back.

**Done when:** a full day can be logged on a phone in airplane mode, and every log arrives once the signal is back.

## Step 5: Posts, the feed and story rings

- Finishing a habit offers a post. The card is made by the app, and Sarge writes the caption.
- Photos are shrunk to about 100 KB, and their location is removed, before upload. They're deleted after 7 days.
- Respect (including a double tap), comments, saving and sharing.
- Story rings fill live as friends clock in. A tap opens their day as a story.
- AWOL after 8 pm with nothing logged.
- Share to Instagram story with a join link.

**Done when:** two testers on two phones see each other's ring fill within a few seconds of a tap.

## Step 6: Squads

- An invite link. Squads stop at 5, and a challenge needs 3 people.
- Challenge setup: goal, length, proof, stakes, debrief time and heat. The weight-loss pace is capped at 1 kg a week.
- The board, the health bar, duels and bounties.
- The captain can remove people, and anyone can leave.
- Squad chat and direct messages, live.
- Pause for up to 7 days, once a month.

**Done when:** the 5 testers can run a 7-day challenge to the end and see the final board.

## Step 7: Sarge

Sarge runs on Claude Haiku 5.5. Every reply passes through fixed rules first.

- **Always first:** the check for someone sounding upset. It runs before anything else, in both tones. When it trips, Sarge drops the act for the day, shows Tele-MANAS (14416) and findahelpline.com, and stops call-outs, squad notes and backup.
- **Never:** comments on bodies or food, in either tone.
- His chat: logging, check-ins, plans, excuses and promises, plus his memory, which you can see and delete.
- Timed messages from the 15-minute timer: the morning plan, the 8:30 pm call-out, the squad note, backup at 9:30, and the debrief at the squad's time.
- The weekly review, raising a goal, and the minimum that saves a streak.
- The debrief: MVP, Slacker (with its limits), duels and health, at the squad's chosen heat.
- If the $5 runs out or the service is down, taps still log and Sarge uses fixed lines.

**Done when:** Sarge passes the test set below, and a full day plays out on the testers' phones: plan, call-out, nudge and debrief.

## Step 8: Streaks, ranks and the profile

- Streaks, the weekly comeback, and a streak that freezes during a pause.
- Ranks: Recruit, Private at 7, Corporal at 30 and Sergeant at 90 clocked days. You drop one only after a full week with nothing clocked.
- The profile grid, patches, the 13-week grid, and fixing the last 2 days.

**Done when:** missing a day, coming back, pausing and fixing a past day all give the same streak the prototype gives.

## Step 9: Settings and safety

- What your squad sees, notification times, quiet hours, and both backup switches.
- Sign out, and delete my account (which really deletes the data and photos).

**Done when:** a deleted account leaves nothing behind in Supabase.

## Step 10: Tests, then the 5 testers

- **The Sarge test set:** about 20 hand-written messages Sarge must handle correctly every time. Someone upset, a body or food comment to refuse, Brutal swearing that stays on effort, typed logs and an excuse. It runs before every change goes live.
- Automated tests for each "Done when" above, run on every change.
- Every Sarge reply is logged in Langfuse with its cost, so the $5 balance can be watched.
- A daily check on Supabase's free limits: database size, photo storage and downloads.

**Done when:** the 5 testers have used it for 7 days, and nobody has hit a bug that lost their data or their streak.

## Not in this version

- Crews. They open after the beta.
- Charging money. Clocked is free for now.
- Friends in different time zones. Everyone uses the squad creator's time zone.
- Store apps. Only if step 1 fails.
