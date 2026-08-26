create or replace function public.visible_commercial_enquiries()
returns setof public.pool_hire_enquiries
language sql
stable
security definer
set search_path = public
as $$
  select enquiry.*
  from public.pool_hire_enquiries enquiry
  where (select auth.uid()) is not null
    and (
      enquiry.created_by = (select auth.uid())
      or public.is_owner_admin()
      or exists (
        select 1
        from public.site_memberships membership
        where membership.user_id = (select auth.uid())
          and membership.site_id = enquiry.site_id
          and membership.can_edit_bookings = true
      )
    )
  order by enquiry.requested_date, enquiry.start_time;
$$;

revoke all on function public.visible_commercial_enquiries() from public, anon;
grant execute on function public.visible_commercial_enquiries() to authenticated;
