-- Not a Consult: sign in with a username and password
-- Supabase Auth still keys accounts by email, so the app maps each username to
-- an address on the project's own host that receives no mail. The username
-- itself lives on the profile; only the server (secret key) can set it.

alter table public.profiles add column username text;
alter table public.profiles
  add constraint profiles_username_format check (username ~ '^[a-z0-9][a-z0-9._-]{2,29}$');
create unique index profiles_username_key on public.profiles (username);

-- Same as 0001, plus the username from the sign-up metadata.
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

  insert into public.profiles (id, email, username, full_name, avatar_url, role, active)
  values (
    new.id,
    new.email,
    lower(nullif(new.raw_user_meta_data ->> 'username', '')),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url',
    case when is_first then 'admin'::public.app_role else 'consultant'::public.app_role end,
    is_first or domain = any (coalesce(allowed, '{}'))
  );
  return new;
end;
$$;
