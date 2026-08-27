alter table public.pool_hire_enquiries
  add column if not exists converted_recurring_programme_id uuid
  references public.recurring_programmes(id) on delete set null;

create or replace function public.convert_commercial_enquiry_to_recurring(
  p_enquiry_id uuid,
  p_name text,
  p_starts_on date,
  p_ends_on date,
  p_days smallint[],
  p_start_time time,
  p_end_time time,
  p_rate numeric default null,
  p_vat_applicable boolean default false,
  p_breaks jsonb default '[]'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  enquiry public.pool_hire_enquiries%rowtype;
  programme_id uuid;
  booking_day smallint;
  break_item jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into enquiry from public.pool_hire_enquiries where id=p_enquiry_id for update;
  if not found then raise exception 'Enquiry not found'; end if;
  if not public.can_edit_site_bookings(enquiry.site_id) then raise exception 'Permission denied'; end if;
  if enquiry.status not in ('enquiry','held') then raise exception 'Only open enquiries or holds can be converted'; end if;
  if enquiry.hirer_id is null then raise exception 'Assign an existing hirer before conversion'; end if;
  if nullif(trim(p_name),'') is null or p_starts_on is null or p_ends_on is null or p_ends_on<p_starts_on then raise exception 'Invalid programme dates'; end if;
  if p_start_time is null or p_end_time is null or p_end_time<=p_start_time then raise exception 'Invalid session time'; end if;
  if coalesce(array_length(p_days,1),0)=0 or exists(select 1 from unnest(p_days) d where d<0 or d>6) then raise exception 'Select valid weekly days'; end if;
  if p_rate is not null and p_rate<0 then raise exception 'Rate cannot be negative'; end if;

  insert into public.recurring_programmes(site_id,academic_year_id,hirer_id,name,booking_type,external_category,holiday_policy,starts_on,ends_on,notes,created_by,active)
  values(enquiry.site_id,null,enquiry.hirer_id,trim(p_name),'external_hire','other',null,p_starts_on,p_ends_on,enquiry.notes,auth.uid(),true)
  returning id into programme_id;

  foreach booking_day in array p_days loop
    insert into public.recurring_programme_sessions(programme_id,day_of_week,start_time,end_time,title,rate,vat_applicable,charge_type,foc_reason,pool_use_type,lane_count,active)
    values(programme_id,booking_day,p_start_time,p_end_time,trim(p_name),p_rate,p_vat_applicable,'chargeable',null,'whole_pool',null,true);
  end loop;

  for break_item in select value from jsonb_array_elements(coalesce(p_breaks,'[]'::jsonb)) loop
    if nullif(trim(break_item->>'name'),'') is null or nullif(break_item->>'starts_on','') is null then raise exception 'Invalid break'; end if;
    insert into public.recurring_programme_breaks(programme_id,name,starts_on,ends_on,notes)
    values(programme_id,trim(break_item->>'name'),(break_item->>'starts_on')::date,coalesce(nullif(break_item->>'ends_on','')::date,(break_item->>'starts_on')::date),null);
  end loop;

  update public.pool_hire_enquiries set status='converted',hold_until=null,converted_booking_id=null,converted_recurring_programme_id=programme_id,updated_at=now() where id=p_enquiry_id;
  return programme_id;
end;
$$;

revoke all on function public.convert_commercial_enquiry_to_recurring(uuid,text,date,date,smallint[],time,time,numeric,boolean,jsonb) from public, anon;
grant execute on function public.convert_commercial_enquiry_to_recurring(uuid,text,date,date,smallint[],time,time,numeric,boolean,jsonb) to authenticated;

drop policy if exists bookings_manage on public.bookings;
create policy bookings_insert on public.bookings for insert with check (public.can_edit_site_bookings(site_id));
create policy bookings_update on public.bookings for update using (public.can_edit_site_bookings(site_id)) with check (public.can_edit_site_bookings(site_id));
create policy bookings_delete_admin on public.bookings for delete using (
  public.can_edit_site_bookings(site_id)
  and exists(select 1 from public.profiles p where p.id=auth.uid() and p.active=true and p.role in ('owner_admin','operations_admin'))
);
