-- Run this in Supabase SQL Editor after the base schema exists.
-- It makes Supabase Auth the source of truth and keeps public.users linked.

create extension if not exists pgcrypto;

create table if not exists public.email_verification_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  code_hash text not null,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists email_verification_codes_email_idx
on public.email_verification_codes (email, created_at desc);

create index if not exists email_verification_codes_active_idx
on public.email_verification_codes (email, code_hash, expires_at)
where consumed_at is null;

alter table public.email_verification_codes enable row level security;

revoke all on public.email_verification_codes from anon, authenticated;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_name text;
begin
  profile_name := nullif(trim(new.raw_user_meta_data ->> 'name'), '');

  if profile_name is null then
    profile_name := coalesce(
      nullif(split_part(new.email, '@', 1), ''),
      'ReadTrack Reader'
    );
  end if;

  insert into public.users (id, email, name, created_at, updated_at)
  values (new.id, lower(new.email), profile_name, now(), now())
  on conflict (id) do update
    set email = excluded.email,
        name = coalesce(nullif(excluded.name, ''), public.users.name),
        updated_at = now();

  insert into public.profiles (user_id, name, created_at)
  values (new.id, profile_name, now())
  on conflict (user_id) do update
    set name = coalesce(nullif(excluded.name, ''), public.profiles.name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

alter table public.users enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "Users can read their own user row" on public.users;
create policy "Users can read their own user row"
on public.users
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can insert their own user row" on public.users;
create policy "Users can insert their own user row"
on public.users
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update their own user row" on public.users;
create policy "Users can update their own user row"
on public.users
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
