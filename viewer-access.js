/* Maintained consolidated runtime module. */
/* Operational-viewer presentation/access additions. */
(function () {
  const isOperationalViewer = () => String(P?.role || '').toLowerCase() === 'operational_viewer';
  const style = document.createElement('style');
  style.textContent = `
    body.operational-viewer .nav button:not([data-v="bookings"]),
    body.operational-viewer #userAccessNav,
    body.operational-viewer #bookings>.term-top,
    body.operational-viewer .booking-tab[data-btab]:not([data-btab="calendar"]),
    body.operational-viewer #bookingTabAll,
    body.operational-viewer #bookingTabRecurring,
    body.operational-viewer #bookingTabSingle,
    body.operational-viewer #bookingTabSchool,
    body.operational-viewer #bookingTabIncome,
    body.operational-viewer .cal-event-actions,
    body.operational-viewer #bookingTabCalendar .cal-event button,
    body.operational-viewer #bookingTabCalendar [onclick*="edit" i],
    body.operational-viewer #bookingTabCalendar [onclick*="delete" i],
    body.operational-viewer #bookingTabCalendar [onclick*="add" i] {display:none!important}
    body.operational-viewer .viewer-site-context{display:block;margin:10px 0 14px;line-height:1.45}
    body.operational-viewer .viewer-site-context b{display:block;margin-bottom:2px}
    body.operational-viewer .viewer-site-context span{display:block;color:#526575}
  `;
  document.head.appendChild(style);

  function tidyViewerContext() {
    if (!isOperationalViewer()) return;
    const siteName = S.find(s => s.id === P?.home_site_id)?.name || S[0]?.name || 'Your school';
    let context = document.querySelector('.viewer-site-context');
    if (!context) {
      context = document.createElement('div');
      context.className = 'viewer-site-context';
      const bookings = document.getElementById('bookings');
      if (bookings) bookings.insertBefore(context, bookings.firstChild);
    }
    context.innerHTML = `<b>${e(siteName)}</b><span>Your account is restricted to this school's pool operations.</span>`;
    const org = document.getElementById('calOrg');
    if (org && org.options.length) org.options[0].textContent = 'All booked organisations';
  }

  function showViewerCalendar() {
    const enabled = isOperationalViewer();
    document.body.classList.toggle('operational-viewer', enabled);
    if (!enabled) return;
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('on', v.id === 'bookings'));
    document.querySelectorAll('.booking-panel').forEach(v => v.classList.toggle('on', v.id === 'bookingTabCalendar'));
    document.querySelectorAll('.booking-tab[data-btab]').forEach(v => v.classList.toggle('active', v.dataset.btab === 'calendar'));
    document.querySelectorAll('#bookingTabCalendar button').forEach(button => {
      const action = String(button.getAttribute('onclick') || '').toLowerCase();
      if ((/edit|delete|add|manage|archive|save/).test(action)) button.hidden = true;
    });
    tidyViewerContext();
  }

  OpsLifecycle.use('setBookingTab', function (next, name) {
    const result = next(isOperationalViewer() ? 'calendar' : name);
    showViewerCalendar();
    return result;
  });
  document.addEventListener('click', event => {
    if (!isOperationalViewer()) return;
    const nav = event.target.closest('.nav button[data-v]');
    if (nav && nav.dataset.v !== 'bookings') {
      event.preventDefault();
      event.stopImmediatePropagation();
      showViewerCalendar();
    }
  }, true);
  OpsLifecycle.use('render', function (next) {
    const result = next();
    showViewerCalendar();
    return result;
  });
  OpsLifecycle.use('enter', async function (next, user) {
    const result = await next(user);
    showViewerCalendar();
    window.setBookingTab('calendar');
    return result;
  });
  if (window.renderBookingCalendar) OpsLifecycle.use('renderBookingCalendar', function (next) {
    const result = next();
    showViewerCalendar();
    return result;
  });
  const observer = new MutationObserver(() => {
    if (!isOperationalViewer()) return;
    const org = document.getElementById('calOrg');
    if (org?.options?.length && org.options[0].textContent !== 'All booked organisations') tidyViewerContext();
  });
  observer.observe(document.body, {childList:true,subtree:true});
  showViewerCalendar();
})();

OpsLifecycle.install(["render","enter","setBookingTab","renderRecurringBookings","renderIncomeSummary","renderBookingCalendar","renderLifeguardServices","renderMonthlyBilling","renderBookingTables","renderTermDates"]);
