create table if not exists public.kmsf_chat_threads (
  id text primary key,
  user_id uuid not null,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.kmsf_chat_messages (
  id text primary key,
  user_id uuid not null,
  thread_id text not null references public.kmsf_chat_threads(id) on delete cascade,
  role text not null check (role in ('system', 'user', 'assistant')),
  content text not null default '',
  thinking text,
  status text not null check (status in ('pending', 'complete', 'error', 'aborted')),
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.kmsf_chat_settings (
  user_id uuid primary key,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.kmsf_chat_threads enable row level security;
alter table public.kmsf_chat_messages enable row level security;
alter table public.kmsf_chat_settings enable row level security;

grant select, insert, update, delete on public.kmsf_chat_threads to authenticated;
grant select, insert, update, delete on public.kmsf_chat_messages to authenticated;
grant select, insert, update, delete on public.kmsf_chat_settings to authenticated;

drop policy if exists "kmsf chat threads owner select" on public.kmsf_chat_threads;
create policy "kmsf chat threads owner select"
  on public.kmsf_chat_threads
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "kmsf chat threads owner insert" on public.kmsf_chat_threads;
create policy "kmsf chat threads owner insert"
  on public.kmsf_chat_threads
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "kmsf chat threads owner update" on public.kmsf_chat_threads;
create policy "kmsf chat threads owner update"
  on public.kmsf_chat_threads
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "kmsf chat threads owner delete" on public.kmsf_chat_threads;
create policy "kmsf chat threads owner delete"
  on public.kmsf_chat_threads
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "kmsf chat messages owner select" on public.kmsf_chat_messages;
create policy "kmsf chat messages owner select"
  on public.kmsf_chat_messages
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "kmsf chat messages owner insert" on public.kmsf_chat_messages;
create policy "kmsf chat messages owner insert"
  on public.kmsf_chat_messages
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "kmsf chat messages owner update" on public.kmsf_chat_messages;
create policy "kmsf chat messages owner update"
  on public.kmsf_chat_messages
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "kmsf chat messages owner delete" on public.kmsf_chat_messages;
create policy "kmsf chat messages owner delete"
  on public.kmsf_chat_messages
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "kmsf chat settings owner select" on public.kmsf_chat_settings;
create policy "kmsf chat settings owner select"
  on public.kmsf_chat_settings
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "kmsf chat settings owner insert" on public.kmsf_chat_settings;
create policy "kmsf chat settings owner insert"
  on public.kmsf_chat_settings
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "kmsf chat settings owner update" on public.kmsf_chat_settings;
create policy "kmsf chat settings owner update"
  on public.kmsf_chat_settings
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "kmsf chat settings owner delete" on public.kmsf_chat_settings;
create policy "kmsf chat settings owner delete"
  on public.kmsf_chat_settings
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create index if not exists kmsf_chat_threads_user_updated_idx
  on public.kmsf_chat_threads (user_id, updated_at desc);

create index if not exists kmsf_chat_messages_user_thread_idx
  on public.kmsf_chat_messages (user_id, thread_id);

create index if not exists kmsf_chat_messages_thread_created_idx
  on public.kmsf_chat_messages (thread_id, created_at asc);

create index if not exists kmsf_chat_settings_user_idx
  on public.kmsf_chat_settings (user_id);
