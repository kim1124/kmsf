create or replace function public.check_login_guard(
  p_provider text,
  p_identifier_hash text
)
returns table(failed_count integer, locked_until timestamptz)
language sql
security invoker
set search_path = public, private
as $$
  select state.failed_count, state.locked_until
  from private.login_attempt_state as state
  where state.provider = p_provider
    and state.identifier_hash = p_identifier_hash;
$$;

create or replace function public.record_login_failure(
  p_provider text,
  p_identifier_hash text,
  p_now timestamptz default now()
)
returns table(failed_count integer, locked_until timestamptz)
language sql
security invoker
set search_path = public, private
as $$
  select *
  from private.record_login_failure(p_provider, p_identifier_hash, p_now);
$$;

create or replace function public.clear_login_attempt_state(
  p_provider text,
  p_identifier_hash text
)
returns void
language sql
security invoker
set search_path = public, private
as $$
  delete from private.login_attempt_state
  where provider = p_provider
    and identifier_hash = p_identifier_hash;
$$;

create or replace function public.insert_login_audit_event(
  p_provider text,
  p_identifier_hash text,
  p_event_type text,
  p_account_id uuid default null,
  p_reason text default null
)
returns void
language sql
security invoker
set search_path = public, private
as $$
  insert into private.login_audit_events (
    account_id,
    event_type,
    identifier_hash,
    provider,
    reason
  )
  values (
    p_account_id,
    p_event_type,
    p_identifier_hash,
    p_provider,
    p_reason
  );
$$;

revoke all on function public.check_login_guard(text, text) from public, anon, authenticated;
revoke all on function public.record_login_failure(text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.clear_login_attempt_state(text, text) from public, anon, authenticated;
revoke all on function public.insert_login_audit_event(text, text, text, uuid, text) from public, anon, authenticated;

grant execute on function public.check_login_guard(text, text) to service_role;
grant execute on function public.record_login_failure(text, text, timestamptz) to service_role;
grant execute on function public.clear_login_attempt_state(text, text) to service_role;
grant execute on function public.insert_login_audit_event(text, text, text, uuid, text) to service_role;

notify pgrst, 'reload schema';
