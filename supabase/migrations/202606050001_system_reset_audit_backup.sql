create schema if not exists private;

create table if not exists private.system_reset_backups (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('local-json', 'supabase')),
  mode text not null check (mode in ('factory', 'settings')),
  actor_id text not null,
  actor_username text not null,
  actor_email text,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists private.system_reset_audit_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('local-json', 'supabase')),
  mode text not null check (mode in ('factory', 'settings')),
  status text not null check (status in ('started', 'success', 'failed')),
  actor_id text not null,
  actor_username text not null,
  actor_email text,
  backup_ref text,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists system_reset_backups_created_at_idx
  on private.system_reset_backups (created_at desc);

create index if not exists system_reset_audit_events_created_at_idx
  on private.system_reset_audit_events (created_at desc);

create index if not exists system_reset_audit_events_provider_mode_idx
  on private.system_reset_audit_events (provider, mode, created_at desc);

alter table private.system_reset_backups enable row level security;
alter table private.system_reset_audit_events enable row level security;

create or replace function public.insert_system_reset_backup(
  p_provider text,
  p_mode text,
  p_actor_id text,
  p_actor_username text,
  p_actor_email text,
  p_snapshot jsonb
)
returns table (id uuid)
language sql
security invoker
set search_path = public, private
as $$
  insert into private.system_reset_backups (
    provider,
    mode,
    actor_id,
    actor_username,
    actor_email,
    snapshot
  )
  values (
    p_provider,
    p_mode,
    p_actor_id,
    p_actor_username,
    p_actor_email,
    p_snapshot
  )
  returning private.system_reset_backups.id;
$$;

create or replace function public.insert_system_reset_audit_event(
  p_provider text,
  p_mode text,
  p_status text,
  p_actor_id text,
  p_actor_username text,
  p_actor_email text,
  p_backup_ref text,
  p_error_message text
)
returns table (id uuid)
language sql
security invoker
set search_path = public, private
as $$
  insert into private.system_reset_audit_events (
    provider,
    mode,
    status,
    actor_id,
    actor_username,
    actor_email,
    backup_ref,
    error_message
  )
  values (
    p_provider,
    p_mode,
    p_status,
    p_actor_id,
    p_actor_username,
    p_actor_email,
    p_backup_ref,
    p_error_message
  )
  returning private.system_reset_audit_events.id;
$$;

revoke all on schema private from public;
revoke all on schema private from anon, authenticated;
revoke all on all tables in schema private from public;
revoke all on all tables in schema private from anon, authenticated;

revoke all on function public.insert_system_reset_backup(text, text, text, text, text, jsonb)
  from public, anon, authenticated;
revoke all on function public.insert_system_reset_audit_event(text, text, text, text, text, text, text, text)
  from public, anon, authenticated;

grant usage on schema private to service_role;
grant insert, select on private.system_reset_backups to service_role;
grant insert, select on private.system_reset_audit_events to service_role;

grant execute on function public.insert_system_reset_backup(text, text, text, text, text, jsonb)
  to service_role;
grant execute on function public.insert_system_reset_audit_event(text, text, text, text, text, text, text, text)
  to service_role;
