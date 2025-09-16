const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator) {
    console.log("supported service Worker") 
/*Si pusieras /service-worker.js (sin el .), 
el navegador buscaría en la raíz del dominio, 
fuera del subdirectorio /GymRoutinePWA/ → da 404.
Con ./service-worker.js le decís: 
“buscá el SW dentro de esta carpeta, junto al index.html” 
→ funciona perfecto en subdirectorios.*/
    try {
      const registration = await navigator.serviceWorker.register("./service-worker.js", {scope: "./",});
      window.addEventListener('load', function(){ 
        console.log ('Service Worker registrado con scope',registration.scope)
          // First, do a one-off check if there's currently a
            // service worker in control.
        if (navigator.serviceWorker.controller) {
        console.log("This page is currently controlled by:", navigator.serviceWorker.controller,);
        }
      })
      if (registration.installing) {
        console.log("Service worker installing");
      } else if (registration.waiting) {
        console.log("Service worker installed");
      } else if (registration.active) {
        console.log("Service worker active");
      }
    } 
    catch (error) {
      console.error(`Registration failed with ${error}`);
    }
  }
};


const CACHE_VERSION = 1; // 👈 cambiás este número cuando hay cambios
const cache_name = `pwa-cache-v${CACHE_VERSION}`;
const video_cache = `video-cache-v${CACHE_VERSION}`;

const app_shell = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
]
// Instalar y guardar archivos en cache
self.addEventListener("install", (event) => {
  console.log("Service Worker: Instalando y cacheando...");
  event.waitUntil(
    caches.open(cache_name)
    .then((cache) => cache.addAll(app_shell))
    .catch((err) => console.error("Error cacheando app shell:", err))
  );
});
self.addEventListener("activate", (event) => {
  // Delete all caches that aren't named in CURRENT_CACHES.
  // While there is only one cache in this example, the same logic
  // will handle the case where there are multiple versioned caches.
  console.log("Service Worker: activando...")
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cache) => {
          if (cache!=(cache_name) && cache !=(video_cache)) {
            // If this cache name isn't present in the set of
            // "expected" cache names, then delete it.
            console.log("Deleting out of date cache:", cache);
            return caches.delete(cache);
          }
        }),
      ),
    ),
  );
});

// Intercepta todas las requests
self.addEventListener("fetch", event => {
  const requestUrl = new URL(event.request.url);

  // Si es un video, lo manejamos aparte
  if (requestUrl.pathname.match(/\.(mp4|webm|ogg)$/)) {
    event.respondWith(
      caches.open(VIDEO_CACHE).then(cache => {
        return cache.match(event.request).then(cachedVideo => {
          if (cachedVideo) {
            // 📂 Si está en cache → lo devuelve
            return cachedVideo;
          }

          // 🌐 Si no está en cache → lo baja y guarda
          return fetch(event.request).then(response => {
            if (response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          });
        });
      })
    );
    return; // 👈 evitamos que siga al código de abajo
  }

  // App Shell normal (HTML, CSS, JS, etc.)
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request);
    })
      .catch((error) => {
        // This catch() will handle exceptions that arise from the match()
        // or fetch() operations.
        // Note that a HTTP error response (e.g. 404) will NOT trigger
        // an exception.
        // It will return a normal response object that has the appropriate
        // error code set.
        console.error("  Error in fetch handler:", error);

        throw error;
      }),
  );
});


registerServiceWorker();