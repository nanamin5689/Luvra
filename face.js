"use strict";
/* ============ Luvra v5 – CAMERA: face tracking, Beauty, AR effects ============ */
const NONE = {id:"none", n:"Normal", e:"✨"};
const TPL = [
  // --- AR (မျက်နှာအလိုက် အလိုအလျောက်) ---
  {g:"ar", id:"funny", n:"ရယ်စရာ", e:"🤪", d:["nose","glasses"], w:[{at:"face", m:1, r:.9, s:.8}]},
  {g:"ar", id:"crown", n:"သရဖူ", e:"👑", d:["crown"]},
  {g:"ar", id:"cool", n:"မျက်မှန်", e:"😎", d:["glasses"]},
  {g:"ar", id:"stache", n:"နှုတ်ခမ်းမွေး", e:"🥸", d:["stache"]},
  {g:"ar", id:"clown", n:"ပြက်လုံး", e:"🤡", d:["nose"], w:[{at:"nose", m:1, r:.3, s:.6}]},
  {g:"ar", id:"love", n:"ချစ်မျက်လုံး", e:"😍", d:["loveEyes"]},
  {g:"ar", id:"star", n:"ကြယ်မျက်လုံး", e:"🤩", d:["starEyes"]},
  {g:"ar", id:"cat", n:"ကြောင်", e:"🐱", d:["catEars","catNose","whisk"]},
  {g:"ar", id:"bunny", n:"ယုန်", e:"🐰", d:["bunnyEars","pinkNose"]},
  {g:"ar", id:"dog", n:"ခွေး", e:"🐶", d:["dog"]},
  {g:"ar", id:"panda", n:"ပန်ဒါ", e:"🐼", d:["panda"]},
  {g:"ar", id:"angel", n:"ကောင်းကင်ဘုံ", e:"😇", d:["halo"]},
  {g:"ar", id:"devil", n:"မာရ်နတ်", e:"😈", d:["horns"]},
  {g:"ar", id:"fire", n:"မီး", e:"🔥", d:["fire"]},
  {g:"ar", id:"freck", n:"ပါးကွက်", e:"🌟", d:["freckles"]},
  {g:"ar", id:"cute", n:"ချစ်စရာ", e:"🥰", d:["cute"]},
  {g:"ar", id:"mask", n:"မျက်နှာဖုံး", e:"🦸", d:["mask"]},
  {g:"ar", id:"spark", n:"လက်ခနဲ", e:"✨", d:["sparkle"]},
  {g:"ar", id:"flower", n:"ပန်းသရဖူ", e:"🌸", d:["flowers"]},
  {g:"ar", id:"hearts", n:"နှလုံးပျံ", e:"💕", d:["hearts"]},
  // --- Warp (ပုံပျက်) ---
  {g:"warp", id:"bulge", n:"မျက်နှာဖောင်း", e:"🎈", w:[{at:"face", m:1, r:.85, s:.9}]},
  {g:"warp", id:"pinch", n:"မျက်နှာပိန်", e:"🍋", w:[{at:"face", m:2, r:.85, s:.9}]},
  {g:"warp", id:"bigeyes", n:"မျက်လုံးကြီး", e:"👀", w:[{at:"eyes", m:1, r:.24, s:.9}]},
  {g:"warp", id:"bignose", n:"နှာခေါင်းကြီး", e:"👃", w:[{at:"nose", m:1, r:.28, s:1}]},
  {g:"warp", id:"bigmouth", n:"ပါးစပ်ကြီး", e:"👄", w:[{at:"mouth", m:1, r:.34, s:1}]},
  {g:"warp", id:"chip", n:"ပါးဖောင်း", e:"🐹", w:[{at:"cheeks", m:1, r:.3, s:.9}]},
  {g:"warp", id:"alien", n:"ဂြိုဟ်သား", e:"👽", w:[{at:"eyes", m:1, r:.26, s:1.2}, {at:"chin", m:2, r:.4, s:1}]},
  {g:"warp", id:"swirl", n:"လှည့်", e:"🌀", w:[{at:"face", m:3, r:.9, s:.8}]},
  {g:"warp", id:"wave", n:"လှိုင်း", e:"🌊", gfx:5},
  {g:"warp", id:"mirror", n:"မှန်", e:"🪞", gfx:4},
  // --- Filter ---
  {g:"flt", id:"bw", n:"အဖြူအမည်း", e:"⚫", flt:1},
  {g:"flt", id:"sepia", n:"ရှေးဟောင်း", e:"🟤", flt:2},
  {g:"flt", id:"neon", n:"Neon", e:"💜", flt:3},
  {g:"flt", id:"poster", n:"ကာတွန်း", e:"🎨", flt:4},
  {g:"flt", id:"vintage", n:"Vintage", e:"📼", flt:5},
  {g:"flt", id:"cool", n:"အေး", e:"🧊", flt:6},
  {g:"flt", id:"warm", n:"နွေး", e:"🌅", flt:7},
  {g:"flt", id:"dream", n:"အိပ်မက်", e:"☁️", flt:8},
  {g:"flt", id:"noir", n:"Noir", e:"🎞️", flt:9},
  {g:"flt", id:"pastel", n:"Pastel", e:"🍬", flt:10}
];
const GROUPS = [["ar","🎭 AR Effect"], ["warp","🌀 ပုံပျက်"], ["flt","🎨 Filter"]];

/* ---------- 2D effect drawing (local face coordinates, rotated with the head) ---------- */
const emo = (c, ch, x, y, sz) => { c.font = `${sz}px "Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(ch, x, y); };
const ed2 = L => Math.hypot(L.eR.x - L.eL.x, L.eR.y - L.eL.y);
const DRAW = {
  crown(c, L, R){ emo(c, "👑", L.top.x, L.top.y - R * .28, R * 1.5); },
  glasses(c, L, R){
    const ed = ed2(L), rr = ed * .37, y = (L.eL.y + L.eR.y) / 2;
    c.lineWidth = R * .07; c.strokeStyle = "#111"; c.fillStyle = "rgba(15,15,25,.88)";
    [L.eL, L.eR].forEach(e => { c.beginPath(); c.arc(e.x, e.y, rr, 0, 7); c.fill(); c.stroke(); });
    c.beginPath(); c.moveTo(L.eL.x + rr, y); c.lineTo(L.eR.x - rr, y);
    c.moveTo(L.eL.x - rr, L.eL.y); c.lineTo(L.eL.x - rr - R * .3, L.eL.y - R * .04);
    c.moveTo(L.eR.x + rr, L.eR.y); c.lineTo(L.eR.x + rr + R * .3, L.eR.y - R * .04); c.stroke();
    c.fillStyle = "rgba(255,255,255,.25)";
    [L.eL, L.eR].forEach(e => { c.beginPath(); c.ellipse(e.x - rr * .3, e.y - rr * .35, rr * .3, rr * .14, -.5, 0, 7); c.fill(); });
  },
  stache(c, L, R){
    const hw = Math.hypot(L.mR.x - L.mL.x, L.mR.y - L.mL.y) / 2 * 1.3, u = hw / .78;
    const x = L.uLip.x, my = (L.noseB.y + L.uLip.y) / 2 + u * .06;
    c.fillStyle = "#2b1b12";
    [-1, 1].forEach(s => { c.beginPath(); c.moveTo(x, my); c.bezierCurveTo(x + s*u*.2, my - u*.22, x + s*u*.6, my - u*.18, x + s*u*.78, my + u*.14);
      c.bezierCurveTo(x + s*u*.5, my + u*.02, x + s*u*.25, my + u*.1, x, my + u*.1); c.closePath(); c.fill(); });
  },
  nose(c, L, R){
    const r = R * .17, g = c.createRadialGradient(L.nose.x - r*.3, L.nose.y - r*.3, r*.1, L.nose.x, L.nose.y, r);
    g.addColorStop(0, "#ff9a9a"); g.addColorStop(1, "#d10f0f");
    c.fillStyle = g; c.beginPath(); c.arc(L.nose.x, L.nose.y, r, 0, 7); c.fill();
  },
  loveEyes(c, L, R){ const s = ed2(L) * .62; emo(c, "❤️", L.eL.x, L.eL.y, s); emo(c, "❤️", L.eR.x, L.eR.y, s); },
  starEyes(c, L, R){ const s = ed2(L) * .6; emo(c, "⭐", L.eL.x, L.eL.y, s); emo(c, "⭐", L.eR.x, L.eR.y, s); },
  halo(c, L, R){
    c.strokeStyle = "#ffd84a"; c.beginPath(); c.ellipse(L.top.x, L.top.y - R * .3, R * .55, R * .15, 0, 0, 7);
    c.globalAlpha = .3; c.lineWidth = R * .2; c.stroke(); c.globalAlpha = 1; c.lineWidth = R * .09; c.stroke();
  },
  horns(c, L, R){
    const x = L.top.x, y = L.top.y + R * .9; c.fillStyle = "#c81d25";
    [-1, 1].forEach(s => { c.beginPath(); c.moveTo(x + s*R*.25, y - R*.9); c.quadraticCurveTo(x + s*R*.85, y - R*1.05, x + s*R*.62, y - R*1.7);
      c.quadraticCurveTo(x + s*R*.45, y - R*1.2, x + s*R*.1, y - R*1.0); c.closePath(); c.fill(); });
  },
  fire(c, L, R){ emo(c, "🔥", L.cL.x - R * .3, L.nose.y, R * .9); emo(c, "🔥", L.cR.x + R * .3, L.nose.y, R * .9); },
  catEars(c, L, R){
    [-1, 1].forEach(s => {
      const y = L.top.y;
      c.fillStyle = "#3a3a4a"; c.beginPath(); c.moveTo(s*R*.25, y + R*.2); c.lineTo(s*R*.85, y + R*.1); c.lineTo(s*R*.8, y - R*.65); c.closePath(); c.fill();
      c.fillStyle = "#ff9fb8"; c.beginPath(); c.moveTo(s*R*.38, y + R*.1); c.lineTo(s*R*.74, y + R*.05); c.lineTo(s*R*.72, y - R*.4); c.closePath(); c.fill();
    });
  },
  catNose(c, L, R){ c.fillStyle = "#ff7aa2"; const r = R * .07; c.beginPath(); c.moveTo(L.nose.x - r, L.nose.y - r*.6); c.lineTo(L.nose.x + r, L.nose.y - r*.6); c.lineTo(L.nose.x, L.nose.y + r*.7); c.closePath(); c.fill(); },
  pinkNose(c, L, R){ c.fillStyle = "#ff8fb1"; c.beginPath(); c.arc(L.nose.x, L.nose.y, R * .07, 0, 7); c.fill(); },
  whisk(c, L, R){
    c.strokeStyle = "rgba(255,255,255,.9)"; c.lineWidth = R * .02; c.lineCap = "round";
    [-1, 1].forEach(s => [-.07, 0, .07].forEach(dy => { c.beginPath(); c.moveTo(L.nose.x + s*R*.25, L.nose.y + R*.05); c.lineTo(L.nose.x + s*R*.85, L.nose.y + R*(.0 + dy*3)); c.stroke(); }));
  },
  bunnyEars(c, L, R){
    [-1, 1].forEach(s => {
      c.save(); c.translate(s*R*.38, L.top.y - R*.65); c.rotate(s*.12);
      c.fillStyle = "#fff"; c.beginPath(); c.ellipse(0, 0, R*.2, R*.65, 0, 0, 7); c.fill();
      c.fillStyle = "#ffb6c8"; c.beginPath(); c.ellipse(0, R*.05, R*.1, R*.5, 0, 0, 7); c.fill(); c.restore();
    });
  },
  dog(c, L, R, F){
    [-1, 1].forEach(s => { c.save(); c.translate(s*R*.98, L.top.y + R*.5); c.rotate(s*.3); c.fillStyle = "#8b5a2b"; c.beginPath(); c.ellipse(0, 0, R*.22, R*.5, 0, 0, 7); c.fill(); c.restore(); });
    c.fillStyle = "#222"; c.beginPath(); c.ellipse(L.nose.x, L.nose.y, R*.12, R*.09, 0, 0, 7); c.fill();
    if(F.open > .05){ c.fillStyle = "#ff6f91"; c.beginPath(); c.ellipse(L.mouth.x, L.mouth.y + R*.2, R*.12, R*.2, 0, 0, 7); c.fill(); }
  },
  panda(c, L, R){
    c.fillStyle = "#111";
    [-1, 1].forEach(s => { c.beginPath(); c.arc(s*R*.7, L.top.y + R*.1, R*.25, 0, 7); c.fill(); });
    c.globalAlpha = .85;
    [[L.eL, 1], [L.eR, -1]].forEach(([e, s]) => { c.save(); c.translate(e.x, e.y); c.rotate(s*.3); c.beginPath(); c.ellipse(0, 0, ed2(L)*.2, ed2(L)*.28, 0, 0, 7); c.fill(); c.restore(); });
    c.globalAlpha = 1; c.beginPath(); c.ellipse(L.nose.x, L.nose.y, R*.1, R*.07, 0, 0, 7); c.fill();
  },
  freckles(c, L, R){
    const P = [[-.55,-.1],[-.4,-.18],[-.3,-.05],[-.5,.05],[-.2,-.15],[-.6,.12],[-.35,.1],[.55,-.1],[.4,-.18],[.3,-.05],[.5,.05],[.2,-.15],[.6,.12],[.35,.1]];
    c.fillStyle = "rgba(150,80,50,.6)";
    P.forEach(([u, v]) => { c.beginPath(); c.arc(L.nose.x + u*R, L.nose.y + v*R - R*.02, R*.02, 0, 7); c.fill(); });
  },
  cute(c, L, R, F){
    c.fillStyle = "rgba(255,90,120,.45)";
    [-1, 1].forEach(s => { c.beginPath(); c.ellipse(s*R*.58, L.nose.y + R*.05, R*.2, R*.12, 0, 0, 7); c.fill(); });
    emo(c, "✨", L.eL.x - R*.25, L.eL.y - R*.3, R*.25); emo(c, "✨", L.eR.x + R*.25, L.eR.y - R*.3, R*.2);
  },
  mask(c, L, R){
    const ed = ed2(L), y = (L.eL.y + L.eR.y) / 2, x0 = L.eL.x - ed*.5, x1 = L.eR.x + ed*.5, hh = ed*.34;
    c.fillStyle = "rgba(15,15,25,.92)"; c.beginPath();
    c.moveTo(x0, y); c.quadraticCurveTo(x0, y - hh, L.eL.x, y - hh); c.quadraticCurveTo((L.eL.x + L.eR.x)/2, y - hh*.5, L.eR.x, y - hh); c.quadraticCurveTo(x1, y - hh, x1, y);
    c.quadraticCurveTo(x1, y + hh, L.eR.x, y + hh*.8); c.quadraticCurveTo((L.eL.x + L.eR.x)/2, y + hh*.1, L.eL.x, y + hh*.8); c.quadraticCurveTo(x0, y + hh, x0, y); c.closePath();
    [L.eL, L.eR].forEach(e => { c.moveTo(e.x + ed*.2, e.y); c.ellipse(e.x, e.y, ed*.2, ed*.13, 0, 0, Math.PI * 2); });
    c.fill("evenodd");
  },
  sparkle(c, L, R, F){
    for(let i = 0; i < 7; i++){ const a = F.t * 1.2 + i * Math.PI * 2 / 7, s = R * (.2 + .09 * Math.sin(F.t * 5 + i));
      emo(c, "✨", Math.cos(a) * R * 1.3, Math.sin(a) * R * 1.15, s * 2); }
  },
  flowers(c, L, R){
    for(let i = 0; i < 7; i++){ const a = Math.PI * (1.08 + i * .14); emo(c, i % 2 ? "🌼" : "🌸", Math.cos(a) * R * .98, L.top.y + R * .2 + Math.sin(a) * R * .3, R * .36); }
  },
  hearts(c, L, R, F){
    for(let i = 0; i < 5; i++){ const ph = (F.t * .5 + i / 5) % 1; c.globalAlpha = 1 - ph;
      emo(c, "❤️", (i - 2) * R * .3 + Math.sin(F.t * 3 + i) * R * .08, L.top.y - ph * R * 1.3, R * .3); }
    c.globalAlpha = 1;
  }
};

/* ---------- Beauty makeup overlay (lips + blush) ---------- */
const LIP_OUT = [61,146,91,181,84,17,314,405,321,375,291,409,270,269,267,0,37,39,40,185];
const LIP_IN = [78,95,88,178,87,14,317,402,318,324,308,415,310,311,312,13,82,81,80,191];
function beautyOverlay(c, F, bt, mp){
  if(!F.lm) return;
  const poly = idx => { idx.forEach((i, k) => { const p = mp(F.lm[i]); k ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y); }); c.closePath(); };
  c.save();
  const canF = "filter" in c; if(canF) c.filter = `blur(${Math.max(1, F.w * .006).toFixed(1)}px)`;
  c.fillStyle = `rgba(210,50,85,${(.34 * bt).toFixed(3)})`; c.beginPath(); poly(LIP_OUT); poly(LIP_IN); c.fill("evenodd");
  if(canF) c.filter = `blur(${Math.max(3, F.w * .03).toFixed(1)}px)`;
  [205, 425].forEach(i => { const p = mp(F.lm[i]); c.fillStyle = `rgba(255,105,130,${(.3 * bt).toFixed(3)})`; c.beginPath(); c.ellipse(p.x, p.y, F.w * .13, F.w * .09, F.rot, 0, 7); c.fill(); });
  c.restore();
}

/* ---------- shader (warp + beauty + filters) ---------- */
const VS = "attribute vec2 a;varying vec2 v;void main(){v=a*.5+.5;gl_Position=vec4(a,0.,1.);}";
const FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 v; uniform sampler2D tx;
uniform vec4 A[3]; uniform float M[3];
uniform float asp,t,mir,bt,hasf; uniform vec4 crop,fc; uniform vec2 px; uniform int gfx,flt;
vec2 T(vec2 q){ q.x=mix(q.x,1.-q.x,mir); return vec2(q.x*crop.x+crop.z,q.y*crop.y+crop.w); }
vec3 S(vec2 q){ return texture2D(tx,T(q)).rgb; }
float skin(vec3 c){
  float cb=-.169*c.r-.331*c.g+.5*c.b+.5; float cr=.5*c.r-.419*c.g-.081*c.b+.5;
  return smoothstep(.27,.31,cb)*(1.-smoothstep(.49,.53,cb))*smoothstep(.49,.53,cr)*(1.-smoothstep(.67,.71,cr));
}
void main(){
  vec2 p=v;
  if(gfx==4){ if(p.x>.5) p.x=1.-p.x; }
  if(gfx==5){ p.x+=sin(p.y*18.+t*4.)*.012; p.y+=cos(p.x*14.+t*3.)*.008; }
  for(int i=0;i<3;i++){
    float m=M[i]; if(m<.5) continue;
    vec4 a=A[i]; vec2 d=p-a.xy; d.x*=asp; float dist=length(d); float r=a.z; float s=a.w;
    if(dist<r&&dist>.0001){
      float k=dist/r;
      if(m<1.5){ k=pow(k,1.+s*1.2); d=normalize(d)*k*r; }
      else if(m<2.5){ k=pow(k,1./(1.+s*1.2)); d=normalize(d)*k*r; }
      else { float an=s*3.*(1.-k)*(1.-k); float cs=cos(an),sn=sin(an); d=mat2(cs,-sn,sn,cs)*d; }
      d.x/=asp; p=a.xy+d;
    }
  }
  vec3 col=S(p); vec3 c0=col; vec3 bl=col;
  if(bt>.001||flt==8){
    vec2 r=px*3.2; vec3 sum=col; float ws=1.;
    for(int i=0;i<8;i++){
      float an=float(i)*.7854; vec3 s=S(p+vec2(cos(an),sin(an))*r); vec3 d=s-col; float w=exp(-dot(d,d)*30.);
      sum+=s*w; ws+=w;
    }
    bl=sum/ws;
  }
  if(bt>.001){
    float sk=skin(c0);
    vec2 q=(v-fc.xy)/fc.zw; float fm=1.-smoothstep(.75,1.1,length(q));
    float m=hasf>.5 ? fm*max(sk,.45) : sk*.55;
    col=mix(col,bl,clamp(m*bt*1.05,0.,1.));
    col+=(c0-bl)*.55*bt*(1.-m);
    col=mix(col,pow(max(col,vec3(0.)),vec3(.88)),.7*bt*m);
    col+=vec3(.03,.012,.018)*bt*m;
    float gg=dot(col,vec3(.299,.587,.114)); col=mix(vec3(gg),col,1.+.08*bt);
    col=(col-.5)*(1.+.05*bt)+.5+.015*bt;
  }
  float g=dot(col,vec3(.299,.587,.114));
  if(flt==1) col=vec3(g);
  else if(flt==2) col=vec3(g*1.2,g,g*.8);
  else if(flt==3) col=vec3(col.b,col.r,col.g)*1.3;
  else if(flt==4) col=floor(col*4.)/3.;
  else if(flt==5) col=mix(col,vec3(g),.4)*vec3(1.1,1.,.85)+.05;
  else if(flt==6) col=col*vec3(.9,1.,1.15)+vec3(0.,.01,.04);
  else if(flt==7) col=col*vec3(1.15,1.,.85)+.03;
  else if(flt==8) col=mix(col,bl,.6)*1.06+.06;
  else if(flt==9) col=vec3(clamp((g-.5)*1.5+.5,0.,1.));
  else if(flt==10) col=mix(col,vec3(g),.2)*.88+.13;
  gl_FragColor=vec4(clamp(col,0.,1.),1.);
}`;
const cv = $("#cv"), cx = cv.getContext("2d");
const cam = {stream:null, video:null, facing:"user", raf:0, tpl:NONE, grp:"ar", ax:.5, ay:.42, gl:null, mode:"photo", rec:null, chunks:[], t0:0, tick:0, credit:null,
  auto: lsGet("ov_auto") !== "0"};
function glInit(){
  const c = document.createElement("canvas"); c.width = cv.width; c.height = cv.height;
  const gl = c.getContext("webgl", {preserveDrawingBuffer:true}) || c.getContext("experimental-webgl", {preserveDrawingBuffer:true});
  if(!gl) return null;
  const mk = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  try{
    const pr = gl.createProgram(); gl.attachShader(pr, mk(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, mk(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(pr); if(!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
    gl.useProgram(pr);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, "a"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.LINEAR));
    [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
    const U = {}; ["A[0]","M[0]","asp","t","mir","bt","hasf","crop","fc","px","gfx","flt"].forEach(n => U[n] = gl.getUniformLocation(pr, n));
    return {c, gl, U};
  }catch(e){ console.warn("WebGL shader မအောင်မြင်ပါ", e); return null; }
}

/* ---------- face tracking (MediaPipe FaceLandmarker) ---------- */
const FT = {lm:null, state:"idle", L:null, miss:99, last:0, ts:0};
const MP_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
async function ftLoad(){
  if(FT.state !== "idle") return;
  FT.state = "loading";
  try{
    const mod = await import(MP_BASE + "/vision_bundle.mjs");
    const fs = await mod.FilesetResolver.forVisionTasks(MP_BASE + "/wasm");
    const opts = d => ({baseOptions:{modelAssetPath:"https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task", delegate:d},
      runningMode:"VIDEO", numFaces:1, minFaceDetectionConfidence:.5, minFacePresenceConfidence:.5, minTrackingConfidence:.5});
    try{ FT.lm = await mod.FaceLandmarker.createFromOptions(fs, opts("GPU")); }
    catch(e){ FT.lm = await mod.FaceLandmarker.createFromOptions(fs, opts("CPU")); }
    FT.state = "ready";
  }catch(e){ FT.state = "failed"; console.warn("face tracker", e); toast("မျက်နှာ auto ရှာစနစ် မရပါ၊ လက်ဖြင့် ထိ/ဆွဲ၍ ချိန်ညှိပါ"); }
}
function ftStep(v, ts){
  if(!cam.auto || !(FT.lm || window.__fakeLM)) return;
  if(ts - FT.last < 55) return; FT.last = ts;
  let L = null;
  try{
    if(window.__fakeLM) L = window.__fakeLM(ts);
    else { FT.ts = Math.max(ts, FT.ts + 1); const r = FT.lm.detectForVideo(v, FT.ts); L = r && r.faceLandmarks && r.faceLandmarks[0]; }
  }catch(e){ L = null; }
  if(L){
    FT.miss = 0;
    if(!FT.L || FT.L.length !== L.length) FT.L = L.map(p => ({x:p.x, y:p.y}));
    else for(let i = 0; i < L.length; i++){ FT.L[i].x += (L[i].x - FT.L[i].x) * .65; FT.L[i].y += (L[i].y - FT.L[i].y) * .65; }
  } else FT.miss++;
}
const dist2 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const mid2 = (a, b) => ({x:(a.x + b.x) / 2, y:(a.y + b.y) / 2});
function buildFace(lm, mp){
  const P = i => mp(lm[i]);
  let e1 = mid2(P(33), P(133)), e2 = mid2(P(362), P(263));
  const eL = e1.x < e2.x ? e1 : e2, eR = e1.x < e2.x ? e2 : e1;
  let cL = P(234), cR = P(454); if(cL.x > cR.x) [cL, cR] = [cR, cL];
  const w = dist2(cL, cR), rot = Math.atan2(eR.y - eL.y, eR.x - eL.x);
  const nose = P(1), mouth = mid2(P(13), P(14));
  const W = {eL, eR, nose, noseB:P(2), uLip:P(0), mouth, mL:P(61), mR:P(291), top:P(10), chin:P(152), cL, cR};
  return fin({lm, c:nose, w, rot, W, open: dist2(P(13), P(14)) / w, tracked:true});
}
function manualFace(ax, ay, R){
  const W = {eL:{x:ax - .36*R, y:ay - .15*R}, eR:{x:ax + .36*R, y:ay - .15*R}, nose:{x:ax, y:ay + .15*R}, noseB:{x:ax, y:ay + .3*R}, uLip:{x:ax, y:ay + .42*R},
    mouth:{x:ax, y:ay + .55*R}, mL:{x:ax - .3*R, y:ay + .55*R}, mR:{x:ax + .3*R, y:ay + .55*R}, top:{x:ax, y:ay - .85*R}, chin:{x:ax, y:ay + 1.05*R}, cL:{x:ax - R, y:ay + .1*R}, cR:{x:ax + R, y:ay + .1*R}};
  return fin({lm:null, c:W.nose, w:2*R, rot:0, W, open:0, tracked:false});
}
function fin(F){
  const {c, rot, W} = F, cs = Math.cos(-rot), sn = Math.sin(-rot);
  const lo = p => ({x:(p.x - c.x) * cs - (p.y - c.y) * sn, y:(p.x - c.x) * sn + (p.y - c.y) * cs});
  F.L = {}; for(const k in W) F.L[k] = lo(W[k]);
  F.R = F.w / 2; return F;
}

/* ---------- main render loop ---------- */
function warpSetup(tp, F, W, H, sz, st){
  const A = new Float32Array(12), M = new Float32Array(3); let n = 0;
  const push = (pt, m, r, s) => { if(n < 3){ A.set([pt.x / W, 1 - pt.y / H, r, s], n * 4); M[n++] = m; } };
  const spec = tp.w || []; if(!spec.length) return {A, M};
  if(!F.tracked){ const s0 = spec[0]; push({x:cam.ax * W, y:cam.ay * H}, s0.m, sz, st * (s0.s || 1)); return {A, M}; }
  const kR = sz / .2, kS = st / .8, w = F.W;
  const mc = mid2(mid2(w.eL, w.eR), w.mouth);
  spec.forEach(s => {
    const r = s.r * F.w * kR / H, str = (s.s || 1) * kS;
    if(s.at === "eyes"){ push(w.eL, s.m, r, str); push(w.eR, s.m, r, str); }
    else if(s.at === "cheeks"){ push(mid2(w.cL, w.nose), s.m, r, str); push(mid2(w.cR, w.nose), s.m, r, str); }
    else push(s.at === "nose" ? w.nose : s.at === "mouth" ? w.mouth : s.at === "chin" ? w.chin : mc, s.m, r, str);
  });
  return {A, M};
}
let chipT = 0;
function drawFrame(ts){
  cam.raf = requestAnimationFrame(drawFrame);
  const v = cam.video; if(!v || v.readyState < 2 || !v.videoWidth) return;
  const W = cv.width, H = cv.height, tp = cam.tpl;
  const sz = +$("#sz").value, st = +$("#st").value, bt = +$("#bty").value;
  const mirror = cam.facing === "user";
  const va = v.videoWidth / v.videoHeight, ta = W / H;
  let sx = 1, sy = 1, ox = 0, oy = 0;
  if(va > ta){ sx = ta / va; ox = (1 - sx) / 2; } else { sy = va / ta; oy = (1 - sy) / 2; }
  ftStep(v, ts);
  const tracked = cam.auto && FT.L && FT.miss <= 8;
  const mp = lm => { const t = (lm.x - ox) / sx; return {x:(mirror ? 1 - t : t) * W, y:((lm.y - oy) / sy) * H}; };
  const F = tracked ? buildFace(FT.L, mp) : manualFace(cam.ax * W, cam.ay * H, sz * H);
  F.t = ts / 1000;
  if(cam.gl){
    const {gl, U, c} = cam.gl;
    gl.viewport(0, 0, W, H);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, v);
    const ws = warpSetup(tp, F, W, H, sz, st);
    gl.uniform4fv(U["A[0]"], ws.A); gl.uniform1fv(U["M[0]"], ws.M);
    gl.uniform1f(U.asp, W / H); gl.uniform1f(U.t, ts / 1000); gl.uniform1f(U.mir, mirror ? 1 : 0); gl.uniform1f(U.bt, bt);
    gl.uniform1f(U.hasf, tracked ? 1 : 0);
    gl.uniform4f(U.crop, sx, sy, ox, oy);
    gl.uniform4f(U.fc, F.W.nose.x / W, 1 - ((F.W.eL.y + F.W.eR.y + F.W.mouth.y) / 3) / H, Math.max(.05, F.w * .62 / W), Math.max(.05, F.w * .86 / H));
    gl.uniform2f(U.px, 1 / W, 1 / H);
    gl.uniform1i(U.gfx, tp.gfx || 0); gl.uniform1i(U.flt, tp.flt || 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    cx.drawImage(c, 0, 0);
  } else {
    cx.save(); if(mirror){ cx.translate(W, 0); cx.scale(-1, 1); }
    const f = ["none","grayscale(1)","sepia(1)","hue-rotate(120deg) saturate(2)","contrast(1.6) saturate(1.8)","sepia(.5) contrast(1.1)","hue-rotate(180deg) saturate(.9)","sepia(.35) saturate(1.3)","blur(1px) brightness(1.1)","grayscale(1) contrast(1.6)","saturate(.7) brightness(1.15)"][tp.flt || 0];
    cx.filter = (f === "none" ? "" : f + " ") + (bt > 0 ? `brightness(${1 + .08 * bt}) contrast(${1 + .04 * bt}) saturate(${1 + .08 * bt})` : "") || "none";
    cx.drawImage(v, ox * v.videoWidth, oy * v.videoHeight, sx * v.videoWidth, sy * v.videoHeight, 0, 0, W, H); cx.restore();
  }
  if(tracked && bt > .02) beautyOverlay(cx, F, bt, mp);
  (tp.d || []).forEach(k => {
    cx.save(); cx.translate(F.c.x, F.c.y); cx.rotate(F.rot);
    try{ DRAW[k](cx, F.L, F.R, F); }catch(e){}
    cx.restore();
  });
  const t = $("#capt").value.trim();
  if(t){
    cx.save(); let fs = W * .09; cx.font = `900 ${fs}px Impact,'Noto Sans Myanmar',sans-serif`;
    while(cx.measureText(t).width > W * .92 && fs > 18){ fs -= 2; cx.font = `900 ${fs}px Impact,'Noto Sans Myanmar',sans-serif`; }
    cx.textAlign = "center"; cx.textBaseline = "alphabetic"; cx.lineJoin = "round"; cx.lineWidth = fs * .16; cx.strokeStyle = "#000"; cx.fillStyle = "#fff";
    cx.strokeText(t, W / 2, H * .92); cx.fillText(t, W / 2, H * .92); cx.restore();
  }
  if(ts - chipT > 400){
    chipT = ts;
    $("#fchip").textContent = !cam.auto ? "👆 လက်ဖြင့်ချိန်" : tracked ? "🙂 မျက်နှာတွေ့ပြီ" : FT.state === "loading" ? "⏳ မော်ဒယ်ဖွင့်နေ…" : FT.state === "failed" ? "👆 လက်ဖြင့်ချိန်" : "🔍 မျက်နှာရှာနေ…";
  }
}
async function camStart(){
  camStop();
  try{
    const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:cam.facing, width:{ideal:1280}, height:{ideal:720}}, audio:false});
    cam.stream = stream;
    const v = h("video", {playsinline:true, muted:true, autoplay:true}); v.muted = true; v.srcObject = stream;
    await v.play().catch(() => {}); cam.video = v;
    if(!cam.gl) cam.gl = glInit();
    FT.miss = 99;
    cam.raf = requestAnimationFrame(drawFrame);
    if(cam.auto) ftLoad();
    $("#camHint").hidden = false; setTimeout(() => $("#camHint").hidden = true, 5000);
  }catch(e){
    console.error(e);
    toast("ကင်မရာ ဖွင့်မရပါ။ Browser တွင် ကင်မရာခွင့်ပြုချက် (permission) ပေးထားပါ။");
  }
}
function camStop(){
  cancelAnimationFrame(cam.raf);
  if(cam.rec && cam.rec.state !== "inactive"){ cam.rec.onstop = null; try{ cam.rec.stop(); }catch(e){} }
  clearInterval(cam.tick); $("#timer").hidden = true; $("#shut").classList.remove("rec");
  if(cam.stream) cam.stream.getTracks().forEach(t => t.stop());
  cam.stream = null; cam.video = null;
}
function updCost(){ $("#cost").textContent = "⭐ −" + COST[cam.mode === "photo" ? "image" : "video"]; }
function camOpen(){
  const gate = $("#camGate"), ui = $("#camUI");
  if(!sb || !user){
    camStop(); ui.hidden = true; gate.hidden = false;
    gate.replaceChildren(!sb ? plainCard("Supabase မချိတ်ရသေးပါ", "ကင်မရာ post တင်ရန် config.js ကို အရင်ပြင်ပါ။")
      : loginCard("ကင်မရာသုံးရန်နှင့် Post တင်ရန် အကောင့်ဝင်ပါ။ (အကောင့်သစ်ဖွင့်လျှင် ⭐ 30 ရပါမည်)"));
    return;
  }
  gate.hidden = true; ui.hidden = false; setBal(); updCost(); loadWallet(); camStart();
}
function drawTpls(){
  const gt = $("#gtabs"); gt.replaceChildren();
  GROUPS.forEach(([id, label]) => gt.append(h("button", {class: id === cam.grp ? "on" : "", onclick: () => { cam.grp = id; drawTpls(); }}, label)));
  const box = $("#tpls"); box.replaceChildren();
  [NONE, ...TPL.filter(t => t.g === cam.grp)].forEach(tp => box.append(h("button", {class:"tp" + (tp === cam.tpl ? " on" : ""), onclick: () => { cam.tpl = tp; drawTpls(); }}, h("i", {}, tp.e), tp.n)));
}
drawTpls();
$("#bty").value = lsGet("ov_bty") || "0.6";
$("#bty").addEventListener("input", () => lsSet("ov_bty", $("#bty").value));
function syncAuto(){ const b = $("#autoBtn"); b.classList.toggle("on", cam.auto); b.textContent = cam.auto ? "🎯 Auto" : "👆 Manual"; }
$("#autoBtn").onclick = () => { cam.auto = !cam.auto; lsSet("ov_auto", cam.auto ? "1" : "0"); syncAuto(); if(cam.auto) ftLoad(); toast(cam.auto ? "Auto – မျက်နှာကို အလိုအလျောက် လိုက်ပါမည်" : "Manual – ဖန်သားပြင်ကို ထိ/ဆွဲ၍ နေရာချပါ"); };
syncAuto();
let dragging = false;
function setAnchor(e){
  const r = cv.getBoundingClientRect(), ar = cv.width / cv.height;
  let w = r.width, hh = r.height, ox = 0, oy = 0;
  if(w / hh > ar){ w = hh * ar; ox = (r.width - w) / 2; } else { hh = w / ar; oy = (r.height - hh) / 2; }
  cam.ax = Math.min(1, Math.max(0, (e.clientX - r.left - ox) / w));
  cam.ay = Math.min(1, Math.max(0, (e.clientY - r.top - oy) / hh));
}
cv.addEventListener("pointerdown", e => { dragging = true; cv.setPointerCapture(e.pointerId); setAnchor(e); });
cv.addEventListener("pointermove", e => { if(dragging) setAnchor(e); });
cv.addEventListener("pointerup", () => dragging = false);
$("#flip").onclick = () => { cam.facing = cam.facing === "user" ? "environment" : "user"; camStart(); };
$("#modeBtn").onclick = () => {
  cam.mode = cam.mode === "photo" ? "video" : "photo";
  $("#modeBtn").textContent = cam.mode === "photo" ? "📷" : "🎥";
  $("#shut").classList.toggle("vid", cam.mode === "video"); updCost();
  toast(cam.mode === "photo" ? "ဓာတ်ပုံ mode" : "ဗီဒီယို mode (အများဆုံး ၃၀ စက္ကန့်)");
};
function lowPoints(cost){
  const o = overlay("⭐ Point မလောက်ပါ", [h("div", {class:"card"}, h("h3", {}, `လိုအပ်: ⭐ ${cost} · ရှိသည်: ⭐ ${balance}`),
    h("p", {}, `ဗီဒီယိုကြည့်ပြီး (${WATCH_SECS} စက္ကန့်လျှင် ⭐ +2) သို့မဟုတ် သူငယ်ချင်းကို Referral ဖြင့် ဖိတ်ပြီး (တစ်ဦးလျှင် ⭐ +50) Point ရယူနိုင်ပါသည်။`),
    h("div", {style:"display:grid;gap:10px;margin-top:10px"},
      h("button", {class:"btn pink", onclick: () => { o.close(); go("video"); }}, "ဗီဒီယိုကြည့်ပြီး ရယူမည်"),
      h("button", {class:"btn alt", onclick: () => { o.close(); go("profile"); }}, "Referral link ရယူမည်")))]);
}
async function needCredit(kind){
  if(cam.credit && cam.credit.kind === kind) return true;
  const cost = COST[kind];
  if(balance < cost){ await loadWallet(); if(balance < cost){ lowPoints(cost); return false; } }
  const {data, error} = await sb.rpc("buy_capture", {p_kind: kind});
  if(error){
    if(/insufficient/.test(error.message)){ await loadWallet(); lowPoints(cost); } else toast("မအောင်မြင်ပါ - " + error.message);
    return false;
  }
  cam.credit = {id: data, kind}; await loadWallet(); toast("⭐ −" + cost); return true;
}
$("#shut").onclick = async () => {
  if(!cam.stream) return;
  if(cam.mode === "photo"){
    if(!(await needCredit("image"))) return;
    cv.toBlob(b => b && openEditor(b, "image"), "image/jpeg", .92); return;
  }
  if(cam.rec && cam.rec.state === "recording"){ if(Date.now() - cam.t0 > 700) cam.rec.stop(); return; }
  if(cam.starting) return; cam.starting = true;
  let mic = null;
  try{
    if(!(await needCredit("video"))) return;
    try{ mic = await navigator.mediaDevices.getUserMedia({audio:true}); }catch(e){ toast("မိုက်ခွင့်မရပါ၊ အသံမပါဘဲ ရိုက်ပါမည်"); }
  } finally { cam.starting = false; }
  const out = cv.captureStream(30); if(mic) mic.getAudioTracks().forEach(t => out.addTrack(t));
  const mt = ["video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm","video/mp4"].find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t));
  if(!mt){ toast("ဤ browser တွင် ဗီဒီယိုရိုက်ခြင်း မထောက်ပံ့ပါ"); return; }
  cam.chunks = []; cam.rec = new MediaRecorder(out, {mimeType: mt, videoBitsPerSecond: 3000000});
  cam.rec.ondataavailable = e => e.data.size && cam.chunks.push(e.data);
  cam.rec.onstop = () => {
    clearInterval(cam.tick); $("#timer").hidden = true; $("#shut").classList.remove("rec");
    if(mic) mic.getTracks().forEach(t => t.stop());
    const vb = new Blob(cam.chunks, {type: mt.split(";")[0]});
    if(vb.size < 1500){ toast("ရိုက်ချက် တိုလွန်းသည်၊ ပြန်ရိုက်ပါ"); camStart(); return; }
    openEditor(vb, "video", {dur: (Date.now() - cam.t0) / 1000});
  };
  cam.rec.start(250); cam.t0 = Date.now(); $("#shut").classList.add("rec"); $("#timer").hidden = false;
  cam.tick = setInterval(() => {
    const s = Math.floor((Date.now() - cam.t0) / 1000); $("#timer").textContent = "● " + Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
    if(s >= 30 && cam.rec.state === "recording") cam.rec.stop();
  }, 250);
};
