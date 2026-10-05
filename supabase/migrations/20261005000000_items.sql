-- Clothing items. Each user can only see and change their own.
create table public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  photo_path text not null,
  category text not null check (category in ('top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory')),
  subcategory text not null default '',
  colors text[] not null default '{}',
  pattern text not null default 'solid' check (pattern in ('solid', 'striped', 'checked', 'floral', 'graphic', 'other')),
  seasons text[] not null default '{}',
  formality text not null default 'casual' check (formality in ('casual', 'smart', 'formal', 'sport')),
  created_at timestamptz not null default now()
);

create index items_user_id_created_at_idx on public.items (user_id, created_at desc);

alter table public.items enable row level security;

create policy "Users read own items" on public.items
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users add own items" on public.items
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update own items" on public.items
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own items" on public.items
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Private photo bucket. Files live under "<user id>/..." and only that user can touch them.
insert into storage.buckets (id, name, public) values ('item-photos', 'item-photos', false);

create policy "Users read own photos" on storage.objects
  for select to authenticated
  using (bucket_id = 'item-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users upload own photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'item-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users delete own photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'item-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
