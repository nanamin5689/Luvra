"use strict";
/* ============ OpenVideo v6 – Sign in/up, headers, Facebook-style Home, profiles, Chat, Menu, Security, Owner center ============ */
let SET = {points_spend: true, camera_enabled: true, posting_enabled: true};   // Owner center မှ ထိန်း (get_settings မရလျှင် v5 အတိုင်း)
let IS_ADMIN = false, presenceT = null, authO = null, VQ = "";
const ERR = e => (e && (e.message || e.error_description || e.msg)) || String(e || "");
const need = () => { toast(t("Please sign in first", "အကောင့်အရင်ဝင်ပါ")); authScreen("in"); return false; };
LEDGER.admin = "Owner မှ ချိန်ညှိ";

/* ---------------- Header bar ---------------- */
function setBar(){
  const bar = document.querySelector("#top .bar"); if(!bar) return;
  const cfg = {
    home: [ "OpenVideo", t("Search OpenVideo…", "ရှာဖွေရန်…"), null ],
    video: [ t("Video", "ဗီဒီယို"), t("Search videos", "ဗီဒီယို ရှာရန်"), null ],
    chat: [ t("Chat", "Chat"), t("Search people", "လူ ရှာရန်"), null ],
    profile: [ t("Me", "ကျွန်ုပ်"), "", t("Menu", "Menu") ]
  }[tab];
  if(!cfg) return;
  $("#bBrand").textContent = cfg[0];
  const q = $("#bQ"); q.placeholder = cfg[1]; q.value = tab === "video" ? VQ : "";
  bar.classList.toggle("noS", !cfg[1]);
  const r = $("#bRight"); r.hidden = !cfg[2]; r.textContent = cfg[2] || ""; r.onclick = openMenu;
}
$("#bForm").onsubmit = e => {
  e.preventDefault(); const q = $("#bQ").value.trim(); $("#bQ").blur();
  if(tab === "home") { if(q) globalSearch(q); }
  else if(tab === "video"){ VQ = q; loadVideos(true); }
  else if(tab === "chat"){ if(q) peopleSearch(q); }
};

/* ---------------- Settings / presence ---------------- */
async function loadSettings(){
  if(!sb) return;
  try{
    const {data, error} = await sb.rpc("get_settings");
    if(!error && data) SET = Object.assign({points_spend: false, camera_enabled: true, posting_enabled: true}, data);
  }catch(e){}
  COST.image = SET.points_spend ? 3 : 0; COST.video = SET.points_spend ? 8 : 0;
  if(tab === "camera") camOpen();
}
updCost = function(){
  const c = COST[cam.mode === "photo" ? "image" : "video"];
  $("#cost").textContent = c ? "⭐ −" + c : t("Free", "အခမဲ့");
};
const _camOpen = camOpen;
camOpen = function(){
  if(sb && user && SET.camera_enabled === false){
    camStop(); $("#camUI").hidden = true; const g = $("#camGate"); g.hidden = false;
    g.replaceChildren(plainCard(t("Camera is closed", "ကင်မရာ ခေတ္တပိတ်ထားသည်"), t("The owner has temporarily turned the camera off. Please check back later.", "Owner က ကင်မရာကို ခေတ္တပိတ်ထားပါသည်။ နောက်မှ ပြန်လာကြည့်ပါ။")));
    return;
  }
  _camOpen(); if(sb && user) updCost();
};
const seen = () => { if(sb && user) sb.rpc("touch_seen").then(() => {}, () => {}); };
const _afterLogin6 = afterLogin;
afterLogin = async function(){
  await _afterLogin6();
  if(authO){ try{ authO.close(); }catch(e){} authO = null; }
  HF.loaded = false;
  seen(); clearInterval(presenceT); presenceT = setInterval(seen, 120000);
  try{ const {data} = await sb.rpc("is_admin"); IS_ADMIN = data === true; }catch(e){ IS_ADMIN = false; }
  loadSettings(); mfaGate();
};
const _afterLogout6 = afterLogout;
afterLogout = function(){ _afterLogout6(); clearInterval(presenceT); IS_ADMIN = false; HF.loaded = false; };
const _dp6 = drawProfile;
drawProfile = async function(){
  await _dp6();
  const pad = document.querySelector("#prof .pad:last-child");
  if(pad && user && SET.points_spend === false)
    pad.prepend(h("div", {class:"tip"}, t("Points are not being spent right now – everything is free. Points you earn from referrals and watching videos are still saved.", "လက်ရှိ Point မနုတ်ပါ – အားလုံး အခမဲ့သုံးနိုင်ပါသည်။ Referral နှင့် ဗီဒီယိုကြည့်၍ ရသော Point များကိုမူ ဆက်စုထားပါသည်။")));
};
async function fillStats(el, uid){
  el.classList.add("pub");
  const cell = (n, l) => h("div", {}, h("b", {}, n), h("small", {}, l));
  const lab = [t("Followers", "Followers"), t("Following", "Following"), t("Point balance", "Point လက်ကျန်")];
  const own = user && uid === user.id;
  el.replaceChildren(cell("–", lab[0]), cell(own ? String(following.size) : "–", lab[1]), cell(own ? "⭐ " + balance : "–", lab[2]));
  try{
    const {data, error} = await sb.rpc("profile_stats", {p_id: uid});
    const r = Array.isArray(data) ? data[0] : data;
    if(error || !r) return;
    el.replaceChildren(cell(fmt(+r.followers), lab[0]), cell(fmt(+r.following), lab[1]), cell("⭐ " + fmt(+r.points), lab[2]));
  }catch(e){}
}

/* ---------------- Auth: Sign in / Sign up ---------------- */
const GLOGO = '<svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.2 5.5-4.7 7.2l7.6 5.9c4.4-4.1 6.9-10.1 6.9-17.6z"/><path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.8 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>';
const redirect = () => location.href.split("#")[0].split("?")[0];
function authErr(e){
  const m = ERR(e);
  if(/rate limit|over_email_send_rate_limit|too many/i.test(m)) return t("Too many emails were requested. Please wait a few minutes and try again. (If this keeps happening for everyone, the owner must set up custom SMTP – see README.)", "Email တောင်းဆိုမှု များလွန်းနေသည်။ မိနစ်အနည်းငယ်စောင့်ပြီး ပြန်စမ်းပါ။ (လူတိုင်းမှာ ဆက်ဖြစ်နေလျှင် Owner က custom SMTP ထည့်ရမည် – README ကိုကြည့်ပါ။)");
  if(/signups? not allowed|user not found/i.test(m)) return t("No account with this email yet. Use “Sign up” instead.", "ဤ email ဖြင့် အကောင့်မရှိသေးပါ။ “Sign up” ကိုသုံးပါ။");
  if(/invalid login|invalid credentials/i.test(m)) return t("Wrong email or password.", "Email သို့မဟုတ် password မမှန်ပါ။");
  if(/token has expired|invalid|otp/i.test(m)) return t("That code is wrong or expired. Request a new one.", "Code မမှန်ပါ သို့မဟုတ် သက်တမ်းကုန်သွားပါပြီ။ အသစ်တောင်းပါ။");
  if(/provider is not enabled|unsupported provider/i.test(m)) return t("This sign-in method is not turned on yet by the owner.", "ဤဝင်ရောက်နည်းကို Owner က မဖွင့်ရသေးပါ။");
  return m;
}
function authScreen(mode, why){
  if(!sb){ toast(t("Supabase is not connected in config.js", "Supabase ကို config.js တွင် မချိတ်ရသေးပါ")); return; }
  if(authO){ try{ authO.close(); }catch(e){} }
  const box = h("div", {class:"authw"});
  const o = authO = overlay("OpenVideo", box, () => { if(authO === o) authO = null; });
  let m = mode === "up" ? "up" : "in", step = "start", email = "", usePw = false;
  const oauth = async prov => {
    const {error} = await sb.auth.signInWithOAuth({provider: prov, options: {redirectTo: redirect()}});
    if(error) toast(authErr(error));
  };
  function draw(){
    box.replaceChildren();
    const up = m === "up";
    box.append(
      h("h1", {}, up ? t("Create your account", "အကောင့်သစ်ဖွင့်ရန်") : t("Welcome back", "ပြန်လည်ကြိုဆိုပါသည်")),
      h("p", {class:"sub"}, why || (up ? t("No forms and no password. We take your name and picture from Google, Facebook or your email.", "ကိုယ်ရေးအချက်အလက်ဖောင်၊ password မလိုပါ။ Google၊ Facebook သို့မဟုတ် email မှ အမည်၊ ပုံကို ယူ၍ အကောင့်ဖန်တီးပေးပါမည်။") : t("Sign in to post, use the camera, chat and earn points.", "Post တင်ရန်၊ ကင်မရာသုံးရန်၊ Chat လုပ်ရန်၊ Point ရယူရန် အကောင့်ဝင်ပါ။"))),
      h("div", {class:"seg"}, h("button", {class: up ? "" : "on", onclick: () => { m = "in"; step = "start"; draw(); }}, t("Sign in", "Sign in")),
        h("button", {class: up ? "on" : "", onclick: () => { m = "up"; step = "start"; draw(); }}, t("Sign up", "Sign up"))),
      h("div", {class:"tip", hidden: !lsGet("ov_ref")}, t("🎁 Referral code saved – you get ⭐ +20 after joining.", "🎁 Referral code မှတ်ထားပြီး – ဝင်ပြီးသည်နှင့် ⭐ +20 ရပါမည်။")));
    const lbl = up ? t("Sign up with", "အောက်ပါဖြင့် Sign up လုပ်ရန်") : t("Continue with", "အောက်ပါဖြင့် ဝင်ရန်");
    const g = h("button", {class:"sbt", onclick: () => oauth("google")}); g.innerHTML = GLOGO; g.append(h("span", {}, lbl + " Google"));
    const f = h("button", {class:"sbt fb", onclick: () => oauth("facebook")}, h("span", {}, "f"), h("span", {}, lbl + " Facebook"));
    const tk = h("button", {class:"sbt tt off", onclick: () => sheet("TikTok", [h("p", {style:"line-height:1.7"}, t("TikTok sign-in isn't available yet: our free backend (Supabase) doesn't support TikTok login, so it can't be turned on honestly. Please use Google, Facebook or Email – your profile is created the same way.", "TikTok ဖြင့်ဝင်ခြင်းကို လောလောဆယ် မထောက်ပံ့နိုင်သေးပါ – အခမဲ့ backend (Supabase) က TikTok login ကို မပါဝင်သောကြောင့်ဖြစ်သည်။ Google၊ Facebook သို့မဟုတ် Email ကိုသုံးပါ – profile ကို အတူတူပင် ဖန်တီးပေးပါသည်။"))])}, h("span", {}, "♪"), h("span", {}, lbl + " TikTok"));
    box.append(g, f, tk, h("div", {class:"or"}, t("or with email", "သို့မဟုတ် email ဖြင့်")));
    const msg = h("div", {});
    const say = (txt, ok) => { msg.className = ok ? "ok" : "err"; msg.textContent = txt || ""; };
    if(step === "start"){
      const em = h("input", {type:"email", placeholder:"you@email.com", autocomplete:"email", value: email});
      const pw = h("input", {type:"password", placeholder:t("Password", "Password"), autocomplete:"current-password", hidden: !(usePw && !up)});
      const go1 = h("button", {class:"btn pink", style:"width:100%", onclick: async () => {
        email = em.value.trim(); if(!email){ say(t("Enter your email", "Email ထည့်ပါ")); return; }
        go1.disabled = true; say("");
        try{
          if(usePw && !up){
            const {error} = await sb.auth.signInWithPassword({email, password: pw.value});
            if(error) say(authErr(error)); else say(t("Signed in", "ဝင်ပြီးပါပြီ"), true);
          } else {
            const {error} = await sb.auth.signInWithOtp({email, options: {shouldCreateUser: up, emailRedirectTo: redirect()}});
            if(error) say(authErr(error)); else { step = "code"; draw(); }
          }
        }catch(e){ say(authErr(e)); }
        go1.disabled = false;
      }}, usePw && !up ? t("Sign in", "ဝင်မည်") : t("Send me a code", "Code ပို့ပါ"));
      box.append(em, pw, go1, msg);
      if(!up) box.append(h("button", {class:"linkbtn", onclick: () => { usePw = !usePw; draw(); }}, usePw ? t("Use an email code instead", "Email code ဖြင့်ဝင်မည်") : t("I have a password", "Password ရှိသည်")));
    } else {
      const code = h("input", {inputmode:"numeric", autocomplete:"one-time-code", placeholder:t("6-digit code", "ဂဏန်း ၆ လုံး code"), maxlength:8});
      const vb = h("button", {class:"btn pink", style:"width:100%", onclick: async () => {
        vb.disabled = true; say("");
        const {error} = await sb.auth.verifyOtp({email, token: code.value.trim(), type: "email"});
        if(error){ say(authErr(error)); vb.disabled = false; } else say(t("Signed in", "ဝင်ပြီးပါပြီ"), true);
      }}, t("Verify", "အတည်ပြုမည်"));
      box.append(h("p", {class:"sub"}, t("We sent an email to ", "Email ပို့ပြီးပါပြီ – ") + email + t(". Type the code from it, or just tap the link inside.", "။ ထဲက code ကိုရိုက်ထည့်ပါ၊ သို့မဟုတ် link ကိုနှိပ်ပါ။")), code, vb, msg,
        h("button", {class:"linkbtn", onclick: () => { step = "start"; draw(); }}, t("← Use a different email", "← အခြား email သုံးမည်")));
      setTimeout(() => code.focus(), 50);
    }
  }
  draw();
}
loginCard = function(why){
  const ref = lsGet("ov_ref") ? h("p", {}, t("🎁 Referral code saved – ⭐ +20 after you join.", "🎁 Referral code မှတ်ထားပြီး ဝင်ပြီးလျှင် ⭐ +20 ရပါမည်။")) : null;
  return h("div", {class:"card"}, h("h3", {}, t("Sign in or sign up", "Sign in သို့မဟုတ် Sign up")), h("p", {}, why), ref,
    h("div", {style:"display:grid;gap:10px;margin-top:10px"},
      h("button", {class:"btn pink", onclick: () => authScreen("up", why)}, t("Sign up (Google · Facebook · Email)", "Sign up (Google · Facebook · Email)")),
      h("button", {class:"btn alt", onclick: () => authScreen("in", why)}, t("Sign in", "Sign in"))));
};
/* 2-step verification (TOTP) – ဝင်ပြီးနောက် code တောင်း */
async function mfaGate(){
  try{
    const {data} = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    if(!data || data.nextLevel !== "aal2" || data.currentLevel === "aal2") return;
    const {data: fs} = await sb.auth.mfa.listFactors();
    const f = fs && fs.totp && fs.totp[0]; if(!f) return;
    const code = h("input", {inputmode:"numeric", maxlength:6, placeholder:"000000", autocomplete:"one-time-code"});
    const msg = h("div", {class:"err"});
    const o = overlay(t("2-step verification", "၂ ဆင့်အတည်ပြုခြင်း"), h("div", {class:"authw"},
      h("p", {class:"sub"}, t("Open Google Authenticator and enter the 6-digit code for OpenVideo.", "Google Authenticator ကိုဖွင့်ပြီး OpenVideo ၏ ဂဏန်း ၆ လုံး code ကို ထည့်ပါ။")), code,
      h("button", {class:"btn pink", style:"width:100%;margin-top:6px", onclick: async () => {
        const {error} = await sb.auth.mfa.challengeAndVerify({factorId: f.id, code: code.value.trim()});
        if(error){ msg.textContent = t("Wrong code, try again.", "Code မမှန်ပါ၊ ပြန်စမ်းပါ။"); return; }
        o.remove(); renderTab();
      }}, t("Verify", "အတည်ပြုမည်")), msg,
      h("button", {class:"linkbtn", onclick: async () => { o.remove(); await sb.auth.signOut(); }}, t("Cancel and sign out", "ပယ်ဖျက်ပြီး ထွက်မည်"))));
    o.querySelector(".x").hidden = true; setTimeout(() => code.focus(), 50);
  }catch(e){ console.warn("mfa", e); }
}

/* ---------------- Follow helper ---------------- */
async function toggleFollow(uid){
  if(!user) return need();
  if(following.has(uid)){ await sb.from("follows").delete().eq("followee_id", uid); following.delete(uid); }
  else { const {error} = await sb.from("follows").insert({followee_id: uid}); if(error){ toast(t("Failed", "မအောင်မြင်ပါ")); return false; } following.add(uid); }
  document.querySelectorAll(`[data-fol="${uid}"]`).forEach(b => b._upd && b._upd());
  return true;
}
function folBtn(uid, cls){
  const b = h("button", {class: cls || "fbfol", "data-fol": uid});
  b._upd = () => { const on = following.has(uid); b.textContent = on ? t("Following", "Following") : t("Follow", "Follow"); b.classList.toggle("on", on); };
  b._upd(); b.onclick = () => toggleFollow(uid); return b;
}

/* ---------------- Home: Facebook-style timeline ---------------- */
const HF = {off: 0, done: false, busy: false, gen: 0, loaded: false, io: null, mio: null};
HR = {deactivate(){ document.querySelectorAll("#hfeed video").forEach(v => v.pause()); }, removeWhere(fn){ document.querySelectorAll("#hfeed .fbp").forEach(c => { if(fn({user_id: c.dataset.uid})) c.remove(); }); }};
pauseReels = function(){ [HR, VR].forEach(R => R && R.deactivate && R.deactivate()); };
function mediaIO(){
  if(HF.mio) return HF.mio;
  return HF.mio = new IntersectionObserver(es => es.forEach(e => {
    const m = e.target;
    if(e.isIntersecting && !m.getAttribute("src") && m.dataset.src) m.src = m.dataset.src;
    if(m.tagName === "VIDEO"){
      if(e.isIntersecting && e.intersectionRatio > .55){ m.muted = true; m.play().catch(() => {}); } else m.pause();
    }
  }), {threshold: [0, .55], rootMargin: "400px 0px"});
}
function likeUI(p){
  const rx = mkRx(p);
  const ic = h("span", {}, "👍"), btn = h("button", {}, ic, h("span", {}, t("Like", "Like")));
  const sum = h("span", {});
  const total = () => Object.values(rx.tot).reduce((a, b) => a + b, 0);
  rx.ui.push(() => {
    const top = REACT.filter(([k]) => rx.mine[k] > 0).sort((a, b) => rx.mine[b[0]] - rx.mine[a[0]])[0];
    ic.textContent = top ? top[1] : "👍"; btn.classList.toggle("on", !!top);
    const n = total();
    sum.textContent = n ? REACT.filter(([k]) => rx.tot[k] > 0).sort((a, b) => rx.tot[b[0]] - rx.tot[a[0]]).slice(0, 3).map(r => r[1]).join("") + " " + fmt(n) : "";
  });
  const tray = () => {
    btn.parentNode.querySelectorAll(".tray").forEach(x => x.remove());
    const tr = h("div", {class:"tray"});
    REACT.forEach(([k, e]) => {
      const c = h("small", {}, ""), b = h("button", {}, h("span", {}, e), c);
      const up = () => { c.textContent = rx.tot[k] ? fmt(rx.tot[k]) : ""; }; up(); rx.ui.push(up);
      b.onclick = ev => { ev.stopPropagation(); rx.add(k); clearTimeout(tr._t); tr._t = setTimeout(() => tr.remove(), 3500); };
      tr.append(b);
    });
    btn.parentNode.append(tr); tr._t = setTimeout(() => tr.remove(), 3500);
    const away = ev => { if(!tr.contains(ev.target)){ tr.remove(); document.removeEventListener("pointerdown", away, true); } };
    setTimeout(() => document.addEventListener("pointerdown", away, true), 0);
  };
  let lp = null, long = false;
  btn.addEventListener("pointerdown", () => { long = false; lp = setTimeout(() => { long = true; tray(); }, 420); });
  ["pointerup", "pointerleave", "pointercancel"].forEach(ev => btn.addEventListener(ev, () => clearTimeout(lp)));
  btn.addEventListener("contextmenu", e => e.preventDefault());
  btn.onclick = () => { if(long){ long = false; return; } rx.add("like"); };
  rx.render();
  return {btn, sum, rx};
}
function fbPost(p){
  const own = user && user.id === p.user_id, isV = p.media_type === "video";
  const media = isV ? h("video", {playsinline:true, loop:true, muted:true, controls:true, preload:"metadata", controlslist:"nodownload noremoteplayback", "data-src": p.media_url})
                    : h("img", {alt: p.caption || "", loading:"lazy", "data-src": p.media_url});
  mediaIO().observe(media);
  const lk = likeUI(p);
  const cc = h("span", {"data-cc": p.id}, CC.get(p.id) || "");
  const card = h("article", {class:"fbp", "data-uid": p.user_id},
    h("div", {class:"fbh"},
      h("div", {onclick: () => openProfile(p.user_id, {username: p.author_name, avatar_url: p.author_avatar})}, avatar(p.author_avatar, p.author_name, 42)),
      h("div", {class:"nm", style:"cursor:pointer", onclick: () => openProfile(p.user_id, {username: p.author_name, avatar_url: p.author_avatar})}, h("b", {}, p.author_name), h("small", {}, ago(p.created_at) + " · ⏳ " + left(p))),
      own ? null : folBtn(p.user_id),
      h("button", {class:"dots", "aria-label":"More", onclick: () => postMenu(p, card)}, "⋯")),
    p.caption ? h("div", {class:"fbcap"}, p.caption) : null,
    h("div", {class:"fbm"}, media),
    h("div", {class:"fbc"}, lk.sum, h("span", {})),
    h("div", {class:"fba"},
      lk.btn,
      h("button", {onclick: () => openComments(p)}, "💬 ", t("Comment", "Comment"), " ", cc),
      (p.allow_download !== false || own) ? h("button", {onclick: () => dlPost(p)}, "⬇️ ", t("Download", "Download")) : null,
      h("button", {onclick: () => shareSheet(postLink(p), p.caption || "")}, "↗️ ", t("Share", "Share"))));
  return card;
}
async function homeMore(){
  const el = $("#hfeed");
  if(HF.busy || HF.done) return; HF.busy = true; const gen = HF.gen;
  const sent = el.querySelector("#hmore");
  try{
    for(let k = 0; k < 4; k++){
      const {data, error} = await sb.from("posts").select("*").gt("expires_at", new Date().toISOString()).order("created_at", {ascending:false}).range(HF.off, HF.off + PER - 1);
      if(gen !== HF.gen) return;
      if(error) throw error;
      const raw = data || []; HF.off += raw.length;
      const rows = raw.filter(p => !blocked.has(p.user_id));
      if(raw.length < PER) HF.done = true;
      if(rows.length){
        rows.forEach(p => el.insertBefore(fbPost(p), sent));
        loadCounts(rows); loadReactions(rows);
      }
      if(rows.length || HF.done) break;
    }
    if(HF.done){
      if(!el.querySelector(".fbp")) sent.replaceChildren(h("div", {class:"msg"}, t("No posts yet. Post the first one from the camera. 📸", "ယခု post မရှိသေးပါ။ ကင်မရာမှ ပထမဆုံး post ကို တင်ကြည့်ပါ။ 📸")));
      else sent.textContent = t("You're all caught up ✓", "အားလုံးကြည့်ပြီးပါပြီ ✓");
    }
  }catch(e){
    console.error(e); sent.replaceChildren(h("div", {class:"msg"}, t("Connection failed. Check your internet and try again.", "ချိတ်ဆက်မှု မအောင်မြင်ပါ။ အင်တာနက်ကို စစ်ပြီး ပြန်စမ်းပါ။")), h("button", {class:"btn alt", onclick: () => homeMore()}, t("Retry", "ပြန်စမ်းမည်")));
  }finally{ HF.busy = false; }
}
async function loadHome(reset){
  const el = $("#hfeed");
  if(!sb){
    el.replaceChildren(h("div", {class:"pad"}, h("div", {class:"card"}, h("h3", {}, t("Supabase is not connected", "Supabase မချိတ်ရသေးပါ")),
      h("p", {}, t("Fill in the Supabase URL and key in config.js and run setup.sql (see README).", "config.js တွင် Supabase URL နှင့် key ဖြည့်ပြီး setup.sql ကို run ပါ။ (README ကိုကြည့်ပါ)")),
      h("button", {class:"btn alt", onclick: () => go("video")}, t("Watch videos", "ဗီဒီယိုများ ကြည့်မည်"))))); return;
  }
  if(HF.loaded && !reset && Date.now() - HT < FRESH) return;
  HT = Date.now(); HF.loaded = true; HF.off = 0; HF.done = false; HF.busy = false; HF.gen++;
  const sent = h("div", {class:"fbmore", id:"hmore"}, t("Loading…", "ဖွင့်နေသည်…"));
  const compose = h("div", {class:"fbp", style:"padding:10px 12px;display:flex;gap:10px;align-items:center"},
    avatar(prof && prof.avatar_url, uname(), 40),
    h("button", {style:"flex:1;text-align:left;background:var(--sf2);color:var(--mu);border-radius:99px;padding:11px 14px", onclick: () => user ? go("camera") : authScreen("up")},
      user ? t("Share a snap with the camera… 📸", "ကင်မရာဖြင့် snap တစ်ခု မျှဝေပါ… 📸") : t("Sign in to share a snap 📸", "Snap မျှဝေရန် အကောင့်ဝင်ပါ 📸")));
  el.replaceChildren(compose, sent);
  if(HF.io) HF.io.disconnect();
  HF.io = new IntersectionObserver(es => { if(es[0].isIntersecting) homeMore(); }, {rootMargin: "700px 0px"});
  HF.io.observe(sent);
  await homeMore();
}
function refresh(){ if(tab === "home") loadHome(true); else if(tab === "video") loadVideos(true); }

/* ---------------- Video tab (category မပါ၊ ရှာဖွေနိုင်) ---------------- */
async function loadVideos(reset){
  const el = $("#vreel");
  if(VR && !reset && Date.now() - VT < FRESH){ VR.cur = -1; return; }
  VT = Date.now(); vPageN = 1;
  VR = mkReel(el, {render: vidSlide, onActive: vidActive, onLeave: vidLeave, emptyMsg: t("No results. Try another search.", "ရလဒ်မတွေ့ပါ။ အခြားစကားလုံးဖြင့် ရှာကြည့်ပါ။"),
    more: async () => { const items = await fetchVideos(VQ, vPageN); vPageN++; return items; }});
  await VR.more();
}

/* ---------------- Search ---------------- */
function loadCSE(cx){
  return new Promise(res => {
    if(window.google && google.search && google.search.cse) return res(true);
    window.__gcse = {parsetags: "explicit"};
    const s = document.createElement("script"); s.async = true; s.src = "https://cse.google.com/cse.js?cx=" + encodeURIComponent(cx);
    s.onload = () => { let n = 0; const w = setInterval(() => { if(window.google && google.search && google.search.cse){ clearInterval(w); res(true); } else if(++n > 40){ clearInterval(w); res(false); } }, 150); };
    s.onerror = () => res(false); document.head.append(s);
  });
}
function globalSearch(q){
  const res = h("div", {class:"sres"});
  const o = overlay(t("Search", "ရှာဖွေရန်") + ": " + q, res);
  const clean = q.replace(/[%,()\\]/g, " ");
  res.append(h("div", {class:"msg"}, t("Searching…", "ရှာနေပါသည်…")));
  (async () => {
    const iso = new Date().toISOString();
    const qp = async () => { try{
      let r = await sb.from("profiles").select("id,username,avatar_url").ilike("username", `%${clean}%`).eq("banned", false).limit(8);
      if(r.error) r = await sb.from("profiles").select("id,username,avatar_url").ilike("username", `%${clean}%`).limit(8);
      return r.data || []; }catch(e){ return []; } };
    const qs = async () => { try{ const r = await sb.from("posts").select("*").gt("expires_at", iso).or(`caption.ilike.%${clean}%,author_name.ilike.%${clean}%`).limit(10); return r.data || []; }catch(e){ return []; } };
    const [people, posts, vids] = await Promise.all([sb ? qp() : [], sb ? qs() : [], fetchVideos(q, 1).catch(() => [])]);
    res.replaceChildren();
    if(people.length){
      res.append(h("h4", {}, t("People", "လူများ")));
      people.filter(u => !user || u.id !== user.id).forEach(u => res.append(h("button", {class:"hrow", onclick: () => { o.close(); openProfile(u.id, u); }}, avatar(u.avatar_url, u.username, 44), h("b", {}, u.username))));
    }
    if(posts.length){
      res.append(h("h4", {}, t("Posts", "Post များ")));
      posts.forEach(p => res.append(h("button", {class:"hrow", onclick: () => openPost(p)},
        p.media_type === "image" ? h("img", {class:"t", src: p.media_url, alt:""}) : h("div", {class:"ph0"}),
        h("div", {style:"flex:1;text-align:left"}, h("b", {}, p.caption || t("(no caption)", "(စာတန်းမရှိ)")), h("small", {}, p.author_name)))));
    }
    if(vids.length){
      res.append(h("h4", {}, t("Videos", "ဗီဒီယိုများ")));
      vids.slice(0, 8).forEach(it => res.append(h("button", {class:"hrow", onclick: () => openPlayer(it)},
        h("img", {class:"t", src: it.thumb, alt:"", loading:"lazy"}), h("div", {style:"flex:1;text-align:left"}, h("b", {}, it.title), h("small", {}, it.src + " · " + it.creator)))));
    }
    if(!people.length && !posts.length && !vids.length) res.append(h("div", {class:"msg"}, t("Nothing found inside OpenVideo.", "OpenVideo ထဲတွင် မတွေ့ပါ။")));
    res.append(h("h4", {}, "Google"));
    res.append(h("div", {style:"padding:0 12px 12px"}, h("a", {class:"btn alt", style:"display:block;text-align:center", target:"_blank", rel:"noopener", href:"https://www.google.com/search?q=" + encodeURIComponent(q)}, t("Search “", "Google တွင် “") + q + t("” on Google", "” ကို ရှာမည်"))));
    if(C.GOOGLE_CSE_ID){
      const cont = h("div", {id:"ov-cse", style:"background:#fff;color:#111;margin:0 12px 20px;border-radius:12px;min-height:60px;padding:6px"});
      res.append(cont);
      if(await loadCSE(C.GOOGLE_CSE_ID)){
        try{ google.search.cse.element.render({div: cont, tag: "searchresults-only", gname: "ovs"}); google.search.cse.element.getElement("ovs").execute(q); }catch(e){ console.warn("cse", e); }
      }
    }
  })();
}
async function peopleSearch(q){
  const clean = q.replace(/[%,()\\]/g, " ");
  const list = h("div", {});
  const o = overlay(t("People", "လူများ") + ": " + q, list);
  list.append(h("div", {class:"msg"}, t("Searching…", "ရှာနေပါသည်…")));
  let {data, error} = await sb.from("profiles").select("id,username,avatar_url").ilike("username", `%${clean}%`).eq("banned", false).limit(30);
  if(error) ({data} = await sb.from("profiles").select("id,username,avatar_url").ilike("username", `%${clean}%`).limit(30));
  list.replaceChildren();
  const rows = (data || []).filter(u => !user || u.id !== user.id);
  if(!rows.length) list.append(h("div", {class:"msg"}, t("Not found", "မတွေ့ပါ")));
  rows.forEach(u => list.append(h("div", {class:"urow"}, h("div", {onclick: () => { o.close(); openProfile(u.id, u); }}, avatar(u.avatar_url, u.username, 46)),
    h("div", {class:"nm", onclick: () => { o.close(); openProfile(u.id, u); }}, h("b", {}, u.username)),
    h("button", {class:"pill", onclick: () => { if(!user) return need(); o.close(); openThread(u); }}, "💬"))));
}

/* ---------------- Other user's profile (follow + chat bar) ---------------- */
async function openProfile(uid, hint){
  if(user && uid === user.id){ go("profile"); return; }
  const body = h("div", {});
  const o = overlay(hint && hint.username || t("Profile", "Profile"), body);
  body.append(h("div", {class:"msg"}, t("Loading…", "ဖွင့်နေသည်…")));
  let P = hint || {};
  try{ const {data} = await sb.from("profiles").select("id,username,bio,avatar_url,cover_url,last_seen").eq("id", uid).maybeSingle(); if(data) P = data; }catch(e){}
  o.querySelector("h2").textContent = P.username || "";
  const cover = h("div", {class:"cover"}); if(P.cover_url) cover.style.backgroundImage = `url("${P.cover_url.replace(/"/g, "%22")}")`;
  const stats = h("div", {class:"stats"});
  const online = P.last_seen && Date.now() - new Date(P.last_seen) < 5 * 60000;
  const inp = h("input", {placeholder: t("Write a short message…", "စာတို ရေးပါ…"), maxlength:500, enterkeyhint:"send"});
  const sentNote = h("div", {class:"tip", hidden:true, style:"margin:0 14px 10px"});
  const send = async e => {
    e && e.preventDefault(); const tx = inp.value.trim(); if(!tx) return;
    if(!user){ need(); return; }
    inp.value = "";
    const {error} = await sb.from("messages").insert({to_id: uid, body: tx});
    if(error){
      const m = ERR(error);
      toast(/rate_limited/.test(m) ? t("Sending too fast, please wait", "မြန်လွန်းနေသည်၊ ခဏစောင့်ပါ") : /blocked/.test(m) ? t("Can't send (blocked)", "ပို့မရပါ (block ထားသည်)") : /banned/.test(m) ? t("Your account is restricted", "သင့်အကောင့်ကို ကန့်သတ်ထားပါသည်") : t("Couldn't send – ", "ပို့မရပါ - ") + m);
      inp.value = tx; return;
    }
    addPeer({id: uid, username: P.username, avatar_url: P.avatar_url});
    sentNote.hidden = false; sentNote.replaceChildren(t("Sent ✓ (messages disappear after 10 minutes) ", "ပို့ပြီးပါပြီ ✓ (မက်ဆေ့ချ်များ ၁၀ မိနစ်ကြာလျှင် ပျောက်ပါမည်) "),
      h("a", {href:"#", style:"color:var(--ac)", onclick: ev => { ev.preventDefault(); o.close(); openThread({id: uid, username: P.username, avatar_url: P.avatar_url}); }}, t("Open chat", "Chat ဖွင့်မည်")));
  };
  const posts = h("div", {class:"fbfeed", style:"padding-top:0"});
  body.replaceChildren(cover,
    h("div", {class:"pavw"}, avatar(P.avatar_url, P.username, 96), online ? h("span", {class:"dot", style:"right:2px;top:70px"}) : null),
    h("div", {class:"pname"}, h("h2", {}, P.username || "user"), P.bio ? h("p", {}, P.bio) : null),
    stats,
    h("div", {class:"pact"}, folBtn(uid, "btn alt"), h("button", {class:"btn alt", style:"flex:0 0 auto", onclick: async () => { if(!user) return need(); if(window.blockUser && await blockUser(uid, P.username)) o.close(); }}, "⛔")),
    h("form", {class:"chatbar", onsubmit: send}, inp, h("button", {class:"btn pink", type:"submit"}, t("Send", "ပို့"))),
    sentNote,
    h("div", {class:"sec", style:"padding:0 14px"}, t("Posts (last 24 hours)", "Post များ (၂၄ နာရီအတွင်း)")), posts);
  fillStats(stats, uid);
  const {data: ps} = await sb.from("posts").select("*").eq("user_id", uid).gt("expires_at", new Date().toISOString()).order("created_at", {ascending:false}).limit(20);
  if(!(ps || []).length) posts.append(h("div", {class:"msg"}, t("No posts yet", "Post မရှိသေးပါ")));
  (ps || []).forEach(p => posts.append(fbPost(p)));
  loadCounts(ps || []); loadReactions(ps || []);
}

/* ---------------- Chat tab ---------------- */
async function drawChat(){
  const box = $("#chat"); box.replaceChildren();
  if(!sb){ box.append(plainCard(t("Supabase is not connected", "Supabase မချိတ်ရသေးပါ"), t("Edit config.js first to use Chat.", "Chat သုံးရန် config.js ကို အရင်ပြင်ပါ။"))); return; }
  if(!user){ box.append(loginCard(t("Sign in to use Chat. (No account is needed just to browse.)", "Chat သုံးရန် အကောင့်ဝင်ပါ။ (ကြည့်ရုံသက်သက်ဆိုလျှင် အကောင့်မလိုပါ)"))); return; }
  chatSeen();
  const arow = h("div", {class:"arow"}), conv = h("div", {}), conn = h("div", {}), sug = h("div", {});
  box.append(h("div", {class:"sec", style:"margin-top:0"}, "🟢 " + t("Active now", "ယခု Active ဖြစ်နေသူများ")), arow,
    h("div", {class:"tip"}, `⏳ ${t("Messages disappear automatically after " + CHAT_TTL + " minutes.", "မက်ဆေ့ချ်များသည် " + CHAT_TTL + " မိနစ်ကြာလျှင် အလိုအလျောက် ပျောက်သွားပါမည်။")}`),
    h("div", {class:"sec"}, t("Messages", "မက်ဆေ့ချ်များ")), conv,
    h("div", {class:"sec"}, t("Following & followers", "Following နှင့် Followers")), conn,
    h("div", {class:"sec"}, t("Suggested accounts to follow", "Follow လုပ်ရန် အကြံပြုထားသူများ")), sug);
  const row = (u, right, onrow) => h("div", {class:"urow"}, h("div", {class:"avw", onclick: () => openProfile(u.id, u)}, avatar(u.avatar_url, u.username, 46),
      u.last_seen && Date.now() - new Date(u.last_seen) < 300000 ? h("span", {class:"dot", style:"right:0;top:32px"}) : null),
    h("div", {class:"nm", style:"cursor:pointer", onclick: onrow || (() => openProfile(u.id, u))}, h("b", {}, u.username), u.sub ? h("small", {}, u.sub) : null), right);
  (async () => {
    const {data} = await sb.rpc("active_users", {p_limit: 30});
    arow.replaceChildren();
    const rows = (data || []).filter(u => !blocked.has(u.id));
    if(!rows.length) arow.append(h("div", {class:"msg", style:"padding:8px 4px;font-size:.85rem"}, t("No one else is active right now.", "ယခု Active ဖြစ်နေသူ မရှိသေးပါ။")));
    rows.forEach(u => arow.append(h("button", {class:"ac", onclick: () => openThread(u)}, h("div", {class:"avw"}, avatar(u.avatar_url, u.username, 52), h("span", {class:"dot"})), h("span", {}, u.username))));
  })();
  renderConvos(conv);
  clearInterval(convoT);
  convoT = setInterval(() => { if(!conv.isConnected){ clearInterval(convoT); return; } if(!document.querySelector(".thread")) renderConvos(conv); }, 8000);
  (async () => {
    const {data} = await sb.rpc("my_connections");
    conn.replaceChildren();
    const rows = (data || []).filter(u => !blocked.has(u.id));
    if(!rows.length) conn.append(h("div", {class:"msg", style:"padding:14px"}, t("Follow people to see them here.", "လူများကို Follow လုပ်လျှင် ဤနေရာတွင် ပေါ်ပါမည်။")));
    rows.forEach(u => { u.sub = u.i_follow && u.follows_me ? t("Mutual", "နှစ်ဦးသား Follow") : u.i_follow ? t("Following", "Following") : t("Follower", "Follower");
      conn.append(row(u, h("button", {class:"pill", onclick: () => openThread(u)}, "💬"), () => openThread(u))); });
  })();
  (async () => {
    const {data} = await sb.rpc("suggested_users", {p_limit: 20});
    sug.replaceChildren();
    const rows = (data || []).filter(u => !blocked.has(u.id));
    if(!rows.length) sug.append(h("div", {class:"msg", style:"padding:14px"}, t("No suggestions yet.", "အကြံပြုရန် မရှိသေးပါ။")));
    rows.forEach(u => sug.append(row(u, folBtn(u.id, "pill"))));
  })();
}

/* ---------------- Menu drawer ---------------- */
function openMenu(){
  const back = h("div", {class:"dback", onclick: () => close()});
  const close = () => { back.remove(); dr.remove(); };
  const item = (ic, label, fn, cls) => h("button", {class:"mi " + (cls || ""), onclick: () => { close(); fn(); }}, h("span", {}, ic), h("span", {}, label));
  const P = prof || {};
  const items = user ? [
    item("✏️", t("Edit profile", "Profile ပြင်ရန်"), editProfile),
    item("🔐", t("Security & password", "လုံခြုံရေးနှင့် Password"), openSecurity),
    item("🌐", t("Language", "ဘာသာစကား"), openLanguage),
    item("📤", t("Share", "မျှဝေရန်"), shareApp),
    IS_ADMIN ? item("🛠", t("Owner center", "Owner center"), openOwner) : null,
    item("📲", t("Install app", "App install လုပ်ရန်"), doInstall),
    item("🚪", t("Sign out", "ထွက်မည်"), async () => { await sb.auth.signOut(); toast(t("Signed out", "ထွက်ပြီးပါပြီ")); }, "red")
  ] : [
    item("👤", t("Sign in / Sign up", "Sign in / Sign up"), () => authScreen("in")),
    item("🌐", t("Language", "ဘာသာစကား"), openLanguage),
    item("📤", t("Share", "မျှဝေရန်"), shareApp),
    item("📲", t("Install app", "App install လုပ်ရန်"), doInstall)
  ];
  const dr = h("div", {class:"drawer"}, h("div", {class:"dh"}, user ? avatar(P.avatar_url, uname(), 40) : null, h("b", {}, user ? uname() : "OpenVideo"), h("button", {class:"x", onclick: close}, "✕")), items);
  document.body.append(back, dr);
}
function shareApp(){ const link = location.origin + location.pathname + (prof && prof.referral_code ? "?ref=" + prof.referral_code : ""); shareSheet(link, "OpenVideo – " + t("camera effects, beauty, 24-hour snaps", "ကင်မရာ Effect၊ Beauty၊ ၂၄ နာရီ snap")); }
function editProfile(){
  const P = prof || {};
  const nm = h("input", {value: P.username || "", maxlength:30, placeholder:t("Name", "အမည်")});
  const bio = h("textarea", {rows:3, maxlength:160, placeholder:t("Bio", "ကိုယ်ရေးအကျဉ်း")}); bio.value = P.bio || "";
  const o = overlay(t("Edit profile", "Profile ပြင်ရန်"), h("div", {class:"pad"}, h("div", {class:"card"},
    h("div", {style:"display:grid;gap:10px"},
      h("button", {class:"btn alt", onclick: () => pickPic("avatar")}, "📷 " + t("Change profile picture", "Profile ပုံပြောင်းမည်")),
      h("button", {class:"btn alt", onclick: () => pickPic("cover")}, "🖼 " + t("Change cover", "Cover ပြောင်းမည်")),
      h("p", {}, t("Name", "အမည်")), nm, h("p", {}, t("Bio", "ကိုယ်ရေးအကျဉ်း")), bio,
      h("button", {class:"btn pink", onclick: async () => {
        const {error} = await sb.from("profiles").update({username: nm.value.trim() || P.username, bio: bio.value.trim() || null}).eq("id", user.id);
        if(error){ toast(t("Failed", "မအောင်မြင်ပါ")); return; }
        toast(t("Saved", "သိမ်းပြီးပါပြီ")); await loadProfile(); o.close(); if(tab === "profile") drawProfile();
      }}, t("Save", "သိမ်းမည်"))))));
}
function openLanguage(){
  const pick = l => h("button", {class:"mi", style:"border:1px solid var(--bd);border-radius:14px;margin-bottom:10px", onclick: () => setLang(l)},
    h("span", {}, LANG === l ? "✅" : "⚪"), h("span", {}, l === "en" ? "English" : "မြန်မာ"));
  overlay(t("Language", "ဘာသာစကား"), h("div", {class:"pad"}, h("p", {class:"sub", style:"color:var(--mu);line-height:1.6"}, t("The whole app switches language. The page will reload.", "App တစ်ခုလုံး ဘာသာစကားပြောင်းပါမည်။ စာမျက်နှာ ပြန်ဖွင့်ပါမည်။")), pick("en"), pick("my")));
}

/* ---------------- Security & password ---------------- */
function openSecurity(){
  const body = h("div", {class:"pad"});
  const o = overlay(t("Security & password", "လုံခြုံရေးနှင့် Password"), body);
  const prov = (user.app_metadata && user.app_metadata.providers || []).join(", ") || "email";
  const row = (ic, label, fn) => h("button", {class:"mi", style:"border:1px solid var(--bd);border-radius:14px;margin-bottom:10px;display:flex;gap:12px;width:100%;padding:15px;text-align:left", onclick: fn}, h("span", {}, ic), h("span", {}, label));
  body.append(h("div", {class:"card"}, h("h3", {}, t("Account", "အကောင့်")), h("div", {class:"kv"}, h("span", {}, "Email"), h("b", {}, user.email || "–")), h("div", {class:"kv"}, h("span", {}, t("Signed in with", "ဝင်ရောက်ပုံ")), h("b", {}, prov))),
    row("🔑", t("Set password", "Password သတ်မှတ်ရန်"), () => passForm(false)),
    row("🔁", t("Change password", "Password ပြောင်းရန်"), () => passForm(true)),
    row("✉️", t("Change email", "Email ပြောင်းရန်"), emailForm),
    row("📱", t("2-step verification (Google Authenticator)", "၂ ဆင့်အတည်ပြုခြင်း (Google Authenticator)"), twoFA));
}
function passForm(change){
  const a = h("input", {type:"password", placeholder:t("New password (8+ characters)", "Password အသစ် (၈ လုံးနှင့်အထက်)"), autocomplete:"new-password"});
  const b = h("input", {type:"password", placeholder:t("Repeat new password", "Password အသစ် ထပ်ရိုက်ပါ"), autocomplete:"new-password"});
  const msg = h("div", {class:"err"});
  const o = overlay(change ? t("Change password", "Password ပြောင်းရန်") : t("Set password", "Password သတ်မှတ်ရန်"), h("div", {class:"authw"},
    h("p", {class:"sub"}, change ? t("Choose a new password.", "Password အသစ်ရွေးပါ။") : t("A password lets you sign in without waiting for an email code.", "Password ရှိလျှင် email code မစောင့်ဘဲ ဝင်နိုင်ပါသည်။")),
    a, b, h("button", {class:"btn pink", style:"width:100%", onclick: async () => {
      if(a.value.length < 8){ msg.textContent = t("At least 8 characters.", "အနည်းဆုံး ၈ လုံးရှိရမည်။"); return; }
      if(a.value !== b.value){ msg.textContent = t("The two passwords don't match.", "Password နှစ်ခု မတူပါ။"); return; }
      const {error} = await sb.auth.updateUser({password: a.value});
      if(error){ msg.textContent = ERR(error); return; }
      toast(t("Password saved ✓", "Password သိမ်းပြီးပါပြီ ✓")); o.close();
    }}, t("Save", "သိမ်းမည်")), msg));
}
function emailForm(){
  const a = h("input", {type:"email", placeholder:t("New email", "Email အသစ်"), autocomplete:"email"});
  const msg = h("div", {class:"err"});
  const o = overlay(t("Change email", "Email ပြောင်းရန်"), h("div", {class:"authw"},
    h("p", {class:"sub"}, t("We'll send a confirmation link to the new address. The change applies after you confirm.", "Email အသစ်သို့ အတည်ပြု link ပို့ပါမည်။ အတည်ပြုပြီးမှ ပြောင်းလဲပါမည်။")), a,
    h("button", {class:"btn pink", style:"width:100%", onclick: async () => {
      if(!a.value.trim()) return;
      const {error} = await sb.auth.updateUser({email: a.value.trim()}, {emailRedirectTo: redirect()});
      if(error){ msg.className = "err"; msg.textContent = authErr(error); return; }
      msg.className = "ok"; msg.textContent = t("Confirmation email sent. Check your inbox.", "အတည်ပြု email ပို့ပြီးပါပြီ။ Inbox ကိုစစ်ပါ။");
    }}, t("Send confirmation", "အတည်ပြု link ပို့မည်")), msg));
}
async function twoFA(){
  const body = h("div", {class:"authw"});
  const o = overlay(t("2-step verification", "၂ ဆင့်အတည်ပြုခြင်း"), body);
  async function draw(){
    body.replaceChildren(h("div", {class:"msg"}, "…"));
    const {data, error} = await sb.auth.mfa.listFactors();
    if(error){ body.replaceChildren(h("div", {class:"err"}, ERR(error))); return; }
    const on = (data.totp || [])[0];
    if(on){
      body.replaceChildren(h("div", {class:"card"}, h("h3", {}, "✅ " + t("Turned on", "ဖွင့်ထားသည်")), h("p", {}, t("You'll be asked for a 6-digit Authenticator code every time you sign in.", "Sign in လုပ်တိုင်း Authenticator ၏ ဂဏန်း ၆ လုံး code တောင်းပါမည်။"))),
        h("button", {class:"btn alt red", style:"width:100%", onclick: async () => {
          if(!confirm(t("Turn off 2-step verification?", "၂ ဆင့်အတည်ပြုခြင်း ပိတ်မလား?"))) return;
          const r = await sb.auth.mfa.unenroll({factorId: on.id});
          if(r.error){ toast(ERR(r.error)); return; } toast(t("Turned off", "ပိတ်ပြီးပါပြီ")); draw();
        }}, t("Turn off", "ပိတ်မည်")));
      return;
    }
    body.replaceChildren(h("div", {class:"card"}, h("h3", {}, t("Protect your account", "သင့်အကောင့်ကို ကာကွယ်ပါ")),
      h("p", {}, t("Use the free Google Authenticator app. Scan a QR code once, then enter a 6-digit code when signing in.", "အခမဲ့ Google Authenticator app ကိုသုံးပါ။ QR code ကို တစ်ကြိမ်စကင်ဖတ်ပြီး Sign in လုပ်တိုင်း ဂဏန်း ၆ လုံး code ထည့်ရပါမည်။"))),
      h("button", {class:"btn pink", style:"width:100%", onclick: enroll}, t("Set up", "စတင်သတ်မှတ်မည်")));
  }
  async function enroll(){
    for(const f of ((await sb.auth.mfa.listFactors()).data?.all || [])) if(f.status === "unverified") await sb.auth.mfa.unenroll({factorId: f.id});
    const {data, error} = await sb.auth.mfa.enroll({factorType:"totp", friendlyName:"OpenVideo " + Date.now().toString(36)});
    if(error){ body.replaceChildren(h("div", {class:"err"}, ERR(error))); return; }
    const code = h("input", {inputmode:"numeric", maxlength:6, placeholder:"000000", autocomplete:"one-time-code"});
    const msg = h("div", {class:"err"});
    body.replaceChildren(
      h("p", {class:"sub"}, t("1) In Google Authenticator tap ＋ and scan this QR code (or type the key).", "၁) Google Authenticator တွင် ＋ ကိုနှိပ်ပြီး ဤ QR code ကို စကင်ဖတ်ပါ (သို့မဟုတ် key ကိုရိုက်ထည့်ပါ)။")),
      h("div", {class:"qr"}, h("img", {alt:"QR", src: data.totp.qr_code})), h("div", {class:"sec2"}, data.totp.secret),
      h("p", {class:"sub"}, t("2) Enter the 6-digit code it shows:", "၂) ပေါ်လာသော ဂဏန်း ၆ လုံး code ကို ထည့်ပါ -")), code,
      h("button", {class:"btn pink", style:"width:100%", onclick: async () => {
        const r = await sb.auth.mfa.challengeAndVerify({factorId: data.id, code: code.value.trim()});
        if(r.error){ msg.textContent = t("Wrong code, try again.", "Code မမှန်ပါ၊ ပြန်စမ်းပါ။"); return; }
        toast(t("2-step verification is on ✓", "၂ ဆင့်အတည်ပြုခြင်း ဖွင့်ပြီးပါပြီ ✓")); draw();
      }}, t("Turn on", "ဖွင့်မည်")), msg);
  }
  draw();
}

/* ---------------- Owner center ---------------- */
function openOwner(){
  const body = h("div", {class:"oc"});
  const o = overlay(t("Owner center", "Owner center"), body); o.classList.add("wide");
  const tabs = h("div", {class:"octabs"}), pane = h("div", {});
  const defs = [["ov", t("Overview", "အနှစ်ချုပ်"), ocOverview], ["us", t("Users", "အသုံးပြုသူများ"), ocUsers], ["ct", t("Content", "Post များ"), ocContent], ["st", t("Settings", "Settings"), ocSettings]];
  const show = k => { [...tabs.children].forEach((b, i) => b.classList.toggle("on", defs[i][0] === k)); pane.replaceChildren(); defs.find(d => d[0] === k)[2](pane); };
  defs.forEach(([k, l]) => tabs.append(h("button", {onclick: () => show(k)}, l)));
  body.append(tabs, pane); show("ov");
}
async function ocOverview(pane){
  pane.append(h("div", {class:"msg"}, "…"));
  const {data, error} = await sb.rpc("admin_stats");
  pane.replaceChildren();
  if(error){ pane.append(h("div", {class:"card"}, h("p", {}, ERR(error) + " — " + t("Run update3.sql and make_owner.sql in Supabase.", "Supabase တွင် update3.sql နှင့် make_owner.sql ကို run ပါ။")))); return; }
  const c = (n, l) => h("div", {class:"card"}, h("b", {}, fmt(+n || 0)), h("small", {}, l));
  pane.append(h("div", {class:"ocg"}, c(data.users, t("Users", "အသုံးပြုသူ")), c(data.new_24h, t("New (24h)", "အသစ် (၂၄ နာရီ)")), c(data.active_5m, t("Active now", "Active")), c(data.banned, t("Banned", "Ban ထား")),
    c(data.posts_live, t("Live posts", "လက်ရှိ post")), c(data.posts_hidden, t("Hidden posts", "ဝှက်ထား post")), c(data.reports, t("Reports", "Report")), c(data.messages_live, t("Live messages", "Message")), c(data.points_total, t("Points in wallets", "Point စုစုပေါင်း"))));
}
async function ocSettings(pane){
  const {data} = await sb.rpc("get_settings");
  const S = Object.assign({}, SET, data || {});
  const card = h("div", {class:"card"}); pane.append(card);
  const sw = (key, title, desc) => {
    const g = h("button", {class:"tg" + (S[key] ? " on" : ""), "aria-label": title, role:"switch", "aria-checked": String(!!S[key]), onclick: async () => {
      const v = !S[key];
      const {error} = await sb.rpc("admin_set_setting", {p_key: key, p_value: v});
      if(error){ toast(ERR(error)); return; }
      S[key] = v; g.classList.toggle("on", v); g.setAttribute("aria-checked", String(v)); await loadSettings(); toast(t("Saved ✓", "သိမ်းပြီးပါပြီ ✓"));
    }});
    return h("div", {class:"swr"}, h("div", {class:"txw"}, h("b", {}, title), h("small", {}, desc)), g);
  };
  card.append(h("h3", {}, t("Access & points", "အသုံးပြုခွင့်နှင့် Point")),
    sw("points_spend", t("Points system (camera & posting cost points)", "Point စနစ် (ကင်မရာ/post တင်ရန် Point နုတ်မည်)"), t("OFF = everything is free for now. Points from referrals and watching videos keep accumulating either way.", "ပိတ်ထားလျှင် လောလောဆယ် အားလုံးအခမဲ့။ Referral နှင့် ဗီဒီယိုကြည့်၍ ရသော Point များကို မည်သို့ပင်ဖြစ်စေ ဆက်စုပါမည်။")),
    sw("camera_enabled", t("Camera enabled", "ကင်မရာ ဖွင့်ထားမည်"), t("Turn OFF to close the camera for everyone.", "ပိတ်လျှင် လူတိုင်း ကင်မရာမသုံးနိုင်ပါ။")),
    sw("posting_enabled", t("Posting enabled", "Post တင်ခွင့် ဖွင့်ထားမည်"), t("Turn OFF to stop all new posts.", "ပိတ်လျှင် post အသစ် မတင်နိုင်ပါ။")));
}
async function ocContent(pane){
  const list = h("div", {}); pane.append(list);
  async function draw(){
    list.replaceChildren(h("div", {class:"msg"}, "…"));
    const {data, error} = await sb.rpc("admin_posts", {p_limit: 50, p_offset: 0});
    list.replaceChildren();
    if(error){ list.append(h("div", {class:"msg"}, ERR(error))); return; }
    if(!(data || []).length) list.append(h("div", {class:"msg"}, t("No live posts.", "လက်ရှိ post မရှိပါ။")));
    (data || []).forEach(p => {
      const r = h("div", {class:"hrow"}, p.media_type === "image" ? h("img", {class:"t", src: p.media_url, alt:""}) : h("div", {class:"ph0"}),
        h("div", {style:"flex:1;min-width:0;text-align:left"}, h("b", {}, p.caption || t("(no caption)", "(စာတန်းမရှိ)")), h("small", {}, p.author_name + " · " + ago(p.created_at) + " · ⚑ " + p.reports + (p.hidden ? " · " + t("hidden", "ဝှက်ထား") : ""))),
        h("div", {style:"display:flex;flex-direction:column;gap:6px"},
          h("button", {class:"btn alt sm", onclick: async () => { await sb.rpc("admin_set_post_hidden", {p_post: p.id, p_hidden: !p.hidden}); draw(); }}, p.hidden ? t("Unhide", "ပြန်ပြ") : t("Hide", "ဝှက်")),
          h("button", {class:"btn red sm", onclick: async () => { if(!confirm(t("Delete this post?", "ဤ post ကိုဖျက်မလား?"))) return; await sb.rpc("admin_delete_post", {p_post: p.id}); HF.loaded = false; draw(); }}, t("Delete", "ဖျက်"))));
      list.append(r);
    });
  }
  draw();
}
function ocUsers(pane){
  const q = h("input", {type:"search", placeholder:t("Search name or email…", "အမည် သို့မဟုတ် email ရှာရန်…")});
  const tb = h("div", {}); let off = 0, term = "";
  pane.append(h("form", {onsubmit: e => { e.preventDefault(); term = q.value.trim(); off = 0; tb.replaceChildren(); load(); }}, q), h("div", {style:"height:10px"}), tb);
  const more = h("button", {class:"btn alt", style:"margin:10px auto;display:block", onclick: () => load()}, t("Load more", "ထပ်ကြည့်မည်"));
  async function act(u, fn){ const {error} = await fn(); if(error){ toast(ERR(error)); return; } toast(t("Done ✓", "ပြီးပါပြီ ✓")); off = 0; tb.replaceChildren(); load(); }
  const btns = u => [
    u.is_admin ? h("span", {class:"pill alt"}, "Owner") : h("button", {class:"btn " + (u.banned ? "alt" : "red") + " sm", onclick: () => act(u, () => sb.rpc("admin_set_ban", {p_user: u.id, p_ban: !u.banned}))}, u.banned ? t("Unban", "Ban ဖြုတ်") : t("Ban", "Ban")),
    h("button", {class:"btn alt sm", onclick: () => { const v = prompt(t("Points to add (negative to remove):", "ထည့်မည့် Point (နုတ်လျှင် အနုတ်ကိန်း):"), "10"); const n = parseInt(v, 10); if(!n) return; act(u, () => sb.rpc("admin_adjust_points", {p_user: u.id, p_delta: n, p_note: "owner"})); }}, "⭐ ±"),
    h("button", {class:"btn alt sm", onclick: () => openProfile(u.id, u)}, t("View", "ကြည့်"))];
  async function load(){
    const {data, error} = await sb.rpc("admin_users", {p_q: term, p_limit: 30, p_offset: off});
    if(error){ tb.replaceChildren(h("div", {class:"msg"}, ERR(error))); return; }
    const rows = data || []; off += rows.length; more.remove();
    let table = tb.querySelector("table");
    if(!table){
      table = h("table", {class:"utab"}, h("thead", {}, h("tr", {}, ["", t("Name", "အမည်"), "Email", t("Joined", "ဖွင့်သည့်ရက်"), t("Last seen", "နောက်ဆုံးတွေ့"), "⭐", t("Posts", "Post"), "", ""].map(x => h("th", {}, x)))), h("tbody", {}));
      tb.append(table);
    }
    rows.forEach(u => {
      const st = u.banned ? " 🚫" : "";
      table.tBodies[0].append(h("tr", {}, h("td", {}, avatar(u.avatar_url, u.username, 32)), h("td", {}, u.username + st), h("td", {}, u.email || ""), h("td", {}, new Date(u.created_at).toLocaleDateString()),
        h("td", {}, u.last_seen ? ago(u.last_seen) : "–"), h("td", {}, String(u.balance)), h("td", {}, String(u.posts)), h("td", {colspan:2}, h("div", {style:"display:flex;gap:6px"}, btns(u)))));
      tb.append(h("div", {class:"ucard"}, h("div", {style:"display:flex;gap:10px;align-items:center"}, avatar(u.avatar_url, u.username, 40), h("div", {}, h("b", {}, u.username + st), h("small", {style:"display:block;color:var(--mu)"}, u.email || ""))),
        h("div", {class:"kv"}, h("span", {}, "⭐ " + u.balance + " · " + t("Posts", "Post") + " " + u.posts), h("span", {}, u.last_seen ? ago(u.last_seen) : "–")), h("div", {class:"r"}, btns(u))));
    });
    if(rows.length === 30) tb.append(more);
    if(!tb.children.length) tb.append(h("div", {class:"msg"}, t("No users found.", "အသုံးပြုသူ မတွေ့ပါ။")));
  }
  load();
}

/* ---------------- boot ---------------- */
(function(){
  const lc = ["Menu"]; void lc;
  if(sb) loadSettings();
  setBar();
})();
