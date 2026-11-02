import { db } from "@/lib/supabase";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The phone's service worker calls this the moment a message arrives. That time is what the test measures.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { id?: string };
  if (!body.id || !UUID.test(body.id)) return Response.json({ error: "Bad id." }, { status: 400 });
  await db().from("push_log").update({ received_at: new Date().toISOString() }).eq("id", body.id).is("received_at", null);
  return Response.json({ ok: true });
}
