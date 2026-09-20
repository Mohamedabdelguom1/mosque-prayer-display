/*
 * عامل خدمة يجعل الشاشة تُقلع بلا انترنت.
 *
 * السبب: الجهاز معلّق على الحائط ويُعاد تشغيله بعد انقطاع الكهرباء،
 * وقد يعود قبل ان يعود الانترنت. بلا هذا الملف تبقى الشاشة بيضاء
 * لان الصفحة نفسها لم تُحمَّل بعد، حتى لو كانت المواقيت محفوظة.
 *
 * قائمة الملفات تُحقن عند البناء من vite.config.ts.
 */
const VERSION = '__VERSION__';
const CACHE = `mosque-display-${VERSION}`;
const PRECACHE = __PRECACHE__;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // مواقيت Aladhan لا تُخزَّن هنا: لها كاشها الخاص في localStorage
  // مع منطق التحديث واعادة المحاولة، ولا نريد طبقتي تخزين متعارضتين.
  if (url.origin !== self.location.origin) return;

  // الصفحة نفسها: نحاول الشبكة اولا لتصل التحديثات، ونسقط للكاش عند الانقطاع
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('index.html', copy));
          return res;
        })
        .catch(() => caches.match('index.html').then((r) => r || Response.error())),
    );
    return;
  }

  // بقية الاصول: الكاش اولا فهي مبصومة باسم يتغيّر مع كل بناء
  event.respondWith(
    caches.match(request).then((hit) => {
      if (hit) return hit;
      return fetch(request).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
        }
        return res;
      });
    }),
  );
});
