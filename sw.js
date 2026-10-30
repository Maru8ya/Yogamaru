// Версия меняется с каждым обновлением конструктора: телефон подхватит новую при следующем открытии с интернетом
const V = "yoga-c82dcfd0e3";
const CORE = ["./", "index.html", "data.bin", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  // Страница-замок: сначала сеть, без сети — сохранённая
  if (r.mode === "navigate") {
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(V).then(k => k.put("index.html", c)); return res; })
      .catch(() => caches.match("index.html")));
    return;
  }
  // Шифр и иконки берём из сохранённой версии (новый шифр приходит вместе с новым sw.js), шрифты обновляем в фоне
  if (u.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {
    e.respondWith(caches.open(V).then(c => c.match(r, { ignoreSearch: true }).then(hit => {
      const net = fetch(r).then(res => { if (res && (res.ok || res.type === "opaque")) c.put(r, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    })));
  }
});
