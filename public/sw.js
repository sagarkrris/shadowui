self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;

      return new Response("Offline", {
        status: 503,
        statusText: "Offline",
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }),
  );
});
