import { db, type PushLogRow } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The last messages sent to this phone, with when they arrived. POST keeps the phone's address out of the URL.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { endpoint?: string };
  if (!body.endpoint) return Response.json({ log: [] });
  const { data: sub } = await db().from("push_subscriptions").select("id").eq("endpoint", body.endpoint).maybeSingle();
  if (!sub) return Response.json({ log: [], joined: false });
  const { data } = await db().from("push_log").select("kind,sent_at,received_at,status").eq("subscription_id", sub.id).order("sent_at", { ascending: false }).limit(14);
  return Response.json({ log: (data ?? []) as Pick<PushLogRow, "kind" | "sent_at" | "received_at" | "status">[], joined: true });
}
