// const CACHE_NAME = "cache-v1";
// const urlsToCache = [
//   "/",
//   "index.html",
//   "manifest.json",
//   "/assets/android",
//   "/assets/ios",
//   "/assets/windows11",
// ];

// self.addEventListener("install", (event) => {
//   event.waitUntil(
//     caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
//   );
// });

// self.addEventListener("fetch", (event) => {
//   event.respondWith(
//     caches
//       .match(event.request)
//       .then((response) => response || fetch(event.request))
//   );
// });
