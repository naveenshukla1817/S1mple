create table if not exists public.workspace_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  state_key text not null,
  data jsonb not null default 'null'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, state_key)
);
create index if not exists workspace_state_user_idx on public.workspace_state(user_id);
alter table public.workspace_state enable row level security;
create policy "workspace_state_select_own" on public.workspace_state for select to authenticated using ((select auth.uid()) = user_id);
create policy "workspace_state_insert_own" on public.workspace_state for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "workspace_state_update_own" on public.workspace_state for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "workspace_state_delete_own" on public.workspace_state for delete to authenticated using ((select auth.uid()) = user_id);
