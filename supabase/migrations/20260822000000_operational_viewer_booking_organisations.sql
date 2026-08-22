create or replace function public.operational_viewer_booking_organisations()
returns table (id uuid, name text)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select h.id, h.name
  from public.hirers h
  where public.is_operational_viewer()
    and (
      exists (
        select 1
        from public.bookings b
        where b.hirer_id = h.id
          and public.has_site_access(b.site_id)
      )
      or exists (
        select 1
        from public.recurring_programmes rp
        where rp.hirer_id = h.id
          and public.has_site_access(rp.site_id)
      )
      or exists (
        select 1
        from public.recurring_rules rr
        where rr.hirer_id = h.id
          and public.has_site_access(rr.site_id)
      )
    )
  order by h.name;
$$;

revoke all on function public.operational_viewer_booking_organisations() from public;
grant execute on function public.operational_viewer_booking_organisations() to authenticated;
