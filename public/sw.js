// Keep the shell cache versioned and never serve an HTML document from it first.
// Next.js documents contain the current build's asset references; serving an old
// document is what previously made users clear the cache after deployments.
const CACHE_NAME = "interviewiq-shell-v3";
const SHELL = ["/", "/privacy", "/reset-password"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  const acceptsHtml = event.request.headers.get("accept")?.includes("text/html");
  const isDocument = event.request.mode === "navigate" || acceptsHtml;

  // Documents must always prefer the network so a new Vercel deployment is
  // visible on the next navigation. Retain the cached shell only as offline
  // fallback.
  if (isDocument) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/")))
        .then((response) => response || new Response("Offline", { status: 503, statusText: "Offline" })),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      // Only cache immutable Next.js chunks. API responses and arbitrary
      // route assets should follow normal browser caching semantics.
      if (response.ok && response.type === "basic" && url.pathname.startsWith("/_next/static/")) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => undefined);
      }
      return response;
    })).catch(() => caches.match("/").then((cached) => cached || new Response("Offline", { status: 503, statusText: "Offline" }))),
  );
});
