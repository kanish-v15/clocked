import { isPushEndpoint } from "@/lib/push-hosts";
import { db } from "@/lib/supabase";

export const runtime = "nodejs";

type Body = { name?: string; subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } } };

// A phone joins the test: its notification address is saved under the tester's name.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;
  const name = (body.name ?? "").trim().slice(0, 40);
  const sub = body.subscription;
  if (!name) return Response.json({ error: "Add your name first." }, { status: 400 });
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth || !isPushEndpoint(sub.endpoint) || sub.endpoint.length > 1000) {
    return Response.json({ error: "Your phone didn't give a valid notification address. Try again." }, { status: 400 });
  }
  const { error } = await db()
    .from("push_subscriptions")
    .upsert(
      { name, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth, user_agent: req.headers.get("user-agent")?.slice(0, 300) ?? null },
      { onConflict: "endpoint" },
    );
  if (error) return Response.json({ error: "Couldn't save your phone. Try again in a minute." }, { status: 500 });
  return Response.json({ ok: true });
}

// A tester leaves the test.
export async function DELETE(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { endpoint?: string };
  if (!body.endpoint) return Response.json({ error: "Missing endpoint." }, { status: 400 });
  await db().from("push_subscriptions").delete().eq("endpoint", body.endpoint);
  return Response.json({ ok: true });
}
