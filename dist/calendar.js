/* Maintained consolidated runtime module. */
/* source: app-20.js */
(function () {
  const style = document.createElement('style');
  style.textContent = `
    #monthlyBilling{margin-top:28px}
    #monthlyBilling .term-top.compact{margin:0 0 14px!important}
    #monthlyBilling .term-top h2{margin:0 0 4px;font-size:22px}
    #monthlyBilling .term-top p{margin:0;line-height:1.45}
    #monthlyBilling .bill-toolbar{padding:16px 18px;margin-bottom:16px;gap:14px}
    #monthlyBilling .bill-toolbar label{min-width:180px}
    #monthlyBilling #billList{display:flex;flex-direction:column;gap:10px}
    #monthlyBilling .bill-row{
      display:grid!important;
      grid-template-columns:minmax(220px,1.25fr) minmax(190px,.9fr) minmax(260px,1fr) minmax(310px,1.35fr)!important;
      gap:20px!important;
      align-items:center!important;
      background:#fff!important;
      border:1px solid #dfe6eb!important;
      border-radius:12px!important;
      padding:17px 18px!important;
      margin:0!important;
      min-height:82px;
    }
    #monthlyBilling .bill-row>div:first-child{min-width:0}
    #monthlyBilling .bill-row>div:first-child>b{display:block;font-size:15px;line-height:1.35;margin-bottom:4px}
    #monthlyBilling .bill-row>div:first-child>.muted{display:block;line-height:1.35;margin:0;color:#647684}
    #monthlyBilling .bill-status{margin:0 0 5px;white-space:nowrap}
    #monthlyBilling .bill-adjust{margin-top:5px;line-height:1.35;max-width:210px}
    #monthlyBilling .bill-values{display:grid!important;grid-template-columns:repeat(3,minmax(72px,1fr));gap:14px!important;align-items:end}
    #monthlyBilling .bill-values span{display:flex!important;flex-direction:column;gap:3px;font-size:11px;color:#657585;line-height:1.2;white-space:nowrap}
    #monthlyBilling .bill-values b{display:block;font-size:15px;color:#0e1b26;line-height:1.25}
    #monthlyBilling .bill-actions{display:flex!important;justify-content:flex-end;align-items:center;gap:8px!important;flex-wrap:wrap}
    #monthlyBilling .bill-actions button{white-space:nowrap}
    @media(max-width:1180px){
      #monthlyBilling .bill-row{grid-template-columns:minmax(210px,1fr) minmax(180px,.8fr) minmax(250px,1fr)!important}
      #monthlyBilling .bill-actions{grid-column:1/-1;justify-content:flex-end;border-top:1px solid #edf1f4;padding-top:12px}
    }
    @media(max-width:820px){
      #monthlyBilling .bill-row{grid-template-columns:1fr!important;gap:12px!important;padding:15px!important}
      #monthlyBilling .bill-values{grid-template-columns:repeat(3,1fr)}
      #monthlyBilling .bill-actions{grid-column:auto;justify-content:flex-start}
    }
  `;
  document.head.appendChild(style);
})();


;
/* source: app-21.js */
(function () {
  const EDIT_ROLES = new Set(['owner_admin', 'operations_admin', 'site_manager', 'pool_manager', 'lettings_manager']);
  function canEditRecurring() {
    const role = String(window.P?.role || P?.role || '');
    if (EDIT_ROLES.has(role)) return true;
    return false;
  }
  function ensureRecurringCreateButton() {
    const panel = document.getElementById('bookingTabRecurring');
    if (!panel) return;
    const head = panel.querySelector('.term-top.compact');
    if (!head) return;
    let btn = head.querySelector('.rb-create-recurring');
    const allowed = canEditRecurring();
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'p rb-create-recurring';
      btn.textContent = '+ Add recurring booking';
      btn.onclick = () => {
        if (typeof window.newRecurringWizard !== 'function' && typeof newRecurringWizard !== 'function') return alert('Recurring booking wizard is not available. Please refresh the page.');
        (window.newRecurringWizard || newRecurringWizard)();
      };
      head.appendChild(btn);
    }
    btn.style.display = allowed ? '' : 'none';
    [...head.querySelectorAll('button')].forEach(b => {
      if (b !== btn && (b.getAttribute('onclick') || '').includes('newRecurringWizard')) b.style.display = 'none';
    });
  }
  const priorRender = window.render;
  OpsLifecycle.use("render", function (next) {
    next();
    setTimeout(ensureRecurringCreateButton, 0);
  });
  const priorEnter = window.enter;
  OpsLifecycle.use("enter", async function (next, user) {
    await next(user);
    setTimeout(ensureRecurringCreateButton, 0);
  });
  const priorRecurring = window.renderRecurringBookings;
  OpsLifecycle.use("renderRecurringBookings", function (next) {
    next();
    setTimeout(ensureRecurringCreateButton, 0);
  });
  document.addEventListener('click', ev => {
    if (ev.target.closest('.booking-tab[data-btab="recurring"]')) setTimeout(ensureRecurringCreateButton, 0);
  });
  window.addEventListener('load', () => setTimeout(ensureRecurringCreateButton, 100));
})();


;
/* source: app-22.js */
(function () {
  let revealing = false;
  function revealNewRecurringIfFilteredOut() {
    if (revealing || !OPEN_PROG) return;
    const programme = G.find(x => x.id === OPEN_PROG);
    const host = document.getElementById('rProg');
    if (!programme || !host) return;
    const visible = [...host.querySelectorAll('.rb-item')].some(card => {
      const btn = [...card.querySelectorAll('button')].find(b => (b.getAttribute('onclick') || '').includes(`manageProgramme('${OPEN_PROG}')`));
      return !!btn;
    });
    if (visible) return;
    const search = document.getElementById('rbSearch');
    const site = document.getElementById('rbSite');
    const org = document.getElementById('rbOrg');
    const status = document.getElementById('rbStatus');
    if (!search || !site || !org || !status) return;
    revealing = true;
    search.value = '';
    if ([...site.options].some(o => o.value === programme.site_id)) site.value = programme.site_id || '';
    const orgValue = programme.hirer_id || 'internal';
    if ([...org.options].some(o => o.value === orgValue)) org.value = orgValue; else org.value = '';
    status.value = 'active';
    window.renderRecurringBookings();
    setTimeout(() => {
      const target = [...host.querySelectorAll('.rb-item')].find(card => [...card.querySelectorAll('button')].some(b => (b.getAttribute('onclick') || '').includes(`manageProgramme('${OPEN_PROG}')`)));
      if (target) {
        target.scrollIntoView({
          block: 'center',
          behavior: 'smooth'
        });
        target.classList.add('rb-newly-created');
        setTimeout(() => target.classList.remove('rb-newly-created'), 2200);
      }
      revealing = false;
    }, 60);
  }
  const previous = window.renderRecurringBookings;
  OpsLifecycle.use("renderRecurringBookings", function (next) {
    next();
    setTimeout(revealNewRecurringIfFilteredOut, 30);
  });
  const style = document.createElement('style');
  style.textContent = '.rb-newly-created{outline:3px solid rgba(22,163,74,.24);box-shadow:0 0 0 4px rgba(22,163,74,.08)}';
  document.head.appendChild(style);
})();


;
/* source: app-23.js */
(function () {
  const previousSetBookingTab = window.setBookingTab;
  if (typeof previousSetBookingTab !== 'function') return;
  OpsLifecycle.use("setBookingTab", function (next, name) {
    if (name === 'recurring' && OPEN_PROG) {
      const programme = G.find(x => x.id === OPEN_PROG);
      const search = document.getElementById('rbSearch');
      const site = document.getElementById('rbSite');
      const org = document.getElementById('rbOrg');
      const status = document.getElementById('rbStatus');
      if (search) search.value = '';
      if (org) org.value = '';
      if (status) status.value = 'active';
      if (site && programme && [...site.options].some(o => o.value === programme.site_id)) site.value = programme.site_id;
    }
    next(name);
    if (name === 'recurring' && OPEN_PROG) {
      setTimeout(() => {
        window.renderRecurringBookings();
        const host = document.getElementById('rProg');
        if (!host) return;
        const target = [...host.querySelectorAll('.rb-item')].find(card => [...card.querySelectorAll('button')].some(b => (b.getAttribute('onclick') || '').includes(`manageProgramme('${OPEN_PROG}')`)));
        if (target) {
          target.scrollIntoView({
            block: 'center',
            behavior: 'smooth'
          });
          target.classList.add('rb-newly-created');
          setTimeout(() => target.classList.remove('rb-newly-created'), 2200);
        }
      }, 80);
    }
  });
})();


;
/* source: app-24.js */
(function () {
  function simplifyBookingTabs() {
    const allBtn = document.querySelector('.booking-tab[data-btab="all"]');
    const allPanel = document.getElementById('bookingTabAll');
    const calBtn = document.querySelector('.booking-tab[data-btab="calendar"]');
    if (allBtn) allBtn.style.display = 'none';
    if (allPanel) {
      allPanel.classList.remove('on');
      allPanel.style.display = 'none';
    }
    if (calBtn) calBtn.textContent = 'Calendar';
  }
  const previousSet = window.setBookingTab;
  OpsLifecycle.use("setBookingTab", function (next, tab) {
    if (tab === 'all') tab = 'calendar';
    next(tab);
    simplifyBookingTabs();
  });
  const previousRender = window.render;
  OpsLifecycle.use("render", function (next) {
    next();
    simplifyBookingTabs();
  });
  const previousEnter = window.enter;
  OpsLifecycle.use("enter", async function (next, user) {
    await next(user);
    simplifyBookingTabs();
    if (document.getElementById('bookings')?.classList.contains('on')) window.setBookingTab('calendar');
  });
  document.addEventListener('click', ev => {
    const nav = ev.target.closest('button[data-v="bookings"]');
    if (nav) setTimeout(() => window.setBookingTab('calendar'), 0);
  });
  window.addEventListener('load', () => setTimeout(simplifyBookingTabs, 100));
})();


;
/* source: app-25.js */
(function () {
  const moneyMonth = v => {
    if (!v) return '';
    const [y, m] = String(v).slice(0, 7).split('-').map(Number);
    return new Date(y, m - 1, 1, 12).toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric'
    });
  };
  function rulesForSessions(sessions) {
    const rules = window.RSTAFF || [];
    return rules.filter(r => r.active !== false && (r.session_id ? sessions.some(s => s.id === r.session_id) : sessions.some(s => s.programme_id === r.programme_id)));
  }
  function ruleLabel(r) {
    return r.service_label || ({
      lifeguard: 'Lifeguard',
      swimming_teacher: 'Swimming teacher',
      teacher: 'Teacher',
      other: 'Other staffing'
    })[r.service_type] || 'Staffing';
  }
  function addManageableTimetableStaffing() {
    document.querySelectorAll('.rb-item').forEach(card => {
      const manageBtn = [...card.querySelectorAll('button')].find(b => (b.getAttribute('onclick') || '').includes('manageProgramme('));
      const m = (manageBtn?.getAttribute('onclick') || '').match(/manageProgramme\('([^']+)'\)/);
      if (!m) return;
      const pid = m[1], overview = card.querySelector('.rb-overview');
      if (!overview) return;
      const rows = [...overview.querySelectorAll('.rb-ov-row')];
      rows.forEach(row => {
        const staffing = row.querySelector('.rb-ov-staffing-visible');
        if (!staffing) return;
        const rowText = row.textContent || '';
        const sessions = RS.filter(s => s.programme_id === pid && s.active !== false).filter(s => rowText.includes(String(s.start_time || '').slice(0, 5)) && rowText.includes(String(s.end_time || '').slice(0, 5)));
        const rules = rulesForSessions(sessions);
        staffing.querySelectorAll('.rb-staff-rule-managed').forEach(x => x.remove());
        staffing.querySelectorAll('.staffing-rule-badge').forEach(x => x.style.display = 'none');
        rules.forEach(r => {
          const wrap = document.createElement('span');
          wrap.className = 'rb-staff-rule-managed';
          wrap.innerHTML = `<span class="staffing-rule-badge">${Number(r.staff_count || 1)} ${e(ruleLabel(r))}</span><button class="link" onclick="editRecurringStaffing('${r.id}','${pid}')">Edit</button><button class="link danger-link" onclick="deleteRecurringStaffing('${r.id}')">Remove</button>`;
          staffing.insertBefore(wrap, staffing.firstChild);
        });
      });
    });
  }
  const prevRecurring = window.renderRecurringBookings;
  OpsLifecycle.use("renderRecurringBookings", function (next) {
    next();
    setTimeout(addManageableTimetableStaffing, 80);
  });
  function staffingMonthHint() {
    const month = $('lgMonth')?.value, host = $('lgRows');
    if (!month || !host) return;
    let hint = document.getElementById('staffingMonthHint');
    if (hint) hint.remove();
    const hasVisible = host.querySelector('tr td:not([colspan])');
    if (hasVisible) return;
    const site = $('lgSite')?.value || '';
    const candidates = (window.RSTAFF || []).filter(r => r.active !== false && (!site || r.site_id === site) && r.starts_on).sort((a, b) => String(a.starts_on).localeCompare(String(b.starts_on)));
    const other = candidates.find(r => String(r.starts_on).slice(0, 7) !== month);
    if (!other) return;
    hint = document.createElement('div');
    hint.id = 'staffingMonthHint';
    hint.className = 'note staffing-month-hint';
    hint.innerHTML = `Recurring staffing is recorded beginning <b>${e(moneyMonth(other.starts_on))}</b>. Select that month above to view the generated staffing dates and income.`;
    const table = host.closest('table');
    if (table) table.parentElement.insertBefore(hint, table);
  }
  const prevLg = window.renderLifeguardServices;
  if (prevLg) OpsLifecycle.use("renderLifeguardServices", async function (next) {
    await next();
    setTimeout(staffingMonthHint, 30);
  });
  const prevTab = window.setBookingTab;
  OpsLifecycle.use("setBookingTab", function (next, tab) {
    next(tab);
    if (tab === 'income') setTimeout(() => {
      if (window.renderLifeguardServices) window.renderLifeguardServices();
    }, 80);
  });
  const style = document.createElement('style');
  style.textContent = `
    .rb-staff-rule-managed{display:inline-flex;align-items:center;gap:6px;margin-right:8px;padding-right:8px;border-right:1px solid #dfe6eb}
    .rb-staff-rule-managed .link{font-size:11px}
    .danger-link{color:#b42318!important}
    .staffing-month-hint{margin:10px 0}
  `;
  document.head.appendChild(style);
})();


;
/* source: app-26.js */
(function () {
  let staffingCustomerTouched = false;
  function fixStaffingFilter() {
    const sel = document.getElementById('lgCustomer');
    if (!sel) return;
    const label = sel.closest('label');
    if (label && label.firstChild && label.firstChild.nodeType === Node.TEXT_NODE) label.firstChild.nodeValue = 'Customer filter';
    if (!staffingCustomerTouched) {
      sel.value = '';
    }
    sel.onchange = () => {
      staffingCustomerTouched = true;
      if (window.renderLifeguardServices) window.renderLifeguardServices();
    };
  }
  const prevLg = window.renderLifeguardServices;
  if (prevLg) {
    OpsLifecycle.use("renderLifeguardServices", async function (next) {
      fixStaffingFilter();
      await next();
      fixStaffingFilter();
    });
  }
  function forceCalendarVisible() {
    const panel = document.getElementById('bookingTabCalendar'), tab = document.querySelector('.booking-tab[data-btab="calendar"]');
    if (!panel || !tab) return;
    document.querySelectorAll('.booking-panel').forEach(x => {
      x.classList.remove('on');
      x.style.display = '';
    });
    document.querySelectorAll('.booking-tab').forEach(x => x.classList.remove('active'));
    panel.classList.add('on');
    tab.classList.add('active');
    if (typeof window.renderBookingCalendar === 'function') window.renderBookingCalendar();
  }
  const prevTab = window.setBookingTab;
  OpsLifecycle.use("setBookingTab", function (next, tab) {
    const cal = document.getElementById('bookingTabCalendar');
    if (cal) cal.style.display = '';
    if (tab === 'calendar') {
      if (next) next('calendar');
      setTimeout(forceCalendarVisible, 0);
      return;
    }
    return next ? next(tab) : undefined;
  });
  document.addEventListener('click', ev => {
    const cal = ev.target.closest('.booking-tab[data-btab="calendar"]');
    if (cal) setTimeout(forceCalendarVisible, 0);
    const income = ev.target.closest('.booking-tab[data-btab="income"]');
    if (income) {
      staffingCustomerTouched = false;
      setTimeout(() => {
        fixStaffingFilter();
        if (window.renderLifeguardServices) window.renderLifeguardServices();
      }, 80);
    }
  });
  window.addEventListener('load', () => {
    setTimeout(() => {
      const cal = document.getElementById('bookingTabCalendar');
      if (cal) cal.style.display = '';
      if (document.querySelector('.booking-tab[data-btab="calendar"]')?.classList.contains('active')) forceCalendarVisible();
      fixStaffingFilter();
    }, 200);
  });
})();


;
/* source: app-27.js */
(function () {
  function refreshRecurringFilterOptions() {
    const site = document.getElementById('rbSite'), org = document.getElementById('rbOrg');
    if (site) {
      const current = site.value;
      site.innerHTML = '<option value="">All sites</option>' + S.map(x => `<option value="${x.id}">${e(x.name)}</option>`).join('');
      const context = (typeof window.getActiveSiteId === 'function' ? window.getActiveSiteId() : '') || '';
      const wanted = context || current;
      if ([...site.options].some(o => o.value === wanted)) site.value = wanted;
    }
    if (org) {
      const current = org.value;
      org.innerHTML = '<option value="">All organisations</option><option value="internal">School/Internal</option>' + H.map(x => `<option value="${x.id}">${e(x.name)}</option>`).join('');
      if ([...org.options].some(o => o.value === current)) org.value = current; else org.value = '';
    }
  }
  const previous = window.renderRecurringBookings;
  OpsLifecycle.use("renderRecurringBookings", function (next) {
    refreshRecurringFilterOptions();
    next();
  });
  const previousTab = window.setBookingTab;
  OpsLifecycle.use("setBookingTab", function (next, tab) {
    if (tab === 'recurring') refreshRecurringFilterOptions();
    next(tab);
    if (tab === 'recurring') setTimeout(() => {
      refreshRecurringFilterOptions();
      previous();
    }, 20);
  });
})();


;
/* source: app-28.js */
(function () {
  const style = document.createElement('style');
  style.textContent = `
    .statement-modal .statement-head,
    #modal .statement-head{padding-bottom:14px!important;margin-bottom:10px!important;border-bottom:1px solid #dfe6ed!important;align-items:flex-start!important}
    .statement-modal .statement-head h3,
    #modal .statement-head h3{margin:0 0 5px!important;line-height:1.25!important}
    .statement-modal .statement-head .muted,
    #modal .statement-head .muted{display:block!important;line-height:1.4!important;margin-top:2px!important}
    .statement-modal .statement-status,
    #modal .statement-status{margin-top:2px!important;align-self:flex-start!important}
    .statement-modal table,
    #modal .statement-table{margin-top:8px!important}
  `;
  document.head.appendChild(style);
})();


;
/* source: app-29.js */
(function () {
  function enhanceStaffingCustomerFilter() {
    const sel = document.getElementById('lgCustomer');
    if (!sel || sel.dataset.ffCustomerEnhanced === '1') return;
    const current = sel.value;
    sel.innerHTML = '<option value="">All customers</option><option value="school">School</option><optgroup label="External hirers">' + H.map(h => `<option value="hirer:${h.id}">${e(h.name)}</option>`).join('') + '</optgroup>';
    if (current === 'school') sel.value = 'school'; else if (current && current.startsWith('hirer:')) sel.value = current; else sel.value = '';
    sel.dataset.ffCustomerEnhanced = '1';
  }
  const prior = window.renderLifeguardServices;
  OpsLifecycle.use("renderLifeguardServices", async function (next) {
    enhanceStaffingCustomerFilter();
    const sel = document.getElementById('lgCustomer');
    const chosen = sel?.value || '';
    if (sel && chosen.startsWith('hirer:')) sel.value = 'hirer';
    await next();
    enhanceStaffingCustomerFilter();
    if (sel) sel.value = chosen;
    const tbody = document.getElementById('lgRows');
    if (!tbody) return;
    if (chosen.startsWith('hirer:')) {
      const id = chosen.slice(6), name = hn(id);
      [...tbody.querySelectorAll('tr')].forEach(tr => {
        const customer = tr.children[2]?.textContent || '';
        tr.style.display = customer.includes(name) ? '' : 'none';
      });
      const visible = [...tbody.querySelectorAll('tr')].filter(tr => tr.style.display !== 'none');
      let hours = 0, net = 0;
      visible.forEach(tr => {
        hours += Number((tr.children[6]?.textContent || '0').replace(/[^0-9.-]/g, '')) || 0;
        net += Number((tr.children[8]?.textContent || '0').replace(/[^0-9.-]/g, '')) || 0;
      });
      const k = document.getElementById('lgKpis');
      if (k) k.innerHTML = `<div class=lg-kpi><span>${e(name)} staffing hours</span><b>${hours.toFixed(2)}</b></div><div class=lg-kpi><span>Amount to invoice ${e(name)}</span><b>£${net.toFixed(2)}</b></div><div class=lg-kpi><span>Customer</span><b>${e(name)}</b></div><div class=lg-kpi><span>Month</span><b>${e(document.getElementById('lgMonth')?.value || '')}</b></div>`;
    }
    addMonthlyCustomerSummary();
  });
  function addMonthlyCustomerSummary() {
    const tbody = document.getElementById('lgRows');
    if (!tbody) return;
    let box = document.getElementById('ffStaffMonthlySummary');
    if (!box) {
      box = document.createElement('div');
      box.id = 'ffStaffMonthlySummary';
      box.className = 'ff-staff-summary';
      tbody.closest('table')?.parentElement?.insertAdjacentElement('afterend', box);
    }
    if (!box) return;
    const totals = new Map();
    [...tbody.querySelectorAll('tr')].filter(tr => tr.style.display !== 'none' && tr.children.length > 3).forEach(tr => {
      const customer = (tr.children[2]?.textContent || '').split('\n')[0].trim(), hours = Number((tr.children[6]?.textContent || '0').replace(/[^0-9.-]/g, '')) || 0, net = Number((tr.children[8]?.textContent || '0').replace(/[^0-9.-]/g, '')) || 0;
      if (!customer) return;
      const t = totals.get(customer) || ({
        hours: 0,
        net: 0,
        count: 0
      });
      t.hours += hours;
      t.net += net;
      t.count++;
      totals.set(customer, t);
    });
    const grand = [...totals.values()].reduce((a, t) => ({
      hours: a.hours + t.hours,
      net: a.net + t.net,
      count: a.count + t.count
    }), {
      hours: 0,
      net: 0,
      count: 0
    });
    box.innerHTML = `<div class="ff-staff-summary-head"><div class="ff-staff-summary-title"><h3>Monthly Frogs & Friends staffing charges</h3><p>Amounts to invoice for staffing services in the selected month.</p></div><div class=ff-staff-grand><span>Monthly total</span><b>£${grand.net.toFixed(2)}</b></div></div><table><thead><tr><th>Customer</th><th>Staffing entries</th><th>Staff hours</th><th>Amount to invoice</th></tr></thead><tbody>${[...totals.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([name, t]) => `<tr><td><b>${e(name)}</b></td><td>${t.count}</td><td>${t.hours.toFixed(2)}</td><td><b>£${t.net.toFixed(2)}</b></td></tr>`).join('') || '<tr><td colspan=4 class=muted>No staffing charges for this selection.</td></tr>'}</tbody><tfoot><tr><th>Total</th><th>${grand.count}</th><th>${grand.hours.toFixed(2)}</th><th>£${grand.net.toFixed(2)}</th></tr></tfoot></table>`;
  }
  const style = document.createElement('style');
  style.textContent = '.ff-staff-summary{margin-top:14px;border:1px solid #dbe3ea;border-radius:12px;padding:16px;background:#fff}.ff-staff-summary-head{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;margin-bottom:16px}.ff-staff-summary-title{display:flex;flex-direction:column;gap:5px;min-width:0}.ff-staff-summary-title h3{display:block;margin:0!important;padding:0!important;line-height:1.3!important;font-size:17px!important}.ff-staff-summary-title p{display:block;margin:0!important;padding:0!important;line-height:1.45!important;font-size:12px;color:#64748b}.ff-staff-grand{text-align:right;min-width:150px;padding-top:1px}.ff-staff-grand span{display:block;font-size:12px;color:#64748b;line-height:1.3}.ff-staff-grand b{display:block;font-size:22px;margin-top:4px;line-height:1.2}.ff-staff-summary table{width:100%;border-collapse:collapse}.ff-staff-summary th,.ff-staff-summary td{padding:9px;border-top:1px solid #e5eaf0;text-align:left}.ff-staff-summary th:last-child,.ff-staff-summary td:last-child{text-align:right}@media(max-width:700px){.ff-staff-summary-head{flex-direction:column}.ff-staff-grand{text-align:left}}';
  document.head.appendChild(style);
})();

