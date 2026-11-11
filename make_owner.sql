-- Owner သတ်မှတ်ရန်။ ဤဖိုင်တစ်ခုလုံးကို Supabase SQL Editor တွင် paste လုပ်ပြီး Run ပါ။
insert into public.app_admins (user_id)
select id from auth.users where lower(email) = lower('yanban293@gmail.com')
on conflict do nothing;

select u.email, 'owner ဖြစ်ပါပြီ' as status
from public.app_admins a join auth.users u on u.id = a.user_id;
