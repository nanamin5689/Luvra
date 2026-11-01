OpenVideo – တပ်ဆင်ရန်လမ်းညွှန်
ဖိုင်လေးခု: index.html · config.js · setup.sql · README.md
(ဖိုင်နာမည်များ အတိအကျ ဖြစ်ရမည်။ အားလုံးကို repo ၏ root တွင်တင်ပါ။)
App တွင် ပါဝင်သည်များ
ပင်မ: user များ၏ snap post (၂၄ နာရီပြည့်လျှင် ပျောက်)။ 👍❤️😂😮😢😡 reaction များကို အကန့်အသတ်မရှိ နှိပ်နိုင်သည်။ Follow နှင့် 💬 chat ခလုတ်ပါသည်။
ဗီဒီယို: Internet Archive၊ Pexels၊ Pixabay (နှင့် YouTube တရားဝင် player) မှ ဗီဒီယိုများကို app ထဲတွင် ကြည့်ရန်။ Download ခလုတ်မပါ။ ၃၀ စက္ကန့်ကြည့်လျှင် ⭐ +2။
ကင်မရာ: ဓာတ်ပုံ/ဗီဒီယို ရိုက်ရန် template ၂၀ ခု။ ဓာတ်ပုံ ⭐ 3၊ ဗီဒီယို ⭐ 8 ကုန်သည်။
Chat: တစ်ဦးချင်း စကားပြော။ မက်ဆေ့ချ်များ ၁၀ မိနစ်ကြာလျှင် ပျောက်သည်။
ကျွန်ုပ်: Profile ပုံ + Cover ပုံ (Facebook ပုံစံ)၊ Point၊ Referral link၊ ကိုယ့် post များ။
အပေါ်ဆုံး category ဘားကို ပွတ်ဆွဲရွေးနိုင်ပြီး 🔍 ရှာဖွေရေးခလုတ်က ညာထောင့်တွင် ပုံသေရှိသည်။
ကြည့်ရုံသက်သက်ဆိုလျှင် အကောင့်မလို။ ကင်မရာ၊ chat၊ reaction၊ point အတွက်သာ အကောင့်လို။
Point စနစ် (server က တွက်သည် – ဖုန်းထဲက ပြင်လို့မရ)
ရယူ
Point
အကောင့်အသစ်ဖွင့်
+30
ဗီဒီယို ၃၀ စက္ကန့်ကြည့် (တူညီသောဗီဒီယိုကို တစ်ရက်တစ်ကြိမ်၊ တစ်ရက် ≤ 20)
+2
သူငယ်ချင်းတစ်ဦး referral ဖြင့်ဖိတ်
+50 (သူငယ်ချင်းလည်း +20)
သုံးစွဲမှု: ဓာတ်ပုံရိုက် −3၊ ဗီဒီယိုရိုက် −8။
Referral code ကို အကောင့်ဖွင့်ပြီး ၇ ရက်အတွင်းသာ ထည့်နိုင်သည်။ ကိုယ့် code ကို မသုံးနိုင်။
တန်ဖိုးပြောင်းလိုလျှင် setup.sql (function များ) နှင့် index.html ထိပ်က COST ကို တူညီစွာ ပြင်ပါ။
၁။ key မလိုဘဲ စမ်းကြည့်ရန်
Pages ဖွင့်ပြီး "ဗီဒီယို" tab ကိုနှိပ်ပါ။
၂။ Pexels / Pixabay / YouTube (အခမဲ့)
config.js ထဲ PEXELS_KEY, PIXABAY_KEY, YT_KEY (လိုလျှင်) ဖြည့်ပါ။ key များသည် browser တွင် မြင်နိုင်ပါသည်။
၃။ Supabase (database + login + file သိမ်း)
https://supabase.com တွင် အကောင့်ဖွင့်ပါ။ GitHub email နှင့် တူစရာမလိုပါ – "Sign up" မှာ ကိုယ်နှစ်သက်သော email + password ဖြင့် ဖွင့်လို့ရသည်။
New project (Free plan၊ Region: Southeast Asia/Singapore)။
SQL Editor ထဲ setup.sql အားလုံးကို paste လုပ်ပြီး Run (ထပ်run လည်းရ)။ Table Editor တွင် profiles, wallets, posts, messages စသည်များ၊ Storage တွင် posts နှင့် avatars bucket ပေါ်ရမည်။
Authentication > URL Configuration: Site URL = https://USERNAME.github.io/openvideo/၊ Redirect URLs ထဲ https://USERNAME.github.io/openvideo/** ထည့်ပါ။
Project Settings > API မှ Project URL နှင့် anon public key ကို config.js ထဲဖြည့်ပါ။ service_role / secret key ကို ဘယ်တော့မှ မထည့်ပါနှင့်။
CONTACT_EMAIL ကို email အစစ်ဖြင့် ပြောင်းပါ။
၄။ Chat သက်တမ်း ပြောင်းလိုလျှင်
setup.sql ထဲ messages table ၏ '10 minutes' နှင့် insert policy ၏ '11 minutes' ကို (ဥပမာ '5 minutes' / '6 minutes') ပြောင်းပြီး ထပ်run ပါ။ index.html ထဲ CHAT_TTL ကိုလည်း တူညီစွာ ပြောင်းပါ။
၅။ သိထားရန်
၂၄ နာရီ/၁၀ မိနစ်ပြည့်သော post/message များ app တွင် မပေါ်တော့ပါ။ သို့သော် Storage ထဲက ဖိုင်များ အလိုအလျောက် မပျက်ပါ (Edge Function လို)။ အခမဲ့ ၁GB ပြည့်မသွားစေရန် ကြည့်ပေးပါ။ ကိုယ့် post ကို ကိုယ်ဖျက်လျှင်တော့ ဖိုင်ပါ ပျက်သည်။
Supabase ၏ အခမဲ့ email ပို့မှုသည် အရေအတွက်ကန့်သတ်ထားသဖြင့် စမ်းသပ်ရုံအတွက်သာ သင့်သည်။ လူများလာလျှင် ကိုယ်ပိုင် SMTP (Resend စသည်) ချိတ်ပါ။
Chat တွင် block စနစ် မပါသေးပါ။ အဆိုးမြင်သော message ကို Report/ဖယ်ရှားရန် စနစ်ထပ်ထည့်သင့်သည်။
Point ကို တစ်ဦးတည်း အကောင့်အများကြီးဖွင့်၍ referral ကောက်ယူခြင်း (abuse) ကို ကာကွယ်ရန် Supabase ၏ email အတည်ပြုချက် (login link) ကို အခြေခံထားသည်။ လူအများစုသုံးလာလျှင် ပိုတင်းကျပ်စွာ ထိန်းရန်လိုနိုင်သည်။
Report များကို Supabase > Table Editor > reports တွင် ပုံမှန်ကြည့်ပါ။ Privacy Policy နှင့် Terms စာမျက်နှာထည့်ပါ။
