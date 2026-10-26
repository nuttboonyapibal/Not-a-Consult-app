-- Not a Consult: follow-ups from the Supabase advisors

-- Client links and published reports are always opened with the anonymous
-- key, so signed-in users don't need the token functions.
revoke execute on function
  public.client_link_get(text),
  public.client_link_save(text, uuid, jsonb),
  public.client_link_submit(text),
  public.public_report_get(text)
  from authenticated;

-- Cover the remaining profile foreign keys (scanned when a profile is deleted).
create index on public.analyses (updated_by);
create index on public.summaries (updated_by);
create index on public.client_links (created_by);
create index on public.report_publications (published_by);
