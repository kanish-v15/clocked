import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

export type SubscriptionRow = {
  id: string;
  name: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  created_at: string;
};

export type PushLogRow = {
  id: string;
  subscription_id: string;
  kind: "nightly" | "now";
  sent_at: string;
  status: "sent" | "failed";
  error: string | null;
  received_at: string | null;
};

let client: SupabaseClient | null = null;

// Server-only client. It uses the service role key, so it must never be imported by a page that runs in the browser.
export function db(): SupabaseClient {
  if (!client) {
    client = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
