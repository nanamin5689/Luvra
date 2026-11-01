-- Supabase > SQL Editor ထဲမှာ အကုန်လုံးကို paste လုပ်ပြီး တစ်ကြိမ် Run ပါ။
-- (ထပ်ပြီး run လည်း ရပါသည်။ ယခင်ဗားရှင်း setup.sql ကို run ပြီးသားဖြစ်လျှင်လည်း ဤဖိုင်ကို ထပ် run နိုင်ပါသည်။)

-- =====================================================================
-- 1) Profiles (profile picture + cover picture + referral code)
-- =====================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text not null check (char_length(username) between 1 and 30),
  bio text check (bio is null or char_length(bio) <= 160),
  avatar_url text,
  cover_url text,
  referral_code text unique not null default substr(md5(random()::text || clock_timestamp()::text), 1, 8),
  referred_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "profiles readable" on public.profiles;
create policy "profiles readable" on public.profiles for select using (true);
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (username, bio, avatar_url, cover_url) on public.profiles to authenticated;

-- =====================================================================
-- 2) Points (server က တွက်ချက်သည် – client ကနေ မပြင်နိုင်ပါ)
-- =====================================================================
create table if not exists public.wallets (
  user_id uuid primary key references auth.users on delete cascade,
  balance int not null default 0 check (balance >= 0)
);
create table if not exists public.point_ledger (
  id bigserial primary key,
  user_id uuid not null references auth.users on delete cascade,
  delta int not null,
  reason text not null,
  ref text,
  created_at timestamptz not null default now()
);
-- တူညီသော ဆုများကို နှစ်ကြိမ်မပေးရန်
create unique index if not exists ledger_once on public.point_ledger (user_id, reason, ref)
  where reason in ('welcome', 'watch', 'referral_new', 'referral_by');

alter table public.wallets enable row level security;
alter table public.point_ledger enable row level security;
drop policy if exists "own wallet" on public.wallets;
create policy "own wallet" on public.wallets for select to authenticated using (user_id = auth.uid());
drop policy if exists "own ledger" on public.point_ledger;
create policy "own ledger" on public.point_ledger for select to authenticated using (user_id = auth.uid());
revoke insert, update, delete on public.wallets, public.point_ledger from anon, authenticated;

create table if not exists public.capture_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  kind text not null check (kind in ('image', 'video')),
  used boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.capture_credits enable row level security;
revoke all on public.capture_credits from anon, authenticated;

-- ပြည်တွင်းသုံး function (client မခေါ်နိုင်)
create or replace function public._add_points(p_uid uuid, p_delta int, p_reason text, p_ref text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  insert into point_ledger (user_id, delta, reason, ref) values (p_uid, p_delta, p_reason, p_ref);
  insert into wallets (user_id, balance) values (p_uid, greatest(p_delta, 0))
    on conflict (user_id) do update set balance = wallets.balance + p_delta;
  return true;
exception when unique_violation then
  return false;
end $$;
revoke all on function public._add_points(uuid, int, text, text) from public, anon, authenticated;

-- အကောင့်အသစ်ဖွင့်လျှင် profile ဖန်တီး + ကြိုဆိုသောအမှတ် ၃၀
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, username)
  values (new.id, left(coalesce(nullif(new.raw_user_meta_data ->> 'username', ''), nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'user'), 30))
  on conflict (id) do nothing;
  perform _add_points(new.id, 30, 'welcome', 'welcome');
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- trigger မတပ်မီ ဖွင့်ထားသော အကောင့်အတွက် (client က login တိုင်း ခေါ်သည်)
create or replace function public.ensure_profile()
returns void language plpgsql security definer set search_path = public as $$
declare u record;
begin
  if auth.uid() is null then return; end if;
  select id, email, raw_user_meta_data into u from auth.users where id = auth.uid();
  if not found then return; end if;
  insert into profiles (id, username)
  values (u.id, left(coalesce(nullif(u.raw_user_meta_data ->> 'username', ''), nullif(split_part(coalesce(u.email, ''), '@', 1), ''), 'user'), 30))
  on conflict (id) do nothing;
  perform _add_points(u.id, 30, 'welcome', 'welcome');
end $$;

-- Referral: အကောင့်အသစ် (၇ ရက်အတွင်း) က code ထည့်လျှင် ကိုယ် +၂၀၊ ဖိတ်သူ +၅၀
create or replace function public.claim_referral(p_code text)
returns text language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); mine profiles%rowtype; ref profiles%rowtype;
begin
  if me is null then raise exception 'login_required'; end if;
  perform ensure_profile();
  select * into mine from profiles where id = me;
  if mine.referred_by is not null then return 'already'; end if;
  if mine.created_at < now() - interval '7 days' then return 'too_late'; end if;
  select * into ref from profiles where referral_code = lower(trim(p_code));
  if not found then return 'invalid'; end if;
  if ref.id = me then return 'self'; end if;
  update profiles set referred_by = ref.id where id = me;
  perform _add_points(me, 20, 'referral_new', ref.id::text);
  perform _add_points(ref.id, 50, 'referral_by', me::text);
  return 'ok';
end $$;

-- ဗီဒီယို ၃၀ စက္ကန့်ကြည့်လျှင် +၂ (တစ်ရက် အများဆုံး ၂၀၊ တူညီသောဗီဒီယိုကို တစ်ရက်တစ်ကြိမ်)
create or replace function public.earn_watch(p_key text)
returns int language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); today_pts int;
begin
  if me is null then raise exception 'login_required'; end if;
  select coalesce(sum(delta), 0) into today_pts from point_ledger
    where user_id = me and reason = 'watch' and created_at >= date_trunc('day', now());
  if today_pts >= 20 then return 0; end if;
  if _add_points(me, 2, 'watch', left(p_key, 80) || ':' || current_date::text) then return 2; end if;
  return 0;
end $$;

-- ကင်မရာသုံးခွင့်ဝယ်ခြင်း: ဓာတ်ပုံ ၃၊ ဗီဒီယို ၈
create or replace function public.buy_capture(p_kind text)
returns uuid language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); cost int; bal int; cid uuid;
begin
  if me is null then raise exception 'login_required'; end if;
  if p_kind not in ('image', 'video') then raise exception 'bad_kind'; end if;
  cost := case p_kind when 'image' then 3 else 8 end;
  select balance into bal from wallets where user_id = me for update;
  if bal is null or bal < cost then raise exception 'insufficient_points'; end if;
  perform _add_points(me, -cost, 'capture', gen_random_uuid()::text);
  insert into capture_credits (user_id, kind) values (me, p_kind) returning id into cid;
  return cid;
end $$;

-- =====================================================================
-- 3) Snap posts (၂၄ နာရီ) – တင်ခွင့်ကို capture credit ဖြင့်သာ
-- =====================================================================
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  author_name text not null,
  author_avatar text,
  caption text,
  category text,
  media_url text not null,
  media_type text not null check (media_type in ('image', 'video')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);
alter table public.posts add column if not exists author_avatar text;
create index if not exists posts_created_idx on public.posts (created_at desc);
create index if not exists posts_expires_idx on public.posts (expires_at);
alter table public.posts enable row level security;
drop policy if exists "read live posts" on public.posts;
create policy "read live posts" on public.posts for select using (expires_at > now());
drop policy if exists "insert own post" on public.posts;     -- ယခင်ဗားရှင်းမှ တိုက်ရိုက်တင်ခွင့်ကို ပိတ်
drop policy if exists "delete own post" on public.posts;
create policy "delete own post" on public.posts for delete to authenticated using (user_id = auth.uid());
revoke insert, update on public.posts from anon, authenticated;

create or replace function public.publish_post(p_credit uuid, p_caption text, p_category text, p_url text, p_type text)
returns uuid language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); c capture_credits%rowtype; pid uuid;
begin
  if me is null then raise exception 'login_required'; end if;
  select * into c from capture_credits
    where id = p_credit and user_id = me and used = false and created_at > now() - interval '2 hours' for update;
  if not found then raise exception 'no_credit'; end if;
  if c.kind <> p_type then raise exception 'kind_mismatch'; end if;
  if position('/storage/v1/object/public/posts/' || me::text || '/' in p_url) = 0 then raise exception 'bad_url'; end if;
  insert into posts (user_id, author_name, author_avatar, caption, category, media_url, media_type)
  select me, pr.username, pr.avatar_url, left(p_caption, 140), p_category, p_url, p_type from profiles pr where pr.id = me
  returning id into pid;
  if pid is null then raise exception 'no_profile'; end if;
  update capture_credits set used = true where id = c.id;
  return pid;
end $$;

-- =====================================================================
-- 4) Follow / Report
-- =====================================================================
create table if not exists public.follows (
  follower_id uuid not null default auth.uid() references auth.users on delete cascade,
  followee_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
alter table public.follows enable row level security;
drop policy if exists "read own follows" on public.follows;
create policy "read own follows" on public.follows for select to authenticated using (follower_id = auth.uid());
drop policy if exists "follow" on public.follows;
create policy "follow" on public.follows for insert to authenticated with check (follower_id = auth.uid());
drop policy if exists "unfollow" on public.follows;
create policy "unfollow" on public.follows for delete to authenticated using (follower_id = auth.uid());

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid,
  reason text,
  created_at timestamptz not null default now()
);
alter table public.reports enable row level security;
drop policy if exists "anyone can report" on public.reports;
create policy "anyone can report" on public.reports for insert to anon, authenticated with check (true);

-- =====================================================================
-- 5) Reactions (အကန့်အသတ်မရှိ နှိပ်နိုင်သည်)
-- =====================================================================
create table if not exists public.reactions (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  kind text not null check (kind in ('like', 'love', 'laugh', 'wow', 'sad', 'angry')),
  n int not null default 0,
  primary key (post_id, user_id, kind)
);
alter table public.reactions enable row level security;
drop policy if exists "own reactions" on public.reactions;
create policy "own reactions" on public.reactions for select to authenticated using (user_id = auth.uid());
revoke insert, update, delete on public.reactions from anon, authenticated;

create or replace function public.react(p_post uuid, p_kind text, p_n int default 1)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'login_required'; end if;
  p_n := least(greatest(coalesce(p_n, 1), 1), 100);
  perform 1 from posts where id = p_post and expires_at > now();
  if not found then raise exception 'post_gone'; end if;
  insert into reactions (post_id, user_id, kind, n) values (p_post, me, p_kind, p_n)
    on conflict (post_id, user_id, kind) do update set n = reactions.n + excluded.n;
end $$;

create or replace function public.reaction_totals(p_ids uuid[])
returns table (post_id uuid, kind text, total bigint)
language sql stable security definer set search_path = public as $$
  select r.post_id, r.kind, sum(r.n)::bigint from reactions r where r.post_id = any(p_ids) group by r.post_id, r.kind
$$;

-- =====================================================================
-- 6) Chat – မက်ဆေ့ချ်များသည် ၁၀ မိနစ်ကြာလျှင် အလိုအလျောက် ပျောက်သည်
--    (မိနစ်ပြောင်းလိုလျှင် အောက်က '10 minutes' နှင့် '11 minutes' ကို တူညီစွာ ပြင်ပါ)
-- =====================================================================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null default auth.uid() references auth.users on delete cascade,
  to_id uuid not null references auth.users on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  check (from_id <> to_id)
);
create index if not exists messages_to_idx on public.messages (to_id, created_at desc);
create index if not exists messages_from_idx on public.messages (from_id, created_at desc);
alter table public.messages enable row level security;
drop policy if exists "read my live messages" on public.messages;
create policy "read my live messages" on public.messages for select to authenticated
  using ((from_id = auth.uid() or to_id = auth.uid()) and expires_at > now());
drop policy if exists "send message" on public.messages;
create policy "send message" on public.messages for insert to authenticated
  with check (from_id = auth.uid() and expires_at <= now() + interval '11 minutes');
drop policy if exists "delete my message" on public.messages;
create policy "delete my message" on public.messages for delete to authenticated using (from_id = auth.uid());

-- =====================================================================
-- 7) Function ခွင့်ပြုချက်
-- =====================================================================
revoke all on function public.ensure_profile(), public.claim_referral(text), public.earn_watch(text),
  public.buy_capture(text), public.publish_post(uuid, text, text, text, text), public.react(uuid, text, int)
  from public, anon;
grant execute on function public.ensure_profile(), public.claim_referral(text), public.earn_watch(text),
  public.buy_capture(text), public.publish_post(uuid, text, text, text, text), public.react(uuid, text, int)
  to authenticated;
grant execute on function public.reaction_totals(uuid[]) to anon, authenticated;

-- ယခင်က ဖွင့်ထားပြီးသား အကောင့်များအတွက် profile + ကြိုဆိုအမှတ် ဖြည့်ပေးခြင်း
insert into public.profiles (id, username)
select id, left(coalesce(nullif(split_part(coalesce(email, ''), '@', 1), ''), 'user'), 30) from auth.users
on conflict (id) do nothing;

-- =====================================================================
-- 8) Storage
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('posts', 'posts', true, 52428800, array['video/webm', 'video/mp4', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "upload to own folder" on storage.objects;
create policy "upload to own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'posts' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "public read posts" on storage.objects;
create policy "public read posts" on storage.objects for select using (bucket_id = 'posts');
drop policy if exists "delete own files" on storage.objects;
create policy "delete own files" on storage.objects for delete to authenticated
  using (bucket_id = 'posts' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatar upload own" on storage.objects;
create policy "avatar upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatar public read" on storage.objects;
create policy "avatar public read" on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists "avatar delete own" on storage.objects;
create policy "avatar delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- =====================================================================
-- (လိုလျှင်) သက်တမ်းကုန်သော row များကို နာရီတိုင်း ရှင်းရန် – Database > Extensions မှာ pg_cron ဖွင့်ပြီးမှ
-- select cron.schedule('purge-expired', '*/30 * * * *', $$
--   delete from public.posts where expires_at < now() - interval '1 hour';
--   delete from public.messages where expires_at < now() - interval '1 hour';
-- $$);
-- မှတ်ချက်: Storage ထဲက ဖိုင်များကို ဤ SQL က မဖျက်ပါ (Storage API/Edge Function လိုသည်)။
