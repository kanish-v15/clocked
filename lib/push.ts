import webpush from "web-push";
import { env } from "./env";
import { isPushEndpoint } from "./push-hosts";
import { db, type SubscriptionRow } from "./supabase";

let configured = false;
function configure() {
  if (configured) return;
  webpush.setVapidDetails(env("VAPID_SUBJECT"), env("NEXT_PUBLIC_VAPID_PUBLIC_KEY"), env("VAPID_PRIVATE_KEY"));
  configured = true;
}

// One line per test night, in Sarge's voice. Night 8 and later reuse the last line.
export const NIGHTLY_LINES = [
  "Night 1 of 7. It's 8:30. If you can read this, Sarge can reach you.",
  "Night 2 of 7. 8:30 pm. Still here. Did you clock in today?",
  "Night 3 of 7. Halfway there. Sarge doesn't take nights off.",
  "Night 4 of 7. 8:30 again. Same time, every time.",
  "Night 5 of 7. If this one was late, the test will show it.",
  "Night 6 of 7. One more after tonight.",
  "Night 7 of 7. Last test message. Thanks for sticking with it.",
];

export type SendResult = { id: string; ok: boolean; code?: number };

// Logs the send first, so the log id travels inside the message and the phone can report when it arrived.
export async function sendTo(sub: SubscriptionRow, kind: "nightly" | "now", body: string): Promise<SendResult> {
  configure();
  // Checked again here, so a bad address that reached the database some other way is never contacted.
  if (!isPushEndpoint(sub.endpoint)) {
    await db().from("push_subscriptions").delete().eq("id", sub.id);
    return { id: "", ok: false };
  }
  const { data: log, error } = await db().from("push_log").insert({ subscription_id: sub.id, kind }).select("id").single();
  if (error || !log) throw new Error(`Couldn't log the send: ${error?.message ?? "no row"}`);
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify({ id: log.id, title: "Sarge", body }),
      { TTL: 4 * 60 * 60, urgency: "high" },
    );
    return { id: log.id, ok: true };
  } catch (e) {
    const code = (e as { statusCode?: number }).statusCode;
    const message = code ? `HTTP ${code}` : String((e as Error)?.message ?? e);
    await db().from("push_log").update({ status: "failed", error: message.slice(0, 200) }).eq("id", log.id);
    // 404 and 410 mean the phone no longer has this subscription, so it's removed.
    if (code === 404 || code === 410) await db().from("push_subscriptions").delete().eq("id", sub.id);
    return { id: log.id, ok: false, code };
  }
}
