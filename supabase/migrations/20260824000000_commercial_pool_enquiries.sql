create table if not exists public.pool_hire_enquiries (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  hirer_id uuid references public.hirers(id) on delete set null,
  contact_name text,
  contact_email text,
  contact_phone text,
  enquiry_title text not null,
  requested_date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'enquiry' check (status in ('enquiry','held','converted','lost','cancelled')),
  hold_until timestamptz,
  notes text,
  converted_booking_id uuid references public.bookings(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pool_hire_enquiries_time_check check (end_time > start_time),
  constraint pool_hire_enquiries_hold_check check (status <> 'held' or hold_until is not null)
);

create index if not exists pool_hire_enquiries_site_date_idx
  on public.pool_hire_enquiries(site_id, requested_date, start_time);
create index if not exists pool_hire_enquiries_status_idx
  on public.pool_hire_enquiries(status, hold_until);

alter table public.pool_hire_enquiries enable row level security;

drop policy if exists pool_hire_enquiries_select on public.pool_hire_enquiries;
create policy pool_hire_enquiries_select on public.pool_hire_enquiries
  for select using (public.has_site_access(site_id));

drop policy if exists pool_hire_enquiries_manage on public.pool_hire_enquiries;
create policy pool_hire_enquiries_manage on public.pool_hire_enquiries
  for all using (public.can_edit_site_bookings(site_id))
  with check (public.can_edit_site_bookings(site_id));
