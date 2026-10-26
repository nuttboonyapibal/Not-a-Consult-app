-- Not a Consult: Phase 1 schema
-- Team members sign in with Google (Supabase Auth). Clients never sign in:
-- they reach their data only through the security-definer functions at the
-- bottom of this file, using a random link token.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.app_role as enum ('admin', 'consultant');
create type public.business_stage as enum ('startup', 'sme', 'enterprise');
create type public.project_status as enum ('draft', 'waiting_client', 'analyzing', 'summarized');
create type public.analysis_status as enum ('not_started', 'in_progress', 'waiting_client', 'done');

-- ---------------------------------------------------------------------------
-- Team
-- ---------------------------------------------------------------------------

create table public.app_settings (
  id int primary key default 1 check (id = 1),
  allowed_domains text[] not null default '{}',
  updated_at timestamptz not null default now()
);
insert into public.app_settings (id) values (1);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  role public.app_role not null default 'consultant',
  active boolean not null default false,
  created_at timestamptz not null default now()
);

-- New sign-ins get a profile. The very first user becomes the admin; later
-- users are active only when their email domain is in app_settings.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_first boolean;
  domain text;
  allowed text[];
begin
  select not exists (select 1 from public.profiles) into is_first;
  domain := lower(split_part(new.email, '@', 2));
  select allowed_domains into allowed from public.app_settings where id = 1;

  insert into public.profiles (id, email, full_name, avatar_url, role, active)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url',
    case when is_first then 'admin'::public.app_role else 'consultant'::public.app_role end,
    is_first or domain = any (coalesce(allowed, '{}'))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_active_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active);
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active and role = 'admin');
$$;

-- Only admins may change role or active, including on their own profile.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (new.role is distinct from old.role or new.active is distinct from old.active)
     and not public.is_admin() then
    raise exception 'only admins can change role or active';
  end if;
  return new;
end;
$$;

create trigger guard_profile_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

-- ---------------------------------------------------------------------------
-- Clients, projects, questions, analyses
-- ---------------------------------------------------------------------------

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null,
  stage public.business_stage not null default 'sme',
  status public.project_status not null default 'draft',
  ai_enabled boolean not null default true,
  report_lang text not null default 'th' check (report_lang in ('th', 'en')),
  business_profile jsonb not null default '{}',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.projects (client_id);

create table public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (project_id, user_id)
);
create index on public.project_members (user_id);

create or replace function public.can_access_project(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
      or (public.is_active_member()
          and exists (select 1 from public.project_members where project_id = pid and user_id = auth.uid()));
$$;

-- The creator of a project is always a member of it.
create or replace function public.add_project_creator()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.created_by is not null then
    insert into public.project_members (project_id, user_id)
    values (new.id, new.created_by)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

create trigger add_project_creator
  after insert on public.projects
  for each row execute function public.add_project_creator();

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  text text not null,
  category text,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.questions (project_id);

create table public.analyses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  framework_key text not null,
  data jsonb not null default '{}',
  status public.analysis_status not null default 'not_started',
  position int not null default 0,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index on public.analyses (project_id);
create index on public.analyses (question_id);

-- An analysis must belong to the same project as its question.
create or replace function public.check_analysis_project()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (select 1 from public.questions where id = new.question_id and project_id = new.project_id) then
    raise exception 'question does not belong to project';
  end if;
  return new;
end;
$$;

create trigger check_analysis_project
  before insert or update of question_id, project_id on public.analyses
  for each row execute function public.check_analysis_project();

-- Merge top-level keys into analysis data, so two people editing different
-- fields at once never overwrite each other.
create or replace function public.patch_analysis(aid uuid, patch jsonb)
returns public.analyses
language plpgsql
security invoker
set search_path = public
as $$
declare
  result public.analyses;
begin
  update public.analyses
     set data = data || patch,
         status = case when status = 'not_started' then 'in_progress' else status end,
         updated_by = auth.uid(),
         updated_at = now()
   where id = aid
  returning * into result;
  if result.id is null then
    raise exception 'analysis not found';
  end if;
  return result;
end;
$$;

create or replace function public.patch_business_profile(pid uuid, patch jsonb)
returns public.projects
language plpgsql
security invoker
set search_path = public
as $$
declare
  result public.projects;
begin
  update public.projects
     set business_profile = business_profile || patch,
         updated_at = now()
   where id = pid
  returning * into result;
  if result.id is null then
    raise exception 'project not found';
  end if;
  return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Summary, client links, published reports
-- ---------------------------------------------------------------------------

create table public.summaries (
  project_id uuid primary key references public.projects (id) on delete cascade,
  exec_summary jsonb not null default '{}',
  decisions jsonb not null default '[]',
  action_plan jsonb not null default '{}',
  source text not null default 'manual' check (source in ('ai', 'template', 'manual')),
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

-- scope = { "profile": ["fieldKey", ...], "analyses": { "<analysis id>": ["fieldKey", ...] } }
create table public.client_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  token text not null unique,
  label text,
  message text,
  scope jsonb not null default '{"profile": [], "analyses": {}}',
  expires_at timestamptz,
  revoked_at timestamptz,
  opened_at timestamptz,
  submitted_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  check (length(token) >= 32)
);
create index on public.client_links (project_id);

create table public.report_publications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  token text not null unique,
  snapshot jsonb not null,
  lang text not null default 'th' check (lang in ('th', 'en')),
  published_by uuid references public.profiles (id) on delete set null,
  published_at timestamptz not null default now(),
  revoked_at timestamptz,
  check (length(token) >= 32)
);
create index on public.report_publications (project_id);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.app_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.questions enable row level security;
alter table public.analyses enable row level security;
alter table public.summaries enable row level security;
alter table public.client_links enable row level security;
alter table public.report_publications enable row level security;

create policy "members read settings" on public.app_settings
  for select to authenticated using (public.is_active_member());
create policy "admins update settings" on public.app_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "read own or team profiles" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_active_member());
create policy "update own profile" on public.profiles
  for update to authenticated using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy "members read clients" on public.clients
  for select to authenticated using (
    public.is_admin()
    or (public.is_active_member() and (
      created_by = auth.uid()
      or exists (select 1 from public.projects p where p.client_id = clients.id and public.can_access_project(p.id))
    ))
  );
create policy "members create clients" on public.clients
  for insert to authenticated with check (public.is_active_member() and created_by = auth.uid());
create policy "creator or admin update clients" on public.clients
  for update to authenticated using (public.is_admin() or (public.is_active_member() and created_by = auth.uid()));
create policy "creator or admin delete clients" on public.clients
  for delete to authenticated using (public.is_admin() or (public.is_active_member() and created_by = auth.uid()));

-- created_by is needed so INSERT ... RETURNING passes before the membership
-- trigger has run.
create policy "members read projects" on public.projects
  for select to authenticated using (
    public.can_access_project(id) or (public.is_active_member() and created_by = auth.uid())
  );
create policy "members create projects" on public.projects
  for insert to authenticated with check (
    public.is_active_member()
    and created_by = auth.uid()
    and exists (
      select 1 from public.clients c
       where c.id = client_id
         and (public.is_admin() or c.created_by = auth.uid()
              or exists (select 1 from public.projects p where p.client_id = c.id and public.can_access_project(p.id)))
    )
  );
create policy "members update projects" on public.projects
  for update to authenticated using (public.can_access_project(id)) with check (public.can_access_project(id));
create policy "creator or admin delete projects" on public.projects
  for delete to authenticated using (public.is_admin() or (public.is_active_member() and created_by = auth.uid()));

create policy "members read project members" on public.project_members
  for select to authenticated using (public.can_access_project(project_id));
create policy "members add project members" on public.project_members
  for insert to authenticated with check (public.can_access_project(project_id));
create policy "members remove project members" on public.project_members
  for delete to authenticated using (public.can_access_project(project_id));

create policy "members manage questions" on public.questions
  for all to authenticated
  using (public.can_access_project(project_id)) with check (public.can_access_project(project_id));
create policy "members manage analyses" on public.analyses
  for all to authenticated
  using (public.can_access_project(project_id)) with check (public.can_access_project(project_id));
create policy "members manage summaries" on public.summaries
  for all to authenticated
  using (public.can_access_project(project_id)) with check (public.can_access_project(project_id));
create policy "members manage client links" on public.client_links
  for all to authenticated
  using (public.can_access_project(project_id)) with check (public.can_access_project(project_id));
create policy "members manage reports" on public.report_publications
  for all to authenticated
  using (public.can_access_project(project_id)) with check (public.can_access_project(project_id));

-- ---------------------------------------------------------------------------
-- Client link functions (callable without signing in)
-- ---------------------------------------------------------------------------

create or replace function public.resolve_client_link(link_token text)
returns public.client_links
language sql
stable
security definer
set search_path = public
as $$
  select * from public.client_links
   where token = link_token
     and revoked_at is null
     and (expires_at is null or expires_at > now());
$$;
revoke all on function public.resolve_client_link(text) from public, anon, authenticated;

-- Returns only the fields this link is allowed to see.
create or replace function public.client_link_get(link_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  link public.client_links;
  proj public.projects;
  profile_keys text[];
  result_analyses jsonb;
begin
  link := public.resolve_client_link(link_token);
  if link.id is null then
    return null;
  end if;

  update public.client_links set opened_at = coalesce(opened_at, now()) where id = link.id;

  select * into proj from public.projects where id = link.project_id;
  select coalesce(array_agg(k), '{}') into profile_keys
    from jsonb_array_elements_text(coalesce(link.scope -> 'profile', '[]')) as k;

  select coalesce(jsonb_agg(jsonb_build_object(
           'id', a.id,
           'framework_key', a.framework_key,
           'question', q.text,
           'fields', s.value,
           'data', (select coalesce(jsonb_object_agg(d.key, d.value), '{}')
                      from jsonb_each(a.data) d
                     where d.key in (select jsonb_array_elements_text(s.value)))
         ) order by q.position, a.position), '[]')
    into result_analyses
    from jsonb_each(coalesce(link.scope -> 'analyses', '{}')) s
    join public.analyses a on a.id::text = s.key and a.project_id = link.project_id
    join public.questions q on q.id = a.question_id;

  return jsonb_build_object(
    'project_name', proj.name,
    'client_name', (select name from public.clients where id = proj.client_id),
    'lang', proj.report_lang,
    'label', link.label,
    'message', link.message,
    'submitted_at', link.submitted_at,
    'expires_at', link.expires_at,
    'profile_fields', to_jsonb(profile_keys),
    'profile', (select coalesce(jsonb_object_agg(p.key, p.value), '{}')
                  from jsonb_each(proj.business_profile) p
                 where p.key = any (profile_keys)),
    'analyses', result_analyses
  );
end;
$$;

-- Saves only keys inside the link's scope; anything else is dropped.
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

  if analysis_id is null then
    update public.projects
       set business_profile = business_profile || filtered, updated_at = now()
     where id = link.project_id;
  else
    update public.analyses
       set data = data || filtered,
           status = case when status = 'not_started' then 'in_progress' else status end,
           updated_by = null,
           updated_at = now()
     where id = analysis_id and project_id = link.project_id;
  end if;
  return true;
end;
$$;

create or replace function public.client_link_submit(link_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  link public.client_links;
begin
  link := public.resolve_client_link(link_token);
  if link.id is null then
    raise exception 'link is invalid or expired';
  end if;

  update public.client_links set submitted_at = now() where id = link.id;

  update public.analyses
     set status = 'in_progress', updated_at = now()
   where project_id = link.project_id
     and status = 'waiting_client'
     and id::text in (select jsonb_object_keys(coalesce(link.scope -> 'analyses', '{}')));

  update public.projects
     set status = 'analyzing', updated_at = now()
   where id = link.project_id and status = 'waiting_client';
  return true;
end;
$$;

create or replace function public.public_report_get(report_token text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object('snapshot', snapshot, 'lang', lang, 'published_at', published_at)
    from public.report_publications
   where token = report_token and revoked_at is null;
$$;

revoke all on function public.client_link_get(text) from public;
revoke all on function public.client_link_save(text, uuid, jsonb) from public;
revoke all on function public.client_link_submit(text) from public;
revoke all on function public.public_report_get(text) from public;
grant execute on function public.client_link_get(text) to anon, authenticated;
grant execute on function public.client_link_save(text, uuid, jsonb) to anon, authenticated;
grant execute on function public.client_link_submit(text) to anon, authenticated;
grant execute on function public.public_report_get(text) to anon, authenticated;
