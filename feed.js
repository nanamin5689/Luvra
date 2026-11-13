"use strict";
/* ============ Luvra v5 – full-screen feed, comments, share, download, PWA, janitor ============ */
let hcat = "foryou";
const blocked = new Set();
let HR = null, VR = null, hOff = 0, vPageN = 1, HT = 0, VT = 0;
const FRESH = 120000;

/* ---------- Block ---------- */
async function loadBlocks(){
  blocked.clear();
  if(!sb || !user) return;
  const {data} = await sb.from("blocks").select("blocked");
  (data || []).forEach(r => blocked.add(r.blocked));
}
async function blockUser(id, name){
  if(!user){ toast("အကောင့်ဝင်ပါ"); return false; }
  if(!confirm((name || "ဤသူ") + " ကို Block လုပ်မလား? သူ့ post နှင့် chat ကို မမြင်ရတော့ပါ။")) return false;
  const {error} = await sb.from("blocks").insert({blocked: id});
  if(error && error.code !== "23505"){ toast("မအောင်မြင်ပါ"); return false; }
  blocked.add(id);
  if(HR) HR.removeWhere(p => p.user_id === id);
  toast("Block လုပ်ပြီးပါပြီ");
  return true;
}

/* ---------- Janitor: ၂၄ နာရီပြည့်ဖိုင်များကို Storage မှ ဖျက် ---------- */
async function janitor(force){
  if(!sb || !user) return;
  const last = +(lsGet("ov_jan") || 0);
  if(!force && Date.now() - last < 10 * 60 * 1000) return;
  lsSet("ov_jan", String(Date.now()));
  try{
    const {data} = await sb.rpc("expired_files");
    if(data && data.length) await sb.storage.from("posts").remove(data);
    await sb.rpc("purge_expired");
  }catch(e){ console.warn("janitor", e); }
}
setInterval(() => janitor(false), 10 * 60 * 1000);

const _afterLogin = afterLogin;
afterLogin = async function(){ await _afterLogin(); await loadBlocks(); HR = null; janitor(false); };
const _afterLogout = afterLogout;
afterLogout = function(){ _afterLogout(); blocked.clear(); HR = null; };

/* ---------- Reel (vertical snap feed) ---------- */
function mkReel(el, o){
  el.className = "reel"; el.replaceChildren();
  const R = {el, items:[], slides:[], busy:false, done:false, cur:-1, t:Date.now()};
  const io = new IntersectionObserver(es => es.forEach(e => {
    if(!e.isIntersecting || e.intersectionRatio < .6) return;
    const i = +e.target.dataset.i;
    if(R.cur === i) return;
    if(R.cur >= 0 && R.slides[R.cur] && o.onLeave) o.onLeave(R.slides[R.cur], R.items[R.cur]);
    R.cur = i; o.onActive && o.onActive(e.target, R.items[i], i);
    if(i >= R.items.length - 3) R.more();
  }), {root: el, threshold: [.6]});
  R.add = items => items.forEach(it => {
    const s = o.render(it); s.dataset.i = R.items.length; R.items.push(it); R.slides.push(s); el.append(s); io.observe(s);
  });
  R.more = async () => {
    if(R.busy || R.done) return; R.busy = true;
    try{
      const r = await o.more();
      if(r && r.msg){ R.empty(r.msg, r.node); R.done = true; }
      else if(!r || !r.length){ R.done = true; if(!R.items.length) R.empty(o.emptyMsg || "မရှိသေးပါ"); }
      else { R.add(r); if(r.end) R.done = true; }
    }catch(e){ console.error(e); if(!R.items.length) R.empty("ချိတ်ဆက်မှု မအောင်မြင်ပါ။ အင်တာနက်ကို စစ်ပြီး ပြန်စမ်းပါ။"); R.done = true; }
    finally{ R.busy = false; }
  };
  R.empty = (msg, node) => el.append(h("div", {class:"slide", style:"display:grid;place-items:center;padding:24px"}, node || h("div", {class:"msg"}, msg)));
  R.deactivate = () => { if(R.cur >= 0 && R.slides[R.cur] && o.onLeave) o.onLeave(R.slides[R.cur], R.items[R.cur]); R.cur = -1; };
  R.removeWhere = fn => { R.items.forEach((it, i) => { if(fn(it)) R.slides[i].remove(); }); };
  R.next = () => { const s = R.slides[R.cur + 1]; if(s) s.scrollIntoView({behavior:"smooth"}); };
  return R;
}
function pauseReels(){ [HR, VR].forEach(R => R && R.deactivate()); }

/* ---------- media helpers ---------- */
function ensureSrc(slide){
  const m = slide.querySelector("video.md,img.md"); if(m && !m.getAttribute("src") && m.dataset.src) m.src = m.dataset.src;
}
async function playV(v, slide){
  const hint = slide.querySelector(".mute");
  try{ v.muted = false; await v.play(); if(hint) hint.hidden = true; }
  catch(e){ v.muted = true; try{ await v.play(); }catch(_){} if(hint) hint.hidden = false; }
}
function mediaTap(slide, v, onDouble){
  const tap = slide.querySelector(".tap"); let last = 0, tm = null;
  tap.addEventListener("click", e => {
    const now = Date.now();
    if(now - last < 320){ clearTimeout(tm); last = 0; if(onDouble) onDouble(e); return; }
    last = now;
    tm = setTimeout(() => {
      if(!v) return;
      const hint = slide.querySelector(".mute");
      if(v.muted){ v.muted = false; if(hint) hint.hidden = true; if(v.paused) v.play().catch(() => {}); }
      else if(v.paused) v.play().catch(() => {}); else v.pause();
    }, 320);
  });
}
function burst(slide, e, emoji){
  const r = slide.getBoundingClientRect();
  const b = h("div", {class:"burst", style:`left:${e.clientX - r.left}px;top:${e.clientY - r.top}px`}, emoji || "❤️");
  slide.append(b); setTimeout(() => b.remove(), 900);
}

/* ---------- sheets ---------- */
function sheet(title, body){
  const close = () => { back.remove(); s.remove(); };
  const back = h("div", {class:"sback", onclick: close});
  const s = h("div", {class:"sheet"}, h("div", {class:"shh"}, h("b", {}, title), h("button", {class:"x", onclick: close}, "✕")), h("div", {class:"shb"}, body));
  s.close = close; $("#layer").append(back, s); return s;
}

/* ---------- reactions (rail) ---------- */
function mkRx(p){
  const st = {tot:{}, mine:{}, pend:{}, t:{}, ui:[]}; RX.set(p.id, st);
  st.render = () => st.ui.forEach(f => f());
  async function flush(k){
    const n = st.pend[k]; if(!n) return; st.pend[k] = 0;
    const {error} = await sb.rpc("react", {p_post: p.id, p_kind: k, p_n: n});
    if(error){
      st.tot[k] = Math.max(0, (st.tot[k] || 0) - n); st.mine[k] = Math.max(0, (st.mine[k] || 0) - n); st.render();
      toast(/post_gone/.test(error.message) ? "ဤ post ပျောက်သွားပါပြီ" : /rate_limited/.test(error.message) ? "အလွန်မြန်နေသည်၊ ခဏစောင့်ပါ" : "မအောင်မြင်ပါ");
    }
  }
  st.add = k => {
    if(!user){ window.authScreen && authScreen("in"); return false; }
    st.tot[k] = (st.tot[k] || 0) + 1; st.mine[k] = (st.mine[k] || 0) + 1; st.pend[k] = (st.pend[k] || 0) + 1; st.render();
    clearTimeout(st.t[k]); st.t[k] = setTimeout(() => flush(k), 700); return true;
  };
  return st;
}

/* ---------- comments ---------- */
const CC = new Map();
async function loadCounts(posts){
  if(!sb || !posts.length) return;
  const {data} = await sb.rpc("comment_counts", {p_ids: posts.map(p => p.id)});
  (data || []).forEach(r => CC.set(r.post_id, Number(r.n)));
  posts.forEach(p => document.querySelectorAll(`[data-cc="${p.id}"]`).forEach(e => e.textContent = CC.get(p.id) || ""));
}
function openComments(p){
  const list = h("div", {});
  const inp = h("input", {placeholder: user ? "comment ရေးရန်…" : "Comment ရေးရန် အကောင့်ဝင်ပါ", maxlength:200, enterkeyhint:"send"});
  let sending = false;
  const sh = sheet("💬 Comment များ", [list, h("form", {class:"composer", style:"padding:10px 0 0;border:0;position:sticky;bottom:0;background:var(--bg)", onsubmit: async e => {
    e.preventDefault();
    if(!user){ sh.close(); window.authScreen && authScreen("in"); return; }
    const t = inp.value.trim(); if(!t || sending) return;
    sending = true;
    const {error} = await sb.from("comments").insert({post_id: p.id, body: t});
    setTimeout(() => sending = false, 1200);
    if(error){
      const m = error.message || "";
      toast(/rate_limited/.test(m) ? "Comment အလွန်မြန်နေသည်၊ ခဏစောင့်ပါ" : /too_many_links/.test(m) ? "link တစ်ခုထက် မများရပါ" : /duplicate/.test(m) ? "တူညီသော comment ကို ထပ်မရေးပါနှင့်" : /post_gone/.test(m) ? "ဤ post ပျောက်သွားပါပြီ" : "မအောင်မြင်ပါ");
      return;
    }
    inp.value = ""; await draw();
  }}, inp, h("button", {class:"btn pink", type:"submit"}, "ပို့"))]);
  async function draw(){
    const {data, error} = await sb.from("comments").select("*").eq("post_id", p.id).order("created_at", {ascending:true}).limit(200);
    list.replaceChildren();
    if(error){ list.append(h("div", {class:"msg"}, "ဖွင့်မရပါ")); return; }
    const rows = (data || []).filter(c => !blocked.has(c.user_id));
    CC.set(p.id, rows.length); document.querySelectorAll(`[data-cc="${p.id}"]`).forEach(e => e.textContent = rows.length || "");
    if(!rows.length) list.append(h("div", {class:"msg", style:"padding:20px"}, "Comment မရှိသေးပါ။ ပထမဆုံး ရေးကြည့်ပါ 💬"));
    rows.forEach(c => list.append(h("div", {class:"cm"}, avatar(null, c.author_name, 32),
      h("div", {class:"t"}, h("b", {}, c.author_name), c.body, h("small", {style:"display:block"}, ago(c.created_at))),
      (user && (user.id === c.user_id || user.id === p.user_id)) ? h("button", {class:"del", "aria-label":"ဖျက်", onclick: async () => { await sb.from("comments").delete().eq("id", c.id); draw(); }}, "✕") : null)));
  }
  draw();
}

/* ---------- download / share ---------- */
async function dlPost(p){
  try{
    toast("ဒေါင်းလုဒ်လုပ်နေသည်…");
    const r = await fetch(p.media_url); if(!r.ok) throw new Error("http " + r.status);
    const b = await r.blob();
    const ext = (p.media_url.split("?")[0].match(/\.(\w{2,4})$/) || [])[1] || (p.media_type === "image" ? "jpg" : "webm");
    const a = h("a", {href: URL.createObjectURL(b), download: "luvra-" + p.id.slice(0, 8) + "." + ext});
    document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
    toast("ဖုန်းထဲ သိမ်းပြီးပါပြီ");
  }catch(e){ console.warn(e); window.open(p.media_url, "_blank"); }
}
const postLink = p => location.origin + location.pathname + "?p=" + p.id;
function shareSheet(url, text){
  const sh = sheet("မျှဝေမည်", [
    h("a", {class:"act", target:"_blank", rel:"noopener", href:"https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url)}, "📘 Facebook တွင် မျှဝေမည်"),
    navigator.share ? h("button", {class:"act", onclick: async () => { try{ await navigator.share({title:"Luvra", text, url}); sh.close(); }catch(e){} }}, "📤 အခြား app များသို့ (Messenger, Telegram …)") : null,
    h("button", {class:"act", onclick: async () => { try{ await navigator.clipboard.writeText(url); toast("Link ကူးပြီးပါပြီ"); }catch(e){ prompt("Link ကို ကူးပါ", url); } sh.close(); }}, "🔗 Link ကူးမည်"),
    h("p", {style:"color:var(--mu);font-size:.76rem;line-height:1.6"}, "မှတ်ချက် - " + (SNAP() ? "post သည် ၂၄ နာရီပြည့်လျှင် ပျောက်သွားပါမည်။ " : "") + "Facebook တွင် preview ပုံသည် Luvra ၏ logo သာ ပေါ်ပါမည်။")]);
}
function postMenu(p, slide){
  const own = user && user.id === p.user_id;
  const sh = sheet("⋯", [
    p.allow_download !== false || own ? h("button", {class:"act", onclick: () => { sh.close(); dlPost(p); }}, "⬇️ ဒေါင်းလုဒ်") : null,
    h("button", {class:"act", onclick: () => { sh.close(); shareSheet(postLink(p), p.caption || ""); }}, "↗️ မျှဝေ"),
    own ? h("button", {class:"act red", onclick: async () => {
      if(!confirm("ဤ post ကို ဖျက်မလား?")) return; sh.close();
      try{ const path = new URL(p.media_url).pathname.split("/posts/")[1]; if(path) await sb.storage.from("posts").remove([decodeURIComponent(path)]); }catch(e){}
      await sb.from("posts").delete().eq("id", p.id); slide.remove(); toast("ဖျက်ပြီးပါပြီ");
    }}, "🗑 ဖျက်မည်") : null,
    !own ? h("button", {class:"act", onclick: () => { sh.close(); reportPost(p); }}, "⚑ Report") : null,
    !own ? h("button", {class:"act red", onclick: async () => { sh.close(); if(await blockUser(p.user_id, p.author_name)) slide.remove(); }}, "⛔ " + p.author_name + " ကို Block") : null]);
}
function reportPost(p){
  if(!user){ window.authScreen && authScreen("in"); return; }
  const sh = sheet("Report – အကြောင်းပြချက်", ["Spam / ကြော်ငြာ", "မလျော်ကန်သော အကြောင်းအရာ", "မူပိုင်ခွင့် ချိုးဖောက်", "အခြား"].map(r =>
    h("button", {class:"act", onclick: async () => {
      sh.close();
      const {error} = await sb.from("reports").insert({post_id: p.id, reason: r});
      toast(error ? (error.code === "23505" ? "Report လုပ်ပြီးသားပါ" : /rate_limited/.test(error.message) ? "ခဏစောင့်ပါ" : "မအောင်မြင်ပါ") : "Report လုပ်ပြီးပါပြီ၊ ကျေးဇူးတင်ပါသည်");
    }}, r)));
}

/* ---------- post slide ---------- */
function postSlide(p){
  const own = user && user.id === p.user_id;
  const isV = p.media_type === "video";
  const media = isV ? h("video", {class:"md", playsinline:true, loop:true, preload:"metadata", "data-src":p.media_url})
                    : h("img", {class:"md", alt:p.caption || "", "data-src":p.media_url});
  const rx = mkRx(p);
  const total = () => Object.values(rx.tot).reduce((a, b) => a + b, 0);
  const rc = h("span", {}), ri = h("i", {}, "🤍");
  const rbtn = h("button", {class:"rbtn", "aria-label":"Reaction"}, ri, rc);
  const tray = () => {
    rbtn.parentNode.querySelectorAll(".tray").forEach(t => t.remove());
    const tr = h("div", {class:"tray"});
    REACT.forEach(([k, e]) => {
      const c = h("span", {}, ""), b = h("button", {}, h("span", {}, e), c);
      const up = () => { c.textContent = rx.tot[k] ? fmt(rx.tot[k]) : ""; };
      up(); rx.ui.push(up);
      b.onclick = ev => { ev.stopPropagation(); if(rx.add(k)){ b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop"); } clearTimeout(tr._t); tr._t = setTimeout(() => tr.remove(), 3500); };
      tr.append(b);
    });
    rbtn.parentNode.append(tr); tr._t = setTimeout(() => tr.remove(), 3500);
    const away = ev => { if(!tr.contains(ev.target)){ tr.remove(); document.removeEventListener("pointerdown", away, true); } };
    setTimeout(() => document.addEventListener("pointerdown", away, true), 0);
  };
  let lp = null, long = false;
  rbtn.addEventListener("pointerdown", () => { long = false; lp = setTimeout(() => { long = true; tray(); }, 420); });
  ["pointerup", "pointerleave", "pointercancel"].forEach(ev => rbtn.addEventListener(ev, () => clearTimeout(lp)));
  rbtn.addEventListener("contextmenu", e => e.preventDefault());
  rbtn.onclick = () => { if(long){ long = false; return; } if(rx.add("love")){ rbtn.classList.remove("pop"); void rbtn.offsetWidth; rbtn.classList.add("pop"); } };
  rx.ui.push(() => {
    const n = total(); rc.textContent = n ? fmt(n) : "";
    const top = REACT.filter(([k]) => rx.mine[k] > 0).sort((a, b) => rx.mine[b[0]] - rx.mine[a[0]])[0];
    ri.textContent = top ? top[1] : "🤍"; rbtn.classList.toggle("on", !!top);
  });
  rx.render();
  const cc = h("span", {"data-cc":p.id}, CC.get(p.id) || "");
  const fb = h("button", {class:"fbtn2"});
  const upd = () => { const on = following.has(p.user_id); fb.textContent = on ? "Following" : "Follow"; fb.className = "fbtn2" + (on ? " on" : ""); };
  fb.onclick = async () => {
    if(!user){ window.authScreen && authScreen("in"); return; }
    if(following.has(p.user_id)){ await sb.from("follows").delete().eq("followee_id", p.user_id); following.delete(p.user_id); }
    else { const {error} = await sb.from("follows").insert({followee_id: p.user_id}); if(error){ toast("မအောင်မြင်ပါ"); return; } following.add(p.user_id); }
    upd();
  };
  upd();
  const slide = h("div", {class:"slide"}, media, h("div", {class:"tap"}),
    isV ? h("div", {class:"mute", hidden:true}, "🔇 အသံဖွင့်ရန် ထိပါ") : null,
    h("div", {class:"shade"}),
    h("div", {class:"sinfo"},
      h("div", {class:"who"}, avatar(p.author_avatar, p.author_name, 34), h("b", {}, p.author_name),
        own ? null : fb,
        own ? null : h("button", {class:"fbtn2", "aria-label":"Chat", onclick: () => { if(!user){ window.authScreen && authScreen("in"); return; } openThread({id:p.user_id, username:p.author_name, avatar_url:p.author_avatar}); }}, "✉ Chat")),
      p.caption ? h("p", {}, p.caption) : null,
      h("small", {}, ago(p.created_at) + " · ⏳ " + left(p))),
    h("div", {class:"rail"},
      rbtn,
      h("button", {class:"rbtn", "aria-label":"Comment", onclick: () => openComments(p)}, h("i", {}, "💬"), cc),
      (p.allow_download !== false || own) ? h("button", {class:"rbtn", "aria-label":"Download", onclick: () => dlPost(p)}, h("i", {}, "⬇️"), h("span", {}, "Save")) : null,
      h("button", {class:"rbtn", "aria-label":"Share", onclick: () => shareSheet(postLink(p), p.caption || "")}, h("i", {}, "↗️"), h("span", {}, "Share")),
      h("button", {class:"rbtn", "aria-label":"More", onclick: () => postMenu(p, slide)}, h("i", {}, "⋯"))));
  slide._rail = rbtn.parentNode;
  mediaTap(slide, isV ? media : null, e => { if(rx.add("love")) burst(slide, e, "❤️"); });
  return slide;
}
function postActive(slide, p){
  ensureSrc(slide);
  const nx = slide.nextElementSibling; if(nx) ensureSrc(nx);
  const v = slide.querySelector("video.md"); if(v) playV(v, slide);
  loadReactions([p]);
}
function postLeave(slide){ const v = slide.querySelector("video.md"); if(v) v.pause(); }

/* ---------- HOME ---------- */
async function loadHome(reset){
  const el = $("#hreel");
  $("#hcFor").className = hcat === "foryou" ? "on" : ""; $("#hcFol").className = hcat === "following" ? "on" : "";
  if(!sb){
    HR = null; el.className = "reel"; el.replaceChildren(h("div", {class:"slide", style:"display:grid;place-items:center;padding:24px"},
      h("div", {class:"card"}, h("h3", {}, "Supabase မချိတ်ရသေးပါ"), h("p", {}, "config.js တွင် Supabase URL နှင့် key ဖြည့်ပြီး setup.sql ကို run ပါ။ (README ကိုကြည့်ပါ)"),
        h("button", {class:"btn alt", onclick: () => go("video")}, "ဗီဒီယိုများ ကြည့်မည်")))); return;
  }
  if(HR && !reset && Date.now() - HT < FRESH){ HR.cur = -1; return; }
  HT = Date.now(); hOff = 0;
  const R = HR = mkReel(el, {
    render: postSlide, onActive: postActive, onLeave: postLeave, emptyMsg: "ယခု post မရှိသေးပါ။ ကင်မရာမှ ပထမဆုံး post ကို တင်ကြည့်ပါ။ 📸",
    more: async () => {
      for(let k = 0; k < 4; k++){
        let q = sb.from("posts").select("*").gt("expires_at", new Date().toISOString()).order("created_at", {ascending:false}).range(hOff, hOff + PER - 1);
        if(hcat === "following"){
          if(!user) return {msg:"", node: loginCard("Follow လုပ်ထားသူများ၏ post များကြည့်ရန် အကောင့်ဝင်ပါ။")};
          if(!following.size) return {msg:"ဘယ်သူ့ကိုမှ Follow မလုပ်ရသေးပါ။ “သင့်အတွက်” ထဲက post များမှ Follow လုပ်ကြည့်ပါ။"};
          q = q.in("user_id", [...following]);
        }
        const {data, error} = await q; if(error) throw error;
        const raw = data || []; hOff += raw.length;
        const rows = raw.filter(p => !blocked.has(p.user_id));
        if(raw.length < PER) rows.end = true;
        if(rows.length || rows.end){ loadCounts(rows); return rows; }
      }
      return [];
    }
  });
  await R.more();
}

/* ---------- VIDEO tab ---------- */
const watched = new Set();
let W = {timer:null, secs:0, slide:null};
function stopWatch(){ clearInterval(W.timer); W = {timer:null, secs:0, slide:null}; }
function vidSlide(it){
  let media;
  const big = h("button", {class:"vbig", "aria-label":"play"}, "▶");
  if(it.mp4){ media = h("video", {class:"md", playsinline:true, loop:true, preload:"metadata", controlslist:"nodownload noremoteplayback", disablepictureinpicture:true, "data-src":it.mp4}); media.addEventListener("contextmenu", e => e.preventDefault()); }
  else media = h("img", {class:"md", alt:"", src:it.thumb, style:"object-fit:cover;opacity:.75"});
  const chip = h("div", {class:"chipw"}, "⭐");
  const slide = h("div", {class:"slide"}, media, it.mp4 ? h("div", {class:"tap"}) : null, it.mp4 ? h("div", {class:"mute", hidden:true}, "🔇 အသံဖွင့်ရန် ထိပါ") : big,
    h("div", {class:"shade"}), chip,
    h("div", {class:"sinfo"}, h("p", {style:"font-weight:700"}, it.title), h("small", {}, it.src + " · " + it.creator)),
    h("div", {class:"rail"},
      h("button", {class:"rbtn", onclick: () => videoInfo(it)}, h("i", {}, "ℹ︎"), h("span", {}, "အချက်အလက်")),
      h("button", {class:"rbtn", onclick: () => { const R = VR; if(R) R.next(); }}, h("i", {}, "⌄"), h("span", {}, "နောက်"))));
  slide._chip = chip; slide._it = it;
  if(!it.mp4) big.onclick = () => {
    const f = h("iframe", {class:"md", src: it.embed + (it.embed.includes("?") ? "&" : "?") + (it.src === "YouTube" ? "autoplay=1" : ""), allowfullscreen:true, allow:"autoplay; fullscreen; encrypted-media"});
    media.replaceWith(f); big.remove(); slide._loaded = true;
    f.style.zIndex = 0; slide.querySelector(".shade").style.display = "none";
    const stop = h("button", {class:"rclose", style:"left:auto;right:10px;top:10px", onclick: () => { f.replaceWith(media); stop.remove(); slide.append(big); slide._loaded = false; slide.querySelector(".shade").style.display = ""; }}, "✕");
    slide.append(stop);
  };
  else mediaTap(slide, media, null);
  return slide;
}
function videoInfo(it){
  sheet("အချက်အလက်", [h("p", {style:"font-weight:700"}, it.title),
    h("p", {class:"info"}, "ဖန်တီးသူ - " + it.creator + " · " + it.src),
    h("p", {}, "လိုင်စင် - ", h("a", {href:it.licenseUrl, target:"_blank", rel:"noopener"}, it.license)),
    it.note ? h("p", {style:"color:var(--mu);font-size:.82rem"}, it.note) : null,
    h("p", {}, h("a", {href:it.pageUrl, target:"_blank", rel:"noopener"}, "မူလစာမျက်နှာတွင် ကြည့်မည်")),
    h("p", {}, h("a", {href:`mailto:${C.CONTACT_EMAIL}?subject=${encodeURIComponent("Report: " + it.title)}&body=${encodeURIComponent(it.pageUrl + "\n\nအကြောင်းပြချက်:")}`}, "⚑ Report လုပ်မည်"))]);
}
function vidActive(slide, it){
  ensureSrc(slide);
  const nx = slide.nextElementSibling; if(nx) ensureSrc(nx);
  const v = slide.querySelector("video.md"); if(v) playV(v, slide);
  stopWatch(); W.slide = slide;
  const chip = slide._chip;
  if(!user){ chip.textContent = "⭐ ဝင်ပြီးကြည့်ရင် Point ရမည်"; chip.onclick = () => authScreen("up"); return; }
  if(watched.has(it.key)){ chip.textContent = "✓ Point ရပြီး"; return; }
  W.secs = 0; chip.textContent = `⭐ +2 · ${WATCH_SECS}s`;
  W.timer = setInterval(async () => {
    const playing = v ? !v.paused : slide._loaded;
    if(!playing) return;
    W.secs++; chip.textContent = `⭐ +2 · ${Math.max(0, WATCH_SECS - W.secs)}s`;
    if(W.secs >= WATCH_SECS){
      clearInterval(W.timer); watched.add(it.key);
      const {data, error} = await sb.rpc("earn_watch", {p_key: it.key});
      if(error){ chip.textContent = "⭐"; return; }
      chip.textContent = data > 0 ? "✓ ⭐ +" + data : "✓ ယနေ့ရပြီး/ကန့်သတ်ချက်ပြည့်";
      if(data > 0){ toast("⭐ +" + data + " ဗီဒီယိုကြည့်ရှုမှု ဆု"); loadWallet(); }
    }
  }, 1000);
}
function vidLeave(slide){ stopWatch(); const v = slide.querySelector("video.md"); if(v) v.pause(); }
async function loadVideos(reset){
  const el = $("#vreel");
  if(VR && !reset && Date.now() - VT < FRESH){ VR.cur = -1; return; }
  VT = Date.now(); vPageN = 1;
  VR = mkReel(el, {render: vidSlide, onActive: vidActive, onLeave: vidLeave, emptyMsg: "ရလဒ်မတွေ့ပါ။ အခြားအမျိုးအစားကို ရွေးကြည့်ပါ။",
    more: async () => { const items = await fetchVideos(CAT_Q[cat] || "", vPageN); vPageN++; return items; }});
  await VR.more();
}

/* ---------- single post overlay (search / shared link) ---------- */
function openReelOverlay(posts, onClose){
  const box = h("div", {class:"reel"});
  const o = h("div", {class:"ov", style:"background:#000"}, box, h("button", {class:"rclose", "aria-label":"ပိတ်မည်", onclick: () => o.close()}, "✕"));
  o.close = () => { R.deactivate(); o.remove(); if(onClose) onClose(); };
  $("#layer").append(o);
  const R = mkReel(box, {render: postSlide, onActive: postActive, onLeave: postLeave, more: async () => null});
  R.done = true; R.add(posts); loadCounts(posts); return o;
}
function openPost(p){ return openReelOverlay([p]); }
async function openSharedPost(id){
  if(!sb) return;
  const {data} = await sb.from("posts").select("*").eq("id", id).gt("expires_at", new Date().toISOString()).maybeSingle();
  if(!data){ toast("ဤ post သည် သက်တမ်းကုန်သွားပါပြီ (၂၄ နာရီပြည့်လျှင် ပျောက်ပါသည်)"); }
  else openReelOverlay([data], () => { try{ history.replaceState(null, "", location.pathname); }catch(e){} });
}

/* ---------- PWA install ---------- */
let deferredInstall = null;
const standalone = () => window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault(); deferredInstall = e;
  if(lsGet("ov_inst_no") || standalone()) return;
  const bar = h("div", {class:"ibar"}, "📲 Luvra ကို app အဖြစ် install လုပ်မလား?",
    h("button", {class:"btn", onclick: () => { bar.remove(); doInstall(); }}, "Install"),
    h("button", {"aria-label":"ပိတ်", onclick: () => { lsSet("ov_inst_no", "1"); bar.remove(); }}, "✕"));
  document.body.append(bar);
});
window.addEventListener("appinstalled", () => { deferredInstall = null; toast("Install လုပ်ပြီးပါပြီ 🎉"); });
async function doInstall(){
  if(deferredInstall){ deferredInstall.prompt(); try{ await deferredInstall.userChoice; }catch(e){} deferredInstall = null; return; }
  if(standalone()){ toast("App အဖြစ် install လုပ်ပြီးသားပါ"); return; }
  const miss = [];
  for(const n of ["manifest.json", "ov-icon-192.png", "ov-icon-512.png", "sw.js"]){
    try{ const r = await fetch(n, {cache:"no-store"}); if(!r.ok) miss.push(n + " (" + r.status + ")"); }catch(e){ miss.push(n); }
  }
  const reg = ("serviceWorker" in navigator) ? await navigator.serviceWorker.getRegistration() : null;
  const body = [];
  if(miss.length) body.push(h("p", {style:"line-height:1.8;color:#f87171"}, "GitHub ပေါ်တွင် ဤဖိုင်များ မတွေ့ပါ - " + miss.join(", ") + "။ repo ၏ root တွင် တင်ပါ (ဖိုင်နာမည် အတိအကျ)။"));
  else if(!reg) body.push(h("p", {style:"line-height:1.8"}, "Service worker မစတင်သေးပါ။ စာမျက်နှာကို ပိတ်ပြီး ပြန်ဖွင့်၍ ၁၀ စက္ကန့်စောင့်ပါ၊ ပြီးမှ ပြန်နှိပ်ပါ။"));
  else body.push(h("p", {style:"line-height:1.8"}, "ဖိုင်များ အဆင်ပြေပါသည်။ Chrome ၏ ⋮ menu တွင် “Install app” ပေါ်လျှင် ရွေးပါ။ “Add to Home screen” သာပေါ်လျှင် Chrome ကို update လုပ်ပါ သို့မဟုတ် Chrome Settings > Site settings မှ ဤ site data ကို ဖျက်ပြီး ပြန်ဖွင့်ပါ။"));
  sheet("📲 Install စစ်ဆေးချက်", body);
}
if("serviceWorker" in navigator && location.protocol === "https:"){
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}

/* ---------- profile extras ---------- */
const _drawProfile = drawProfile;
drawProfile = async function(){
  await _drawProfile();
  const pad = document.querySelector("#prof .pad:last-child"); if(!pad || !user) return;
  const link = location.origin + location.pathname;
  const card = h("div", {class:"card"}, h("h3", {}, "📲 App & မျှဝေရန်"),
    h("p", {}, "ဖုန်း home screen သို့ app အဖြစ် ထည့်ပြီး Facebook တွင် မျှဝေနိုင်ပါသည်။"),
    h("div", {style:"display:grid;gap:8px;margin-top:8px"},
      h("button", {class:"btn pink", onclick: doInstall}, "📲 App ကို install လုပ်မည်"),
      h("button", {class:"btn alt", onclick: () => shareSheet(link + (prof && prof.referral_code ? "?ref=" + prof.referral_code : ""), "Luvra – ကင်မရာ Beauty၊ Effect၊ ၂၄ နာရီ snap")}, "📘 Facebook သို့ မျှဝေမည်")));
  const bl = h("div", {class:"card"}, h("h3", {}, "⛔ Block လုပ်ထားသူများ"));
  if(!blocked.size) bl.append(h("p", {}, "မရှိပါ"));
  else {
    const {data} = await sb.from("profiles").select("id,username").in("id", [...blocked]);
    (data || []).forEach(u => { const r = h("div", {class:"kv"}, h("span", {}, u.username), h("button", {class:"btn alt", onclick: async () => { await sb.from("blocks").delete().eq("blocked", u.id); blocked.delete(u.id); HR = null; r.remove(); toast("Block ဖြုတ်ပြီး"); }}, "ဖြုတ်မည်")); bl.append(r); });
  }
  pad.append(card, bl);
};

/* ---------- boot extras ---------- */
function bootExtras(){
  try{
    const p = new URLSearchParams(location.search).get("p");
    if(p && /^[\w-]{1,64}$/i.test(p)) openSharedPost(p);
  }catch(e){}
}
