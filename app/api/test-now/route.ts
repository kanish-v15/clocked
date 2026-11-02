import { sendTo } from "@/lib/push";
import { db, type SubscriptionRow } from "@/lib/supabase";

export const runtime = "nodejs";

// "Send me one now": a message to this phone only, so a slow phone can be told apart from a slow timer.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { endpoint?: string };
  if (!body.endpoint) return Response.json({ error: "Turn on notifications first." }, { status: 400 });
  const { data: sub } = await db().from("push_subscriptions").select("*").eq("endpoint", body.endpoint).maybeSingle();
  if (!sub) return Response.json({ error: "This phone isn't in the test yet. Turn on notifications again." }, { status: 404 });

  // At most one test message a minute per phone.
  const since = new Date(Date.now() - 60_000).toISOString();
  const { count } = await db().from("push_log").select("id", { count: "exact", head: true }).eq("subscription_id", sub.id).eq("kind", "now").gte("sent_at", since);
  if ((count ?? 0) > 0) return Response.json({ error: "One test message a minute. Try again shortly." }, { status: 429 });

  const result = await sendTo(sub as SubscriptionRow, "now", "Test message. If you can read this, notifications work.");
  if (!result.ok) return Response.json({ error: "Your phone's notification service refused it. Turn notifications on again." }, { status: 502 });
  return Response.json({ ok: true });
}
