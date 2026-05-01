// Блок Бласт — Service Worker
// Версию меняй при каждом обновлении игры
const CACHE = 'blokblast-v5';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  // Google Fonts — кешируются при первом открытии
  'https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@700;900&display=swap',
];

// Установка — кешируем все файлы
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      // Шрифты могут не загрузиться без интернета при первой установке — не критично
      return Promise.allSettled(
        ASSETS.map(function(url) {
          return cache.add(url).catch(function() {});
        })
      );
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Активация — удаляем старые кеши
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch — сначала кеш, потом сеть
self.addEventListener('fetch', function(e) {
  // Только GET запросы
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;

      // Не в кеше — идём в сеть и кешируем
      return fetch(e.request).then(function(response) {
        if (!response || response.status !== 200) return response;
        var clone = response.clone();
        caches.open(CACHE).then(function(cache) {
          cache.put(e.request, clone);
        });
        return response;
      }).catch(function() {
        // Оффлайн и не в кеше — возвращаем главную страницу
        return caches.match('./index.html');
      });
    })
  );
});