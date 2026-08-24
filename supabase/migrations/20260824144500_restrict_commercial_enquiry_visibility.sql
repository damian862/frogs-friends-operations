drop policy if exists pool_hire_enquiries_select on public.pool_hire_enquiries;
create policy pool_hire_enquiries_select on public.pool_hire_enquiries
  for select using (public.can_edit_site_bookings(site_id));
