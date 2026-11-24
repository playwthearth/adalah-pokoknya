-- A Place Beyond Time — Supabase schema
-- Run this once in the Supabase SQL editor (Dashboard → SQL → New query).

create extension if not exists pgcrypto;

-- The two people allowed through the gate.
create table if not exists public.members (
  email text primary key,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now()
);

-- Notes either member leaves for the other.
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  author_email text not null default lower(coalesce(auth.jwt() ->> 'email', '')),
  author_name text not null default '',
  kind text not null default 'daily' check (kind in ('daily', 'love')),
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists notes_created_at_idx on public.notes (created_at desc);

-- The names and the anniversary both people share. One row, id = 'shared'.
create table if not exists public.settings (
  id text primary key default 'shared' check (id = 'shared'),
  recipient text not null default 'Sora' check (char_length(recipient) <= 40),
  author text not null default 'Me' check (char_length(author) <= 40),
  start_date date not null default date '2026-08-28',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

insert into public.settings (id) values ('shared') on conflict (id) do nothing;

-- Both people count the days together in one named zone, so neither device's
-- own clock can shift the total by a day.
alter table public.settings
  add column if not exists timezone text not null default 'Asia/Jakarta';

alter table public.members enable row level security;
alter table public.notes enable row level security;
alter table public.settings enable row level security;

create or replace function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.members m
    where m.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.members m
    where m.email = lower(coalesce(auth.jwt() ->> 'email', ''))
      and m.role = 'owner'
  );
$$;

-- Called right after sign-in. The first person through the door becomes the
-- owner; everyone after that needs to already be on the list.
create or replace function public.claim_membership()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_role text;
begin
  if v_email = '' then
    return null;
  end if;

  if not exists (select 1 from public.members) then
    insert into public.members (email, role) values (v_email, 'owner');
  end if;

  select role into v_role from public.members where email = v_email;
  return v_role;
end;
$$;

create or replace function public.add_member(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
begin
  if not public.is_owner() then
    raise exception 'only the owner can add people';
  end if;

  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'invalid email';
  end if;

  insert into public.members (email, role)
  values (v_email, 'member')
  on conflict (email) do nothing;
end;
$$;

create or replace function public.remove_member(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_owner() then
    raise exception 'only the owner can remove people';
  end if;

  delete from public.members
  where email = lower(trim(p_email)) and role = 'member';
end;
$$;

create or replace function public.list_members()
returns table (email text, role text, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_owner() then
    raise exception 'only the owner can see the list';
  end if;

  return query
    select m.email, m.role, m.created_at
    from public.members m
    order by m.created_at;
end;
$$;

revoke all on function public.is_member() from public, anon;
revoke all on function public.is_owner() from public, anon;
revoke all on function public.claim_membership() from public, anon;
revoke all on function public.add_member(text) from public, anon;
revoke all on function public.remove_member(text) from public, anon;
revoke all on function public.list_members() from public, anon;

grant execute on function public.is_member() to authenticated;
grant execute on function public.is_owner() to authenticated;
grant execute on function public.claim_membership() to authenticated;
grant execute on function public.add_member(text) to authenticated;
grant execute on function public.remove_member(text) to authenticated;
grant execute on function public.list_members() to authenticated;

-- Table privileges: signed-in members get the verbs, the policies decide the rows.
grant usage on schema public to authenticated;
grant select on public.members to authenticated;
grant select, insert, delete on public.notes to authenticated;
grant select, insert, update on public.settings to authenticated;

drop policy if exists members_owner_read on public.members;
create policy members_owner_read on public.members
  for select to authenticated
  using (public.is_owner());

drop policy if exists notes_read on public.notes;
create policy notes_read on public.notes
  for select to authenticated
  using (public.is_member());

drop policy if exists settings_read on public.settings;
create policy settings_read on public.settings
  for select to authenticated
  using (public.is_member());

drop policy if exists settings_insert on public.settings;
create policy settings_insert on public.settings
  for insert to authenticated
  with check (public.is_member());

drop policy if exists settings_update on public.settings;
create policy settings_update on public.settings
  for update to authenticated
  using (public.is_member())
  with check (public.is_member());

drop policy if exists notes_insert on public.notes;
create policy notes_insert on public.notes
  for insert to authenticated
  with check (public.is_member() and author_id = auth.uid());

drop policy if exists notes_delete on public.notes;
create policy notes_delete on public.notes
  for delete to authenticated
  using (author_id = auth.uid());

-- Live notes: the browser subscribes to inserts and deletes, so a note the
-- other person leaves appears without a reload. Re-running this is harmless.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notes'
  ) then
    alter publication supabase_realtime add table public.notes;
  end if;
end
$$;

-- Live settings: a name, the anniversary or the shared timezone changed by one
-- person reaches the other without a reload. Re-running this is harmless.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'settings'
  ) then
    alter publication supabase_realtime add table public.settings;
  end if;
end
$$;

-- The shared memory archive. Both members can add, edit and delete.
-- image_url holds the original placeholder assets; image_path points at an
-- uploaded photo in the private `memories` storage bucket.
create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  title text not null default '' check (char_length(title) <= 120),
  note text not null default '' check (char_length(note) <= 2000),
  memory_date date not null default current_date,
  image_path text,
  image_url text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create index if not exists memories_date_idx on public.memories (memory_date);

alter table public.memories enable row level security;

grant select, insert, update, delete on public.memories to authenticated;

drop policy if exists memories_read on public.memories;
create policy memories_read on public.memories
  for select to authenticated
  using (public.is_member());

drop policy if exists memories_insert on public.memories;
create policy memories_insert on public.memories
  for insert to authenticated
  with check (public.is_member() and created_by = auth.uid());

drop policy if exists memories_update on public.memories;
create policy memories_update on public.memories
  for update to authenticated
  using (public.is_member())
  with check (public.is_member());

drop policy if exists memories_delete on public.memories;
create policy memories_delete on public.memories
  for delete to authenticated
  using (public.is_member());

-- Live archive: both browsers subscribe to inserts, edits and deletes, so a
-- memory the other person adds shows up without a reload. Re-running is safe.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'memories'
  ) then
    alter publication supabase_realtime add table public.memories;
  end if;
end
$$;

-- Private bucket for uploaded photos. Every object path starts with the
-- uploader's user id; both members may read every photo.
insert into storage.buckets (id, name, public)
values ('memories', 'memories', false)
on conflict (id) do nothing;

drop policy if exists memories_photo_read on storage.objects;
create policy memories_photo_read on storage.objects
  for select to authenticated
  using (bucket_id = 'memories' and public.is_member());

drop policy if exists memories_photo_insert on storage.objects;
create policy memories_photo_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'memories'
    and public.is_member()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists memories_photo_update on storage.objects;
create policy memories_photo_update on storage.objects
  for update to authenticated
  using (bucket_id = 'memories' and public.is_member())
  with check (bucket_id = 'memories' and public.is_member());

drop policy if exists memories_photo_delete on storage.objects;
create policy memories_photo_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'memories' and public.is_member());
