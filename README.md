# OpenVideo v5 – တပ်ဆင်ရန်

## ဖိုင်များ (repo ၏ root တွင် အားလုံးတင်ပါ)
`index.html` · `feed.js` · `face.js` · `editor.js` · `sw.js` · `manifest.webmanifest` · `icon-192.png` · `icon-512.png`
(`config.js` ကို **မပြောင်းပါနှင့်** – သင့်လက်ရှိ config.js ကိုပဲ ဆက်သုံးပါ။)

## Supabase – SQL တစ်ကြိမ် run ရန် (အရေးကြီး)
သင်သည် ယခင် setup.sql ကို run ပြီးသားဖြစ်သဖြင့် **`update2.sql` တစ်ခုတည်း** ကို SQL Editor တွင် paste လုပ်ပြီး Run ပါ။ (ထပ် run လည်းရ။ ဖုန်းတွင် paste မရလျှင် အပိုင်းလေးပိုင်းခွဲ၍ run ပါ။) `setup.sql` သည် အစကနေ အပြည့်အစုံ (v5 ပါ) ဖြစ်ပြီး project အသစ်အတွက်သာ။

## v5 တွင် အသစ်ပါသည်များ
- **App install (PWA)**: Chrome တွင် “Install” banner ပေါ်မည်။ Profile တွင် 📲 ခလုတ်ပါ။ Facebook မျှဝေရန် post တိုင်းတွင် ↗️ ပါ (`?p=` link ဖြင့် post တိုက်ရိုက်ဖွင့်)။
- **Home** = full-screen TikTok ပုံစံ (အပေါ်သို့ ပွတ်လျှင် နောက်တစ်ခု)။ Category menu မပါ။ **ဗီဒီယို tab** တွင်သာ category ပေါ်။
- ညာဘက် ခလုတ်များ: ❤️ (နှိပ်=+1၊ ဖိထား=reaction ၆ မျိုး၊ double-tap=❤️)၊ 💬 comment၊ ⬇️ download (တင်သူ ခွင့်ပြုမှသာ)၊ ↗️ share၊ ⋯ (report / block / ဖျက်)။
- **ကင်မရာ**: မျက်နှာ auto လိုက်သော effect ၂၀ + ပုံပျက် ၁၀ + filter ၁၀၊ ✨ Beauty slider (ချောမွေ့/ဖြူ/အရောင်ရွှေ့/နှုတ်ခမ်း/ပါးနီ)၊ 🎯 Auto ⇄ Manual။
- **တည်းဖြတ်ရန်** (ရိုက်ပြီးတိုင်း): Template၊ Filter၊ Adjust၊ Sticker၊ စာ၊ Frame၊ Effect၊ Ratio၊ Background။
- **Spam ကာကွယ်ရေး (server ဘက်)**: comment/chat/react/report/post တင်ခြင်း rate limit၊ link ၂ ခုထက်များသော comment ပယ်၊ စာတူထပ်ပယ်၊ Block၊ report ၃ ဦးဖြင့် post အလိုအလျောက်ဖျောက်။

## ၂၄ နာရီပြည့် Storage ဖိုင် ဖျက်ခြင်း (သိထားရန်)
Supabase သည် SQL ဖြင့် Storage ဖိုင်ကို တိုက်ရိုက်ဖျက်ခွင့်မပေးပါ။ ထို့ကြောင့် **login ဝင်ထားသူ တစ်ဦးဦး app ဖွင့်လျှင်** (၁၀ မိနစ်တစ်ကြိမ်) ၂၄ နာရီပြည့်ဖိုင်များကို browser က ရှာ၍ ဖျက်ပေးသည်။ app ကို ဘယ်သူမှ မဖွင့်သော အချိန်တွင် မဖျက်ပါ (ပြန်ဖွင့်လျှင် ချက်ချင်း ရှင်းပေးသည်)။ post row များကိုလည်း ၁ နာရီကျော်လျှင် ရှင်းသည်။ ၁GB ပြည့်မလာအောင် Supabase > Storage ကို တစ်ခါတစ်ရံ စစ်ပါ။

## ကန့်သတ်ချက်များ
- မျက်နှာ tracking သည် Google MediaPipe model (~4MB) ကို ပထမအကြိမ် internet မှ ဒေါင်းသည်။ မရလျှင် Manual (ထိ/ဆွဲ) သို့ အလိုအလျောက်ပြောင်း။
- **ကိုယ်လုံး (body) tracking မပါပါ** – မျက်နှာသာ။ တစ်ကြိမ်လျှင် မျက်နှာတစ်ခုသာ။
- ဗီဒီယို တည်းဖြတ်ထုတ်ယူခြင်းသည် ဗီဒီယိုအရှည်အတိုင်း အချိန်ယူသည် (၃၀ စက္ကန့် = ~၃၀ စက္ကန့်)။ မတည်းဖြတ်ဘဲ တင်လျှင် ချက်ချင်း။ iPhone Safari/Chrome တွင် filter/adjust အချို့ မအလုပ်လုပ်နိုင်ပါ (Android Chrome အတွက် ရေးထားသည်)။
- Facebook တွင် link preview သည် OpenVideo logo သာပေါ်မည် (post တစ်ခုချင်းပုံ မပေါ်ပါ – static site ဖြစ်၍)။
- “download ခွင့်ပြုမထား” ခြင်းသည် app ထဲ ခလုတ်ဖျောက်ခြင်းသာ ဖြစ်သည် (file link ကို နည်းပညာကျွမ်းသူက ရနိုင်သေး)။
- Chat တွင် admin စောင့်ကြည့်မှု မရှိ။ Privacy Policy / Terms စာမျက်နှာ ထည့်ပါ။
