// module.exports = {
//   staticFileGlobs: [
//     "public/**/*.html",
//     "public/**/*.json",
//     "public/**/*.css",
//     "public/**/*.js",
//     "public/**/*.png",
//     "public/**/*.jpg",
//     "public/**/*.svg",
//     "public/**/*.ico",
//   ],
//   stripPrefix: "public",
//   skipWaiting: true,
//   runtimeCaching: [
//     {
//       //   urlPattern: /^https:\/\/api\.example\.com/,
//       handler: "cacheFirst",
//     },
//   ],
// };

const CACHE_NAME = "cache-v0.8.3";
const urlsToCache = [
  "/",
  "index.html",
  "manifest.json",
  //   "/assets/android",
  //   "/assets/ios",
  //   "/assets/windows11",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .catch((err) => console.log(err))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            return caches.delete(key);
          })
      );
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
