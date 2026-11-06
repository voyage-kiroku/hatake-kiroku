// 畑の記録（アプリ版）の Service Worker
// 画面の部品を端末に保存し、畑で圏外でも起動できるようにする。記録の送受信（POST）や写真は保存しない。
// 画面は「保存済みをすぐ出し、裏で最新を取り直す」。保存の仕組みを変えたら CACHE の番号を上げる。

var CACHE = 'farm-shell-v1';
var FONT_CACHE = 'farm-fonts';
var SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon-180.png'];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE && k !== FONT_CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin === self.location.origin) {
    event.respondWith(caches.open(CACHE).then(function (cache) {
      return cache.match(req, { ignoreSearch: true }).then(function (hit) {
        var fresh = fetch(req).then(function (res) { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(function () { return hit; });
        return hit || fresh;
      });
    }));
    return;
  }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(caches.open(FONT_CACHE).then(function (cache) {
      return cache.match(req).then(function (hit) {
        return hit || fetch(req).then(function (res) { if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; });
      });
    }));
  }
});
