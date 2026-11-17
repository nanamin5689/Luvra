"use strict";
(() => {
/* ============ Luvra hair.js – ဆံပင်၊ နှုတ်ခမ်းမွှေး၊ မုတ်ဆိတ် AR styles + အရောင်ချိန်ညှိ ============
   face.js ၏ မျက်နှာ landmark (L.arc = နဖူးအနားသတ်၊ L.jaw = မေးရိုး) ကိုသုံး၍ ဆွဲသည်။
   ဆံပင်သည် မျက်နှာအပြင်ဘက်ကိုသာ ဆွဲသဖြင့် မျက်နှာကို မဖုံးပါ။                                    */
const HB = {hair:null, stache:null, beard:null, hairCol:"#2b1b12", faceCol:"#2b1b12"};
try{ const a = lsGet("ov_hcol"), b = lsGet("ov_fcol"); if(/^#[0-9a-f]{6}$/i.test(a || "")) HB.hairCol = a; if(/^#[0-9a-f]{6}$/i.test(b || "")) HB.faceCol = b; }catch(e){}

/* ---------- helpers ---------- */
const hx = s => { const n = parseInt(s.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const sh = (s, k) => { const [r, g, b] = hx(s), t = k < 0 ? 0 : 255, p = Math.abs(k); return `rgb(${(r + (t - r) * p) | 0},${(g + (t - g) * p) | 0},${(b + (t - b) * p) | 0})`; };
const rnd = seed => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const lerp = (a, b, t) => a + (b - a) * t;
const nrm = (x, y) => { const l = Math.hypot(x, y) || 1; return {x: x / l, y: y / l}; };
function sp(c, pts){            // ချောမွေ့သော အဝိုင်းပိတ် လမ်းကြောင်း
  const n = pts.length, m = (a, b) => ({x: (a.x + b.x) / 2, y: (a.y + b.y) / 2}); let s = m(pts[n - 1], pts[0]); c.moveTo(s.x, s.y);
  for(let i = 0; i < n; i++){ const p = pts[i], q = m(p, pts[(i + 1) % n]); c.quadraticCurveTo(p.x, p.y, q.x, q.y); }
  c.closePath();
}
function bbox(pts){ let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; pts.forEach(p => { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }); return {x0, y0, x1, y1}; }
function geo(L, R){
  const eyeY = (L.eL.y + L.eR.y) / 2;
  return {eyeY, noseY: L.nose.y, nbY: L.noseB.y, ulY: L.uLip.y, mY: L.mouth.y, chinY: L.chin.y, topY: L.top.y, mw: Math.max(R * .28, Math.abs(L.mR.x - L.mL.x) / 2)};
}
/* ---------- အမျှင်တစ်ချောင်းချင်း ဆွဲသော ဆံပင်/မွှေး ဆေးသုတ်စနစ် ---------- */
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
function segDist(px, py, a, b){ const vx = b.x - a.x, vy = b.y - a.y, l = vx * vx + vy * vy || 1, t = clamp(((px - a.x) * vx + (py - a.y) * vy) / l, 0, 1); return Math.hypot(px - a.x - vx * t, py - a.y - vy * t); }
function polyDist(px, py, pts){ let m = 1e9; for(let i = 0; i < pts.length - 1; i++) m = Math.min(m, segDist(px, py, pts[i], pts[i + 1])); return m; }
const NB = 9;
function inside(c, p, x, y, rule){ const M = c.getTransform(); return c.isPointInPath(p, M.a * x + M.c * y + M.e, M.b * x + M.d * y + M.f, rule); }
function fur(c, pathFn, col, R, o){
  const p = new Path2D(); pathFn(p); const rule = o.rule || "nonzero", w = o.x1 - o.x0, hh = o.y1 - o.y0;
  /* အောက်ခံ (အမျှင်များကြားက အရိပ်) */
  const ug = c.createLinearGradient(0, o.y0, 0, o.y1); ug.addColorStop(0, sh(col, -.1)); ug.addColorStop(.5, sh(col, -.3)); ug.addColorStop(1, sh(col, -.5));
  c.globalAlpha = o.underA == null ? 1 : o.underA; c.fillStyle = ug; c.fill(p, rule); c.globalAlpha = 1;
  if(o.n === 0) return;
  const r = rnd(o.seed || 7), lw = Math.max(.9, R * (o.lw || .0105)), len = o.len, steps = o.steps || 6, cov = o.cov || 3;
  const N = Math.min(o.max || 2600, Math.round(cov * w * hh * .5 / (lw * len * .8)));
  const bk = []; for(let i = 0; i < NB; i++) bk.push({a: new Path2D(), b: new Path2D()});
  const shade = o.shade || ((x, y) => .16 - .5 * (y - o.y0) / hh);
  let made = 0, tries = 0;
  while(made < N && tries < N * 5){
    tries++;
    const x = o.x0 + r() * w, y = o.y0 + r() * hh;
    if(!inside(c, p, x, y, rule)) continue;
    const fade = o.edge ? o.edge(x, y) : 1; if(fade < 1 && r() > fade) continue;
    made++;
    const L = (o.lenFn ? o.lenFn(x, y, r) : len) * (.65 + r() * .7) * (fade < 1 ? .55 + .45 * fade : 1), cs = (r() - .5) * 2, ph = r() * 6;
    const k0 = clamp(shade(x, y) + (r() - .5) * (o.var || .55), -.5, .42), bi = clamp(Math.round((k0 + .5) / .92 * (NB - 1)), 0, NB - 1), P = (r() < .62 ? bk[bi].a : bk[bi].b);
    let px = x, py = y, ang = 0; P.moveTo(px, py);
    for(let k = 0; k < steps; k++){
      const d = o.flow(px, py); ang = Math.atan2(d.y, d.x) + (o.jit == null ? .22 : o.jit) * cs * (k / steps) + (o.curl ? o.curl * cs * (k + 1) * .5 : 0) + (o.wave ? Math.sin(k * .9 + ph) * o.wave : 0);
      px += Math.cos(ang) * L / steps; py += Math.sin(ang) * L / steps; P.lineTo(px, py);
    }
  }
  c.save(); if(o.clip !== false) c.clip(p, rule); c.lineCap = "round"; c.lineJoin = "round";
  bk.forEach((B, i) => { const colr = sh(col, -.5 + .92 * i / (NB - 1));
    c.strokeStyle = colr; c.globalAlpha = o.alpha || .9; c.lineWidth = lw * 1.3; c.stroke(B.a); c.lineWidth = lw * .62; c.globalAlpha = (o.alpha || .9) * .95; c.stroke(B.b); });
  c.globalAlpha = 1; c.restore();
  if(o.sheen){
    c.save(); c.clip(p, rule); c.globalCompositeOperation = "source-atop";
    const sg = c.createLinearGradient(o.x0, 0, o.x1, 0); sg.addColorStop(0, "rgba(255,255,255,0)"); sg.addColorStop(.3, "rgba(255,255,255,.55)"); sg.addColorStop(.48, "rgba(255,255,255,0)"); sg.addColorStop(1, "rgba(255,255,255,0)");
    c.globalAlpha = .2; c.fillStyle = sg; c.fillRect(o.x0, o.y0, w, hh);
    const dg = c.createLinearGradient(0, o.y0, 0, o.y1); dg.addColorStop(0, "rgba(0,0,0,0)"); dg.addColorStop(1, "rgba(0,0,0,.35)"); c.globalAlpha = .55; c.fillStyle = dg; c.fillRect(o.x0, o.y0, w, hh);
    c.restore(); c.globalAlpha = 1;
  }
  if(o.stray && o.strayFrom){          // ဖြတ်ထွက်နေသော ဆံမျှင်ပါးများ
    c.save(); c.lineCap = "round"; c.globalAlpha = .45; c.lineWidth = lw * .55;
    const r2 = rnd((o.seed || 7) + 99);
    for(let i = 0; i < o.stray; i++){
      const s0 = o.strayFrom(r2), L = len * (.18 + r2() * .3), cs = (r2() - .5) * 2; let px = s0.x, py = s0.y;
      c.strokeStyle = sh(col, (r2() - .5) * .6); c.beginPath(); c.moveTo(px, py);
      for(let k = 0; k < 4; k++){ const d = o.strayFlow ? o.strayFlow(px, py) : o.flow(px, py), a = Math.atan2(d.y, d.x) + cs * .6 * (k / 4); px += Math.cos(a) * L / 4; py += Math.sin(a) * L / 4; c.lineTo(px, py); }
      c.stroke();
    }
    c.restore();
  }
}
/* ကပ်မနေဘဲ အစစ်ပေါက်သလို ဖြစ်စေရန် – sprite ကို မျက်နှာပုံသဏ္ဌာန်အလိုက် ၁ ကြိမ်ဆွဲပြီး cache ထားသည် */
const SPR = new Map();
function layer(c, kind, id, col, L, R, F, bounds, paint, extra){
  const g = geo(L, R), q = v => Math.round(v / R * 8);
  const sig = [kind, id, col, Math.round(Math.log(R) / .26), q(g.topY), q(g.chinY), q(g.eyeY), q(g.mw), q(L.arc[0].x), extra || ""].join("|");
  let s = SPR.get(sig);
  if(!s){
    const b = bounds(g, R), k = Math.min(1, 1100 / Math.max(b.x1 - b.x0, b.y1 - b.y0));
    const cv = document.createElement("canvas"); cv.width = Math.ceil((b.x1 - b.x0) * k); cv.height = Math.ceil((b.y1 - b.y0) * k);
    const x = cv.getContext("2d"); x.scale(k, k); x.translate(-b.x0, -b.y0);
    try{ paint(x, g); }catch(e){ console.warn("hair paint", e); }
    s = {cv, b, R}; if(SPR.size > 14) SPR.delete(SPR.keys().next().value); SPR.set(sig, s);
  }
  const f = R / s.R; c.save(); c.scale(f, f); c.drawImage(s.cv, s.b.x0, s.b.y0, s.b.x1 - s.b.x0, s.b.y1 - s.b.y0); c.restore();
}
function braid(c, x0, y0, x1, y1, w, col, R, bead){
  const len = Math.hypot(x1 - x0, y1 - y0), n = Math.max(4, Math.round(len / (w * .75))), ang = Math.atan2(y1 - y0, x1 - x0);
  for(let i = 0; i < n; i++){
    const t = i / (n - 1), x = lerp(x0, x1, t) + Math.sin(i * 1.3) * w * .05, y = lerp(y0, y1, t), ww = w * (1 - t * .4) * .5;
    c.save(); c.translate(x, y); c.rotate(ang - Math.PI / 2 + (i % 2 ? .55 : -.55));
    const g = c.createLinearGradient(-ww, 0, ww, 0); g.addColorStop(0, sh(col, -.35)); g.addColorStop(.5, sh(col, i % 2 ? .2 : 0)); g.addColorStop(1, sh(col, -.3));
    c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, ww, ww * 1.05, 0, 0, 7); c.fill(); c.restore();
  }
  c.fillStyle = sh(col, -.1); c.beginPath(); c.ellipse(x1, y1 + w * .25, w * .3, w * .38, 0, 0, 7); c.fill();
  if(bead){ const g = c.createLinearGradient(x1 - w * .4, 0, x1 + w * .4, 0); g.addColorStop(0, "#6b6f78"); g.addColorStop(.5, "#e8eaee"); g.addColorStop(1, "#6b6f78");
    c.fillStyle = g; c.beginPath(); c.roundRect ? c.roundRect(x1 - w * .42, y1 - w * .12, w * .84, w * .32, w * .1) : c.rect(x1 - w * .42, y1 - w * .12, w * .84, w * .32); c.fill(); }
}

/* ================= ဆံပင် ================= */
const HAIR = {
  crop:   {n:"ဆံတို",         vol:1.04, lift:.3,  pk:1,   side:.2},
  fade:   {n:"ဘေးတိုဖိတ်",    vol:1,    lift:.36, pk:1.5, side:.05},
  sweep:  {n:"ဘေးခွဲ",       vol:1.08, lift:.4,  pk:1.2, side:.24, fringe:"side", dir:.5},
  quiff:  {n:"ထိပ်မြင့်",     vol:1.1,  lift:.9,  pk:1.8, side:.12, dir:.3},
  bangs:  {n:"ဘန်း",         vol:1.08, lift:.32, pk:1,   side:.6,  fringe:"straight"},
  long:   {n:"ရှည်ဖြောင့်",   vol:1.1,  lift:.3,  pk:1,   side:.24, long:1.25, fringe:"center"},
  wavy:   {n:"ရှည်လိမ်",     vol:1.16, lift:.36, pk:1,   side:.24, long:1.2, wave:1, fringe:"side"},
  bob:    {n:"ဘော့ဘ်",       vol:1.12, lift:.3,  pk:1,   side:.3,  long:.06, fringe:"straight"},
  curtain:{n:"ကာတင်",        vol:1.08, lift:.34, pk:1,   side:.24, long:.55, fringe:"center"},
  braids: {n:"ကျစ်ဆံမြီး",    vol:1.04, lift:.3,  pk:1,   side:.2,  braids:1.35, fringe:"center"},
  bun:    {n:"ဆံထုံး",       vol:1.04, lift:.28, pk:1,   side:.2,  bun:1},
  pony:   {n:"မြင်းမြီး",     vol:1.04, lift:.34, pk:1,   side:.2,  pony:1, fringe:"side"},
  pig:    {n:"နှစ်ပင်ကျစ်",   vol:1.04, lift:.3,  pk:1,   side:.2,  pig:1, fringe:"straight"},
  mohawk: {n:"မိုဟော့",       vol:1,    lift:.1,  pk:1,   side:.04, mohawk:1},
  spiky:  {n:"ထောင်ဆံ",      vol:1.04, lift:.3,  pk:1,   side:.16, spiky:1},
  curly:  {n:"ကောက်ဆံ",      vol:1.3,  lift:.46, pk:1,   side:.3,  curly:1},
  afro:   {n:"အာဖရို",       vol:1.8,  lift:.7,  pk:1,   side:.5,  curly:1}
};
function drawHair(c, L, R, F, st, col, g){
  const arc = L.arc, n = arc.length;
  if(!arc || n < 5) return;
  const cy0 = g.eyeY + R * .1, crownY = g.topY - R * .55, wx = (st.dir || 0) * R * .35;
  const flow = (x, y) => { const d = nrm((x - wx) * .9, y - crownY + R * .3); return {x: d.x, y: Math.max(.22, d.y)}; };
  const lengthFlow = s => () => nrm(s * .12, 1);
  const out = arc.map((p, i) => { const u = i / (n - 1), up = Math.pow(Math.sin(Math.PI * u), st.pk || 1), d = nrm(p.x, p.y - cy0), k = R * (.12 + ((st.vol || 1) - 1) * .55) + (st.lift || 0) * R * up;
    return {x: p.x + d.x * k, y: p.y + d.y * k}; });
  const apex = out.reduce((a, p) => p.y < a.y ? p : a, out[0]);
  const hairEdge = (x, y) => clamp(polyDist(x, y, arc) / (R * .12), .1, 1);
  const rootsOut = r => { const i = 1 + Math.floor(r() * (n - 2)), p = out[i]; return {x: p.x + (r() - .5) * R * .06, y: p.y + (r() - .5) * R * .06}; };
  const outFlow = (x, y) => { const d = nrm(x * .7, y - cy0); return {x: d.x, y: d.y * .6 + .25}; };

  /* --- ရှည်သော ဘေးဆံပင် --- */
  if(st.long != null){
    [-1, 1].forEach(s => {
      const e = s < 0 ? out[0] : out[n - 1], a = s < 0 ? arc[0] : arc[n - 1], yb = g.chinY + st.long * R, wv = st.wave ? R * .08 : 0;
      const xi = a.x, xo = e.x + s * R * (.14 + st.long * .06);
      const pts = [{x: xi, y: a.y - R * .1}, {x: e.x, y: e.y}];
      for(let k = 1; k <= 5; k++){ const t = k / 5, yy = lerp(e.y, yb, t), ph = Math.sin(t * Math.PI * 3) * wv; pts.push({x: lerp(e.x, xo, Math.min(1, t * 1.4)) + s * ph, y: yy}); }
      pts.push({x: xo - s * R * .2, y: yb + R * .14});
      for(let k = 5; k >= 1; k--){ const t = k / 5, yy = lerp(a.y, yb, t), ph = Math.sin(t * Math.PI * 3 + .5) * wv; pts.push({x: xi + s * R * (.04 + .16 * t) + s * ph * .6, y: yy}); }
      const b = bbox(pts);
      fur(c, cc => sp(cc, pts), col, R, {x0: b.x0, x1: b.x1, y0: b.y0, y1: b.y1, flow: lengthFlow(s), len: R * (.5 + st.long * .2), steps: 7, seed: 11 + (s > 0 ? 3 : 0), sheen: 1, wave: st.wave ? .22 : 0, jit: st.wave ? .5 : .12, cov: 3.2,
        shade: (x, y) => .2 - .55 * (y - b.y0) / (b.y1 - b.y0) + (s * x < s * xi ? -.15 : 0)});
    });
  }
  if(st.braids) [-1, 1].forEach(s => { const e = s < 0 ? out[0] : out[n - 1]; braid(c, e.x + s * R * .02, e.y + R * .3, e.x + s * R * .1, g.chinY + st.braids * R, R * .22, col, R, 1); });
  if(st.pony || st.pig){
    const sides = st.pig ? [-1, 1] : [1];
    sides.forEach(s => {
      const e = out[Math.round((n - 1) * (s < 0 ? .16 : st.pig ? .84 : .8))], tipY = st.pig ? g.mY + R * .45 : g.chinY + R * .55, bw = st.pig ? R * .3 : R * .34;
      const pts = [{x: e.x, y: e.y - R * .05}, {x: e.x + s * bw, y: e.y + R * .1}, {x: e.x + s * (bw * 1.6 + R * .08), y: lerp(e.y, tipY, .45)}, {x: e.x + s * (bw * 1.2), y: lerp(e.y, tipY, .8)},
        {x: e.x + s * bw * .3, y: tipY}, {x: e.x - s * bw * .2, y: lerp(e.y, tipY, .6)}, {x: e.x - s * bw * .35, y: lerp(e.y, tipY, .25)}];
      const b = bbox(pts);
      fur(c, cc => sp(cc, pts), col, R, {x0: b.x0, x1: b.x1, y0: b.y0, y1: b.y1, flow: () => nrm(s * .15, 1), len: R * .45, steps: 6, seed: 31, sheen: 1, cov: 3.5});
      c.fillStyle = st.pig ? "#ff4f93" : sh(col, .35); c.beginPath(); c.arc(e.x + s * R * .02, e.y + R * .05, R * (st.pig ? .12 : .08), 0, 7); c.fill();
    });
  }
  /* --- ဦးခေါင်းထိပ် (အပြည့်ဖုံး) --- */
  if(!st.mohawk){
    const sd = (st.side || 0) * R, pts = [{x: out[0].x - R * .03, y: out[0].y + sd}, ...out, {x: out[n - 1].x + R * .03, y: out[n - 1].y + sd}, {x: arc[n - 1].x, y: arc[n - 1].y + sd * .9}, ...arc.slice().reverse(), {x: arc[0].x, y: arc[0].y + sd * .9}];
    const b = bbox(pts);
    /* မျက်နှာပေါ် ဆံပင်အရိပ် (နုနုညံ့ညံ့) */
    c.save(); c.filter = "blur(" + Math.max(1, R * .04) + "px)"; c.strokeStyle = "rgba(20,10,5,.22)"; c.lineWidth = R * .09; c.lineJoin = "round"; c.beginPath();
    arc.forEach((p, i) => { const d = nrm(p.x, p.y - cy0); const x = p.x - d.x * R * .04, y = p.y - d.y * R * .02 + R * .02; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke(); c.restore();
    fur(c, cc => sp(cc, pts), col, R, {x0: b.x0, x1: b.x1, y0: b.y0, y1: b.y1, flow, len: R * (st.curly ? .2 : .52), steps: st.curly ? 9 : 6, curl: st.curly ? .5 : 0, cov: st.curly ? 4.2 : 3.2, lw: st.curly ? .013 : .0105, seed: 5, sheen: st.curly ? 0 : 1,
      edge: hairEdge, stray: st.curly ? 24 : 36, strayFrom: rootsOut, strayFlow: outFlow, jit: st.curly ? .4 : .22, max: 3400,
      shade: (x, y) => .2 - .6 * (y - b.y0) / (b.y1 - b.y0) + (st.curly ? .1 * Math.sin(x * .4) : 0)});
    if(c.filter !== undefined){      // ဆံထိုးနားစွန်းကို နူးညံ့စေရန် ဖျော့ဖျက်
      c.save(); c.globalCompositeOperation = "destination-out"; c.filter = "blur(" + Math.max(1, R * .025) + "px)"; c.strokeStyle = "rgba(0,0,0,.75)"; c.lineWidth = R * .035; c.lineJoin = "round"; c.beginPath();
      arc.forEach((p, i) => { const d = nrm(p.x, p.y - cy0), x = p.x - d.x * R * .02, y = p.y - d.y * R * .02; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke(); c.restore();
    }
    if(st.spiky){
      const r = rnd(8);
      for(let i = 1; i < n - 1; i++){ const p = out[i], q = out[Math.min(n - 1, i + 1)], d = nrm(p.x, p.y - cy0), tg = nrm(q.x - p.x, q.y - p.y), hgt = R * (.34 + r() * .22), tw = R * .1;
        const pp = [{x: p.x - tg.x * tw, y: p.y - tg.y * tw}, {x: p.x + d.x * hgt + tg.x * tw * .3, y: p.y + d.y * hgt}, {x: p.x + tg.x * tw, y: p.y + tg.y * tw}, {x: p.x - d.x * R * .12, y: p.y - d.y * R * .12}];
        const bb = bbox(pp), ax = nrm(d.x * hgt, d.y * hgt);
        fur(c, cc => { cc.moveTo(pp[0].x, pp[0].y); cc.lineTo(pp[1].x, pp[1].y); cc.lineTo(pp[2].x, pp[2].y); cc.lineTo(pp[3].x, pp[3].y); cc.closePath(); }, col, R, {x0: bb.x0, x1: bb.x1, y0: bb.y0, y1: bb.y1, flow: () => ax, len: hgt * .8, steps: 4, seed: 40 + i, cov: 4, lw: .009, jit: .1}); }
    }
  }
  if(st.mohawk){
    const base = g.topY + R * .12, pts = [{x: -R * .3, y: base}];
    for(let k = 0; k <= 6; k++){ const t = k / 6; pts.push({x: lerp(-.26, .26, t) * R, y: base - R * (.6 + .22 * Math.sin(t * 9) + (.3 * (1 - Math.abs(t * 2 - 1))))}); if(k < 6) pts.push({x: lerp(-.26, .26, (k + .5) / 6) * R, y: base - R * .35}); }
    pts.push({x: R * .3, y: base});
    const b = bbox(pts);
    fur(c, cc => { cc.moveTo(pts[0].x, pts[0].y); pts.forEach(p => cc.lineTo(p.x, p.y)); cc.closePath(); }, col, R, {x0: b.x0, x1: b.x1, y0: b.y0, y1: b.y1, flow: (x, y) => nrm(x * .004, -1), len: R * .4, steps: 5, seed: 9, sheen: 1, cov: 4, jit: .12, shade: (x, y) => -.05 + .35 * (b.y1 - y) / (b.y1 - b.y0) - .2});
  }
  if(st.bun){
    const rr = R * .3, cx = 0, cyb = apex.y - rr * .45, bb = {x0: cx - rr, x1: cx + rr, y0: cyb - rr, y1: cyb + rr};
    fur(c, cc => cc.arc(cx, cyb, rr, 0, 7), col, R, Object.assign(bb, {flow: (x, y) => { const d = nrm(y - cyb, -(x - cx)); return d; }, len: rr * 1.1, steps: 6, curl: .12, seed: 17, sheen: 1, cov: 4, jit: .3,
      shade: (x, y) => .2 - .6 * (y - bb.y0) / (bb.y1 - bb.y0)}));
  }
  /* --- နဖူးပေါ်က ဆံစ (fringe) --- */
  if(st.fringe){
    const sub = arc.filter(p => Math.abs(p.x) <= R * .94), brow = g.eyeY - R * .3, ty = g.topY;
    let pts, ff = (x, y) => nrm(x < 0 ? -.3 : .2, 1), len = R * .45;
    if(st.fringe === "straight"){ pts = [...sub.map(p => ({x: p.x, y: p.y - R * .02})), {x: R * .94, y: brow - R * .04}, {x: R * .5, y: brow}, {x: 0, y: brow + R * .03}, {x: -R * .5, y: brow}, {x: -R * .94, y: brow - R * .04}]; ff = (x, y) => nrm(x * .08 / R, 1); len = R * .5; }
    else if(st.fringe === "center"){ pts = null; }
    else pts = [...sub, {x: R * .9, y: g.eyeY - R * .45}, {x: R * .45, y: ty + R * .33}, {x: 0, y: ty + R * .27}, {x: -R * .5, y: g.eyeY - R * .3}, {x: -R * .94, y: g.eyeY + R * .04}];
    if(pts){ const b = bbox(pts); fur(c, cc => sp(cc, pts), col, R, {x0: b.x0, x1: b.x1, y0: b.y0, y1: b.y1, flow: ff, len, steps: 6, seed: 21, sheen: 1, cov: 3.2, jit: .3, edge: hairEdge, underA: .9, stray: 14, strayFrom: r => { const p = pts[Math.floor(r() * pts.length)]; return {x: p.x, y: p.y}; }}); }
    else [-1, 1].forEach(s => {
      const half = sub.filter(p => s * p.x >= -R * .02), pp = [{x: 0, y: ty + R * .14}, ...half.sort((a, b) => s * (a.x - b.x)), {x: s * R * .95, y: g.eyeY - R * .02}, {x: s * R * .72, y: g.eyeY - R * .3}, {x: s * R * .3, y: ty + R * .38}];
      const b = bbox(pp); fur(c, cc => sp(cc, pp), col, R, {x0: b.x0, x1: b.x1, y0: b.y0, y1: b.y1, flow: () => nrm(s * .5, 1), len: R * .45, steps: 6, seed: 23 + s, sheen: 1, cov: 3.2, edge: hairEdge, underA: .9});
    });
  }
}
const hairBounds = (g, R) => ({x0: -2.5 * R, x1: 2.5 * R, y0: g.topY - 1.9 * R, y1: g.chinY + 2.3 * R});

/* ================= နှုတ်ခမ်းမွှေး ================= */
/* ညာဘက်ခြမ်း၏ bezier (x = hw အလိုက်၊ y = th အလိုက်); ဘယ်ဘက်ကို mirror လုပ်။ up = အစွန်းမြှောက်၊ drop = အစွန်းကျ */
const STACHE = {
  pencil:   {n:"ပါးလွှာ",    p:"M0,-.3 C.4,-.5 .8,-.4 1.05,-.05 L1.05,.12 C.8,0 .4,.05 0,.1 Z"},
  toothbr:  {n:"အသေးလေး",   p:"M0,-.4 C.2,-.45 .5,-.45 .6,-.32 L.6,.3 C.4,.33 .15,.33 0,.34 Z"},
  chevron:  {n:"ထူထူ",      p:"M0,-.6 C.4,-.75 .9,-.7 1.15,-.35 C1.2,.1 1.1,.55 .9,.75 C.6,.45 .3,.4 0,.45 Z"},
  fluffy:   {n:"ပွပွထူ",     p:"M0,-.7 C.5,-.95 1.2,-.9 1.45,-.25 C1.65,.35 1.5,.9 1.1,1.05 C.8,.65 .4,.6 0,.65 Z", fl:1},
  soft:     {n:"ဝိုင်းပွ",    p:"M0,-.65 C.6,-.85 1.15,-.45 1.28,.12 C1.2,.78 .65,.95 0,.72 Z", fl:1},
  walrus:   {n:"ဝက်ဝံမွေး",   p:"M0,-.7 C.4,-.85 1,-.8 1.25,-.3 C1.4,.3 1.35,.9 1.1,1.25 C.9,.8 .5,.6 0,.55 Z", drop:.4, fl:1},
  pancho:   {n:"ကျပွ",      p:"M0,-.55 C.5,-.75 1.1,-.6 1.35,-.1 C1.55,.5 1.55,1.2 1.45,1.9 C1.2,1.2 1,.8 .7,.5 C.4,.45 .2,.4 0,.4 Z", drop:1, fl:1},
  handle:   {n:"ကွေးထောင်",   p:"M0,-.5 C.4,-.7 .85,-.5 1.1,-.1 C1.3,.2 1.55,.05 1.62,-.65 C1.52,-.15 1.4,.5 1.05,.52 C.7,.62 .35,.35 0,.4 Z", up:1.1},
  waxed:    {n:"ချွန်",       p:"M0,-.45 C.4,-.6 .9,-.45 1.2,-.1 C1.45,.1 1.7,-.1 1.9,-.45 C1.65,.3 1.3,.5 .95,.5 C.6,.55 .3,.35 0,.35 Z", up:1.2},
  english:  {n:"အင်္ဂလိပ်",     p:"M0,-.4 C.5,-.55 1,-.4 1.3,-.1 C1.6,.15 1.9,-.1 2.05,-.75 C1.95,.1 1.6,.4 1.2,.3 C.8,.28 .4,.25 0,.22 Z", up:1.25},
  fumanchu: {n:"ဖူးမန်ချူး",   p:"M0,-.5 C.4,-.7 .9,-.5 1.1,-.1 C1.25,.6 1.2,1.8 1.12,3 C1,2 .85,.9 .6,.5 C.35,.4 .15,.35 0,.35 Z", drop:.9},
  shoe:     {n:"မြင်းခွာ",     p:"M0,-.5 C.4,-.65 .9,-.6 1.05,-.2 C1.15,1 1.15,1.6 1.1,2.3 L.8,2.3 C.82,1.2 .8,.5 .5,.35 C.3,.3 .15,.3 0,.3 Z", drop:.9}
};
function drawStache(c, L, R, F, st, col, g){
  const hw = g.mw * 1.4, th = Math.max(R * .2, (g.ulY - g.nbY) * 1.15), yc = g.nbY + (g.ulY - g.nbY) * .42;
  const tok = st.p.split(/[\s,]+/).filter(Boolean);
  const path = cc => { [-1, 1].forEach(s => {
    const X = v => s * (+v) * hw, Y = v => yc + (+v) * th; let i = 0;
    while(i < tok.length){ const t = tok[i++], first = t[0], rest = t.slice(1);
      if(first === "M") cc.moveTo(X(rest), Y(tok[i++]));
      else if(first === "L") cc.lineTo(X(rest), Y(tok[i++]));
      else if(first === "C"){ const a = [X(rest), Y(tok[i]), X(tok[i + 1]), Y(tok[i + 2]), X(tok[i + 3]), Y(tok[i + 4])]; i += 5; cc.bezierCurveTo(...a); }
      else if(first === "Z") cc.closePath(); }
  }); };
  const flow = (x, y) => {
    const s = x < 0 ? -1 : 1, ax = Math.abs(x) / hw;
    let dx = s * (.25 + ax * .9), dy = .62 - ax * .12;
    if(st.up && ax > st.up * .75){ const k = clamp((ax - st.up * .75) / (.5 * hw / hw), 0, 1); dy = lerp(dy, -1.2, k); dx = lerp(dx, s * .5, k); }
    if(st.drop && ax > .9){ const k = clamp((ax - .9) / .35, 0, 1) * st.drop; dy = lerp(dy, 1.3, k); dx = lerp(dx, s * .12, k); }
    return nrm(dx, dy);
  };
  fur(c, path, col, R, {x0: -hw * 2.2, x1: hw * 2.2, y0: yc - th * 1.1, y1: yc + th * 3.2, flow, len: R * (st.fl ? .3 : .22), steps: 5, seed: 41, lw: st.fl ? .012 : .0105, cov: st.fl ? 4.2 : 3.6, jit: st.fl ? .5 : .3, max: 2400,
    shade: (x, y) => .12 - .4 * (y - (yc - th)) / (th * 3), stray: st.fl ? 34 : 12, strayFrom: r => { const s = r() < .5 ? -1 : 1; return {x: s * hw * (.2 + r() * 1.1), y: yc + (r() - .5) * th * 1.6}; }, strayFlow: (x, y) => flow(x, y)});
}
const stacheBounds = (g, R) => ({x0: -g.mw * 3.6 - R * .2, x1: g.mw * 3.6 + R * .2, y0: g.nbY - R * .5, y1: g.ulY + R * 1.2});

/* ================= မုတ်ဆိတ် ================= */
const BEARD = {
  full:    {n:"အပြည့်",       k:"full",  len:.16, p:.6,  th:.07},
  fluffy:  {n:"ပွပွထူ",        k:"full",  len:.4,  p:.8,  th:.15, fl:1},
  hipster: {n:"Hipster",     k:"full",  len:.5,  p:1.1, th:.09, fl:1},
  long:    {n:"ရှည်",        k:"full",  len:1.0,  p:1.2, th:.08, fl:1},
  wild:    {n:"တောင်ပေါ်",     k:"full",  len:1.2,  p:1.0, th:.18, fl:1},
  forked:  {n:"နှစ်ခွ",        k:"full",  len:.95,  fork:1, th:.08, fl:1},
  braided: {n:"ကျစ်မုတ်ဆိတ်",  k:"full",  len:.15, p:.6, th:.07, braids:1},
  goatee:  {n:"ဆိတ်မွေး",     k:"goat",  len:.2},
  point:   {n:"ချွန်ဆိတ်မွေး",  k:"goat",  len:.55, point:1},
  strap:   {n:"မေးကြိုး",      k:"band",  band:.13, len:.04},
  chops:   {n:"ပါးသိုင်း",     k:"chops"},
  circle:  {n:"ဝိုင်းမွေး",     k:"circle", len:.15},
  stubble: {n:"ဖွာမွေး",      k:"full",  len:.05, p:.6, th:.04, dots:1}
};
function jawOuter(L, R, o){
  const j = L.jaw, m = j.length, C = {x: 0, y: L.nose.y};
  return j.map((p, i) => { const u = i / (m - 1), d = nrm(p.x - C.x, p.y - C.y), ext = (o.len || 0) * R * (o.fork ? (Math.exp(-Math.pow((u - .36) / .09, 2)) + Math.exp(-Math.pow((u - .64) / .09, 2))) : Math.pow(Math.max(0, 1 - Math.abs(2 * u - 1)), o.p || .6));
    return {x: p.x + d.x * (o.th || 0) * R, y: p.y + d.y * (o.th || 0) * R + ext}; });
}
function drawBeard(c, L, R, F, st, col, g){
  const j = L.jaw, m = j.length, open = Math.min(.5, F.open || 0);
  const flow = (x, y) => { const d = nrm(-x / R * .45, 1); return d; };
  const mouthHole = cc => { cc.moveTo(g.mw * 1.1, g.mY); cc.ellipse(0, g.mY + open * R * .5, g.mw * 1.1, R * .055 + open * R * 1.05, 0, 0, Math.PI * 2); };
  let pts, hole = true, extra = null;
  if(st.k === "full"){
    const o = jawOuter(L, R, st), s0 = j[0], s1 = j[m - 1];
    const top = [{x: s1.x * .97, y: s1.y - R * .08}, {x: R * .82, y: g.ulY - R * .3}, {x: R * .52, y: g.ulY - R * .2}, {x: R * .24, y: g.nbY + R * .06}, {x: 0, y: g.nbY + R * .09}, {x: -R * .24, y: g.nbY + R * .06}, {x: -R * .52, y: g.ulY - R * .2}, {x: -R * .82, y: g.ulY - R * .3}, {x: s0.x * .97, y: s0.y - R * .08}];
    pts = [...o, ...top];
  } else if(st.k === "band"){
    const o = jawOuter(L, R, {len: st.len, p: .6, th: .04}), C = {x: 0, y: L.nose.y}, inn = j.map(p => { const d = nrm(p.x - C.x, p.y - C.y); return {x: p.x - d.x * st.band * R, y: p.y - d.y * st.band * R}; });
    pts = [...o, ...inn.reverse()]; hole = false;
  } else if(st.k === "chops"){
    const C = {x: 0, y: L.nose.y}; pts = null; extra = [];
    [[0, 6], [m - 7, m - 1]].forEach(([a, b]) => { const seg = j.slice(a, b + 1), o = seg.map(p => { const d = nrm(p.x - C.x, p.y - C.y); return {x: p.x + d.x * R * .06, y: p.y + d.y * R * .06}; }), inn = seg.map(p => { const d = nrm(p.x - C.x, p.y - C.y); return {x: p.x - d.x * R * .32, y: p.y - d.y * R * .3}; });
      extra.push([...o, ...inn.reverse()]); });
    hole = false;
  } else if(st.k === "goat" || st.k === "circle"){
    const top = g.mY + open * R + R * .09, ln = st.len * R, w = R * (st.point ? .3 : .36);
    pts = st.point ? [{x: -w, y: top}, {x: -w * 1.05, y: lerp(top, g.chinY, .55)}, {x: -w * .55, y: g.chinY}, {x: 0, y: g.chinY + ln}, {x: w * .55, y: g.chinY}, {x: w * 1.05, y: lerp(top, g.chinY, .55)}, {x: w, y: top}, {x: 0, y: top - R * .02}]
      : [{x: -w, y: top}, {x: -w * 1.1, y: lerp(top, g.chinY, .6)}, {x: -w * .6, y: g.chinY + ln * .3}, {x: 0, y: g.chinY + ln}, {x: w * .6, y: g.chinY + ln * .3}, {x: w * 1.1, y: lerp(top, g.chinY, .6)}, {x: w, y: top}, {x: 0, y: top - R * .02}];
    hole = false;
    if(st.k === "circle") extra = [[{x: -g.mw * 1.55, y: g.mY}, {x: -g.mw * 1.35, y: g.mY - R * .2}, {x: 0, y: g.ulY - R * .05}, {x: g.mw * 1.35, y: g.mY - R * .2}, {x: g.mw * 1.55, y: g.mY}, {x: g.mw * 1.35, y: g.mY + R * .28}, {x: 0, y: top}, {x: -g.mw * 1.35, y: g.mY + R * .28}]];
  }
  const all = [...(pts || []), ...(extra || []).flat()], b = bbox(all);
  const rings = pts ? [pts] : [];
  (extra || []).forEach(e => rings.push(e));
  const path = cc => { rings.forEach(r => sp(cc, r)); if(hole && !st.dots) mouthHole(cc); };
  const edge = (x, y) => { let d = 1e9; rings.forEach(r => { d = Math.min(d, polyDist(x, y, r.concat([r[0]]))); }); return clamp(d / (R * .07), .18, 1); };
  const base = {x0: b.x0, x1: b.x1, y0: b.y0, y1: b.y1, flow, len: R * (st.fl ? .34 : .22), steps: 5, seed: 13, lw: st.fl ? .0125 : .0105, cov: st.fl ? 4 : 3.4, jit: st.fl ? .5 : .3, max: 3200, edge, rule: hole && !st.dots ? "evenodd" : "nonzero",
    shade: (x, y) => .1 - .45 * (y - b.y0) / (b.y1 - b.y0), lenFn: (x, y, r) => R * (st.fl ? .3 : .2) * (1 + Math.max(0, (y - g.mY) / R) * (st.len || 0) * .9)};
  if(st.dots){      // ဖွာမွေး – အရေပြားပေါ် မွှေးတိုတိုလေးများ
    const p = new Path2D(); path(p); c.save(); c.clip(p, "evenodd");
    const r = rnd(17); c.lineCap = "round"; c.lineWidth = Math.max(.8, R * .008); c.globalAlpha = .6; c.strokeStyle = col; c.beginPath();
    for(let i = 0; i < 1500; i++){ const x = b.x0 + r() * (b.x1 - b.x0), y = b.y0 + r() * (b.y1 - b.y0); if(!inside(c, p, x, y, "evenodd")) continue; const dd = flow(x, y), l = R * (.03 + r() * .03); c.moveTo(x, y); c.lineTo(x + dd.x * l, y + dd.y * l); }
    c.stroke(); c.globalAlpha = .12; c.fillStyle = col; c.fillRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0); c.restore(); c.globalAlpha = 1;
  } else {
    /* မျက်နှာအသားပေါ် အရိပ် */
    c.save(); c.filter = "blur(" + Math.max(1, R * .03) + "px)"; c.globalAlpha = .25; c.fillStyle = "#20100a"; const p0 = new Path2D(); path(p0); c.fill(p0, base.rule); c.restore();
    fur(c, path, col, R, base);
  }
  if(st.braids){
    [[-.32, 0], [.32, 0]].forEach(([x]) => braid(c, x * R, g.chinY - R * .05, x * R * 1.1, g.chinY + R * 1.0, R * .22, col, R, 1));
    braid(c, 0, g.chinY, 0, g.chinY + R * .75, R * .2, col, R, 1);
  }
}
const beardBounds = (g, R) => ({x0: -1.9 * R, x1: 1.9 * R, y0: g.nbY - R * .6, y1: g.chinY + 1.9 * R});

/* ================= DRAW hooks + Looks ================= */
DRAW.hb_hair = (c, L, R, F) => { if(HB.hair && HAIR[HB.hair]) layer(c, "hair", HB.hair, HB.hairCol, L, R, F, hairBounds, (x, g) => drawHair(x, L, R, F, HAIR[HB.hair], HB.hairCol, g)); };
DRAW.hb_beard = (c, L, R, F) => { if(HB.beard && BEARD[HB.beard]){ const st = BEARD[HB.beard]; layer(c, "beard", HB.beard, HB.faceCol, L, R, F, beardBounds, (x, g) => drawBeard(x, L, R, F, st, HB.faceCol, g), st.k === "goat" || st.k === "circle" || st.k === "full" ? Math.round(Math.min(.5, F.open || 0) * 7) : ""); } };
DRAW.hb_stache = (c, L, R, F) => { if(HB.stache && STACHE[HB.stache]) layer(c, "stache", HB.stache, HB.faceCol, L, R, F, stacheBounds, (x, g) => drawStache(x, L, R, F, STACHE[HB.stache], HB.faceCol, g)); };
function hbList(tp){
  const o = []; if(HB.hair) o.push("hb_hair"); (tp.d || []).forEach(k => o.push(k)); if(HB.beard) o.push("hb_beard"); if(HB.stache) o.push("hb_stache"); return o;
}
const LOOKS = [
  {id:"rugged",  n:"ယောက်ျားမာန်",  hair:"quiff",  stache:null,     beard:"full",    hc:"#2b1b12", fc:"#2b1b12"},
  {id:"gent",    n:"လူကြီးလူကောင်း", hair:"sweep",  stache:"handle", beard:null,      hc:"#14100d", fc:"#14100d"},
  {id:"warrior", n:"စစ်သူရဲ",       hair:"braids", stache:"walrus", beard:"braided", hc:"#a4531c", fc:"#a4531c"},
  {id:"sage",    n:"ဆရာကြီး",       hair:"long",   stache:"walrus", beard:"long",    hc:"#e9e9ec", fc:"#e9e9ec"},
  {id:"biker",   n:"ဘိုင်ကာ",       hair:"mohawk", stache:null,     beard:"point",   hc:"#e11d48", fc:"#14100d"},
  {id:"retro",   n:"Retro",       hair:"afro",   stache:"chevron",beard:"chops",   hc:"#14100d", fc:"#14100d"},
  {id:"master",  n:"ကုန်ဖူးမာစတာ",  hair:"bun",    stache:"fumanchu",beard:"goatee", hc:"#1c1410", fc:"#1c1410"},
  {id:"cutie",   n:"ချစ်စရာ",       hair:"pig",    stache:null,     beard:null,      hc:"#ff7eb6", fc:"#14100d"},
  {id:"punk",    n:"ပန့်ခ်",         hair:"spiky",  stache:"shoe",   beard:"circle",  hc:"#7c5cff", fc:"#14100d"},
  {id:"elder",   n:"အဘိုးကြီး",      hair:"wavy",   stache:"waxed",  beard:"forked",  hc:"#9aa0a6", fc:"#9aa0a6"}
];
const SWATCH = ["#0f0b09","#2b1b12","#5a3a22","#8b5a2b","#a4531c","#d9a441","#9aa0a6","#e9e9ec","#ff7eb6","#e11d48","#7c5cff","#3b82f6","#22c55e"];

/* ---------- thumbnails (ပုံစံအတိုင်း မျက်နှာပြောင်ပေါ် ဆွဲပြ) ---------- */
const THUMB = new Map();
function thumbFor(kind, id){
  const col = kind === "hair" ? HB.hairCol : HB.faceCol, key = kind + "|" + id + "|" + col + (kind === "look" ? HB.hairCol + HB.faceCol : "");
  if(THUMB.has(key)) return THUMB.get(key);
  const cv = document.createElement("canvas"); cv.width = cv.height = 96; const c = cv.getContext("2d");
  const R = 100, F = manualFace(0, 0, R); F.open = 0; F.t = 0; const L = F.L, s = 96 / (R * 3.7);
  c.translate(48, 48 + R * .3 * s); c.scale(s, s);
  const skin = c.createLinearGradient(0, L.top.y, 0, L.chin.y); skin.addColorStop(0, "#f2c9a4"); skin.addColorStop(1, "#e0a67d");
  c.fillStyle = skin; c.beginPath(); [...L.arc, ...L.jaw.slice().reverse()].forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.closePath(); c.fill();
  c.fillStyle = "#2b2b36"; [L.eL, L.eR].forEach(e => { c.beginPath(); c.ellipse(e.x, e.y, R * .06, R * .045, 0, 0, 7); c.fill(); });
  c.strokeStyle = "#c0764f"; c.lineWidth = R * .03; c.lineCap = "round"; c.beginPath(); c.moveTo(L.nose.x, L.nose.y - R * .12); c.lineTo(L.nose.x - R * .04, L.nose.y + R * .06); c.stroke();
  c.strokeStyle = "#b5524f"; c.lineWidth = R * .045; c.beginPath(); c.moveTo(L.mL.x + R * .06, L.mouth.y); c.quadraticCurveTo(0, L.mouth.y + R * .05, L.mR.x - R * .06, L.mouth.y); c.stroke();
  const save = [HB.hair, HB.stache, HB.beard, HB.hairCol, HB.faceCol];
  if(kind === "look"){ const lk = LOOKS.find(x => x.id === id); HB.hair = lk.hair; HB.stache = lk.stache; HB.beard = lk.beard; HB.hairCol = lk.hc; HB.faceCol = lk.fc; }
  else { HB.hair = kind === "hair" ? id : null; HB.stache = kind === "stache" ? id : null; HB.beard = kind === "beard" ? id : null; }
  try{ ["hb_hair", "hb_beard", "hb_stache"].forEach(k => DRAW[k](c, L, R, F)); }catch(e){ console.warn(e); }
  [HB.hair, HB.stache, HB.beard, HB.hairCol, HB.faceCol] = save;
  const url = cv.toDataURL("image/png"); THUMB.set(key, url); return url;
}

/* ---------- UI (camera tools) ---------- */
GROUPS.splice(1, 0, ["look", "💈 Look"], ["hair", "💇 ဆံပင်"], ["stache", "🥸 နှုတ်ခမ်းမွှေး"], ["beard", "🧔 မုတ်ဆိတ်"]);
const _drawTpls0 = drawTpls;
let hbRow = null;
function hbColors(kind){
  if(!hbRow){ hbRow = h("div", {class:"hbcol"}); $("#tpls").after(hbRow); }
  hbRow.replaceChildren();
  const isHair = kind === "hair", key = isHair ? "hairCol" : "faceCol", sel = isHair ? HB.hair : (kind === "stache" ? HB.stache : HB.beard);
  hbRow.hidden = !sel && kind !== "look";
  if(hbRow.hidden) return;
  const set = v => { HB[key] = v; lsSet(isHair ? "ov_hcol" : "ov_fcol", v); drawTpls(); };
  const row = (label, k) => { const rr = h("div", {class:"hbr"}, h("span", {}, label));
    SWATCH.forEach(v => rr.append(h("button", {class:"sw" + (HB[k] === v ? " on" : ""), style:"background:" + v, "aria-label":v, onclick: () => { HB[k] = v; lsSet(k === "hairCol" ? "ov_hcol" : "ov_fcol", v); drawTpls(); }})));
    const pick = h("input", {type:"color", value:HB[k], "aria-label":"Custom colour", oninput: e => { HB[k] = e.target.value; lsSet(k === "hairCol" ? "ov_hcol" : "ov_fcol", e.target.value); THUMB.clear(); }, onchange: () => drawTpls()});
    rr.append(pick); return rr; };
  if(kind === "look") hbRow.append(row("💇 ဆံပင်အရောင်", "hairCol"), row("🧔 မွှေးအရောင်", "faceCol"));
  else hbRow.append(row(isHair ? "💇 ဆံပင်အရောင်" : "🧔 မွှေးအရောင်", key));
}
drawTpls = function(){
  const kinds = ["look", "hair", "stache", "beard"];
  if(!kinds.includes(cam.grp)){ _drawTpls0(); if(hbRow) hbRow.hidden = true; return; }
  const gt = $("#gtabs"); gt.replaceChildren();
  GROUPS.forEach(([id, label]) => gt.append(h("button", {class: id === cam.grp ? "on" : "", onclick: () => { cam.grp = id; drawTpls(); }}, label)));
  const box = $("#tpls"); box.replaceChildren();
  const k = cam.grp;
  const chip = (e, name, on, fn, img) => h("button", {class:"tp" + (on ? " on" : ""), onclick: fn}, h("i", {style: img ? `background:#f2f4f9 url(${img}) center/cover` : ""}, img ? "" : e), name);
  if(k === "look"){
    box.append(chip("✖", "မရှိ", !HB.hair && !HB.stache && !HB.beard, () => { HB.hair = HB.stache = HB.beard = null; drawTpls(); }));
    LOOKS.forEach(lk => box.append(chip("", lk.n, HB.hair === lk.hair && HB.stache === lk.stache && HB.beard === lk.beard && HB.hairCol === lk.hc && HB.faceCol === lk.fc,
      () => { HB.hair = lk.hair; HB.stache = lk.stache; HB.beard = lk.beard; HB.hairCol = lk.hc; HB.faceCol = lk.fc; lsSet("ov_hcol", lk.hc); lsSet("ov_fcol", lk.fc); drawTpls(); }, thumbFor("look", lk.id))));
  } else {
    const D = k === "hair" ? HAIR : k === "stache" ? STACHE : BEARD;
    box.append(chip("✖", "မရှိ", !HB[k], () => { HB[k] = null; drawTpls(); }));
    Object.keys(D).forEach(id => box.append(chip("", D[id].n, HB[k] === id, () => { HB[k] = id; drawTpls(); }, thumbFor(k, id))));
  }
  hbColors(k);
};
drawTpls();
window.hbList = hbList; window.HB = HB; window.THUMBFOR = thumbFor; window.HAIR = HAIR; window.STACHE = STACHE; window.BEARD = BEARD; window.LOOKS = LOOKS;
})();
