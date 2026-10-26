-- Not a Consult: safe client deletion
-- Deleting a client deletes every project under it, including projects its
-- creator can't see. So only an admin, or the client's creator when every
-- project under it is their own, may delete a client.

create or replace function private.can_delete_client(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_admin()
      or (private.is_active_member()
          and exists (select 1 from public.clients c where c.id = cid and c.created_by = auth.uid())
          and not exists (
            select 1 from public.projects p
             where p.client_id = cid and p.created_by is distinct from auth.uid()));
$$;

revoke all on function private.can_delete_client(uuid) from public;
grant execute on function private.can_delete_client(uuid) to authenticated;

drop policy "creator or admin delete clients" on public.clients;
create policy "admins or sole owners delete clients" on public.clients
  for delete to authenticated using (private.can_delete_client(id));
