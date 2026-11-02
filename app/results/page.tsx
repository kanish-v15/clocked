import type { Metadata } from "next";
import { db, type PushLogRow, type SubscriptionRow } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Clocked test results", robots: { index: false, follow: false } };

const ON_TIME_SECONDS = 5 * 60;

function device(ua: string | null): string {
  if (!ua) return "Unknown";
  if (/iPhone|iPad|iPod/.test(ua)) return "iPhone";
  if (/Android/.test(ua)) return "Android";
  if (/Macintosh/.test(ua)) return "Mac";
  return "Other";
}
const secs = (l: PushLogRow) => (l.received_at ? (new Date(l.received_at).getTime() - new Date(l.sent_at).getTime()) / 1000 : null);
function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b), m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
const fmt = (s: number | null) => (s == null ? "–" : s < 60 ? `${Math.round(s)} s` : `${Math.round(s / 60)} min`);

export default async function Results({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const { key } = await searchParams;
  if (!key || key !== process.env.RESULTS_KEY) {
    return <main className="wrap"><h1 className="mark">Results</h1><p className="err">Add your results key to the address: /results?key=…</p></main>;
  }
  const [{ data: subs }, { data: logs }] = await Promise.all([
    db().from("push_subscriptions").select("*").order("created_at"),
    db().from("push_log").select("*").order("sent_at", { ascending: false }).limit(1000),
  ]);
  const testers = (subs ?? []) as SubscriptionRow[];
  const all = (logs ?? []) as PushLogRow[];
  const nightly = all.filter(l => l.kind === "nightly");
  const onTime = nightly.filter(l => { const s = secs(l); return s != null && s <= ON_TIME_SECONDS; }).length;
  const share = nightly.length ? Math.round((onTime / nightly.length) * 100) : null;

  return (
    <main className="wrap" style={{ maxWidth: 760 }}>
      <span className="lab">Notification test results</span>
      <h1 className="mark">Results</h1>
      <section className="card">
        <h2>{share == null ? "No 8:30 pm messages sent yet" : `${share}% arrived within 5 minutes`}</h2>
        <p className="lead">
          {share == null
            ? "The first nightly send is at 8:30 pm."
            : share >= 80
              ? "The web app plan holds. Notifications reach phones on time."
              : "Too many were late or never arrived. That points to packaging the app for the App Store."}
        </p>
        <p className="lead">{onTime} of {nightly.length} nightly messages on time, across {testers.length} {testers.length === 1 ? "phone" : "phones"}.</p>
      </section>
      <section className="card scroll">
        <table>
          <thead><tr><th>Tester</th><th>Phone</th><th>Nights sent</th><th>On time</th><th>Never arrived</th><th>Typical delay</th></tr></thead>
          <tbody>
            {testers.map(t => {
              const mine = nightly.filter(l => l.subscription_id === t.id);
              const delays = mine.map(secs).filter((s): s is number => s != null);
              const ok = delays.filter(s => s <= ON_TIME_SECONDS).length;
              const missing = mine.filter(l => !l.received_at).length;
              return <tr key={t.id}><td>{t.name}</td><td>{device(t.user_agent)}</td><td>{mine.length}</td><td>{ok}</td><td>{missing}</td><td>{fmt(median(delays))}</td></tr>;
            })}
          </tbody>
        </table>
      </section>
      <section className="card scroll">
        <h2>Every message</h2>
        <table>
          <thead><tr><th>Tester</th><th>Kind</th><th>Sent</th><th>Arrived after</th></tr></thead>
          <tbody>
            {all.slice(0, 200).map(l => {
              const t = testers.find(x => x.id === l.subscription_id);
              return <tr key={l.id}><td>{t?.name ?? "Left the test"}</td><td>{l.kind === "nightly" ? "8:30 pm" : "Test"}</td><td>{new Date(l.sent_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", hour: "numeric", minute: "2-digit" })}</td><td>{l.status === "failed" ? `Failed (${l.error ?? ""})` : fmt(secs(l))}</td></tr>;
            })}
          </tbody>
        </table>
      </section>
    </main>
  );
}
