-- =====================================
-- PRIME PRIVATE CENTER DATABASE
-- =====================================

create extension if not exists pgcrypto;

-- ADMIN USERS TABLE
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- LESSONS TABLE
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  created_at timestamptz default now()
);

-- ASSIGNMENTS TABLE
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  created_at timestamptz default now()
);

-- NOTICES TABLE
create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  created_at timestamptz default now()
);

-- ROUTINES TABLE
create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  created_at timestamptz default now()
);

-- ADMIN CHECK FUNCTION
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

-- ENABLE RLS
alter table public.admin_users enable row level security;
alter table public.lessons enable row level security;
alter table public.assignments enable row level security;
alter table public.notices enable row level security;
alter table public.routines enable row level security;

-- ADMIN USERS POLICY
drop policy if exists "Admins can read admin list"
on public.admin_users;

create policy "Admins can read admin list"
on public.admin_users
for select
to authenticated
using (public.is_admin());

-- CONTENT POLICIES
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'lessons',
    'assignments',
    'notices',
    'routines'
  ]
  loop

    execute format(
      'drop policy if exists "Public can read %I" on public.%I',
      tbl, tbl
    );

    execute format(
      'create policy "Public can read %I" on public.%I
       for select to anon, authenticated using (true)',
      tbl, tbl
    );

    execute format(
      'drop policy if exists "Admins can insert %I" on public.%I',
      tbl, tbl
    );

    execute format(
      'create policy "Admins can insert %I" on public.%I
       for insert to authenticated
       with check (public.is_admin())',
      tbl, tbl
    );

    execute format(
      'drop policy if exists "Admins can update %I" on public.%I',
      tbl, tbl
    );

    execute format(
      'create policy "Admins can update %I" on public.%I
       for update to authenticated
       using (public.is_admin())
       with check (public.is_admin())',
      tbl, tbl
    );

    execute format(
      'drop policy if exists "Admins can delete %I" on public.%I',
      tbl, tbl
    );

    execute format(
      'create policy "Admins can delete %I" on public.%I
       for delete to authenticated
       using (public.is_admin())',
      tbl, tbl
    );

  end loop;
end $$;

-- DATABASE PERMISSIONS
grant usage on schema public to anon, authenticated;

grant select on public.lessons,
public.assignments,
public.notices,
public.routines
to anon, authenticated;

grant insert, update, delete on public.lessons,
public.assignments,
public.notices,
public.routines
to authenticated;

grant select on public.admin_users to authenticated;

-- REALTIME ENABLE
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'lessons',
    'assignments',
    'notices',
    'routines'
  ]
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = tbl
    ) then
      execute format(
        'alter publication supabase_realtime add table public.%I',
        tbl
      );
    end if;
  end loop;
end $$;

-- DATABASE SETUP COMPLETE
