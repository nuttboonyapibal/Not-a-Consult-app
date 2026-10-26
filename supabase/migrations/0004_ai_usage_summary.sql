-- Not a Consult: AI usage totals for the team settings page

-- Runs with the caller's rights, so RLS limits it to their own requests
-- unless they are an admin.
create function public.ai_usage_summary(since timestamptz)
returns table (
  user_id uuid,
  model text,
  requests bigint,
  failed bigint,
  input_tokens bigint,
  output_tokens bigint,
  cache_read_tokens bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select r.user_id,
         r.model,
         count(*),
         count(*) filter (where not r.ok),
         coalesce(sum(r.input_tokens), 0),
         coalesce(sum(r.output_tokens), 0),
         coalesce(sum(r.cache_read_tokens), 0)
    from public.ai_requests r
   where r.created_at >= since
   group by r.user_id, r.model;
$$;

revoke all on function public.ai_usage_summary(timestamptz) from public, anon;
grant execute on function public.ai_usage_summary(timestamptz) to authenticated;
