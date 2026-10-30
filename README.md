OpenVideo – တပ်ဆင်ရန်လမ်းညွှန်
ဖိုင်များ: index.html · config.js · setup.sql · README.md
၁။ အလုပ်လုပ်ကြည့်ရန် (key မလိုပါ)
index.html ကို browser မှာဖွင့်ပါ။ Internet Archive tab က key မလိုဘဲ အလုပ်လုပ်ပါမယ်။
(ဖိုင်ကို တိုက်ရိုက်ဖွင့်လို့ မရရင် python3 -m http.server နဲ့ ဖွင့်ပါ။)
၂။ Pexels / Pixabay ထည့်ရန် (အခမဲ့)
https://www.pexels.com/api/ နှင့် https://pixabay.com/api/docs/ တွင် account ဖွင့်ပြီး key ယူပါ။
config.js ထဲ PEXELS_KEY, PIXABAY_KEY ဖြည့်ပါ။
သတိ: key သည် browser ထဲမှာ မြင်နိုင်ပါသည်။ အခမဲ့ key များဖြစ်ပြီး rate limit ရှိပါသည်။ ပိုလုံခြုံချင်ပါက Cloudflare Worker လို proxy ကိုသုံးပါ။
Pexels / Pixabay စည်းမျဉ်းများကို ဖတ်ပါ။ Attribution (ဖန်တီးသူ + source link) ကို ဆိုဒ်က ပြထားပါသည်။ ၎င်းတို့၏ ဝန်ဆောင်မှုကို အတိအကျ ကူးယူသည့် ဆိုဒ်မဖြစ်စေရန်လည်း သတိထားပါ။ Pixabay API သည် video ကို အမြဲတမ်း hotlink လုပ်ခြင်းကို ကန့်သတ်ထားနိုင်သဖြင့် အသုံးမပြုမီ https://pixabay.com/api/docs/ ကို စစ်ပါ။
၃။ Creator Upload (Supabase အခမဲ့)
https://supabase.com တွင် project အသစ်ဖွင့်ပါ။
SQL Editor ထဲ setup.sql ကို paste လုပ်ပြီး Run ပါ။
Authentication > URL Configuration တွင် Site URL ကို သင့်ဆိုဒ် URL ဖြင့် ဖြည့်ပါ။
Project Settings > API မှ Project URL နှင့် anon public key ကို config.js ထဲဖြည့်ပါ။
Creator တင်သော video များသည် approved = false ဖြင့် စပါသည်။ Supabase > Table Editor > videos တွင် စစ်ဆေးပြီး approved ကို true လုပ်မှ ဆိုဒ်ပေါ်တွင် ပေါ်ပါမည်။
အခမဲ့ plan: storage ၁GB၊ ဖိုင်တစ်ခု ၅၀MB အထိ။ ပြည့်လာလျှင် Pro plan သို့ ပြောင်းရပါမည်။
၄။ အခမဲ့ တင်ရန်
Cloudflare Pages / Netlify / GitHub Pages တစ်ခုခုတွင် ဖိုင်လေးခုလုံးကို folder တစ်ခုတည်း တင်ပါ။
၅။ ဝင်ငွေ
index.html ထဲ ad-top / ad-bottom နေရာများတွင် AdSense code ထည့်ပါ။
၆။ မဖြစ်မနေ လုပ်ရန်
config.js ထဲ CONTACT_EMAIL ကို သင့် email အစစ်ဖြင့် ပြောင်းပါ။
Report / Takedown email များကို မြန်မြန်ဖြေပါ။ မူပိုင်ခွင့်ချိုးဖောက်သော video များကို ချက်ချင်းဖယ်ရှားပါ။
Creator video တိုင်းကို approve မလုပ်မီ ကြည့်ပါ (သူတစ်ပါး video ကူးတင်ခြင်း မဟုတ်ကြောင်း)။
Privacy Policy နှင့် Terms စာမျက်နှာ ထည့်ပါ (AdSense အတွက်လည်း လိုပါသည်)။
