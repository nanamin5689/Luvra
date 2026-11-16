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
/* ဖျော့မွေးအမျှင် အသားပေးသော ဖြည့်ခြင်း: path = c => {…subpaths…} */
function fur(c, path, col, R, o){
  const g = c.createLinearGradient(0, o.y0, 0, o.y1); g.addColorStop(0, sh(col, .18)); g.addColorStop(.45, col); g.addColorStop(1, sh(col, -.32));
  c.beginPath(); path(c); c.fillStyle = g; c.fill(o.rule || "nonzero");
  if(o.n === 0) return;
  c.save(); c.beginPath(); path(c); c.clip(o.rule || "nonzero");
  const r = rnd(o.seed || 7), w = o.x1 - o.x0, hh = o.y1 - o.y0, n = o.n || 150;
  c.lineCap = "round"; c.lineWidth = Math.max(1, R * (o.lw || .013));
  const A = new Path2D(), B = new Path2D();
  for(let i = 0; i < n; i++){
    const x = o.x0 + r() * w, y = o.y0 + r() * hh, d = o.flow(x, y), ln = o.len * (.6 + r() * .9), sw = (r() - .5) * ln * .35;
    (i & 1 ? A : B).moveTo(x, y); (i & 1 ? A : B).quadraticCurveTo(x + d.x * ln * .5 - d.y * sw, y + d.y * ln * .5 + d.x * sw, x + d.x * ln, y + d.y * ln);
  }
  c.globalAlpha = .38; c.strokeStyle = sh(col, .45); c.stroke(A);
  c.globalAlpha = .42; c.strokeStyle = sh(col, -.5); c.stroke(B);
  if(o.sheen){ c.globalAlpha = .22; const sg = c.createLinearGradient(o.x0, 0, o.x1, 0); sg.addColorStop(0, "rgba(255,255,255,0)"); sg.addColorStop(.35, "rgba(255,255,255,.9)"); sg.addColorStop(.5, "rgba(255,255,255,0)"); sg.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = sg; c.fillRect(o.x0, o.y0, w, hh); }
  c.restore(); c.globalAlpha = 1;
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
  crop:   {n:"ဆံတို",         vol:1,    lift:.14, pk:1,   side:.04},
  sweep:  {n:"ဘေးခွဲ",       vol:1,    lift:.22, pk:1.2, side:.1, fringe:"side"},
  quiff:  {n:"ထိပ်မြင့်",     vol:1.05, lift:.66, pk:1.7, side:0},
  bangs:  {n:"ဘန်း",         vol:1.04, lift:.18, pk:1,   side:.55, fringe:"straight"},
  long:   {n:"ရှည်ဖြောင့်",   vol:1.04, lift:.18, pk:1,   side:.1, long:1.2, fringe:"center"},
  wavy:   {n:"ရှည်လိမ်",     vol:1.08, lift:.24, pk:1,   side:.1, long:1.15, wave:1, fringe:"side"},
  braids: {n:"ကျစ်ဆံမြီး",    vol:1,    lift:.16, pk:1,   side:.05, braids:1.35, fringe:"center"},
  bun:    {n:"ဆံထုံး",       vol:1,    lift:.14, pk:1,   side:.04, bun:1},
  pony:   {n:"မြင်းမြီး",     vol:1,    lift:.2,  pk:1,   side:.05, pony:1, fringe:"side"},
  pig:    {n:"နှစ်ပင်ကျစ်",   vol:1,    lift:.14, pk:1,   side:.05, pig:1, fringe:"straight"},
  mohawk: {n:"မိုဟော့",       none:1,   mohawk:1},
  spiky:  {n:"ထောင်ဆံ",      vol:1,    lift:.1,  pk:1,   side:.03, spiky:1},
  curly:  {n:"ကောက်ဆံ",      vol:1.26, lift:.26, pk:1,   side:.16, curly:1},
  afro:   {n:"အာဖရို",       vol:1.7,  lift:.46, pk:1,   side:.34, curly:1}
};
function drawHair(c, L, R, F, st, col){
  const g = geo(L, R), arc = L.arc, n = arc.length;
  if(!arc || n < 5) return;
  const cy0 = g.eyeY + R * .1;
  const crownY = g.topY - R * .5;
  const flow = (x, y) => { const d = nrm(x * .9, y - crownY + R * .35); return {x: d.x, y: Math.max(.25, d.y)}; };
  const lengthFlow = s => (x, y) => nrm(s * .14 + (x - s * R) * .0, 1);
  const out = arc.map((p, i) => { const u = i / (n - 1), up = Math.pow(Math.sin(Math.PI * u), st.pk || 1), d = nrm(p.x, p.y - cy0), k = R * (.1 + ((st.vol || 1) - 1) * .55) + (st.lift || 0) * R * up;
    return {x: p.x + d.x * k, y: p.y + d.y * k}; });
  const apex = out.reduce((a, p) => p.y < a.y ? p : a, out[0]);

  /* --- ရှည်သော ဘေးဆံပင် (မျက်နှာအပြင်ဘက်သာ) --- */
  if(st.long){
    [-1, 1].forEach(s => {
      const e = s < 0 ? out[0] : out[n - 1], a = s < 0 ? arc[0] : arc[n - 1], yb = g.chinY + st.long * R, wv = st.wave ? R * .07 : 0, wl = R * .55;
      const xi = a.x, xo = e.x + s * R * .14;
      const pts = [{x: xi, y: a.y}, {x: e.x, y: e.y}];
      for(let k = 1; k <= 5; k++){ const t = k / 5, yy = lerp(e.y, yb, t), ph = Math.sin(t * Math.PI * 3) * wv; pts.push({x: lerp(e.x, xo, Math.min(1, t * 1.4)) + s * ph, y: yy}); }
      pts.push({x: xo - s * R * .12, y: yb + R * .12});
      for(let k = 5; k >= 1; k--){ const t = k / 5, yy = lerp(a.y, yb, t), ph = Math.sin(t * Math.PI * 3 + .5) * wv; pts.push({x: xi + s * R * (.02 + .1 * t) + s * ph * .6, y: yy}); }
      const b = bbox(pts);
      fur(c, cc => sp(cc, pts), col, R, {x0: b.x0, x1: b.x1, y0: b.y0, y1: b.y1, flow: lengthFlow(s), n: 70, len: R * .55, seed: 11 + (s > 0 ? 3 : 0), sheen: 1});
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
      fur(c, cc => sp(cc, pts), col, R, {x0: b.x0, x1: b.x1, y0: b.y0, y1: b.y1, flow: () => nrm(s * .15, 1), n: 40, len: R * .4, seed: 31, sheen: 1});
      c.fillStyle = st.pig ? "#ff4f93" : sh(col, .35); c.beginPath(); c.arc(e.x + s * R * .02, e.y + R * .05, R * (st.pig ? .12 : .08), 0, 7); c.fill();
    });
  }
  /* --- ထိပ်ပိုင်း (ring) --- */
  if(!st.none){
    const sd = (st.side || 0) * R, pts = [{x: out[0].x, y: out[0].y + sd}, ...out, {x: out[n - 1].x, y: out[n - 1].y + sd}, {x: arc[n - 1].x, y: arc[n - 1].y + sd}, ...arc.slice().reverse(), {x: arc[0].x, y: arc[0].y + sd}];
    const b = bbox(pts);
    fur(c, cc => sp(cc, pts), col, R, {x0: b.x0, x1: b.x1, y0: b.y0, y1: b.y1, flow, n: st.curly ? 30 : 170, len: R * .5, seed: 5, sheen: 1});
    if(st.curly){
      const r = rnd(3); c.fillStyle = col;
      for(let i = 1; i < n - 1; i++){ const p = out[i], rr = R * (.16 + r() * .08), cg = c.createRadialGradient(p.x - rr * .3, p.y - rr * .3, rr * .1, p.x, p.y, rr);
        cg.addColorStop(0, sh(col, .25)); cg.addColorStop(1, sh(col, -.3)); c.fillStyle = cg; c.beginPath(); c.arc(p.x, p.y, rr, 0, 7); c.fill(); }
    }
    if(st.spiky){
      for(let i = 2; i < n - 2; i += 2){ const p = out[i], q = out[Math.min(n - 1, i + 1)], d = nrm(p.x, p.y - cy0), tg = nrm(q.x - p.x, q.y - p.y), hgt = R * (.34 + (i % 4) * .05);
        const pp = [{x: p.x - tg.x * R * .09, y: p.y - tg.y * R * .09}, {x: p.x + d.x * hgt + tg.x * R * .05, y: p.y + d.y * hgt}, {x: p.x + tg.x * R * .13, y: p.y + tg.y * R * .13}];
        c.fillStyle = sh(col, i % 4 ? 0 : .12); c.beginPath(); c.moveTo(pp[0].x, pp[0].y); c.lineTo(pp[1].x, pp[1].y); c.lineTo(pp[2].x, pp[2].y); c.closePath(); c.fill(); }
    }
  }
  if(st.mohawk){
    const base = g.topY + R * .06, pts = [{x: -R * .3, y: base}];
    for(let k = 0; k <= 6; k++){ const t = k / 6; pts.push({x: lerp(-.26, .26, t) * R, y: base - R * (.6 + .22 * Math.sin(t * 9) + (.3 * (1 - Math.abs(t * 2 - 1))))}); if(k < 6) pts.push({x: lerp(-.26, .26, (k + .5) / 6) * R, y: base - R * .35}); }
    pts.push({x: R * .3, y: base});
    c.save(); const b = bbox(pts);
    fur(c, cc => { cc.moveTo(pts[0].x, pts[0].y); pts.forEach(p => cc.lineTo(p.x, p.y)); cc.closePath(); }, col, R, {x0: b.x0, x1: b.x1, y0: b.y0, y1: b.y1, flow: () => ({x: 0, y: -1}), n: 90, len: R * .35, seed: 9, sheen: 1}); c.restore();
  }
  if(st.bun){
    const rr = R * .3, cx = 0, cyb = apex.y - rr * .55, rg = c.createRadialGradient(cx - rr * .3, cyb - rr * .3, rr * .1, cx, cyb, rr);
    rg.addColorStop(0, sh(col, .25)); rg.addColorStop(1, sh(col, -.3)); c.fillStyle = rg; c.beginPath(); c.arc(cx, cyb, rr, 0, 7); c.fill();
    c.strokeStyle = sh(col, .4); c.globalAlpha = .4; c.lineWidth = R * .012; for(let k = 0; k < 6; k++){ c.beginPath(); c.arc(cx, cyb, rr * (.3 + k * .11), k, k + 2); c.stroke(); } c.globalAlpha = 1;
  }
  /* --- နဖူးပေါ်က ဆံစ (fringe) --- */
  if(st.fringe){
    const sub = arc.filter(p => Math.abs(p.x) <= R * .94), brow = g.eyeY - R * .3, ty = g.topY;
    let pts;
    if(st.fringe === "straight"){ pts = [...sub]; const m = 9; for(let k = 0; k <= m; k++){ const t = 1 - k / m; pts.push({x: lerp(-.94, .94, t) * R, y: brow + (k % 2 ? R * .07 : -R * .02)}); } }
    else if(st.fringe === "center"){ pts = null; }
    else pts = [...sub, {x: R * .9, y: g.eyeY - R * .45}, {x: R * .45, y: ty + R * .33}, {x: 0, y: ty + R * .27}, {x: -R * .5, y: g.eyeY - R * .3}, {x: -R * .94, y: g.eyeY + R * .04}];
    if(pts){ const b = bbox(pts); fur(c, cc => sp(cc, pts), col, R, {x0: b.x0, x1: b.x1, y0: b.y0, y1: b.y1, flow: (x, y) => nrm(x < 0 ? -.35 : .15, 1), n: 60, len: R * .4, seed: 21, sheen: 1}); }
    else [-1, 1].forEach(s => {
      const half = sub.filter(p => s * p.x >= -R * .02), pp = [{x: 0, y: ty + R * .14}, ...half.sort((a, b) => s * (a.x - b.x)), {x: s * R * .95, y: g.eyeY - R * .02}, {x: s * R * .72, y: g.eyeY - R * .3}, {x: s * R * .3, y: ty + R * .38}];
      const b = bbox(pp); fur(c, cc => sp(cc, pp), col, R, {x0: b.x0, x1: b.x1, y0: b.y0, y1: b.y1, flow: () => nrm(s * .45, 1), n: 45, len: R * .4, seed: 23 + s, sheen: 1});
    });
  }
}

/* ================= နှုတ်ခမ်းမွှေး ================= */
/* ညာဘက်ခြမ်း၏ bezier (x = hw အလိုက်၊ y = th အလိုက်); ဘယ်ဘက်ကို mirror လုပ် */
const STACHE = {
  pencil:   {n:"ပါးလွှာ",    p:"M0,-.3 C.4,-.5 .8,-.4 1.05,-.05 L1.05,.12 C.8,0 .4,.05 0,.1 Z"},
  chevron:  {n:"ထူထူ",      p:"M0,-.6 C.4,-.75 .9,-.7 1.15,-.35 C1.2,.1 1.1,.55 .9,.75 C.6,.45 .3,.4 0,.45 Z"},
  walrus:   {n:"ဝက်ဝံမွေး",   p:"M0,-.7 C.4,-.85 1,-.8 1.25,-.3 C1.4,.3 1.35,.9 1.1,1.25 C.9,.8 .5,.6 0,.55 Z"},
  handle:   {n:"ကွေးထောင်",   p:"M0,-.5 C.4,-.7 .85,-.5 1.1,-.1 C1.3,.2 1.55,.05 1.62,-.65 C1.52,-.15 1.4,.5 1.05,.52 C.7,.62 .35,.35 0,.4 Z"},
  waxed:    {n:"ချွန်",       p:"M0,-.45 C.4,-.6 .9,-.45 1.2,-.1 C1.45,.1 1.7,-.1 1.9,-.45 C1.65,.3 1.3,.5 .95,.5 C.6,.55 .3,.35 0,.35 Z"},
  fumanchu: {n:"ဖူးမန်ချူး",   p:"M0,-.5 C.4,-.7 .9,-.5 1.1,-.1 C1.25,.6 1.2,1.8 1.12,3 C1,2 .85,.9 .6,.5 C.35,.4 .15,.35 0,.35 Z"},
  shoe:     {n:"မြင်းခွာ",     p:"M0,-.5 C.4,-.65 .9,-.6 1.05,-.2 C1.15,1 1.15,1.6 1.1,2.3 L.8,2.3 C.82,1.2 .8,.5 .5,.35 C.3,.3 .15,.3 0,.3 Z"}
};
function drawStache(c, L, R, F, st, col){
  const g = geo(L, R), hw = g.mw * 1.4, th = Math.max(R * .2, (g.ulY - g.nbY) * 1.15), yc = g.nbY + (g.ulY - g.nbY) * .42;
  const tok = st.p.split(/[\s,]+/).filter(Boolean);
  const path = cc => { [-1, 1].forEach(s => {
    const X = v => s * (+v) * hw, Y = v => yc + (+v) * th; let i = 0;
    while(i < tok.length){ const t = tok[i++], first = t[0], rest = t.slice(1);
      if(first === "M") cc.moveTo(X(rest), Y(tok[i++]));
      else if(first === "L") cc.lineTo(X(rest), Y(tok[i++]));
      else if(first === "C"){ const a = [X(rest), Y(tok[i]), X(tok[i + 1]), Y(tok[i + 2]), X(tok[i + 3]), Y(tok[i + 4])]; i += 5; cc.bezierCurveTo(...a); }
      else if(first === "Z") cc.closePath(); }
  }); };
  fur(c, path, col, R, {x0: -hw * 2, x1: hw * 2, y0: yc - th, y1: yc + th * 1.6, flow: (x, y) => nrm(x / hw * .7, .5), n: 70, len: R * .28, seed: 41, lw: .011});
}

/* ================= မုတ်ဆိတ် ================= */
const BEARD = {
  full:    {n:"အပြည့်",       k:"full",  len:.12, p:.6,  th:.05},
  long:    {n:"ရှည်",        k:"full",  len:1.0,  p:1.2, th:.06},
  forked:  {n:"နှစ်ခွ",        k:"full",  len:.95,  fork:1, th:.06},
  braided: {n:"ကျစ်မုတ်ဆိတ်",  k:"full",  len:.15, p:.6, th:.05, braids:1},
  goatee:  {n:"ဆိတ်မွေး",     k:"goat",  len:.2},
  point:   {n:"ချွန်ဆိတ်မွေး",  k:"goat",  len:.55, point:1},
  strap:   {n:"မေးကြိုး",      k:"band",  band:.13, len:.04},
  chops:   {n:"ပါးသိုင်း",     k:"chops"},
  circle:  {n:"ဝိုင်းမွေး",     k:"circle", len:.15},
  stubble: {n:"ဖွာမွေး",      k:"full",  len:.04, p:.6, th:.03, dots:1}
};
function jawOuter(L, R, o){
  const j = L.jaw, m = j.length, C = {x: 0, y: L.nose.y};
  return j.map((p, i) => { const u = i / (m - 1), d = nrm(p.x - C.x, p.y - C.y), ext = (o.len || 0) * R * (o.fork ? (Math.exp(-Math.pow((u - .36) / .09, 2)) + Math.exp(-Math.pow((u - .64) / .09, 2))) : Math.pow(Math.max(0, 1 - Math.abs(2 * u - 1)), o.p || .6));
    return {x: p.x + d.x * (o.th || 0) * R, y: p.y + d.y * (o.th || 0) * R + ext}; });
}
function drawBeard(c, L, R, F, st, col){
  const g = geo(L, R), j = L.jaw, m = j.length, open = Math.min(.5, F.open || 0);
  const flow = (x, y) => nrm(-x / R * .35, 1);
  const mouthHole = cc => { cc.moveTo(g.mw * 1.1, g.mY); cc.ellipse(0, g.mY + open * R * .5, g.mw * 1.1, R * .055 + open * R * 1.05, 0, 0, Math.PI * 2); };
  let pts, hole = true, extra = null;
  if(st.k === "full"){
    const o = jawOuter(L, R, st), s0 = j[0], s1 = j[m - 1];
    const top = [{x: s1.x * .97, y: s1.y - R * .06}, {x: R * .8, y: g.ulY - R * .28}, {x: R * .5, y: g.ulY - R * .18}, {x: R * .22, y: g.nbY + R * .05}, {x: 0, y: g.nbY + R * .08}, {x: -R * .22, y: g.nbY + R * .05}, {x: -R * .5, y: g.ulY - R * .18}, {x: -R * .8, y: g.ulY - R * .28}, {x: s0.x * .97, y: s0.y - R * .06}];
    pts = [...o, ...top];
  } else if(st.k === "band"){
    const o = jawOuter(L, R, {len: st.len, p: .6, th: .03}), C = {x: 0, y: L.nose.y}, inn = j.map(p => { const d = nrm(p.x - C.x, p.y - C.y); return {x: p.x - d.x * st.band * R, y: p.y - d.y * st.band * R}; });
    pts = [...o, ...inn.reverse()]; hole = false;
  } else if(st.k === "chops"){
    const C = {x: 0, y: L.nose.y}; pts = null; extra = [];
    [[0, 6], [m - 7, m - 1]].forEach(([a, b]) => { const seg = j.slice(a, b + 1), o = seg.map(p => { const d = nrm(p.x - C.x, p.y - C.y); return {x: p.x + d.x * R * .05, y: p.y + d.y * R * .05}; }), inn = seg.map(p => { const d = nrm(p.x - C.x, p.y - C.y); return {x: p.x - d.x * R * .32, y: p.y - d.y * R * .3}; });
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
  const o = {x0: b.x0, x1: b.x1, y0: b.y0, y1: b.y1, flow, n: st.dots ? 0 : 190, len: R * .5, seed: 13, lw: .013};
  const rings = pts ? [pts] : [];
  (extra || []).forEach(e => rings.push(e));
  const path = cc => { rings.forEach(r => sp(cc, r)); if(hole && !st.dots) mouthHole(cc); };
  if(st.dots){
    c.save(); c.beginPath(); rings.forEach(r => sp(c, r)); mouthHole(c); c.clip("evenodd"); const r = rnd(17); c.fillStyle = col; c.globalAlpha = .5;
    for(let i = 0; i < 420; i++){ const x = b.x0 + r() * (b.x1 - b.x0), y = b.y0 + r() * (b.y1 - b.y0); c.fillRect(x, y, R * .014, R * .014); }
    c.globalAlpha = .12; c.fillRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0); c.restore(); c.globalAlpha = 1;
  } else fur(c, path, col, R, Object.assign(o, {rule: hole ? "evenodd" : "nonzero"}));
  if(st.braids){
    [[-.32, 0], [.32, 0]].forEach(([x]) => braid(c, x * R, g.chinY - R * .05, x * R * 1.1, g.chinY + R * 1.0, R * .22, col, R, 1));
    braid(c, 0, g.chinY, 0, g.chinY + R * .75, R * .2, col, R, 1);
  }
}

/* ================= DRAW hooks + Looks ================= */
DRAW.hb_hair = (c, L, R, F) => { if(HB.hair && HAIR[HB.hair]) drawHair(c, L, R, F, HAIR[HB.hair], HB.hairCol); };
DRAW.hb_beard = (c, L, R, F) => { if(HB.beard && BEARD[HB.beard]) drawBeard(c, L, R, F, BEARD[HB.beard], HB.faceCol); };
DRAW.hb_stache = (c, L, R, F) => { if(HB.stache && STACHE[HB.stache]) drawStache(c, L, R, F, STACHE[HB.stache], HB.faceCol); };
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
