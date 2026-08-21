drop policy if exists recurring_programmes_access on public.recurring_programmes;
create policy recurring_programmes_select on public.recurring_programmes for select using (public.has_site_access(site_id));
create policy recurring_programmes_manage on public.recurring_programmes for all using (public.can_edit_site_bookings(site_id)) with check (public.can_edit_site_bookings(site_id));

drop policy if exists recurring_programme_sessions_access on public.recurring_programme_sessions;
create policy recurring_programme_sessions_select on public.recurring_programme_sessions for select using (
  exists (select 1 from public.recurring_programmes p where p.id=programme_id and public.has_site_access(p.site_id))
);
create policy recurring_programme_sessions_manage on public.recurring_programme_sessions for all using (
  exists (select 1 from public.recurring_programmes p where p.id=programme_id and public.can_edit_site_bookings(p.site_id))
) with check (
  exists (select 1 from public.recurring_programmes p where p.id=programme_id and public.can_edit_site_bookings(p.site_id))
);

drop policy if exists recurring_programme_breaks_access on public.recurring_programme_breaks;
create policy recurring_programme_breaks_select on public.recurring_programme_breaks for select using (
  exists (select 1 from public.recurring_programmes p where p.id=programme_id and public.has_site_access(p.site_id))
);
create policy recurring_programme_breaks_manage on public.recurring_programme_breaks for all using (
  exists (select 1 from public.recurring_programmes p where p.id=programme_id and public.can_edit_site_bookings(p.site_id))
) with check (
  exists (select 1 from public.recurring_programmes p where p.id=programme_id and public.can_edit_site_bookings(p.site_id))
);

drop policy if exists recurring_programme_session_exceptions_access on public.recurring_programme_session_exceptions;
create policy recurring_programme_session_exceptions_select on public.recurring_programme_session_exceptions for select using (
  exists (select 1 from public.recurring_programmes p where p.id=programme_id and public.has_site_access(p.site_id))
);
create policy recurring_programme_session_exceptions_manage on public.recurring_programme_session_exceptions for all using (
  exists (select 1 from public.recurring_programmes p where p.id=programme_id and public.can_edit_site_bookings(p.site_id))
) with check (
  exists (select 1 from public.recurring_programmes p where p.id=programme_id and public.can_edit_site_bookings(p.site_id))
);

drop policy if exists recurring_programme_period_overrides_access on public.recurring_programme_period_overrides;
create policy recurring_programme_period_overrides_select on public.recurring_programme_period_overrides for select using (
  exists (select 1 from public.recurring_programmes p where p.id=programme_id and public.has_site_access(p.site_id))
);
create policy recurring_programme_period_overrides_manage on public.recurring_programme_period_overrides for all using (
  exists (select 1 from public.recurring_programmes p where p.id=programme_id and public.can_edit_site_bookings(p.site_id))
) with check (
  exists (select 1 from public.recurring_programmes p where p.id=programme_id and public.can_edit_site_bookings(p.site_id))
);

drop policy if exists recurring_staffing_services_access on public.recurring_staffing_services;
create policy recurring_staffing_services_select on public.recurring_staffing_services for select using (public.has_site_access(site_id));
create policy recurring_staffing_services_manage on public.recurring_staffing_services for all using (public.can_edit_site_bookings(site_id)) with check (public.can_edit_site_bookings(site_id));

drop policy if exists rules_manage on public.recurring_rules;
create policy rules_manage on public.recurring_rules for all using (public.can_edit_site_bookings(site_id)) with check (public.can_edit_site_bookings(site_id));

drop policy if exists academic_years_access on public.academic_years;
create policy academic_years_select on public.academic_years for select using (public.has_site_access(site_id));
create policy academic_years_manage on public.academic_years for all using (public.can_edit_site_bookings(site_id)) with check (public.can_edit_site_bookings(site_id));

drop policy if exists academic_calendar_periods_access on public.academic_calendar_periods;
create policy academic_calendar_periods_select on public.academic_calendar_periods for select using (
  exists (select 1 from public.academic_years y where y.id=academic_year_id and public.has_site_access(y.site_id))
);
create policy academic_calendar_periods_manage on public.academic_calendar_periods for all using (
  exists (select 1 from public.academic_years y where y.id=academic_year_id and public.can_edit_site_bookings(y.site_id))
) with check (
  exists (select 1 from public.academic_years y where y.id=academic_year_id and public.can_edit_site_bookings(y.site_id))
);
