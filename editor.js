"use strict";
/* ============ OpenVideo v5 – EDITOR (filter, adjust, sticker, text, frame, effect, ratio, background) + post sheet ============ */
const E_FILTERS = [["none","မရှိ","⚪",""],["vivid","Vivid","🌈","saturate(1.4) contrast(1.1)"],["warm","နွေး","🌅","sepia(.3) saturate(1.3) hue-rotate(-10deg)"],
  ["cool","အေး","🧊","hue-rotate(15deg) saturate(1.1) brightness(1.03)"],["bw","B&W","⚫","grayscale(1)"],["sepia","Sepia","🟤","sepia(.9)"],
  ["fade","Fade","🌫️","contrast(.85) brightness(1.1) saturate(.8)"],["drama","Drama","🎭","contrast(1.4) saturate(1.2) brightness(.95)"],
  ["dream","Dream","☁️","brightness(1.1) saturate(1.2) blur(.6px)"],["vintage","Vintage","📼","sepia(.4) contrast(1.1) saturate(.8)"],
  ["neon","Neon","💜","hue-rotate(60deg) saturate(2) contrast(1.1)"],["noir","Noir","🎞️","grayscale(1) contrast(1.5)"]];
const E_FRAMES = [["none","မရှိ","⬜"],["white","ဖြူ","🔲"],["black","မည်း","⬛"],["polaroid","Polaroid","🖼️"],["neon","Neon","💠"],["gold","ရွှေ","🟨"],["rounded","ထောင့်ဝိုင်း","🔘"],["film","Film","🎞️"],["hearts","နှလုံး","💗"]];
const E_FX = [["none","မရှိ","⚪"],["vignette","Vignette","🌑"],["warm","နွေးအလင်း","🌇"],["cool","အေးအလင်း","🌌"],["sparkle","လက်ခနဲ","✨"],["snow","နှင်း","❄️"],["hearts","နှလုံး","💕"],["scan","Scanline","📺"]];
const E_RATIOS = [["orig","မူလ"],["9:16","9:16"],["1:1","1:1"],["4:5","4:5"],["16:9","16:9"]];
const E_BGS = [["blur","ဝါးထား"],["#000000","မည်း"],["#ffffff","ဖြူ"],["#1e293b","မီးခိုး"],["g0","Sunset"],["g1","Ocean"],["g2","Candy"],["g3","Forest"]];
const E_GRAD = [["#ff7a18","#af002d"],["#00c6ff","#0072ff"],["#ff9a9e","#a18cd1"],["#11998e","#38ef7d"]];
const E_EMOJI = "😀😂🥹😍🤩😎🥳😭😡🤯🙌👍🔥💯❤️💖💕✨⭐🌈🎉🎈👑🕶️🎀🌸🌹🍀🦋🐶🐱🐼🦄🍕🍔🍦⚽🎵💥💫🌙☀️".match(/\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*/gu);
const E_TPLS = [["Cinema","🎬",{filter:"drama", fx:"vignette", frame:"film"}], ["Retro","📼",{filter:"vintage", fx:"scan", frame:"polaroid"}],
  ["Pop","🍭",{filter:"vivid", fx:"sparkle", frame:"neon"}], ["Dream","☁️",{filter:"dream", fx:"hearts", frame:"none"}], ["Snow","❄️",{filter:"cool", fx:"snow", frame:"none"}],
  ["Gold","🏆",{filter:"warm", fx:"warm", frame:"gold"}], ["Noir","🎞️",{filter:"noir", fx:"vignette", frame:"none"}], ["Love","💘",{filter:"fade", fx:"hearts", frame:"hearts"}]];
const edDef = () => ({ratio:"orig", fit:"contain", filter:"none", adj:{b:100, c:100, s:100, w:0, hue:0, blur:0}, bg:"blur", frame:"none", fx:"none", items:[]});
const cssOf = E => {
  const a = E.adj, f = (E_FILTERS.find(x => x[0] === E.filter) || [])[3] || "";
  return [f, `brightness(${a.b}%) contrast(${a.c}%) saturate(${a.s}%)`, a.hue ? `hue-rotate(${a.hue}deg)` : "", a.w > 0 ? `sepia(${a.w / 200}) saturate(${1 + a.w / 300})` : "", a.w < 0 ? `hue-rotate(${a.w * .3}deg)` : "", a.blur ? `blur(${a.blur}px)` : ""].filter(Boolean).join(" ");
};
const edDims = (r, mw, mh) => {
  if(r === "9:16") return [720, 1280]; if(r === "1:1") return [720, 720]; if(r === "4:5") return [720, 900]; if(r === "16:9") return [1280, 720];
  const k = 1280 / Math.max(mw, mh, 1); return [Math.max(2, Math.round(mw * k / 2) * 2), Math.max(2, Math.round(mh * k / 2) * 2)];
};
const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
let _m2 = null; const meas = () => _m2 || (_m2 = document.createElement("canvas").getContext("2d"));
function itemBox(it, W){
  const sz = it.s * W;
  if(it.k === "emoji") return {w: sz, h: sz};
  const c = meas(); c.font = `900 ${sz}px "Noto Sans Myanmar",Impact,sans-serif`; return {w: c.measureText(it.t).width + sz * .4, h: sz * 1.3};
}
function drawItem(c, it, W, H){
  const sz = it.s * W;
  c.save(); c.translate(it.x * W, it.y * H); c.rotate(it.r * Math.PI / 180);
  if(it.k === "emoji"){ c.font = `${sz}px "Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(it.t, 0, 0); }
  else {
    c.font = `900 ${sz}px "Noto Sans Myanmar",Impact,sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.lineJoin = "round";
    if(it.st === "box"){ const b = itemBox(it, W); c.fillStyle = "rgba(0,0,0,.65)"; c.beginPath(); c.roundRect ? c.roundRect(-b.w / 2, -b.h / 2, b.w, b.h, sz * .25) : c.rect(-b.w / 2, -b.h / 2, b.w, b.h); c.fill(); c.fillStyle = it.col; c.fillText(it.t, 0, 0); }
    else if(it.st === "neon"){ c.strokeStyle = it.col; [[.3, .2], [.18, .35]].forEach(([lw, al]) => { c.globalAlpha = al; c.lineWidth = sz * lw; c.strokeText(it.t, 0, 0); }); c.globalAlpha = 1; c.fillStyle = "#fff"; c.fillText(it.t, 0, 0); }
    else { c.lineWidth = sz * .16; c.strokeStyle = "#000"; c.strokeText(it.t, 0, 0); c.fillStyle = it.col; c.fillText(it.t, 0, 0); }
  }
  c.restore();
}
function drawFx(c, W, H, t, fx){
  if(fx === "vignette"){ const g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .3, W / 2, H / 2, Math.max(W, H) * .72); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.6)"); c.fillStyle = g; c.fillRect(0, 0, W, H); }
  else if(fx === "warm" || fx === "cool"){ const g = c.createLinearGradient(0, 0, W, H); const col = fx === "warm" ? "255,140,40" : "60,120,255"; g.addColorStop(0, `rgba(${col},.4)`); g.addColorStop(.5, `rgba(${col},0)`); g.addColorStop(1, `rgba(${col},.18)`);
    c.save(); c.globalCompositeOperation = "screen"; c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore(); }
  else if(fx === "sparkle"){ c.save(); c.textAlign = "center"; c.textBaseline = "middle"; for(let i = 0; i < 16; i++){ c.globalAlpha = .35 + .65 * Math.abs(Math.sin(t * 2 + i * 1.7)); c.font = `${W * (.04 + rnd(i, 3) * .05)}px serif`; c.fillText("✨", rnd(i, 1) * W, rnd(i, 2) * H); } c.restore(); }
  else if(fx === "snow"){ c.save(); c.fillStyle = "rgba(255,255,255,.85)"; for(let i = 0; i < 45; i++){ const y = (rnd(i, 2) * H + t * (40 + rnd(i, 4) * 70)) % H, x = rnd(i, 1) * W + Math.sin(t + i) * 14; c.beginPath(); c.arc(x, y, W * (.004 + rnd(i, 3) * .008), 0, 7); c.fill(); } c.restore(); }
  else if(fx === "hearts"){ c.save(); c.textAlign = "center"; c.textBaseline = "middle"; for(let i = 0; i < 12; i++){ const ph = (t * .12 + rnd(i, 2)) % 1; c.globalAlpha = Math.min(1, (1 - ph) * 1.6); c.font = `${W * (.05 + rnd(i, 3) * .05)}px serif`; c.fillText("❤️", rnd(i, 1) * W + Math.sin(t * 2 + i) * 12, H * (1.05 - ph * 1.15)); } c.restore(); }
  else if(fx === "scan"){ c.save(); c.fillStyle = "rgba(0,0,0,.14)"; for(let y = 0; y < H; y += 4) c.fillRect(0, y, W, 2); c.restore(); }
}
function drawFrameDeco(c, W, H, f){
  c.save();
  if(f === "white" || f === "black"){ c.strokeStyle = f === "white" ? "#fff" : "#000"; c.lineWidth = W * .06; c.strokeRect(W * .03, W * .03, W - W * .06, H - W * .06); }
  else if(f === "polaroid"){ c.fillStyle = "#fff"; const b = W * .05; c.fillRect(0, 0, W, b); c.fillRect(0, 0, b, H); c.fillRect(W - b, 0, b, H); c.fillRect(0, H - W * .17, W, W * .17); }
  else if(f === "neon"){ const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#00e5ff"); g.addColorStop(.5, "#ff2bd6"); g.addColorStop(1, "#ffe600"); [[.05, .25], [.035, .45], [.02, 1]].forEach(([lw, al]) => { c.globalAlpha = al; c.strokeStyle = g; c.lineWidth = W * lw; c.strokeRect(W * .03, W * .03, W - W * .06, H - W * .06); }); c.globalAlpha = 1; }
  else if(f === "gold"){ c.strokeStyle = "#d4af37"; c.lineWidth = W * .025; c.strokeRect(W * .02, W * .02, W - W * .04, H - W * .04); c.lineWidth = W * .006; c.strokeStyle = "#fff3b0"; c.strokeRect(W * .05, W * .05, W - W * .1, H - W * .1); }
  else if(f === "rounded"){ const r = W * .08; c.fillStyle = "#000"; c.beginPath(); c.rect(0, 0, W, H); c.moveTo(r, 0); c.arcTo(W, 0, W, H, r); c.arcTo(W, H, 0, H, r); c.arcTo(0, H, 0, 0, r); c.arcTo(0, 0, W, 0, r); c.closePath(); c.fill("evenodd"); }
  else if(f === "film"){ const b = H * .07; c.fillStyle = "#000"; c.fillRect(0, 0, W, b); c.fillRect(0, H - b, W, b); c.fillStyle = "#fff"; for(let x = W * .02; x < W; x += W * .07){ c.fillRect(x, b * .3, W * .035, b * .4); c.fillRect(x, H - b * .7, W * .035, b * .4); } }
  else if(f === "hearts"){ c.textAlign = "center"; c.textBaseline = "middle"; c.font = `${W * .13}px serif`; [[.07, .05], [.93, .05], [.07, .95], [.93, .95]].forEach(([x, y]) => c.fillText("💗", x * W, y * H)); }
  c.restore();
}
const E_BG_NEED = (ratio, mw, mh, W, H) => Math.abs(mw / mh - W / H) > .01;
function edRender(ctx, E, m, mw, mh, W, H, t, ui, sel){
  ctx.clearRect(0, 0, W, H);
  const fit = E.fit, css = cssOf(E);
  // background
  const bars = fit === "contain" && E_BG_NEED(E.ratio, mw, mh, W, H);
  if(bars){
    if(E.bg === "blur"){ const s = Math.max(W / mw, H / mh); ctx.save(); ctx.filter = "blur(28px) brightness(.7)"; ctx.drawImage(m, (W - mw * s) / 2, (H - mh * s) / 2, mw * s, mh * s); ctx.restore(); }
    else if(E.bg[0] === "g"){ const [a, b] = E_GRAD[+E.bg.slice(1)] || E_GRAD[0]; const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, a); g.addColorStop(1, b); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    else { ctx.fillStyle = E.bg; ctx.fillRect(0, 0, W, H); }
  }
  const s = fit === "cover" ? Math.max(W / mw, H / mh) : Math.min(W / mw, H / mh);
  ctx.save(); if("filter" in ctx) ctx.filter = css || "none"; ctx.drawImage(m, (W - mw * s) / 2, (H - mh * s) / 2, mw * s, mh * s); ctx.restore();
  drawFx(ctx, W, H, t, E.fx);
  drawFrameDeco(ctx, W, H, E.frame);
  E.items.forEach(it => drawItem(ctx, it, W, H));
  if(ui && sel){ const b = itemBox(sel, W); ctx.save(); ctx.translate(sel.x * W, sel.y * H); ctx.rotate(sel.r * Math.PI / 180); ctx.strokeStyle = "#fff"; ctx.setLineDash([10, 8]); ctx.lineWidth = 3; ctx.strokeRect(-b.w / 2 - 6, -b.h / 2 - 6, b.w + 12, b.h + 12); ctx.restore(); }
}

/* ---------- editor overlay ---------- */
function openEditor(blob, kind, opts){
  opts = opts || {};
  camStop();
  const E = opts.E || edDef();
  const url = URL.createObjectURL(blob);
  let m, mw = 1, mh = 1, raf = 0, paused = false, sel = null, etab = "tpl", closed = false;
  const cvE = h("canvas", {});
  const cx2 = cvE.getContext("2d");
  const panel = h("div", {class:"edpan"}), selbar = h("div", {class:"selbar", hidden:true});
  const tabsEl = h("div", {class:"edtabs"});
  const TABS = [["tpl","✨ Template"],["flt","🎨 Filter"],["adj","🎚 Adjust"],["stk","😀 Sticker"],["txt","🔤 စာ"],["frm","🖼 Frame"],["fx","💫 Effect"],["ratio","📐 Ratio"],["bg","🌫 Background"]];
  const mute = kind === "video" ? h("button", {class:"x", "aria-label":"အသံ", onclick: () => { m.muted = !m.muted; mute.textContent = m.muted ? "🔇" : "🔊"; }}, "🔇") : null;
  const o = h("div", {class:"ov edv"},
    h("div", {class:"edtop"}, h("button", {class:"x", "aria-label":"ပယ်ဖျက်", onclick: () => { if(confirm("တည်းဖြတ်မှုကို ပယ်ဖျက်မလား? (Point ပြန်မဖြတ်ပါ၊ ပြန်ရိုက်နိုင်ပါသည်)")) o.close(); }}, "✕"), h("h2", {}, "တည်းဖြတ်ရန်"), mute,
      h("button", {class:"btn pink", id:"edNext", onclick: next}, "ရှေ့ဆက် →")),
    h("div", {class:"edst"}, cvE), tabsEl, selbar, panel);
  o.close = () => { closed = true; cancelAnimationFrame(raf); if(m && m.pause) m.pause(); URL.revokeObjectURL(url); o.remove(); if(tab === "camera" && !cam.stream) camStart(); };
  $("#layer").append(o);

  function load(){
    return new Promise(res => {
      if(kind === "image"){ m = new Image(); m.onload = () => { mw = m.naturalWidth; mh = m.naturalHeight; res(); }; m.src = url; }
      else {
        m = h("video", {src:url, muted:true, loop:true, playsinline:true, autoplay:true}); m.muted = true;
        const done = () => { mw = m.videoWidth || 720; mh = m.videoHeight || 1280; res(); };
        if(m.readyState >= 1) done(); else m.onloadedmetadata = done; m.onerror = done;
        m.play().catch(() => {});
      }
    });
  }
  function size(){ const [W, H] = edDims(E.ratio, mw, mh); if(cvE.width !== W || cvE.height !== H){ cvE.width = W; cvE.height = H; } return [W, H]; }
  function loop(ts){
    if(closed) return; if(paused){ raf = 0; return; } raf = requestAnimationFrame(loop);
    if(kind === "video" && m.readyState < 2) return;
    const [W, H] = size(); edRender(cx2, E, m, mw, mh, W, H, ts / 1000, true, sel);
  }

  /* interaction */
  const pt = e => {
    const r = cvE.getBoundingClientRect(), ar = cvE.width / cvE.height; let w = r.width, hh = r.height, ox = 0, oy = 0;
    if(w / hh > ar){ w = hh * ar; ox = (r.width - w) / 2; } else { hh = w / ar; oy = (r.height - hh) / 2; }
    return {x:(e.clientX - r.left - ox) / w, y:(e.clientY - r.top - oy) / hh};
  };
  const hit = p => {
    for(let i = E.items.length - 1; i >= 0; i--){
      const it = E.items[i], b = itemBox(it, cvE.width), dx = (p.x - it.x) * cvE.width, dy = (p.y - it.y) * cvE.height;
      const a = -it.r * Math.PI / 180, lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a);
      if(Math.abs(lx) <= b.w / 2 + 14 && Math.abs(ly) <= b.h / 2 + 14) return it;
    } return null;
  };
  let drag = null;
  cvE.addEventListener("pointerdown", e => { const p = pt(e), it = hit(p); select(it); if(it){ drag = {it, dx:it.x - p.x, dy:it.y - p.y}; cvE.setPointerCapture(e.pointerId); } });
  cvE.addEventListener("pointermove", e => { if(!drag) return; const p = pt(e); drag.it.x = Math.min(1, Math.max(0, p.x + drag.dx)); drag.it.y = Math.min(1, Math.max(0, p.y + drag.dy)); });
  cvE.addEventListener("pointerup", () => drag = null);
  function select(it){
    sel = it; selbar.hidden = !it; selbar.replaceChildren(); if(!it) return;
    const sz = h("input", {type:"range", min:".05", max:".6", step:".01", value:it.s}), rt = h("input", {type:"range", min:"-180", max:"180", step:"1", value:it.r});
    sz.oninput = () => it.s = +sz.value; rt.oninput = () => it.r = +rt.value;
    selbar.append("အရွယ်", sz, "လှည့်", rt, h("button", {class:"x", "aria-label":"ဖျက်", onclick: () => { E.items.splice(E.items.indexOf(it), 1); select(null); }}, "🗑"));
  }

  /* panels */
  const chips = (list, cur, on, wrap) => h("div", {class:"chips" + (wrap ? " wrap" : "")}, list.map(([id, label, em]) => h("button", {class:"ch" + (id === cur ? " on" : ""), onclick: () => { on(id); drawPanel(); }}, em ? h("i", {}, em) : null, label)));
  function drawPanel(){
    tabsEl.replaceChildren(...TABS.map(([id, l]) => h("button", {class: id === etab ? "on" : "", onclick: () => { etab = id; drawPanel(); }}, l)));
    panel.replaceChildren();
    if(etab === "tpl") panel.append(h("div", {class:"chips"}, E_TPLS.map(([n, e, p]) => h("button", {class:"ch", onclick: () => { Object.assign(E, p); drawPanel(); }}, h("i", {}, e), n))));
    else if(etab === "flt") panel.append(chips(E_FILTERS.map(f => [f[0], f[1], f[2]]), E.filter, id => E.filter = id));
    else if(etab === "adj"){
      [["b","အလင်း",30,170],["c","Contrast",50,160],["s","အရောင်ရင့်",0,200],["w","နွေး/အေး",-100,100],["hue","Hue",-90,90],["blur","Blur",0,6]].forEach(([k, l, mn, mx]) => {
        const r = h("input", {type:"range", min:mn, max:mx, step:k === "blur" ? ".5" : "1", value:E.adj[k]}); r.oninput = () => E.adj[k] = +r.value; panel.append(h("div", {class:"erow"}, l, r)); });
      panel.append(h("button", {class:"btn alt", style:"margin-top:6px", onclick: () => { E.adj = edDef().adj; drawPanel(); }}, "ပြန်သတ်မှတ်"));
    }
    else if(etab === "stk") panel.append(h("div", {class:"chips wrap"}, E_EMOJI.map(em => h("button", {class:"stk", onclick: () => { const it = {k:"emoji", t:em, x:.5, y:.45, s:.22, r:0}; E.items.push(it); select(it); }}, em))));
    else if(etab === "txt"){
      let col = "#ffffff", st = "outline";
      const inp = h("input", {placeholder:"စာရေးပြီး ထည့်ပါ", maxlength:40});
      const cols = ["#ffffff","#ffe600","#ff3b6b","#00e5ff","#7CFF6B","#000000"];
      const sw = h("div", {class:"chips"}, cols.map(c => h("button", {class:"sw" + (c === col ? " on" : ""), style:"background:" + c, onclick: ev => { col = c; sw.querySelectorAll(".sw").forEach(x => x.classList.remove("on")); ev.target.classList.add("on"); if(sel && sel.k === "text") sel.col = c; }})));
      const sts = chips([["outline","Outline"],["box","Box"],["neon","Neon"]], st, id => { st = id; if(sel && sel.k === "text") sel.st = id; });
      panel.append(h("div", {style:"display:flex;gap:8px"}, inp, h("button", {class:"btn", onclick: () => { const t = inp.value.trim(); if(!t) return; const it = {k:"text", t, x:.5, y:.5, s:.09, r:0, col, st}; E.items.push(it); select(it); inp.value = ""; }}, "ထည့်")), h("div", {style:"height:8px"}), sw, sts);
    }
    else if(etab === "frm") panel.append(chips(E_FRAMES, E.frame, id => E.frame = id));
    else if(etab === "fx") panel.append(chips(E_FX, E.fx, id => E.fx = id));
    else if(etab === "ratio"){
      panel.append(chips(E_RATIOS, E.ratio, id => E.ratio = id), h("div", {style:"height:8px"}),
        chips([["contain","ပုံအပြည့်ထည့် (ကွက်လပ်ရှိ)"],["cover","ဖြတ်ပြီး ပြည့်စေ"]], E.fit, id => E.fit = id));
    }
    else if(etab === "bg"){
      panel.append(h("p", {style:"color:var(--mu);font-size:.76rem;margin:0 0 6px"}, "Ratio ကို ပြောင်း၍ “ပုံအပြည့်ထည့်” ရွေးမှ background ပေါ်ပါမည်။"),
        h("div", {class:"chips"}, E_BGS.map(([id, l]) => {
          const st = id === "blur" ? "background:linear-gradient(135deg,#556,#223)" : id[0] === "g" ? `background:linear-gradient(135deg,${E_GRAD[+id.slice(1)].join(",")})` : "background:" + id;
          return h("button", {class:"ch" + (E.bg === id ? " on" : ""), onclick: () => { E.bg = id; drawPanel(); }}, h("div", {class:"sw", style:st + ";margin:0 auto 4px"}), l); })));
    }
  }

  /* export */
  const isDefault = () => JSON.stringify(E) === JSON.stringify(edDef());
  async function next(){
    const btn = $("#edNext"); btn.disabled = true; select(null);
    paused = true; await new Promise(r => setTimeout(r, 60));   // ပြင်ဆင်ရာတွင် preview loop ကို ခဏရပ် (ဖုန်းပေါ် အလုပ်မလေးစေရန်)
    try{
      let out;
      if(isDefault()) out = blob;
      else if(kind === "image"){ const [W, H] = size(); const c = document.createElement("canvas"); c.width = W; c.height = H; edRender(c.getContext("2d", {willReadFrequently:true}), E, m, mw, mh, W, H, 0, false, null); out = await new Promise(r => c.toBlob(r, "image/jpeg", .92)); }
      else { if(m.pause) m.pause(); out = await exportVideo(); }
      if(!out){ btn.disabled = false; paused = false; raf = requestAnimationFrame(loop); return; }
      cancelAnimationFrame(raf); closed = true; if(m.pause) m.pause();
      o.style.display = "none";
      showPreview(out, kind, {back: () => { o.remove(); URL.revokeObjectURL(url); openEditor(blob, kind, {E, dur: opts.dur}); }, discard: () => { o.close(); }});
    }catch(e){ console.error(e); toast("တည်းဖြတ်ထုတ်ယူမှု မအောင်မြင်ပါ - " + (e.message || e)); }
    btn.disabled = false; if(!closed && paused){ paused = false; raf = requestAnimationFrame(loop); }
  }
  async function exportVideo(){
    const [W, H] = size();
    const ex = document.createElement("canvas"); ex.width = W; ex.height = H; const c2 = ex.getContext("2d");
    const pv = h("div", {class:"prog"}, h("div", {}, h("div", {}, "⏳ ဗီဒီယို ပြင်ဆင်နေသည်…"), h("div", {class:"bar"}, h("i", {})), h("small", {}, "ဗီဒီယိုအရှည်အတိုင်း အချိန်ယူပါမည်၊ ဤစာမျက်နှာကို မပိတ်ပါနှင့်"), h("div", {}, h("button", {class:"btn alt", onclick: () => { cancelled = true; }}, "ပယ်ဖျက်"))));
    o.append(pv); let cancelled = false;
    const v = h("video", {src:url, playsinline:true, preload:"auto"});
    await new Promise(r => { v.onloadedmetadata = r; v.onerror = r; v.load(); });
    const AC = window.AudioContext || window.webkitAudioContext; let ac = null, dest = null;
    try{ ac = new AC(); const sn = ac.createMediaElementSource(v); dest = ac.createMediaStreamDestination(); sn.connect(dest); if(ac.state === "suspended") await ac.resume(); }catch(e){ ac = null; v.muted = true; }
    const stream = ex.captureStream(30); if(dest) dest.stream.getAudioTracks().forEach(t => stream.addTrack(t));
    const mt = ["video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm","video/mp4"].find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t));
    if(!mt){ pv.remove(); throw new Error("ဤ browser တွင် ဗီဒီယိုတည်းဖြတ်ထုတ်ယူခြင်း မထောက်ပံ့ပါ"); }
    const rec = new MediaRecorder(stream, {mimeType: mt, videoBitsPerSecond: 3500000}), chunks = [];
    rec.ondataavailable = e => e.data.size && chunks.push(e.data);
    const total = isFinite(v.duration) && v.duration > 0 ? v.duration : (opts.dur || 30);
    const result = new Promise(res => { rec.onstop = () => res(cancelled ? null : new Blob(chunks, {type: mt.split(";")[0]})); });
    rec.start(250);
    let r2 = 0; const t0 = performance.now();
    const draw = () => { if(rec.state === "inactive") return; edRender(c2, E, v, v.videoWidth || mw, v.videoHeight || mh, W, H, v.currentTime, false, null); pv.querySelector(".bar i").style.width = Math.min(100, v.currentTime / total * 100) + "%"; if(cancelled) stopAll(); r2 = requestAnimationFrame(draw); };
    const stopAll = () => { cancelAnimationFrame(r2); try{ v.pause(); }catch(e){} if(rec.state !== "inactive") rec.stop(); };
    v.onended = stopAll;
    const guard = setTimeout(stopAll, (total + 6) * 1000);
    v.currentTime = 0;
    try{ await v.play(); }
    catch(e1){ console.warn("export play", e1 && e1.name, e1 && e1.message); try{ v.muted = true; await v.play(); }catch(e){ clearTimeout(guard); stopAll(); pv.remove(); throw new Error("ဗီဒီယိုဖွင့်မရပါ (" + (e && e.name) + ")"); } }
    draw();
    const out = await result; clearTimeout(guard); if(ac) ac.close().catch(() => {}); pv.remove();
    return out;
  }

  drawPanel();
  load().then(() => { size(); raf = requestAnimationFrame(loop); });
  return o;
}

/* ---------- POST SHEET ---------- */
function showPreview(blob, kind, opts){
  opts = opts || {};
  camStop();
  const url = URL.createObjectURL(blob);
  const media = kind === "image" ? h("img", {src:url, class:"player", style:"aspect-ratio:auto;max-height:50vh;object-fit:contain", alt:""})
    : h("video", {src:url, class:"player", style:"aspect-ratio:auto;max-height:50vh", controls:true, playsinline:true, autoplay:true, loop:true, muted:true});
  const cap = h("input", {placeholder:"ဖော်ပြချက် အတိုချုပ် ရေးရန် (မထည့်လည်းရ)", maxlength:140});
  const sel = h("select", {}, CATS.slice(2).map(([id, l]) => h("option", {value:id}, l)));
  const ok = h("input", {type:"checkbox", style:"width:auto;margin-top:3px"});
  const dl = h("input", {type:"checkbox", checked:true, style:"width:auto;margin-top:3px"});
  const post = h("button", {class:"btn pink", onclick: async () => {
    if(!ok.checked){ toast("အတည်ပြုချက်ကို အမှန်ခြစ်ပါ"); return; }
    if(!cam.credit || cam.credit.kind !== kind){ toast("ကင်မရာသုံးခွင့် မရှိပါ၊ ပြန်ရိုက်ပါ"); return; }
    post.disabled = true; post.textContent = "တင်နေသည်…";
    try{
      const ext = kind === "image" ? "jpg" : (blob.type.includes("mp4") ? "mp4" : "webm");
      const path = `${user.id}/${Date.now()}.${ext}`;
      const up = await sb.storage.from("posts").upload(path, blob, {contentType: blob.type || (kind === "image" ? "image/jpeg" : "video/webm")});
      if(up.error) throw up.error;
      const pub = sb.storage.from("posts").getPublicUrl(path).data.publicUrl;
      const args = {p_credit: cam.credit.id, p_caption: cap.value.trim() || null, p_category: sel.value, p_url: pub, p_type: kind};
      let ins = await sb.rpc("publish_post", {...args, p_allow_download: dl.checked});
      if(ins.error && /Could not find the function|schema cache/i.test(ins.error.message)){
        ins = await sb.rpc("publish_post", args);      // update2.sql မ run ရသေးလျှင်လည်း တင်လို့ရစေရန်
        if(!ins.error) setTimeout(() => toast("မှတ်ချက်: Supabase တွင် update2.sql ကို run ပါ (မဟုတ်လျှင် Download ခွင့် setting အလုပ်မလုပ်ပါ)"), 2500);
      }
      if(ins.error) throw ins.error;
      cam.credit = null; HR = null;
      go("home"); o.close(); URL.revokeObjectURL(url); document.querySelectorAll(".edv").forEach(x => x.close ? x.close() : x.remove());
      toast("တင်ပြီးပါပြီ! ၂၄ နာရီကြာ ပေါ်နေပါမည်");
    }catch(e){
      console.error(e); const m = (e && e.message) || String(e);
      toast(/rate_limited/.test(m) ? "တင်တာ အလွန်မြန်နေသည်၊ ခဏစောင့်ပါ" : "မအောင်မြင်ပါ - " + m);
      post.disabled = false; post.textContent = "၂၄ နာရီ Post တင်မည်";
    }
  }}, "၂၄ နာရီ Post တင်မည်");
  const save = h("a", {class:"btn alt", href:url, download:"openvideo-" + Date.now() + (kind === "image" ? ".jpg" : (blob.type.includes("mp4") ? ".mp4" : ".webm")), style:"text-align:center;text-decoration:none"}, "ဖုန်းထဲသိမ်းမည်");
  const o = overlay("Post တင်ရန်", [media, h("div", {style:"display:grid;gap:10px;margin-top:12px"}, cap, sel,
    h("label", {style:"display:flex;gap:8px;font-size:.84rem;line-height:1.5"}, dl, "ကြည့်သူများ ဤ post ကို Download လုပ်ခွင့်ပြုမည်"),
    h("label", {style:"display:flex;gap:8px;font-size:.82rem;color:var(--mu);line-height:1.5"}, ok, "ဤအကြောင်းအရာသည် ကျွန်ုပ်ကိုယ်တိုင်ဖန်တီးထားခြင်းဖြစ်ပြီး ဥပဒေနှင့်ညီညွတ်ကြောင်း၊ သူတစ်ပါး၏ မူပိုင်ခွင့်/ကိုယ်ရေးကိုယ်တာကို မထိခိုက်ကြောင်း အတည်ပြုပါသည်။"),
    post, save,
    opts.back ? h("button", {class:"btn alt", onclick: () => { o.remove(); URL.revokeObjectURL(url); opts.back(); }}, "← ပြန်တည်းဖြတ်မည်") : null,
    h("button", {class:"btn alt", onclick: () => { o.close(); URL.revokeObjectURL(url); if(opts.discard) opts.discard(); }}, "ပယ်ဖျက်ပြီး ပြန်ရိုက်မည် (Point ပြန်မဖြတ်ပါ)"))],
    () => { if(tab === "camera" && !cam.stream && !document.querySelector(".edv")) camStart(); });
  o.style.zIndex = 36;
  return o;
}
