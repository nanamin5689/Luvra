-- Supabase > SQL Editor ထဲမှာ တစ်ကြိမ် run ပါ။

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null,
  description text,
  creator text not null,
  category text,
  license text not null,
  video_url text not null,
  approved boolean not null default false,   -- admin က true လုပ်မှ အများပြည်သူမြင်ရမည်
  created_at timestamptz not null default now()
);

alter table public.videos enable row level security;

create policy "read approved or own" on public.videos
  for select using (approved = true or user_id = auth.uid());

create policy "insert own unapproved" on public.videos
  for insert to authenticated
  with check (user_id = auth.uid() and approved = false);

create policy "delete own" on public.videos
  for delete to authenticated using (user_id = auth.uid());

-- Storage bucket (50MB ကန့်သတ်၊ mp4/webm သာ)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('videos', 'videos', true, 52428800, array['video/mp4','video/webm'])
on conflict (id) do nothing;

create policy "upload to own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "public read videos" on storage.objects
  for select using (bucket_id = 'videos');
