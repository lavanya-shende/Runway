const CACHE_NAME = 'runway-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/main.js',
  '/style.css',
  '/manifest.json',
  '/assets/background/grass.png',

  // Player sprites
  '/assets/student/runner.png',
  '/assets/student/boy.png',
  '/assets/student/girl.jpg',
  '/assets/student/kid.jpg',
  '/assets/student/run.png',
  '/assets/student/s.png',
  '/assets/student/backpacker-running.png',

  // Collectibles
  '/assets/collectibles/books.png',
  '/assets/collectibles/job.png',
  '/assets/collectibles/linkedin.png',
  '/assets/collectibles/programming.png',
  '/assets/collectibles/work.png',

  // Distractions
  '/assets/distractions/beer.png',
  '/assets/distractions/movies.png',
  '/assets/distractions/party.png',
  '/assets/distractions/phone.png',
  '/assets/distractions/pizza.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
