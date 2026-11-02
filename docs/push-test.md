# The iPhone notification test

Step 1 of `docs/build-plan.md`. It checks whether Sarge's 8:30 pm message reaches phones on time when Clocked is a web app.

The app records when each message is sent and when it lands on the phone. Nobody has to note times by hand.

## Set it up (about 20 minutes)

### 1. Supabase

1. Create a free project at supabase.com. Pick the Mumbai region so it's close to India.
2. Open **SQL Editor**, paste in all of `supabase/migrations/0001_push_test.sql`, and run it.
3. Open **Project Settings → API**. Copy the **Project URL** into `SUPABASE_URL` in `.env.local`, and the **service_role** secret into `SUPABASE_SERVICE_ROLE_KEY`.

The other settings in `.env.local` are already filled in: the notification keys and the two secrets.

### 2. Put the code on GitHub

Vercel builds the app from the GitHub repo, so today's work has to be committed and pushed first.

### 3. Vercel

1. At vercel.com, choose **Add New → Project** and import the `clocked` repo.
2. Before you press Deploy, open **Environment Variables** and add every line from `.env.local`, one by one.
3. Deploy. Copy the app's address, which looks like `https://clocked-xxxx.vercel.app`.
4. Open that address on your iPhone and check the page loads.

### 4. The nightly timer

1. In Supabase, open **SQL Editor** and paste in `supabase/push-test-timer.sql`.
2. In the editor, not in the file, replace `YOUR-APP.vercel.app` with the app's address, and `YOUR_CRON_SECRET` with the `CRON_SECRET` from `.env.local`.
3. Run it. From then on it sends at 8:30 pm India time every night.

## Each tester (2 minutes)

1. Open the link in Safari on iPhone. iOS 16.4 or newer is needed. On Android, use Chrome.
2. Add it to the Home Screen: Share, then Add to Home Screen.
3. Open Clocked from the Home Screen, type a name, and tap **Turn on notifications**.
4. Tap **Send me one now** and check that it arrives.

Then they do nothing for 7 nights. Notifications are the thing being tested, so they shouldn't turn off notifications or Focus modes for Clocked.

## Read the results

Open `https://YOUR-APP.vercel.app/results?key=` followed by the `RESULTS_KEY` from `.env.local`.

**It passes** if, after 7 nights, at least 8 in 10 of the 8:30 pm messages arrived within 5 minutes. Then the web app plan holds.

**It fails** if more than 2 in 10 were late or never came. Then we package the app for the App Store before building anything else.

The "Send me one now" messages help tell the two problems apart. If those arrive in seconds but the 8:30 pm ones don't, the timer is the problem, not the phone.

## After the test

Stop the timer by running `select cron.unschedule('clocked-nightly-push');` in the Supabase SQL Editor.
