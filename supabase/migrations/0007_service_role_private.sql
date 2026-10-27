-- Not a Consult: let the secret-key client update profiles
-- Server code with the secret key (service_role) sets usernames on profiles.
-- The profile guard trigger calls private.is_admin(), so without access to
-- the private schema those updates failed with "permission denied for schema
-- private". service_role already bypasses RLS; this only lets it run the helpers.
grant usage on schema private to service_role;
grant execute on all functions in schema private to service_role;

-- Fill in usernames that reached auth but not the profile because of that error.
update public.profiles p
   set username = lower(u.raw_user_meta_data ->> 'username')
  from auth.users u
 where u.id = p.id
   and p.username is null
   and lower(u.raw_user_meta_data ->> 'username') ~ '^[a-z0-9][a-z0-9._-]{2,29}$'
   and not exists (select 1 from public.profiles o where o.username = lower(u.raw_user_meta_data ->> 'username'));
