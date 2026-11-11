-- Owner (website ပိုင်ရှင်) သတ်မှတ်ရန် - update3.sql run ပြီးမှ run ပါ။
-- အောက်က email ကို သင်၏ OpenVideo app ထဲ login ဝင်သော email အတိအကျ ပြောင်းပြီးမှ Run ပါ။
-- (Supabase dashboard login email မဟုတ်ဘဲ app ထဲ အကောင့်ဖွင့်ထားသော email ဖြစ်ရမည်။ အရင် app ထဲ တစ်ကြိမ် login ဝင်ထားရမည်။)
insert into public.app_admins (user_id)
select id from auth.users where lower(email) = lower('PUT-YOUR-APP-LOGIN-EMAIL@gmail.com')
on conflict do nothing;

select u.yanban293@gmail.com, 'owner ဖြစ်ပါပြီ' as status from public.app_admins a join auth.users u on u.id = a.user_id;
