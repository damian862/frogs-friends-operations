/* Maintained consolidated runtime module. */
/* source: app-44.js */
(function () {
  function tidyBookingCharges() {
    ['rSingleBookings', 'rSchoolBookings', 'rBookings'].forEach(id => {
      const body = document.getElementById(id);
      if (!body) return;
      body.querySelectorAll('tr').forEach(tr => {
        const cells = [...tr.children];
        cells.forEach(td => {
          if (!td || td.dataset.chargeTidy === '1') return;
          const text = (td.textContent || '').trim();
          if (!(/£\s*\d/).test(text) || !(/(\/hr|VAT|No VAT)/i).test(text)) return;
          td.dataset.chargeTidy = '1';
          td.classList.add('booking-charge-cell');
          const html = td.innerHTML;
          if (!(/<br\s*\/?\s*>/i).test(html)) {
            const m = html.match(/^(.*?£[\d,.]+)(.*)$/s);
            if (m && m[2].trim()) td.innerHTML = `<div class="booking-charge-total">${m[1]}</div><div class="booking-charge-detail">${m[2]}</div>`;
          }
        });
      });
    });
  }
  function tidyStaffingSummary() {
    document.querySelectorAll('.monthly-staffing-summary td:first-child').forEach(td => {
      const note = td.querySelector('.lg-note');
      if (note) return;
      const text = (td.textContent || '').trim();
      const suffixes = ['External customer', 'School expenditure'];
      for (const suffix of suffixes) {
        if (text.endsWith(suffix)) {
          const name = text.slice(0, -suffix.length).trim();
          td.innerHTML = `<b>${name}</b><div class="lg-note staffing-customer-note">${suffix}</div>`;
          break;
        }
      }
    });
    document.querySelectorAll('td').forEach(td => {
      if (td.querySelector('.lg-note')) return;
      const text = (td.textContent || '').trim();
      for (const suffix of ['External customer', 'School expenditure']) {
        if (text.length > suffix.length && text.endsWith(suffix)) {
          const name = text.slice(0, -suffix.length).trim();
          if (name) {
            td.innerHTML = `<b>${name}</b><div class="lg-note staffing-customer-note">${suffix}</div>`;
          }
          break;
        }
      }
    });
  }
  function tidy() {
    tidyBookingCharges();
    tidyStaffingSummary();
  }
  for (const fn of ['renderBookingTables', 'renderLifeguardServices']) {
    const prior = window[fn];
    if (prior) window[fn] = async function () {
      const out = await prior.apply(this, arguments);
      setTimeout(tidy, 0);
      return out;
    };
  }
  window.addEventListener('load', () => setTimeout(tidy, 500));
  const style = document.createElement('style');
  style.textContent = `.booking-charge-cell{min-width:150px;line-height:1.25}.booking-charge-total{font-weight:700;margin-bottom:4px}.booking-charge-detail{font-size:12px;color:#667786;white-space:nowrap}.staffing-customer-note{display:block;margin-top:3px}`;
  document.head.appendChild(style);
})();


;
/* source: app-45.js */
(function () {
  window.deleteStaffingCharge = async function (id) {
    if (!id) return;
    if (!confirm('Delete this staffing charge? This will remove it from staffing hours and monthly reporting.')) return;
    const r = await sb.from('lifeguard_service_entries').delete().eq('id', id);
    if (r.error) return alert(r.error.message);
    if (typeof window.renderLifeguardServices === 'function') await window.renderLifeguardServices();
    if (typeof window.renderBookingTables === 'function') window.renderBookingTables();
  };
  function addDeleteActions() {
    const rows = document.querySelectorAll('#lgRows tr');
    rows.forEach(tr => {
      const action = tr.lastElementChild;
      if (!action || action.querySelector('.staff-delete')) return;
      const edit = action.querySelector('button[onclick*="editBookingStaffing"]');
      if (!edit) return;
      const m = (edit.getAttribute('onclick') || '').match(/editBookingStaffing\(null,'([^']+)'\)/);
      if (!m) return;
      edit.insertAdjacentHTML('afterend', ` <button type="button" class="link danger-link staff-delete" onclick="deleteStaffingCharge('${m[1]}')">Delete</button>`);
    });
  }
  const prior = window.renderLifeguardServices;
  if (prior) OpsLifecycle.use("renderLifeguardServices", async function (next) {
    const out = await next.apply(this, arguments);
    setTimeout(addDeleteActions, 0);
    return out;
  });
  window.addEventListener('load', () => setTimeout(addDeleteActions, 500));
  const style = document.createElement('style');
  style.textContent = '.danger-link{color:#b42318!important;margin-left:8px}';
  document.head.appendChild(style);
})();


;
/* source: app-46.js */
(function () {
  const prior = window.financeMarkInvoiced;
  if (!prior) return;
  window.financeMarkInvoiced = async function (id) {
    await prior.apply(this, arguments);
    try {
      if (typeof window.load === 'function') await window.load();
      if (typeof window.renderIncomeSummary === 'function') window.renderIncomeSummary();
      if (typeof window.renderMonthlyBilling === 'function') window.renderMonthlyBilling();
    } catch (err) {
      console.warn('Post-invoice billing refresh failed', err);
    }
  };
})();


;
/* source: app-47.js */
(function () {
  async function removeBooking(id) {
    const booking = (typeof B !== 'undefined' ? B : []).find(x => x.id === id);
    if (!booking) return alert('This booking could not be found. Please refresh and try again.');
    const label = booking.title || 'booking';
    const date = typeof ukDate === 'function' ? ukDate(booking.booking_date) : booking.booking_date;
    const isSchool = booking.booking_type === 'school_internal';
    const wording = isSchool ? 'school event' : 'single booking';
    if (!confirm(`Delete this ${wording}?\n\n${label}\n${date}\n${String(booking.start_time || '').slice(0, 5)}–${String(booking.end_time || '').slice(0, 5)}\n\nAny staffing linked directly to this booking will also be removed. Monthly billing will recalculate from the remaining bookings.\n\nThis cannot be undone.`)) return;
    const linked = await sb.from('lifeguard_service_entries').select('id').eq('booking_id', id);
    if (linked.error) return alert(linked.error.message);
    if ((linked.data || []).length) {
      const delStaff = await sb.from('lifeguard_service_entries').delete().eq('booking_id', id);
      if (delStaff.error) return alert(delStaff.error.message);
    }
    const del = await sb.from('bookings').delete().eq('id', id);
    if (del.error) return alert(del.error.message);
    await load();
    if (typeof window.renderBookingCalendar === 'function') window.renderBookingCalendar();
    if (typeof window.renderIncomeSummary === 'function') window.renderIncomeSummary();
  }
  window.deleteSingleBooking = removeBooking;
  window.deleteSchoolEvent = removeBooking;
  function addDeleteButtons() {
    ['rSingleBookings', 'rSchoolBookings'].forEach(bodyId => {
      const body = document.getElementById(bodyId);
      if (!body) return;
      body.querySelectorAll('tr').forEach(tr => {
        const edit = [...tr.querySelectorAll('button')].find(b => (b.getAttribute('onclick') || '').includes("editBooking('"));
        if (!edit || tr.querySelector('.booking-delete')) return;
        const m = (edit.getAttribute('onclick') || '').match(/editBooking\('([^']+)'/);
        if (!m) return;
        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'link booking-delete';
        del.textContent = 'Delete';
        del.onclick = () => removeBooking(m[1]);
        edit.insertAdjacentText('afterend', ' · ');
        edit.insertAdjacentElement('afterend', del);
        edit.insertAdjacentText('afterend', ' · ');
      });
    });
  }
  const prior = window.renderBookingTables;
  if (prior) OpsLifecycle.use("renderBookingTables", function (next) {
    const out = next.apply(this, arguments);
    setTimeout(addDeleteButtons, 0);
    return out;
  });
  window.addEventListener('load', () => setTimeout(addDeleteButtons, 400));
  const style = document.createElement('style');
  style.textContent = '.booking-delete{color:#b42318!important}';
  document.head.appendChild(style);
})();


;
/* source: app-48.js */
(function () {
  const previousModal = window.modal;
  if (typeof previousModal === 'function') {
    window.modal = function (title, html, save) {
      const saveButton = document.getElementById('ms');
      if (saveButton) {
        saveButton.style.display = '';
        saveButton.textContent = 'Save';
        saveButton.disabled = false;
      }
      return previousModal.apply(this, arguments);
    };
  }
  const previousClose = window.closeM;
  if (typeof previousClose === 'function') {
    window.closeM = function () {
      const result = previousClose.apply(this, arguments);
      const saveButton = document.getElementById('ms');
      if (saveButton) {
        saveButton.style.display = '';
        saveButton.textContent = 'Save';
        saveButton.disabled = false;
      }
      return result;
    };
  }
})();


;
/* source: app-49.js */
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
  `;
  document.head.appendChild(style);
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
  }
  const originalSetBookingTab = window.setBookingTab;
  OpsLifecycle.use("setBookingTab", function (next, name) {
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
  const originalRender = window.render;
  OpsLifecycle.use("render", function (next) {
    const result = next();
    showViewerCalendar();
    return result;
  });
  const originalEnter = window.enter;
  OpsLifecycle.use("enter", async function (next, user) {
    const result = await next(user);
    showViewerCalendar();
    window.setBookingTab('calendar');
    return result;
  });
  const originalCalendar = window.renderBookingCalendar;
  if (originalCalendar) OpsLifecycle.use("renderBookingCalendar", function (next) {
    const result = next();
    showViewerCalendar();
    return result;
  });
  const observer = new MutationObserver(showViewerCalendar);
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  showViewerCalendar();
  if (typeof window.renderLifeguardServices === 'function' && window.OpsUtil?.createBurstDeduper) {
    let dedupedStaffingRender = null;
    OpsLifecycle.use('renderLifeguardServices', function (next, ...args) {
      if (!dedupedStaffingRender) {
        dedupedStaffingRender = OpsUtil.createBurstDeduper((...innerArgs) => next(...innerArgs), {
          windowMs: 250,
          key: () => [document.getElementById('lgMonth')?.value || '', document.getElementById('lgSite')?.value || '', document.getElementById('lgCustomer')?.value || ''].join('|')
        });
      }
      return dedupedStaffingRender(...args);
    });
  }
})();


OpsLifecycle.install(["render","enter","setBookingTab","renderRecurringBookings","renderIncomeSummary","renderBookingCalendar","renderLifeguardServices","renderMonthlyBilling","renderBookingTables","renderTermDates"]);
