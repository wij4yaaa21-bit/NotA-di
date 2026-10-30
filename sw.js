const CACHE = 'notadi-v1';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
    self.clients.claim();
});

// Halaman utama: jaringan dulu, kalau gagal pakai salinan tersimpan (offline).
// Aset lain (MathLive, jsPDF, font, gambar rumus): disimpan saat pertama kali diambil.
self.addEventListener('fetch', e => {
    const req = e.request;
    if (req.method !== 'GET') return;
    const isHalaman = req.mode === 'navigate';
    const ambil = isHalaman
        ? fetch(req).then(res => { const salin = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', salin)); return res; })
        : caches.match(req).then(hit => hit || fetch(req).then(res => {
            if (res.ok || res.type === 'opaque') { const salin = res.clone(); caches.open(CACHE).then(c => c.put(req, salin)); }
            return res;
        }));
    e.respondWith(ambil.catch(() => caches.match(req).then(hit => hit || caches.match('./index.html'))));
});
