create schema if not exists private;

create table if not exists public.manager (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  email text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.manager
  add column if not exists display_name text,
  add column if not exists role text not null default 'member',
  add column if not exists level integer not null default 1,
  add column if not exists status text not null default 'active',
  add column if not exists last_signed_in_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'manager_role_check'
  ) then
    alter table public.manager
      add constraint manager_role_check check (role in ('admin', 'member'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'manager_level_check'
  ) then
    alter table public.manager
      add constraint manager_level_check check (level between 1 and 3);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'manager_status_check'
  ) then
    alter table public.manager
      add constraint manager_status_check check (status in ('active', 'suspended'));
  end if;
end $$;

create unique index if not exists manager_username_key on public.manager (username);
create unique index if not exists manager_email_lower_key on public.manager (lower(email));
create index if not exists manager_status_level_role_idx on public.manager (status, level, role);

create table if not exists public.manager_access (
  manager_id uuid not null references public.manager(id) on delete cascade,
  resource text not null,
  can_read boolean not null default true,
  can_write boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (manager_id, resource)
);

alter table public.manager enable row level security;
alter table public.manager_access enable row level security;

revoke all on public.manager from anon, authenticated;
revoke all on public.manager_access from anon, authenticated;

grant select on public.manager to authenticated;
grant update (username, email, display_name, avatar_url, updated_at) on public.manager to authenticated;
grant select on public.manager_access to authenticated;

create or replace function private.is_active_level3_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.manager
    where id = (select auth.uid())
      and role = 'admin'
      and level = 3
      and status = 'active'
  );
$$;

revoke all on function private.is_active_level3_admin() from public;
grant execute on function private.is_active_level3_admin() to authenticated;

drop policy if exists "manager_select_self_or_level3_admin" on public.manager;
create policy "manager_select_self_or_level3_admin"
on public.manager
for select
to authenticated
using (
  id = (select auth.uid())
  or private.is_active_level3_admin()
);

drop policy if exists "manager_update_own_profile" on public.manager;
create policy "manager_update_own_profile"
on public.manager
for update
to authenticated
using (
  id = (select auth.uid())
  and status = 'active'
)
with check (
  id = (select auth.uid())
  and status = 'active'
);

drop policy if exists "manager_access_select_self_or_level3_admin" on public.manager_access;
create policy "manager_access_select_self_or_level3_admin"
on public.manager_access
for select
to authenticated
using (
  manager_id = (select auth.uid())
  or private.is_active_level3_admin()
);
