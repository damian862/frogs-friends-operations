alter table public.pool_hire_enquiries
  drop constraint if exists pool_hire_enquiries_status_check;

alter table public.pool_hire_enquiries
  add constraint pool_hire_enquiries_status_check
  check (status in ('enquiry','held','converted','lost','cancelled','archived'));

drop policy if exists pool_hire_enquiries_select on public.pool_hire_enquiries;
create policy pool_hire_enquiries_select on public.pool_hire_enquiries
  for select
  to authenticated
  using (
    (select auth.uid()) = created_by
    or (select public.can_edit_site_bookings(site_id))
  );
