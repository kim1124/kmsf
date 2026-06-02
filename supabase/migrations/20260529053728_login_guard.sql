create schema if not exists private;

create table if not exists private.login_attempt_state (
  provider text not null,
  identifier_hash text not null,
  failed_count integer not null default 0,
  locked_until timestamptz,
  last_failed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (provider, identifier_hash),
  constraint login_attempt_state_failed_count_check check (failed_count >= 0)
);

create table if not exists private.login_audit_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  identifier_hash text not null,
  account_id uuid,
  event_type text not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint login_audit_events_event_type_check check (
    event_type in ('failure', 'success', 'blocked')
  )
);

create index if not exists login_attempt_state_locked_until_idx
  on private.login_attempt_state (locked_until)
  where locked_until is not null;

create index if not exists login_audit_events_identifier_created_at_idx
  on private.login_audit_events (provider, identifier_hash, created_at desc);

create or replace function private.record_login_failure(
  p_provider text,
  p_identifier_hash text,
  p_now timestamptz default now()
)
returns table(failed_count integer, locked_until timestamptz)
language sql
security definer
set search_path = private
as $$
  insert into private.login_attempt_state (
    provider,
    identifier_hash,
    failed_count,
    locked_until,
    last_failed_at,
    updated_at
  )
  values (
    p_provider,
    p_identifier_hash,
    1,
    null,
    p_now,
    p_now
  )
  on conflict (provider, identifier_hash)
  do update set
    failed_count = private.login_attempt_state.failed_count + 1,
    locked_until = case
      when private.login_attempt_state.failed_count + 1 >= 3 then p_now + interval '300 seconds'
      else null
    end,
    last_failed_at = p_now,
    updated_at = p_now
  returning private.login_attempt_state.failed_count,
    private.login_attempt_state.locked_until;
$$;

alter table private.login_attempt_state enable row level security;
alter table private.login_audit_events enable row level security;

revoke all on schema private from anon, authenticated;
revoke all on all tables in schema private from anon, authenticated;
revoke all on schema private from public;
revoke all on all tables in schema private from public;

grant usage on schema private to service_role;
revoke all on function private.record_login_failure(text, text, timestamptz) from public, anon, authenticated;
grant select, insert, update, delete on private.login_attempt_state to service_role;
grant insert on private.login_audit_events to service_role;
grant execute on function private.record_login_failure(text, text, timestamptz) to service_role;
