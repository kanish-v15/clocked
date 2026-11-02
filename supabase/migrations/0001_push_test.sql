-- Step 1: the iPhone notification test.
-- Run this once in Supabase → SQL Editor.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.push_log (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
  kind text not null check (kind in ('nightly', 'now')),
  sent_at timestamptz not null default now(),
  status text not null default 'sent' check (status in ('sent', 'failed')),
  error text,
  received_at timestamptz
);

create index if not exists push_log_sub_sent on public.push_log (subscription_id, sent_at desc);

-- Row level security on, with no policies: only the server, using the service role key, can read or write.
-- The browser's public key gets nothing.
alter table public.push_subscriptions enable row level security;
alter table public.push_log enable row level security;
