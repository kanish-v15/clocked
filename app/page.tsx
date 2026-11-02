"use client";

import { useCallback, useEffect, useState } from "react";

type Log = { kind: "nightly" | "now"; sent_at: string; received_at: string | null; status: string };
type Phase = "loading" | "install" | "unsupported" | "ready" | "blocked" | "joined";

// The browser wants the public key as raw bytes.
function keyBytes(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

const time = (iso: string) => new Date(iso).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" });
function delayText(l: Log): { text: string; cls: string } {
  if (l.status === "failed") return { text: "failed to send", cls: "late" };
  if (!l.received_at) return { text: "not arrived yet", cls: "" };
  const s = Math.max(0, Math.round((new Date(l.received_at).getTime() - new Date(l.sent_at).getTime()) / 1000));
  if (s < 60) return { text: `arrived in ${s} s`, cls: "fast" };
  const m = Math.round(s / 60);
  return { text: `arrived after ${m} min`, cls: m > 5 ? "late" : "" };
}

export default function PushTest() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok?: string; err?: string }>({});
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [log, setLog] = useState<Log[]>([]);

  useEffect(() => {
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    try { setName(localStorage.getItem("clocked-test-name") ?? ""); } catch {}
    if (ios && !standalone) { setPhase("install"); return; }
    if (!supported) { setPhase("unsupported"); return; }
    navigator.serviceWorker
      .register("/sw.js")
      .then(async reg => {
        const sub = await reg.pushManager.getSubscription();
        if (sub && Notification.permission === "granted") { setEndpoint(sub.endpoint); setPhase("joined"); }
        else setPhase(Notification.permission === "denied" ? "blocked" : "ready");
      })
      .catch(() => setPhase("unsupported"));
  }, []);

  const refresh = useCallback(async (ep: string) => {
    try {
      const res = await fetch("/api/my-log", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint: ep }) });
      const j = (await res.json()) as { log: Log[]; joined?: boolean };
      setLog(j.log ?? []);
      if (j.joined === false) { setEndpoint(null); setPhase("ready"); }
    } catch {}
  }, []);

  useEffect(() => {
    if (!endpoint) return;
    refresh(endpoint);
    const t = setInterval(() => refresh(endpoint), 15000);
    return () => clearInterval(t);
  }, [endpoint, refresh]);

  async function join() {
    if (!name.trim()) { setNote({ err: "Add your name first, so the results show who's who." }); return; }
    setBusy(true); setNote({});
    try {
      // The permission prompt has to come straight from the tap, so it goes first.
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPhase(permission === "denied" ? "blocked" : "ready");
        setNote({ err: "Notifications weren't allowed, so Sarge can't reach this phone." });
        return;
      }
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) throw new Error("The app is missing its notification key. Tell Kanish.");
      const reg = await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) }));
      const res = await fetch("/api/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: name.trim(), subscription: sub.toJSON() }) });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Couldn't join the test.");
      try { localStorage.setItem("clocked-test-name", name.trim()); } catch {}
      setEndpoint(sub.endpoint);
      setPhase("joined");
      setNote({ ok: "You're in. Sarge messages this phone every night at 8:30 pm for 7 nights." });
    } catch (e) {
      setNote({ err: (e as Error).message || "Something went wrong. Try again." });
    } finally {
      setBusy(false);
    }
  }

  async function testNow() {
    if (!endpoint) return;
    setBusy(true); setNote({});
    try {
      const res = await fetch("/api/test-now", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint }) });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Couldn't send it.");
      setNote({ ok: "Sent. Lock your phone. It should arrive within a few seconds." });
      setTimeout(() => refresh(endpoint), 5000);
    } catch (e) {
      setNote({ err: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function leave() {
    if (!endpoint) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      await fetch("/api/subscribe", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint }) });
      await sub?.unsubscribe();
      setEndpoint(null); setLog([]); setPhase("ready");
      setNote({ ok: "You've left the test. No more messages." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="wrap">
      <span className="lab">Notification test · 7 nights</span>
      <h1 className="mark">Clocked</h1>
      <p className="lead">This checks one thing: whether Sarge's 8:30 pm message reaches your phone on time. It takes a minute to set up.</p>

      {phase === "loading" && <p className="lead">Checking your phone…</p>}

      {phase === "install" && (
        <section className="card">
          <h2>First, add it to your Home Screen</h2>
          <p className="lead">On iPhone, notifications only work from the Home Screen.</p>
          <ol className="steps">
            <li>Tap the Share button in Safari&apos;s toolbar</li>
            <li>Choose Add to Home Screen, then Add</li>
            <li>Open Clocked from your Home Screen. This page then lets you turn on notifications</li>
          </ol>
        </section>
      )}

      {phase === "unsupported" && (
        <section className="card">
          <h2>This browser can&apos;t do it</h2>
          <p className="lead">Open this page in Safari on iPhone (iOS 16.4 or newer), or Chrome on Android.</p>
        </section>
      )}

      {phase === "blocked" && (
        <section className="card">
          <h2>Notifications are blocked</h2>
          <p className="lead">On iPhone: Settings, then Notifications, then Clocked, then turn on Allow Notifications. Then come back here.</p>
          <button className="btn ghost" onClick={() => setPhase("ready")}>I turned them on</button>
        </section>
      )}

      {phase === "ready" && (
        <section className="card">
          <h2>Let Sarge reach you</h2>
          <label className="field">Your name
            <input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="So the results show who's who" maxLength={40} autoComplete="given-name" />
          </label>
          <button className="btn sun" onClick={join} disabled={busy}>{busy ? "Turning on…" : "Turn on notifications"}</button>
        </section>
      )}

      {phase === "joined" && (
        <>
          <section className="card">
            <h2>You&apos;re in</h2>
            <p className="lead">Every night at 8:30 pm, Sarge sends this phone a message. You don&apos;t need to do anything else. The app records when each one arrives.</p>
            <button className="btn" onClick={testNow} disabled={busy}>Send me one now</button>
          </section>
          <section className="card">
            <h2>Your messages</h2>
            {log.length === 0 ? (
              <p className="lead">None yet. The first one comes tonight at 8:30 pm, or tap Send me one now.</p>
            ) : (
              <div className="log">
                {log.map((l, i) => { const d = delayText(l); return (
                  <div key={i}><b>{l.kind === "nightly" ? "8:30 pm message" : "Test message"} · {time(l.sent_at)}</b><span className={d.cls}>{d.text}</span></div>
                ); })}
              </div>
            )}
          </section>
          <button className="btn ghost" onClick={leave} disabled={busy}>Leave the test</button>
        </>
      )}

      {note.ok && <p className="ok" role="status">{note.ok}</p>}
      {note.err && <p className="err" role="alert">{note.err}</p>}
    </main>
  );
}
