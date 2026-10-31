-- Supabase > SQL Editor ထဲမှာ တစ်ကြိမ် run ပါ။ (ဖိုင်နာမည်က setup.sql ဖြစ်ရမည်)

-- ========== Snap posts (၂၄ နာရီပြည့်ရင် ပျောက်သည်) ==========
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  author_name text not null,
  caption text,
  category text,
  media_url text not null,
  media_type text not null check (media_type in ('image','video')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);
create index if not exists posts_created_idx on public.posts (created_at desc);
create index if not exists posts_expires_idx on public.posts (expires_at);

alter table public.posts enable row level security;

create policy "read live posts" on public.posts
  for select using (expires_at > now());

create policy "insert own post" on public.posts
  for insert to authenticated
  with check (user_id = auth.uid() and expires_at <= now() + interval '24 hours 5 minutes');

create policy "delete own post" on public.posts
  for delete to authenticated using (user_id = auth.uid());

-- ========== Follow ==========
create table if not exists public.follows (
  follower_id uuid not null default auth.uid() references auth.users on delete cascade,
  followee_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
alter table public.follows enable row level security;
create policy "read own follows" on public.follows for select to authenticated using (follower_id = auth.uid());
create policy "follow" on public.follows for insert to authenticated with check (follower_id = auth.uid());
create policy "unfollow" on public.follows for delete to authenticated using (follower_id = auth.uid());

-- ========== Report ==========
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid,
  reason text,
  created_at timestamptz not null default now()
);
alter table public.reports enable row level security;
create policy "anyone can report" on public.reports for insert to anon, authenticated with check (true);
-- (reports ကို Supabase Table Editor ထဲမှာသာ ကြည့်နိုင်သည်)

-- ========== Storage ==========
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('posts', 'posts', true, 52428800,
        array['video/webm','video/mp4','image/jpeg','image/png'])
on conflict (id) do nothing;

create policy "upload to own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'posts' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "public read posts" on storage.objects
  for select using (bucket_id = 'posts');

create policy "delete own files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'posts' and (storage.foldername(name))[1] = auth.uid()::text);

-- ========== (လိုလျှင်) သက်တမ်းကုန် row များကို နာရီတိုင်း ရှင်းရန် ==========
-- Database > Extensions မှာ pg_cron ကို ဖွင့်ပြီးမှ run ပါ။
-- select cron.schedule('purge-expired-posts', '0 * * * *',
--   $$ delete from public.posts where expires_at < now() - interval '1 hour' $$);
-- မှတ်ချက်: ဒီ SQL က row ကိုသာ ဖျက်သည်။ Storage ထဲက ဖိုင်များကို Supabase Storage API
-- (Edge Function) ဖြင့် ဖျက်ရသည်။ မဖျက်ရင် အခမဲ့ ၁GB ပြည့်သွားနိုင်သည်။
