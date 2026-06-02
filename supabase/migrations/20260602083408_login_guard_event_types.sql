update private.login_audit_events
set event_type = 'failed'
where event_type = 'failure';

alter table private.login_audit_events
  drop constraint if exists login_audit_events_event_type_check;

alter table private.login_audit_events
  add constraint login_audit_events_event_type_check
  check (event_type in ('failed', 'locked', 'blocked', 'success'));

notify pgrst, 'reload schema';
