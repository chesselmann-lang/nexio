// Nexio Service Worker v1.0
const CACHE_NAME = "nexio-v1";
const STATIC_ASSETS = [
  "/",
  "/chats",
  "/contacts",
  "/discover",
  "/payments",
  "/profile",
  "/manifest.json",
];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Non-fatal — continue even if some assets aren't cacheable yet
      });
    })
  );
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch — Network First, Cache Fallback ────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, cross-origin, Supabase API, and Chrome extension requests
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("supabase.co")
  ) {
    return;
  }

  // Next.js _next/static — cache first (immutable assets)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
    return;
  }

  // Everything else — network first, stale cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// ── Push Notifications ───────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Nexio", body: event.data.text() };
  }

  const { title = "Nexio", body = "Neue Nachricht", data = {} } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-72.png",
      tag: data.conversation_id || "nexio-message",
      renotify: true,
      vibrate: [100, 50, 100],
      data,
      actions: [
        { action: "open", title: "Öffnen" },
        { action: "dismiss", title: "Schließen" },
      ],
    })
  );
});

// ── Notification Click ───────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const { action, notification } = event;
  if (action === "dismiss") return;

  const conversationId = notification.data?.conversation_id;
  const url = conversationId ? `/chats/${conversationId}` : "/chats";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Focus existing window if open
      for (const client of windowClients) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// ── Background Sync (future: offline message queue) ─────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "nexio-send-messages") {
    event.waitUntil(syncPendingMessages());
  }
});

async function syncPendingMessages() {
  // TODO: Flush IndexedDB offline queue to Supabase
  console.log("[SW] Syncing pending messages…");
}
