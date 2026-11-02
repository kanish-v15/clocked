-- The nightly 8:30 pm timer for the notification test.
-- Run this in Supabase → SQL Editor after the app is online.
-- Replace the two placeholders first. Don't commit the real secret back into this file.
--
-- Supabase's timer runs in UTC. 8:30 pm in India (IST) is 15:00 UTC.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'clocked-nightly-push',
  '0 15 * * *',
  $$
  select net.http_post(
    url := 'https://YOUR-APP.vercel.app/api/send',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_CRON_SECRET',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- To check it's scheduled:   select jobname, schedule from cron.job;
-- To see past runs:          select status, start_time from cron.job_run_details order by start_time desc limit 10;
-- To stop it after the test: select cron.unschedule('clocked-nightly-push');
