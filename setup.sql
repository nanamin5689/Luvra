-- =====================================================================
-- v6 – Owner center၊ Point စနစ် ဖွင့်/ပိတ်၊ Ban၊ Active status၊ Public stats၊ Google/Facebook profile
--      (ထပ်ထပ် run လို့ရသည်။ setup.sql နှင့် update2.sql ကို အရင် run ပြီးသားဖြစ်ရမည်)
-- =====================================================================

-- 10.1 profiles: active status + ban
alter table public.profiles add column if not exists last_seen timestamptz;
alter table public.profiles add column if not exists banned boolean not null default false;
create index if not exists profiles_seen_idx on public.profiles (last_seen desc);

-- 10.2 Owner (admin) စာရင်း – SQL ဖြင့်သာ ထည့်နိုင်သည် (make_owner.sql ကိုကြည့်ပါ)
create table if not exists public.app_admins (user_id uuid primary key references auth.users on delete cascade);
alter table public.app_admins enable row level security;
revoke all on public.app_admins from anon, authenticated;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from app_admins where user_id = auth.uid())
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- 10.3 Settings (key/value)
create table if not exists public.app_settings (key text primary key, value jsonb not null);
alter table public.app_settings enable row level security;
revoke all on public.app_settings from anon, authenticated;
-- ပုံသေ - Point နှင့် ကန့်သတ်ခြင်း ပိတ်ထား (အားလုံး အခမဲ့သုံးနိုင်)
insert into public.app_settings (key, value) values
  ('points_spend', 'false'::jsonb),     -- true = ကင်မရာ/post တင်ရန် Point နုတ်မည်
  ('camera_enabled', 'true'::jsonb),
  ('posting_enabled', 'true'::jsonb),
  ('signup_enabled', 'true'::jsonb)
on conflict (key) do nothing;

create or replace function public._setting(p_key text, p_default boolean)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select (value #>> '{}')::boolean from app_settings where key = p_key), p_default)
$$;
revoke all on function public._setting(text, boolean) from public, anon, authenticated;

create or replace function public.get_settings()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'points_spend', _setting('points_spend', false),
    'camera_enabled', _setting('camera_enabled', true),
    'posting_enabled', _setting('posting_enabled', true))
$$;
grant execute on function public.get_settings() to anon, authenticated;

-- 10.4 Ban စစ်ဆေးချက်
create or replace function public._not_banned(p_uid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from profiles where id = p_uid and banned) then raise exception 'banned'; end if;
end $$;
revoke all on function public._not_banned(uuid) from public, anon, authenticated;

-- Google / Facebook ၏ အမည်၊ ပုံကို ယူ၍ profile ဖန်တီး
create or replace function public._meta_name(m jsonb, em text)
returns text language sql immutable as $$
  select left(coalesce(nullif(m ->> 'username', ''), nullif(m ->> 'full_name', ''), nullif(m ->> 'name', ''),
                       nullif(split_part(coalesce(em, ''), '@', 1), ''), 'user'), 30)
$$;
create or replace function public._meta_avatar(m jsonb)
returns text language sql immutable as $$
  select nullif(coalesce(nullif(m ->> 'avatar_url', ''), nullif(m ->> 'picture', '')), '')
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, username, avatar_url)
  values (new.id, _meta_name(new.raw_user_meta_data, new.email), _meta_avatar(new.raw_user_meta_data))
  on conflict (id) do nothing;
  perform _add_points(new.id, 30, 'welcome', 'welcome');
  return new;
end $$;

create or replace function public.ensure_profile()
returns void language plpgsql security definer set search_path = public as $$
declare u record;
begin
  if auth.uid() is null then return; end if;
  select id, email, raw_user_meta_data into u from auth.users where id = auth.uid();
  if not found then return; end if;
  insert into profiles (id, username, avatar_url)
  values (u.id, _meta_name(u.raw_user_meta_data, u.email), _meta_avatar(u.raw_user_meta_data))
  on conflict (id) do nothing;
  perform _add_points(u.id, 30, 'welcome', 'welcome');
end $$;

-- 10.5 Point ကုန်ကျစရိတ် (owner ပိတ်ထားလျှင် ၀) + camera/posting ပိတ်/ဖွင့်
create or replace function public.buy_capture(p_kind text)
returns uuid language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); cost int; bal int; cid uuid;
begin
  if me is null then raise exception 'login_required'; end if;
  perform _not_banned(me);
  if not _setting('camera_enabled', true) then raise exception 'camera_closed'; end if;
  if p_kind not in ('image', 'video') then raise exception 'bad_kind'; end if;
  perform _rate_limit(me, 'capture', 60, 3600);
  cost := case when _setting('points_spend', false) then (case p_kind when 'image' then 3 else 8 end) else 0 end;
  if cost > 0 then
    select balance into bal from wallets where user_id = me for update;
    if bal is null or bal < cost then raise exception 'insufficient_points'; end if;
    perform _add_points(me, -cost, 'capture', gen_random_uuid()::text);
  end if;
  insert into capture_credits (user_id, kind) values (me, p_kind) returning id into cid;
  return cid;
end $$;

create or replace function public.publish_post(p_credit uuid, p_caption text, p_category text, p_url text, p_type text,
                                               p_allow_download boolean default true)
returns uuid language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); c capture_credits%rowtype; pid uuid;
begin
  if me is null then raise exception 'login_required'; end if;
  perform _not_banned(me);
  if not _setting('posting_enabled', true) then raise exception 'posting_closed'; end if;
  perform _rate_limit(me, 'publish', 12, 3600);
  select * into c from capture_credits
    where id = p_credit and user_id = me and used = false and created_at > now() - interval '2 hours' for update;
  if not found then raise exception 'no_credit'; end if;
  if c.kind <> p_type then raise exception 'kind_mismatch'; end if;
  if position('/storage/v1/object/public/posts/' || me::text || '/' in p_url) = 0 then raise exception 'bad_url'; end if;
  insert into posts (user_id, author_name, author_avatar, caption, category, media_url, media_type, allow_download)
  select me, pr.username, pr.avatar_url, left(p_caption, 140), p_category, p_url, p_type, coalesce(p_allow_download, true)
  from profiles pr where pr.id = me
  returning id into pid;
  if pid is null then raise exception 'no_profile'; end if;
  update capture_credits set used = true where id = c.id;
  return pid;
end $$;
revoke all on function public.buy_capture(text), public.publish_post(uuid, text, text, text, text, boolean) from public, anon;
grant execute on function public.buy_capture(text), public.publish_post(uuid, text, text, text, text, boolean) to authenticated;

-- Ban ခံရသူ comment / chat / reaction မလုပ်နိုင်
create or replace function public._comment_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); links int; nm text;
begin
  if me is null then raise exception 'login_required'; end if;
  perform _not_banned(me);
  perform 1 from posts where id = new.post_id and expires_at > now() and hidden = false;
  if not found then raise exception 'post_gone'; end if;
  new.body := btrim(new.body);
  if char_length(new.body) = 0 then raise exception 'empty'; end if;
  links := (select count(*) from regexp_matches(new.body, '(https?://|www\.)', 'gi'));
  if links > 1 then raise exception 'too_many_links'; end if;
  if exists (select 1 from comments where user_id = me and post_id = new.post_id and body = new.body
             and created_at > now() - interval '10 minutes') then raise exception 'duplicate'; end if;
  perform _rate_limit(me, 'comment_fast', 5, 30);
  perform _rate_limit(me, 'comment_hour', 60, 3600);
  select username into nm from profiles where id = me;
  new.user_id := me;
  new.author_name := coalesce(nm, 'user');
  return new;
end $$;

create or replace function public._message_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'login_required'; end if;
  perform _not_banned(me);
  if exists (select 1 from blocks where blocker = new.to_id and blocked = me) then raise exception 'blocked'; end if;
  if exists (select 1 from blocks where blocker = me and blocked = new.to_id) then raise exception 'you_blocked'; end if;
  perform _rate_limit(me, 'msg_fast', 8, 20);
  perform _rate_limit(me, 'msg_hour', 200, 3600);
  return new;
end $$;

create or replace function public.react(p_post uuid, p_kind text, p_n int default 1)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'login_required'; end if;
  perform _not_banned(me);
  p_n := least(greatest(coalesce(p_n, 1), 1), 100);
  perform _rate_limit(me, 'react', 60, 60);
  perform 1 from posts where id = p_post and expires_at > now() and hidden = false;
  if not found then raise exception 'post_gone'; end if;
  insert into reactions (post_id, user_id, kind, n) values (p_post, me, p_kind, p_n)
    on conflict (post_id, user_id, kind) do update set n = reactions.n + excluded.n;
end $$;

-- 10.6 Active status + အများသိ stats
create or replace function public.touch_seen()
returns void language sql security definer set search_path = public as $$
  update profiles set last_seen = now() where id = auth.uid()
$$;
revoke all on function public.touch_seen() from public, anon;
grant execute on function public.touch_seen() to authenticated;

create or replace function public.profile_stats(p_id uuid)
returns table (followers bigint, following bigint, points int, posts bigint)
language sql stable security definer set search_path = public as $$
  select (select count(*) from follows where followee_id = p_id),
         (select count(*) from follows where follower_id = p_id),
         coalesce((select balance from wallets where user_id = p_id), 0),
         (select count(*) from posts where user_id = p_id and expires_at > now() and hidden = false)
$$;
grant execute on function public.profile_stats(uuid) to anon, authenticated;

create or replace function public.active_users(p_limit int default 30)
returns table (id uuid, username text, avatar_url text)
language sql stable security definer set search_path = public as $$
  select p.id, p.username, p.avatar_url from profiles p
  where p.last_seen > now() - interval '5 minutes' and not p.banned and p.id <> auth.uid()
    and not exists (select 1 from blocks b where (b.blocker = auth.uid() and b.blocked = p.id) or (b.blocker = p.id and b.blocked = auth.uid()))
  order by p.last_seen desc limit least(coalesce(p_limit, 30), 60)
$$;
grant execute on function public.active_users(int) to authenticated;

create or replace function public.my_connections()
returns table (id uuid, username text, avatar_url text, i_follow boolean, follows_me boolean, last_seen timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, p.username, p.avatar_url,
         exists (select 1 from follows f where f.follower_id = auth.uid() and f.followee_id = p.id),
         exists (select 1 from follows f where f.follower_id = p.id and f.followee_id = auth.uid()),
         p.last_seen
  from profiles p
  where not p.banned and p.id <> auth.uid()
    and (exists (select 1 from follows f where f.follower_id = auth.uid() and f.followee_id = p.id)
      or exists (select 1 from follows f where f.follower_id = p.id and f.followee_id = auth.uid()))
    and not exists (select 1 from blocks b where (b.blocker = auth.uid() and b.blocked = p.id) or (b.blocker = p.id and b.blocked = auth.uid()))
  order by p.last_seen desc nulls last limit 200
$$;
grant execute on function public.my_connections() to authenticated;

create or replace function public.suggested_users(p_limit int default 20)
returns table (id uuid, username text, avatar_url text, last_seen timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, p.username, p.avatar_url, p.last_seen from profiles p
  where not p.banned and p.id <> auth.uid()
    and not exists (select 1 from follows f where f.follower_id = auth.uid() and f.followee_id = p.id)
    and not exists (select 1 from blocks b where (b.blocker = auth.uid() and b.blocked = p.id) or (b.blocker = p.id and b.blocked = auth.uid()))
  order by (select count(*) from follows f where f.followee_id = p.id) desc, p.last_seen desc nulls last, p.created_at desc
  limit least(coalesce(p_limit, 20), 50)
$$;
grant execute on function public.suggested_users(int) to authenticated;

-- 10.7 Owner center RPC များ (is_admin() မဟုတ်လျှင် 'not_admin' error)
create or replace function public._need_admin() returns void
language plpgsql security definer set search_path = public as $$
begin if not exists (select 1 from app_admins where user_id = auth.uid()) then raise exception 'not_admin'; end if; end $$;
revoke all on function public._need_admin() from public, anon, authenticated;

create or replace function public.admin_stats()
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  perform _need_admin();
  return jsonb_build_object(
    'users', (select count(*) from profiles),
    'new_24h', (select count(*) from profiles where created_at > now() - interval '24 hours'),
    'active_5m', (select count(*) from profiles where last_seen > now() - interval '5 minutes'),
    'banned', (select count(*) from profiles where banned),
    'posts_live', (select count(*) from posts where expires_at > now()),
    'posts_hidden', (select count(*) from posts where hidden and expires_at > now()),
    'reports', (select count(*) from reports),
    'messages_live', (select count(*) from messages where expires_at > now()),
    'points_total', (select coalesce(sum(balance), 0) from wallets),
    'settings', get_settings());
end $$;

create or replace function public.admin_users(p_q text default '', p_limit int default 30, p_offset int default 0)
returns table (id uuid, username text, avatar_url text, email text, created_at timestamptz, last_seen timestamptz,
               banned boolean, balance int, posts bigint, is_admin boolean)
language plpgsql stable security definer set search_path = public as $$
begin
  perform _need_admin();
  return query
  select p.id, p.username, p.avatar_url, u.email::text, p.created_at, p.last_seen, p.banned,
         coalesce(w.balance, 0), (select count(*) from posts x where x.user_id = p.id),
         exists (select 1 from app_admins a where a.user_id = p.id)
  from profiles p
  left join auth.users u on u.id = p.id
  left join wallets w on w.user_id = p.id
  where coalesce(p_q, '') = '' or p.username ilike '%' || p_q || '%' or u.email ilike '%' || p_q || '%'
  order by p.created_at desc
  limit least(coalesce(p_limit, 30), 100) offset greatest(coalesce(p_offset, 0), 0);
end $$;

create or replace function public.admin_set_ban(p_user uuid, p_ban boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _need_admin();
  if exists (select 1 from app_admins where user_id = p_user) then raise exception 'cannot_ban_admin'; end if;
  update profiles set banned = coalesce(p_ban, true) where id = p_user;
  if coalesce(p_ban, true) then update posts set hidden = true where user_id = p_user; end if;
end $$;

create or replace function public.admin_adjust_points(p_user uuid, p_delta int, p_note text default '')
returns int language plpgsql security definer set search_path = public as $$
declare nb int;
begin
  perform _need_admin();
  if p_delta is null or p_delta = 0 or abs(p_delta) > 100000 then raise exception 'bad_amount'; end if;
  insert into wallets (user_id, balance) values (p_user, 0) on conflict (user_id) do nothing;
  update wallets set balance = greatest(0, balance + p_delta) where user_id = p_user returning balance into nb;
  insert into point_ledger (user_id, delta, reason, ref) values (p_user, p_delta, 'admin', left(coalesce(p_note, ''), 80));
  return nb;
end $$;

create or replace function public.admin_posts(p_limit int default 30, p_offset int default 0)
returns table (id uuid, user_id uuid, author_name text, caption text, media_url text, media_type text,
               created_at timestamptz, expires_at timestamptz, hidden boolean, reports bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  perform _need_admin();
  return query
  select p.id, p.user_id, p.author_name, p.caption, p.media_url, p.media_type, p.created_at, p.expires_at, p.hidden,
         (select count(*) from reports r where r.post_id = p.id)
  from posts p where p.expires_at > now()
  order by (select count(*) from reports r where r.post_id = p.id) desc, p.created_at desc
  limit least(coalesce(p_limit, 30), 100) offset greatest(coalesce(p_offset, 0), 0);
end $$;

create or replace function public.admin_set_post_hidden(p_post uuid, p_hidden boolean)
returns void language plpgsql security definer set search_path = public as $$
begin perform _need_admin(); update posts set hidden = coalesce(p_hidden, true) where id = p_post; end $$;

create or replace function public.admin_delete_post(p_post uuid)
returns text language plpgsql security definer set search_path = public as $$
declare u text;
begin
  perform _need_admin();
  select media_url into u from posts where id = p_post;
  delete from posts where id = p_post;
  return u;
end $$;

create or replace function public.admin_set_setting(p_key text, p_value jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _need_admin();
  if p_key not in ('points_spend', 'camera_enabled', 'posting_enabled') then raise exception 'bad_key'; end if;
  insert into app_settings (key, value) values (p_key, p_value) on conflict (key) do update set value = excluded.value;
end $$;

revoke all on function public.admin_stats(), public.admin_users(text, int, int), public.admin_set_ban(uuid, boolean),
  public.admin_adjust_points(uuid, int, text), public.admin_posts(int, int), public.admin_set_post_hidden(uuid, boolean),
  public.admin_delete_post(uuid), public.admin_set_setting(text, jsonb) from public, anon;
grant execute on function public.admin_stats(), public.admin_users(text, int, int), public.admin_set_ban(uuid, boolean),
  public.admin_adjust_points(uuid, int, text), public.admin_posts(int, int), public.admin_set_post_hidden(uuid, boolean),
  public.admin_delete_post(uuid), public.admin_set_setting(text, jsonb) to authenticated;

-- Owner သည် ပိတ်ထားသော post ကိုပါ မြင်နိုင်ရန် မလိုပါ (admin_posts ဖြင့်ကြည့်သည်)

notify pgrst, 'reload schema';
