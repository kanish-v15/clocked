import { env } from "@/lib/env";
import { NIGHTLY_LINES, sendTo } from "@/lib/push";
import { db, type SubscriptionRow } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The nightly 8:30 pm send. Supabase's timer calls this with the secret, so nobody else can trigger it.
export async function POST(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${env("CRON_SECRET")}`) {
    return Response.json({ error: "Not allowed." }, { status: 401 });
  }
  const { data: subs, error } = await db().from("push_subscriptions").select("*");
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const results = await Promise.allSettled(
    (subs as SubscriptionRow[]).map(async sub => {
      const { count } = await db().from("push_log").select("id", { count: "exact", head: true }).eq("subscription_id", sub.id).eq("kind", "nightly");
      const night = Math.min((count ?? 0) + 1, NIGHTLY_LINES.length);
      return sendTo(sub, "nightly", NIGHTLY_LINES[night - 1]);
    }),
  );
  const sent = results.filter(r => r.status === "fulfilled" && r.value.ok).length;
  return Response.json({ testers: subs?.length ?? 0, sent, failed: results.length - sent });
}
