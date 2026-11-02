// Clocked service worker, step 1: show Sarge's message and report the moment it arrived.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));

self.addEventListener("push", event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = { body: event.data ? event.data.text() : "" }; }
  const title = data.title || "Sarge";
  const options = {
    body: data.body || "Clock in.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: data.id || "sarge",
    data: { id: data.id || null, url: "/" },
  };
  const report = data.id
    ? fetch("/api/received", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: data.id }) }).catch(() => {})
    : Promise.resolve();
  event.waitUntil(Promise.all([self.registration.showNotification(title, options), report]));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      for (const client of list) if ("focus" in client) return client.focus();
      return self.clients.openWindow("/");
    }),
  );
});
