-- Not a Consult: production setup on Supabase
-- 1. Explicit API grants (new objects are no longer exposed automatically)
-- 2. RLS helpers moved to a schema the Data API doesn't expose, and policies
--    rewritten so per-user checks run once per query
-- 3. updated_at and project activity kept by triggers
-- 4. Field-level edit history for analyses
-- 5. AI usage log

-- ---------------------------------------------------------------------------
-- 1. API access
-- ---------------------------------------------------------------------------

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from public;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. RLS helpers in a private schema
-- ---------------------------------------------------------------------------

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.is_active_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active);
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active and role = 'admin');
$$;

create or replace function private.can_access_project(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_admin()
      or (private.is_active_member()
          and exists (select 1 from public.project_members where project_id = pid and user_id = auth.uid()));
$$;

-- Client access lives in a helper so the clients and projects policies never
-- query each other's tables (which Postgres would reject as policy recursion).
create or replace function private.can_access_client(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_admin()
      or (private.is_active_member()
          and exists (
            select 1 from public.clients c
             where c.id = cid
               and (c.created_by = auth.uid()
                    or exists (
                      select 1 from public.projects p
                        join public.project_members m on m.project_id = p.id
                       where p.client_id = cid and m.user_id = auth.uid()))));
$$;

revoke all on all functions in schema private from public;
grant execute on function
  private.is_active_member(),
  private.is_admin(),
  private.can_access_project(uuid),
  private.can_access_client(uuid)
  to authenticated;

create or replace function public.guard_profile_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (new.role is distinct from old.role or new.active is distinct from old.active)
     and not private.is_admin() then
    raise exception 'only admins can change role or active';
  end if;
  return new;
end;
$$;

-- Policies: drop the originals and recreate them on the private helpers.
drop policy "members read settings" on public.app_settings;
drop policy "admins update settings" on public.app_settings;
drop policy "read own or team profiles" on public.profiles;
drop policy "update own profile" on public.profiles;
drop policy "members read clients" on public.clients;
drop policy "members create clients" on public.clients;
drop policy "creator or admin update clients" on public.clients;
drop policy "creator or admin delete clients" on public.clients;
drop policy "members read projects" on public.projects;
drop policy "members create projects" on public.projects;
drop policy "members update projects" on public.projects;
drop policy "creator or admin delete projects" on public.projects;
drop policy "members read project members" on public.project_members;
drop policy "members add project members" on public.project_members;
drop policy "members remove project members" on public.project_members;
drop policy "members manage questions" on public.questions;
drop policy "members manage analyses" on public.analyses;
drop policy "members manage summaries" on public.summaries;
drop policy "members manage client links" on public.client_links;
drop policy "members manage reports" on public.report_publications;

drop function public.can_access_project(uuid);
drop function public.is_admin();
drop function public.is_active_member();

create policy "members read settings" on public.app_settings
  for select to authenticated using ((select private.is_active_member()));
create policy "admins update settings" on public.app_settings
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "read own or team profiles" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or (select private.is_active_member()));
create policy "update own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()))
  with check (id = (select auth.uid()) or (select private.is_admin()));

-- The creator check reads the row itself, so INSERT ... RETURNING works
-- (a helper query can't see a row inserted by the same statement).
create policy "members read clients" on public.clients
  for select to authenticated using (
    ((select private.is_active_member()) and created_by = (select auth.uid())) or private.can_access_client(id)
  );
create policy "members create clients" on public.clients
  for insert to authenticated with check ((select private.is_active_member()) and created_by = (select auth.uid()));
create policy "creator or admin update clients" on public.clients
  for update to authenticated
  using ((select private.is_admin()) or ((select private.is_active_member()) and created_by = (select auth.uid())));
create policy "creator or admin delete clients" on public.clients
  for delete to authenticated
  using ((select private.is_admin()) or ((select private.is_active_member()) and created_by = (select auth.uid())));

-- created_by is needed so INSERT ... RETURNING passes before the membership trigger runs.
create policy "members read projects" on public.projects
  for select to authenticated using (
    private.can_access_project(id) or ((select private.is_active_member()) and created_by = (select auth.uid()))
  );
create policy "members create projects" on public.projects
  for insert to authenticated with check (
    (select private.is_active_member()) and created_by = (select auth.uid()) and private.can_access_client(client_id)
  );
create policy "members update projects" on public.projects
  for update to authenticated using (private.can_access_project(id)) with check (private.can_access_project(id));
create policy "creator or admin delete projects" on public.projects
  for delete to authenticated
  using ((select private.is_admin()) or ((select private.is_active_member()) and created_by = (select auth.uid())));

create policy "members read project members" on public.project_members
  for select to authenticated using (private.can_access_project(project_id));
create policy "members add project members" on public.project_members
  for insert to authenticated with check (private.can_access_project(project_id));
create policy "members remove project members" on public.project_members
  for delete to authenticated using (private.can_access_project(project_id));

create policy "members manage questions" on public.questions
  for all to authenticated
  using (private.can_access_project(project_id)) with check (private.can_access_project(project_id));
create policy "members manage analyses" on public.analyses
  for all to authenticated
  using (private.can_access_project(project_id)) with check (private.can_access_project(project_id));
create policy "members manage summaries" on public.summaries
  for all to authenticated
  using (private.can_access_project(project_id)) with check (private.can_access_project(project_id));
create policy "members manage client links" on public.client_links
  for all to authenticated
  using (private.can_access_project(project_id)) with check (private.can_access_project(project_id));
create policy "members manage reports" on public.report_publications
  for all to authenticated
  using (private.can_access_project(project_id)) with check (private.can_access_project(project_id));

create index if not exists clients_created_by_idx on public.clients (created_by);
create index if not exists projects_created_by_idx on public.projects (created_by);

-- ---------------------------------------------------------------------------
-- 3. Timestamps and activity
-- ---------------------------------------------------------------------------

alter table public.clients add column if not exists updated_at timestamptz not null default now();

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger touch_updated_at before update on public.clients for each row execute function private.touch_updated_at();
create trigger touch_updated_at before update on public.projects for each row execute function private.touch_updated_at();
create trigger touch_updated_at before update on public.analyses for each row execute function private.touch_updated_at();
create trigger touch_updated_at before update on public.summaries for each row execute function private.touch_updated_at();
create trigger touch_updated_at before update on public.app_settings for each row execute function private.touch_updated_at();

-- Work inside a project moves it up the dashboard, at most once a minute.
create or replace function private.touch_project()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  pid uuid := case when tg_op = 'DELETE' then old.project_id else new.project_id end;
begin
  update public.projects set updated_at = now() where id = pid and updated_at < now() - interval '1 minute';
  return null;
end;
$$;

create trigger touch_project after insert or update or delete on public.questions for each row execute function private.touch_project();
create trigger touch_project after insert or update or delete on public.analyses for each row execute function private.touch_project();
create trigger touch_project after insert or update or delete on public.summaries for each row execute function private.touch_project();
create trigger touch_project after insert or update or delete on public.client_links for each row execute function private.touch_project();

create or replace function private.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function private.sync_profile_email();

-- ---------------------------------------------------------------------------
-- 4. Edit history
-- ---------------------------------------------------------------------------

create table public.analysis_revisions (
  id bigint generated always as identity primary key,
  analysis_id uuid not null references public.analyses (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  field_key text not null,
  value_before jsonb,
  value_after jsonb,
  changed_by uuid references public.profiles (id) on delete set null,
  client_link_id uuid references public.client_links (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.analysis_revisions (analysis_id, field_key, updated_at desc);
create index on public.analysis_revisions (project_id);
create index on public.analysis_revisions (changed_by);
create index on public.analysis_revisions (client_link_id);

-- One row per changed field. Repeated autosaves of the same field by the same
-- person within 2 minutes update that row instead of adding new ones.
create or replace function private.record_analysis_revision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  k text;
  actor uuid := auth.uid();
  link uuid := nullif(current_setting('app.client_link_id', true), '')::uuid;
  recent bigint;
begin
  if new.data is not distinct from old.data then
    return null;
  end if;
  for k in select jsonb_object_keys(old.data) union select jsonb_object_keys(new.data) loop
    continue when (old.data -> k) is not distinct from (new.data -> k);
    select r.id into recent
      from public.analysis_revisions r
     where r.analysis_id = new.id
       and r.field_key = k
       and r.changed_by is not distinct from actor
       and r.client_link_id is not distinct from link
       and r.updated_at > now() - interval '2 minutes'
     order by r.updated_at desc
     limit 1;
    if recent is not null then
      update public.analysis_revisions set value_after = new.data -> k, updated_at = now() where id = recent;
    else
      insert into public.analysis_revisions (analysis_id, project_id, field_key, value_before, value_after, changed_by, client_link_id)
      values (new.id, new.project_id, k, old.data -> k, new.data -> k, actor, link);
    end if;
  end loop;
  return null;
end;
$$;

create trigger record_analysis_revision
  after update of data on public.analyses
  for each row execute function private.record_analysis_revision();

alter table public.analysis_revisions enable row level security;
create policy "members read revisions" on public.analysis_revisions
  for select to authenticated using (private.can_access_project(project_id));

-- Client edits name their link so the history shows who changed what.
create or replace function public.client_link_save(link_token text, analysis_id uuid, patch jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  link public.client_links;
  allowed jsonb;
  filtered jsonb;
begin
  link := public.resolve_client_link(link_token);
  if link.id is null then
    raise exception 'link is invalid or expired';
  end if;

  if analysis_id is null then
    allowed := coalesce(link.scope -> 'profile', '[]');
  else
    allowed := link.scope -> 'analyses' -> analysis_id::text;
    if allowed is null then
      raise exception 'analysis not in link scope';
    end if;
  end if;

  select coalesce(jsonb_object_agg(p.key, p.value), '{}') into filtered
    from jsonb_each(coalesce(patch, '{}')) p
   where allowed ? p.key;

  if filtered = '{}'::jsonb then
    return false;
  end if;

  perform set_config('app.client_link_id', link.id::text, true);
  if analysis_id is null then
    update public.projects
       set business_profile = business_profile || filtered
     where id = link.project_id;
  else
    update public.analyses
       set data = data || filtered,
           status = case when status = 'not_started' then 'in_progress' else status end,
           updated_by = null
     where id = analysis_id and project_id = link.project_id;
  end if;
  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. AI usage log
-- ---------------------------------------------------------------------------

create table public.ai_requests (
  id bigint generated always as identity primary key,
  project_id uuid references public.projects (id) on delete set null,
  user_id uuid references public.profiles (id) on delete set null default auth.uid(),
  kind text not null check (kind in ('recommend', 'assist', 'review', 'summary')),
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cache_read_tokens integer not null default 0,
  ok boolean not null default true,
  error text,
  created_at timestamptz not null default now()
);
create index on public.ai_requests (created_at desc);
create index on public.ai_requests (user_id);
create index on public.ai_requests (project_id);

alter table public.ai_requests enable row level security;
create policy "members log their ai requests" on public.ai_requests
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and (select private.is_active_member())
    and (project_id is null or private.can_access_project(project_id))
  );
create policy "own or admin read ai requests" on public.ai_requests
  for select to authenticated using (user_id = (select auth.uid()) or (select private.is_admin()));

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant select on public.app_settings to authenticated;
grant update (allowed_domains) on public.app_settings to authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, avatar_url, role, active) on public.profiles to authenticated;
grant select, insert, update, delete on
  public.clients,
  public.projects,
  public.questions,
  public.analyses,
  public.summaries,
  public.client_links,
  public.report_publications
  to authenticated;
grant select, insert, delete on public.project_members to authenticated;
grant select on public.analysis_revisions to authenticated;
grant select, insert on public.ai_requests to authenticated;

grant select, insert, update, delete on all tables in schema public to service_role;

grant execute on function public.patch_analysis(uuid, jsonb), public.patch_business_profile(uuid, jsonb) to authenticated;
grant execute on function
  public.client_link_get(text),
  public.client_link_save(text, uuid, jsonb),
  public.client_link_submit(text),
  public.public_report_get(text)
  to anon, authenticated;
