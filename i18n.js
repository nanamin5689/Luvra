"use strict";
/* ============ Luvra v6 – Myanmar ⇄ English ============
   မူလ မြန်မာစာများကို English သို့ စာကြောင်းအပိုင်းအစအလိုက် ပြောင်းသည်။
   စာအသစ်များကို t("English", "မြန်မာ") ဖြင့် နှစ်ဘာသာ တိုက်ရိုက်ရေးထားသည်။ */
const LANG = (() => { try{ return localStorage.getItem("ov_lang") || "my"; }catch(e){ return "my"; } })();
const t = (en, my) => (LANG === "my" && my != null) ? my : en;
const EN_RAW = {
"Luvra – Beauty ကင်မရာနှင့် ချစ်စရာ အခိုက်အတန့်များ မျှဝေရန်":"Luvra – Beauty camera and lovely moments to share",
"အမျိုးအစားများ":"Categories","ရှာဖွေရန်":"Search","စာတန်း (meme) ထည့်ရန်…":"Add a caption (meme)…",
"ပုံ/ဗီဒီယို ပြောင်းရန်":"Switch photo / video","ရိုက်ရန်":"Capture","ကင်မရာလှည့်ရန်":"Flip camera","ပင်မမီနူး":"Main menu",
"မိနစ်ကြာလျှင်":"minutes","မိနစ်က":"min ago","နာရီက":"h ago","ရက်က":"d ago","သက်တမ်းကုန်ပြီ":"Expired","မိနစ် ကျန်":"min left","နာရီ ကျန်":"h left","မိနစ်":"min",
"သင့်အတွက်":"For you","သဘာဝ":"Nature","မြို့":"City","တိရစ္ဆာန်":"Animals","အစားအစာ":"Food","ခရီး":"Travel","နည်းပညာ":"Technology","လူများ":"People","အားကစား":"Sports",
"ပင်မ":"Home","ဗီဒီယိုများ":"Videos","ဗီဒီယို":"Video","ကင်မရာ":"Camera","ကျွန်ုပ်၏":"My","ကျွန်ုပ်":"Me",
"Referral အောင်မြင်ပါသည်!":"Referral successful!","Supabase ကို config.js တွင် မချိတ်ရသေးပါ။":"Supabase is not connected in config.js yet.",
"ပို့နေသည်…":"Sending…","မအောင်မြင်ပါ -":"Failed –","မအောင်မြင်ပါ":"Failed",
"Email ကို စစ်ပါ။ Login link ကိုနှိပ်ပြီး ဤ app သို့ ပြန်လာပါ။":"Check your email and tap the login link to come back to this app.",
"အကောင့်ဝင်ရန်":"Sign in","ပိတ်မည်":"Close",
"လိုင်စင်အချက်အလက်ကို ဖိုင်တင်သူက ကိုယ်တိုင်ဖြည့်ထားခြင်းဖြစ်ပြီး မှားနေနိုင်ပါသည်။ မှန်ကန်မှုမရှိဟု ထင်ပါက Report လုပ်ပါ။":"The licence info is entered by the uploader and may be wrong. Report it if you think it is incorrect.",
"YouTube ၏ တရားဝင် player":"YouTube's official player",
"ဗီဒီယိုကြည့်ရှုမှု ဆု":"video watching reward",
"ဤဗီဒီယိုမှ ယနေ့ရပြီးသား သို့မဟုတ် တစ်နေ့ကန့်သတ်ချက် ပြည့်ပါပြီ":"Already earned from this video today, or the daily limit is reached",
"အကောင့်ဝင်ပြီး":"Sign in and watch for","စက္ကန့်ကြည့်ရင် ⭐ ရပါမယ်":"seconds to earn ⭐",
"⚑ Report လုပ်မည်":"⚑ Report","ဖန်တီးသူ -":"Creator –","လိုင်စင် -":"Licence –","မူလစာမျက်နှာတွင် ကြည့်မည်":"View on the original page",
"post၊ ဗီဒီယို၊ လူ ရှာရန်…":"Search posts, videos, people…","ရှာနေပါသည်…":"Searching…",
"Chat သုံးရန် အကောင့်ဝင်ပါ။ (ကြည့်ရုံသက်သက်ဆိုလျှင် အကောင့်မလိုပါ)":"Sign in to use Chat. (No account is needed just to browse.)",
"Chat သုံးရန် အကောင့်ဝင်ပါ":"Sign in to use Chat","💬 Chat စပြောမည်":"💬 Start chatting","Post များ":"Posts","မတွေ့ပါ":"Not found","(စာတန်းမရှိ)":"(no caption)",
"Supabase မချိတ်ရသေးပါ":"Supabase is not connected","Chat သုံးရန် config.js ကို အရင်ပြင်ပါ။":"Edit config.js first to use Chat.",
"＋ စကားစပြောမည်":"＋ New chat","⏳ မက်ဆေ့ချ်များသည်":"⏳ Messages","အလိုအလျောက် ပျောက်သွားပါမည်။":"disappear automatically.",
"စကားဝိုင်း မရှိသေးပါ။ “စကားစပြောမည်” သို့မဟုတ် Post ပေါ်က 💬 ကိုနှိပ်ပါ။":"No conversations yet. Tap “New chat” or the 💬 on a post.",
"သင်:":"You:","မက်ဆေ့ချ် မရှိတော့ပါ":"No messages left","အမည်ဖြင့် ရှာရန်…":"Search by name…","စကားစပြောမည်":"Start a chat","စာရေးရန်…":"Write a message…","နောက်သို့":"Back",
"မက်ဆေ့ချ်များ ပျောက်ပါမည်":"messages will disappear","မက်ဆေ့ချ် အလွန်မြန်နေသည်၊ ခဏစောင့်ပါ":"Sending too fast, please wait",
"ပို့မရပါ (block ထားသည်)":"Can't send (blocked)","ပို့မရပါ -":"Couldn't send –","ပို့":"Send","စကားစပြောလိုက်ပါ 👋":"Say hello 👋",
"တင်နေသည်…":"Uploading…","ပြောင်းပြီးပါပြီ":"Changed",
"ကြိုဆိုအမှတ်":"Welcome bonus","ဗီဒီယိုကြည့်ရှု":"Watched a video","Referral ဖြင့် ဝင်ရောက်":"Joined with a referral","သူငယ်ချင်း ဖိတ်ခေါ်မှု":"Friend invited","ကင်မရာ အသုံးပြု":"Camera use","Owner မှ ချိန်ညှိ":"Adjusted by owner",
"config.js ကို အရင်ပြင်ပါ။":"Edit config.js first.",
"ကြည့်ရှုရုံဆိုလျှင် အကောင့်မလိုပါ။ Post တင်ရန်၊ ကင်မရာသုံးရန်၊ Chat လုပ်ရန်၊ Point ရယူရန်သာ အကောင့်လိုပါသည်။":"No account is needed just to browse. You only need one to post, use the camera, chat or earn points.",
"Google၊ Facebook သို့မဟုတ် Email ဖြင့် ဝင်နိုင်ပါသည် – စကားဝှက်မလိုပါ။":"Sign in with Google, Facebook or Email – no password needed.",
"📷 Cover ပြောင်းမည်":"📷 Change cover","အမည်":"Name","ကိုယ်ရေးအကျဉ်း":"Bio","သိမ်းပြီးပါပြီ":"Saved","သိမ်းမည်":"Save","ပုံပြောင်းရန်":"Change picture","✏️ ပြင်မည်":"✏️ Edit","ထွက်ပြီးပါပြီ":"Signed out",
"ကျွန်ုပ်၏ Point":"My points","ရယူနည်း":"How to earn","စက္ကန့်ကြည့်ရှု":"seconds watched","+2 (တစ်နေ့ ≤ 20)":"+2 (max 20 / day)","သူငယ်ချင်းတစ်ဦး ဖိတ်ခေါ်":"Invite a friend","သုံးစွဲမှု":"Spending","ဓာတ်ပုံရိုက်":"Take a photo","ဗီဒီယိုရိုက်":"Record a video",
"Luvra တွင် ကျွန်ုပ်နှင့်အတူ ပါဝင်ပါ – Referral code:":"Join me on Luvra – Referral code:","Link ကူးပြီးပါပြီ":"Link copied","Link ကို ရွေး၍ ကူးပါ":"Select the link and copy it",
"🎁 သူငယ်ချင်းဖိတ်ပြီး Point ရယူပါ":"🎁 Invite friends and earn points",
"ကိုယ့်ဖိတ်စာ link ဖြင့် အကောင့်သစ်ဖွင့်သူတိုင်းအတွက် သင် ⭐ +50 ရပြီး သူ/သူမလည်း ⭐ +20 ရပါမည်။ Referral code:":"For everyone who signs up with your invite link, you get ⭐ +50 and they get ⭐ +20. Referral code:",
"မျှဝေမည်":"Share","သူငယ်ချင်း၏ referral code ရှိလျှင် ထည့်ပါ":"Enter a friend's referral code if you have one","အောင်မြင်ပါသည်! ⭐ +20":"Success! ⭐ +20",
"Code မမှန်ပါ":"Invalid code","အသုံးပြုပြီးသားပါ":"Already used","ကိုယ့် code ကို မသုံးနိုင်ပါ":"You can't use your own code","အကောင့်ဖွင့်ပြီး ၇ ရက်ကျော်၍ မရတော့ပါ":"Not allowed more than 7 days after sign-up","အသုံးပြုမည်":"Apply",
"မကြာသေးမီ Point မှတ်တမ်း":"Recent points history","ကျွန်ုပ်၏ ယခုတင်ထားသော post များ (၂၄ နာရီအတွင်း)":"My current posts (last 24 hours)","မှတ်တမ်း မရှိသေးပါ":"No history yet","Post မရှိသေးပါ":"No posts yet",
"ဖျက်မလား?":"Delete?","ဖျက်ပြီးပါပြီ":"Deleted","ဖျက်":"Delete",
"Auto – မျက်နှာကို အလိုအလျောက် လိုက်ရှာပါမည်":"Auto – tracks your face automatically","အရွယ်အစား":"Size","အားပြင်း":"Strength",
"အကောင့်ဝင်ပါ":"Sign in","ဤသူ":"this person","ကို Block လုပ်မလား? သူ့ post နှင့် chat ကို မမြင်ရတော့ပါ။":"— block this person? You will no longer see their posts or chat.","Block လုပ်ပြီးပါပြီ":"Blocked",
"မရှိသေးပါ":"Nothing yet","ချိတ်ဆက်မှု မအောင်မြင်ပါ။ အင်တာနက်ကို စစ်ပြီး ပြန်စမ်းပါ။":"Connection failed. Check your internet and try again.","ဤ post ပျောက်သွားပါပြီ":"This post is gone",
"အလွန်မြန်နေသည်၊ ခဏစောင့်ပါ":"Too fast, please wait","Reaction ပေးရန် အကောင့်ဝင်ပါ":"Sign in to react","comment ရေးရန်…":"Write a comment…","Comment ရေးရန် အကောင့်ဝင်ပါ":"Sign in to comment","💬 Comment များ":"💬 Comments",
"Comment အလွန်မြန်နေသည်၊ ခဏစောင့်ပါ":"Commenting too fast, please wait","link တစ်ခုထက် မများရပါ":"No more than one link","တူညီသော comment ကို ထပ်မရေးပါနှင့်":"Don't post the same comment twice","ဖွင့်မရပါ":"Couldn't open",
"Comment မရှိသေးပါ။ ပထမဆုံး ရေးကြည့်ပါ 💬":"No comments yet. Be the first 💬","ဒေါင်းလုဒ်လုပ်နေသည်…":"Downloading…","ဖုန်းထဲ သိမ်းပြီးပါပြီ":"Saved to your phone",
"📘 Facebook တွင် မျှဝေမည်":"📘 Share on Facebook","📤 အခြား app များသို့ (Messenger, Telegram …)":"📤 Other apps (Messenger, Telegram …)","Link ကို ကူးပါ":"Copy the link","🔗 Link ကူးမည်":"🔗 Copy link",
"မှတ်ချက် - post သည် ၂၄ နာရီပြည့်လျှင် ပျောက်သွားပါမည်။ Facebook တွင် preview ပုံသည် Luvra ၏ logo သာ ပေါ်ပါမည်။":"Note: a post disappears after 24 hours. On Facebook the preview image will only show the Luvra logo.",
"⬇️ ဒေါင်းလုဒ်":"⬇️ Download","↗️ မျှဝေ":"↗️ Share","ဤ post ကို ဖျက်မလား?":"Delete this post?","🗑 ဖျက်မည်":"🗑 Delete","ကို Block":"— Block",
"Report လုပ်ရန် အကောင့်ဝင်ပါ":"Sign in to report","Report – အကြောင်းပြချက်":"Report – reason","Spam / ကြော်ငြာ":"Spam / ads","မလျော်ကန်သော အကြောင်းအရာ":"Inappropriate content","မူပိုင်ခွင့် ချိုးဖောက်":"Copyright violation","အခြား":"Other",
"Report လုပ်ပြီးသားပါ":"Already reported","ခဏစောင့်ပါ":"Please wait","Report လုပ်ပြီးပါပြီ၊ ကျေးဇူးတင်ပါသည်":"Reported, thank you","Follow လုပ်ရန် အကောင့်ဝင်ပါ":"Sign in to follow","🔇 အသံဖွင့်ရန် ထိပါ":"🔇 Tap to unmute",
"config.js တွင် Supabase URL နှင့် key ဖြည့်ပြီး setup.sql ကို run ပါ။ (README ကိုကြည့်ပါ)":"Fill in the Supabase URL and key in config.js and run setup.sql (see README).","ဗီဒီယိုများ ကြည့်မည်":"Watch videos",
"ယခု post မရှိသေးပါ။ ကင်မရာမှ ပထမဆုံး post ကို တင်ကြည့်ပါ။ 📸":"No posts yet. Post the first one from the camera. 📸",
"အချက်အလက်":"Info","နောက်":"Next","⭐ ဝင်ပြီးကြည့်ရင် Point ရမည်":"⭐ Sign in to earn points","✓ Point ရပြီး":"✓ Points earned","✓ ယနေ့ရပြီး/ကန့်သတ်ချက်ပြည့်":"✓ Done today / limit reached",
"ရလဒ်မတွေ့ပါ။ အခြားအမျိုးအစားကို ရွေးကြည့်ပါ။":"No results. Try another search.","ဤ post သည် သက်တမ်းကုန်သွားပါပြီ (၂၄ နာရီပြည့်လျှင် ပျောက်ပါသည်)":"This post has expired (posts disappear after 24 hours)",
"📲 Luvra ကို app အဖြစ် install လုပ်မလား?":"📲 Install Luvra as an app?","ပိတ်":"Close","Install လုပ်ပြီးပါပြီ 🎉":"Installed 🎉","App အဖြစ် install လုပ်ပြီးသားပါ":"Already installed as an app",
"GitHub ပေါ်တွင် ဤဖိုင်များ မတွေ့ပါ -":"These files were not found on GitHub –","။ repo ၏ root တွင် တင်ပါ (ဖိုင်နာမည် အတိအကျ)။":". Upload them to the repo root (exact file names).",
"Service worker မစတင်သေးပါ။ စာမျက်နှာကို ပိတ်ပြီး ပြန်ဖွင့်၍ ၁၀ စက္ကန့်စောင့်ပါ၊ ပြီးမှ ပြန်နှိပ်ပါ။":"The service worker hasn't started. Close and reopen the page, wait 10 seconds, then try again.",
"ဖိုင်များ အဆင်ပြေပါသည်။ Chrome ၏ ⋮ menu တွင် “Install app” ပေါ်လျှင် ရွေးပါ။ “Add to Home screen” သာပေါ်လျှင် Chrome ကို update လုပ်ပါ သို့မဟုတ် Chrome Settings > Site settings မှ ဤ site data ကို ဖျက်ပြီး ပြန်ဖွင့်ပါ။":"The files are fine. In Chrome's ⋮ menu choose “Install app” if it appears. If only “Add to Home screen” appears, update Chrome or clear this site's data in Chrome Settings > Site settings and reopen.",
"📲 Install စစ်ဆေးချက်":"📲 Install check","📲 App & မျှဝေရန်":"📲 App & sharing","ဖုန်း home screen သို့ app အဖြစ် ထည့်ပြီး Facebook တွင် မျှဝေနိုင်ပါသည်။":"Add it to your home screen as an app and share it on Facebook.",
"📲 App ကို install လုပ်မည်":"📲 Install the app","📘 Facebook သို့ မျှဝေမည်":"📘 Share to Facebook","⛔ Block လုပ်ထားသူများ":"⛔ Blocked people","မရှိပါ":"None","Block ဖြုတ်ပြီး":"Unblocked","ဖြုတ်မည်":"Unblock",
"ရယ်စရာ":"Funny","သရဖူ":"Crown","မျက်မှန်":"Glasses","နှုတ်ခမ်းမွေး":"Moustache","ပြက်လုံး":"Joke","ချစ်မျက်လုံး":"Heart eyes","ကြယ်မျက်လုံး":"Star eyes","ကြောင်":"Cat","ယုန်":"Bunny","ခွေး":"Dog","ပန်ဒါ":"Panda","ကောင်းကင်ဘုံ":"Heaven","မာရ်နတ်":"Devil","မီး":"Fire","ပါးကွက်":"Blush","ချစ်စရာ":"Cute","မျက်နှာဖုံး":"Mask","လက်ခနဲ":"Sparkle","ပန်းသရဖူ":"Flower crown","နှလုံးပျံ":"Floating hearts",
"မျက်နှာဖောင်း":"Puffy face","မျက်နှာပိန်":"Slim face","မျက်လုံးကြီး":"Big eyes","နှာခေါင်းကြီး":"Big nose","ပါးစပ်ကြီး":"Big mouth","ပါးဖောင်း":"Puffy cheeks","ဂြိုဟ်သား":"Alien","လှည့်":"Swirl","လှိုင်း":"Wave","မှန်":"Mirror","အဖြူအမည်း":"B&W","ရှေးဟောင်း":"Vintage","ကာတွန်း":"Cartoon","အေး":"Cool","နွေး":"Warm","အိပ်မက်":"Dream","🌀 ပုံပျက်":"🌀 Warp",
"WebGL shader မအောင်မြင်ပါ":"WebGL shader failed","မျက်နှာ auto ရှာစနစ် မရပါ၊ လက်ဖြင့် ထိ/ဆွဲ၍ ချိန်ညှိပါ":"Auto face detection isn't available. Touch/drag to position manually.","👆 လက်ဖြင့်ချိန်":"👆 Manual",
"🙂 မျက်နှာတွေ့ပြီ":"🙂 Face found","⏳ မော်ဒယ်ဖွင့်နေ…":"⏳ Loading model…","🔍 မျက်နှာရှာနေ…":"🔍 Looking for a face…","ကင်မရာ ဖွင့်မရပါ။ Browser တွင် ကင်မရာခွင့်ပြုချက် (permission) ပေးထားပါ။":"Can't open the camera. Allow camera permission in your browser.",
"ကင်မရာ post တင်ရန် config.js ကို အရင်ပြင်ပါ။":"Edit config.js first to post from the camera.","ကင်မရာသုံးရန်နှင့် Post တင်ရန် အကောင့်ဝင်ပါ။ (အကောင့်သစ်ဖွင့်လျှင် ⭐ 30 ရပါမည်)":"Sign in to use the camera and post. (New accounts get ⭐ 30.)",
"Auto – မျက်နှာကို အလိုအလျောက် လိုက်ပါမည်":"Auto – follows your face automatically","Manual – ဖန်သားပြင်ကို ထိ/ဆွဲ၍ နေရာချပါ":"Manual – touch/drag the screen to place it","ဓာတ်ပုံ mode":"Photo mode","ဗီဒီယို mode (အများဆုံး ၃၀ စက္ကန့်)":"Video mode (max 30 seconds)",
"⭐ Point မလောက်ပါ":"⭐ Not enough points","လိုအပ်:":"Needed:","ရှိသည်:":"You have:","ဗီဒီယိုကြည့်ပြီး (":"Watch videos (","စက္ကန့်လျှင် ⭐ +2) သို့မဟုတ် သူငယ်ချင်းကို Referral ဖြင့် ဖိတ်ပြီး (တစ်ဦးလျှင် ⭐ +50) Point ရယူနိုင်ပါသည်။":"seconds = ⭐ +2) or invite friends with a referral (⭐ +50 each) to earn points.",
"ဗီဒီယိုကြည့်ပြီး ရယူမည်":"Watch videos to earn","Referral link ရယူမည်":"Get my referral link","မိုက်ခွင့်မရပါ၊ အသံမပါဘဲ ရိုက်ပါမည်":"Microphone not allowed – recording without sound","ဤ browser တွင် ဗီဒီယိုရိုက်ခြင်း မထောက်ပံ့ပါ":"This browser doesn't support video recording","ရိုက်ချက် တိုလွန်းသည်၊ ပြန်ရိုက်ပါ":"Clip too short, record again",
"မရှိ":"None","ဖြူ":"White","မည်း":"Black","ရွှေ":"Gold","ထောင့်ဝိုင်း":"Rounded","နှလုံး":"Heart","နွေးအလင်း":"Warm light","အေးအလင်း":"Cool light","နှင်း":"Snow","မူလ":"Original","ဝါးထား":"Blur","မီးခိုး":"Smoke",
"🔤 စာ":"🔤 Text","အသံ":"Sound","ပယ်ဖျက်":"Cancel","တည်းဖြတ်မှုကို ပယ်ဖျက်မလား? (Point ပြန်မဖြတ်ပါ၊ ပြန်ရိုက်နိုင်ပါသည်)":"Discard the edit? (Points are not charged again; you can re-shoot.)","တည်းဖြတ်ရန်":"Edit","ရှေ့ဆက် →":"Next →",
"အရွယ်":"Size","အလင်း":"Brightness","အရောင်ရင့်":"Saturation","နွေး/အေး":"Warm/Cool","ပြန်သတ်မှတ်":"Reset","စာရေးပြီး ထည့်ပါ":"Type and add","ထည့်":"Add","ပုံအပြည့်ထည့် (ကွက်လပ်ရှိ)":"Fit whole image (with margins)","ဖြတ်ပြီး ပြည့်စေ":"Crop to fill",
"Ratio ကို ပြောင်း၍ “ပုံအပြည့်ထည့်” ရွေးမှ background ပေါ်ပါမည်။":"Change the ratio and pick “Fit whole image” to see the background.","တည်းဖြတ်ထုတ်ယူမှု မအောင်မြင်ပါ -":"Edit export failed –",
"⏳ ဗီဒီယို ပြင်ဆင်နေသည်…":"⏳ Preparing the video…","ဗီဒီယိုအရှည်အတိုင်း အချိန်ယူပါမည်၊ ဤစာမျက်နှာကို မပိတ်ပါနှင့်":"This takes about as long as the video. Don't close this page.","ဤ browser တွင် ဗီဒီယိုတည်းဖြတ်ထုတ်ယူခြင်း မထောက်ပံ့ပါ":"This browser can't export edited video",
"ဗီဒီယိုဖွင့်မရပါ (":"Can't open the video (","ဖော်ပြချက် အတိုချုပ် ရေးရန် (မထည့်လည်းရ)":"Short caption (optional)","အတည်ပြုချက်ကို အမှန်ခြစ်ပါ":"Please tick the confirmation","ကင်မရာသုံးခွင့် မရှိပါ၊ ပြန်ရိုက်ပါ":"No camera credit – shoot again",
"မှတ်ချက်: Supabase တွင် update2.sql ကို run ပါ (မဟုတ်လျှင် Download ခွင့် setting အလုပ်မလုပ်ပါ)":"Note: run update2.sql in Supabase (otherwise the Download setting won't work)","တင်ပြီးပါပြီ! ၂၄ နာရီကြာ ပေါ်နေပါမည်":"Posted! It will stay for 24 hours","တင်တာ အလွန်မြန်နေသည်၊ ခဏစောင့်ပါ":"Posting too fast, please wait",
"၂၄ နာရီ Post တင်မည်":"Post for 24 hours","ဖုန်းထဲသိမ်းမည်":"Save to phone","Post တင်ရန်":"Post","ကြည့်သူများ ဤ post ကို Download လုပ်ခွင့်ပြုမည်":"Allow viewers to download this post",
"ဤအကြောင်းအရာသည် ကျွန်ုပ်ကိုယ်တိုင်ဖန်တီးထားခြင်းဖြစ်ပြီး ဥပဒေနှင့်ညီညွတ်ကြောင်း၊ သူတစ်ပါး၏ မူပိုင်ခွင့်/ကိုယ်ရေးကိုယ်တာကို မထိခိုက်ကြောင်း အတည်ပြုပါသည်။":"I confirm this content was created by me, is lawful, and does not infringe anyone's copyright or privacy.",
"← ပြန်တည်းဖြတ်မည်":"← Back to editing","ပယ်ဖျက်ပြီး ပြန်ရိုက်မည် (Point ပြန်မဖြတ်ပါ)":"Discard and re-shoot (no extra points charged)",
"မက်ဆေ့ချ်":"message","ဖျက်ပြီး":"deleted","စာ":"Text",
"ဤ browser":"This browser",
"Post တင်မည်":"Post now","တင်ပြီးပါပြီ!":"Posted!","ကျွန်ုပ်၏ ယခုတင်ထားသော post များ":"My posts"," (၂၄ နာရီအတွင်း)":" (last 24 hours)","မှတ်ချက် -":"Note:","post သည် ၂၄ နာရီပြည့်လျှင် ပျောက်သွားပါမည်။ ":"A post disappears after 24 hours. ","Facebook တွင် preview ပုံသည် Luvra ၏ logo သာ ပေါ်ပါမည်။":"On Facebook the preview image will only show the Luvra logo."
};
const EN_LIST = Object.entries(EN_RAW).sort((a, b) => b[0].length - a[0].length);
const MM_RE = /[က-႟]/;
const _cache = new Map();
function trEN(s){
  if(!MM_RE.test(s)) return s;
  if(_cache.has(s)) return _cache.get(s);
  let r = s;
  for(const [k, v] of EN_LIST){ if(r.includes(k)) r = r.split(k).join(v); if(!MM_RE.test(r)) break; }
  _cache.set(s, r); return r;
}
if(LANG === "en"){
  document.documentElement.lang = "en";
  const fixNode = n => {
    if(n.nodeType === 3){ const v = n.nodeValue; if(MM_RE.test(v)){ const r = trEN(v); if(r !== v) n.nodeValue = r; } }
    else if(n.nodeType === 1){
      for(const a of ["placeholder", "aria-label", "title", "alt"]){ const v = n.getAttribute && n.getAttribute(a); if(v && MM_RE.test(v)){ const r = trEN(v); if(r !== v) n.setAttribute(a, r); } }
      n.childNodes.forEach(fixNode);
    }
  };
  const obs = new MutationObserver(ms => ms.forEach(m => {
    if(m.type === "characterData") fixNode(m.target);
    else if(m.type === "attributes") fixNode(m.target);
    else m.addedNodes.forEach(fixNode);
  }));
  const start = () => { fixNode(document.body); obs.observe(document.body, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:["placeholder", "aria-label", "title", "alt"]}); };
  if(document.body) start(); else document.addEventListener("DOMContentLoaded", start);
  const _c = window.confirm.bind(window), _p = window.prompt.bind(window), _a = window.alert.bind(window);
  window.confirm = m => _c(trEN(String(m))); window.alert = m => _a(trEN(String(m)));
  window.prompt = (m, d) => _p(trEN(String(m)), d);
}
function setLang(l){ try{ localStorage.setItem("ov_lang", l); }catch(e){} location.reload(); }
