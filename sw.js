// Luvra service worker – network-first (အသစ်ရှိလျှင် အမြဲအသစ်ယူ၊ offline ဆိုလျှင်သာ cache သုံး)
const CACHE = "luvra-v9";
const SHELL = ["./", "index.html", "feed.js", "i18n.js", "v6.js", "v6.css", "face.js", "hair.js", "editor.js", "manifest.json", "ov-icon-192.png", "ov-icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== "luvra-lib").map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  /* Offline ကင်မရာအတွက် – မျက်နှာရှာ မော်ဒယ်/library (version ပုံသေ URL) ကို တစ်ကြိမ်ယူပြီး cache ထဲသိမ်း၊ နောက်ပိုင်း အင်တာနက်မလိုပါ */
  const heavy = r.method === "GET" && ((u.hostname === "cdn.jsdelivr.net" && /\/npm\/(@mediapipe|@supabase)\//.test(u.pathname)) || (u.hostname === "storage.googleapis.com" && u.pathname.startsWith("/mediapipe-models/")));
  if(heavy){
    e.respondWith(caches.open("luvra-lib").then(c => c.match(r).then(m => m || fetch(r).then(res => { if(res.ok && res.type !== "opaque") c.put(r, res.clone()).catch(() => {}); return res; }))));
    return;
  }
  if(r.method !== "GET" || u.origin !== location.origin) return;     // Supabase API စသည်တို့ကို မထိ
  e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)).catch(() => {}); return res; })
    .catch(() => caches.match(r).then(m => m || caches.match("index.html"))));
});
