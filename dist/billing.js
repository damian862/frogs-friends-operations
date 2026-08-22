/* Maintained consolidated runtime module. */
/* source: app-30.js */
(function () {
  function identifyCalendarCards() {
    document.querySelectorAll('.cal-event').forEach(card => {
      if (card.dataset.recordReady) return;
      const time = (card.querySelector('.cal-time')?.textContent || '').split('–'), org = (card.querySelector('.cal-org')?.textContent || '').trim(), title = (card.children[2]?.textContent || '').trim();
      const cell = card.closest('.cal-cell,.cal-day,.cal-term-day');
      let date = '';
      if (cell?.classList.contains('cal-cell')) {
        const num = Number(cell.querySelector('.num')?.textContent);
        if (num) {
          const anchor = document.getElementById('calAnchor')?.value || '';
          const [y, m] = anchor.split('-').map(Number);
          let mm = m, yy = y;
          if (cell.classList.contains('out')) {
            if (num > 20) {
              mm = m - 1;
              if (mm < 1) {
                mm = 12;
                yy--;
              }
            } else {
              mm = m + 1;
              if (mm > 12) {
                mm = 1;
                yy++;
              }
            }
          }
          date = `${yy}-${String(mm).padStart(2, '0')}-${String(num).padStart(2, '0')}`;
        }
      }
      if (cell?.classList.contains('cal-day')) {
        const anchor = document.getElementById('calAnchor')?.value;
        if (anchor) {
          const d = new Date(anchor + 'T12:00:00'), target = [...document.querySelectorAll('.cal-day')].indexOf(cell), shift = (d.getDay() + 6) % 7, start = new Date(d.getTime() - shift * 86400000);
          date = new Date(start.getTime() + target * 86400000).toISOString().slice(0, 10);
        }
      }
      if (cell?.classList.contains('cal-term-day')) {
        const txt = cell.querySelector('.cal-term-date')?.textContent || '';
        const d = new Date(txt + ' 12:00');
        if (!isNaN(d)) date = d.toISOString().slice(0, 10);
      }
      if (!date) return;
      const b = B.find(x => x.booking_date === date && String(x.start_time || '').slice(0, 5) === time[0] && String(x.end_time || '').slice(0, 5) === time[1] && (x.title || 'Booking') === title && (hn(x.hirer_id) || 'School/Internal') === org);
      if (b) {
        card.dataset.bookingId = b.id;
        card.dataset.recordReady = '1';
        return;
      }
      const dow = new Date(date + 'T12:00:00').getDay();
      for (const p of G) {
        if (p.active === false || p.starts_on > date || p.ends_on < date || (hn(p.hirer_id) || 'School/Internal') !== org) continue;
        const s = RS.find(x => x.programme_id === p.id && x.active !== false && Number(x.day_of_week) === dow && String(x.start_time || '').slice(0, 5) === time[0] && String(x.end_time || '').slice(0, 5) === time[1] && (x.title || p.name || 'Recurring booking') === title);
        if (s) {
          card.dataset.programmeId = p.id;
          card.dataset.sessionId = s.id;
          card.dataset.recordReady = '1';
          break;
        }
      }
    });
  }
  window.calendarEditEvent = function (btn) {
    const card = btn.closest('.cal-event');
    identifyCalendarCards();
    if (card.dataset.bookingId) return editBooking(card.dataset.bookingId);
    if (card.dataset.sessionId) return editSession(card.dataset.sessionId, card.dataset.programmeId);
    alert('This calendar item could not be matched to its booking record.');
  };
  function addCalendarActions() {
    identifyCalendarCards();
    document.querySelectorAll('.cal-event').forEach(card => {
      if (card.querySelector('.cal-event-actions')) return;
      const actions = document.createElement('div');
      actions.className = 'cal-event-actions';
      actions.innerHTML = '<button type="button" onclick="event.stopPropagation();calendarEditEvent(this)">Edit</button>';
      card.appendChild(actions);
    });
  }
  const priorCal = window.renderBookingCalendar;
  OpsLifecycle.use("renderBookingCalendar", function (next) {
    next();
    setTimeout(addCalendarActions, 0);
  });
  const panels = [['recurring', 'bookingTabRecurring', 'Recurring Bookings'], ['single', 'bookingTabSingle', 'Single Booking'], ['school', 'bookingTabSchool', 'School Events'], ['income', 'bookingTabIncome', 'Pool Usage & Income']], collapsed = {};
  window.toggleBookingSection = function (name) {
    collapsed[name] = !collapsed[name];
    applyCollapsibleSections();
  };
  function applyCollapsibleSections() {
    panels.forEach(([name, id, label]) => {
      const panel = document.getElementById(id);
      if (!panel) return;
      let bar = panel.querySelector(':scope > .section-collapse-bar');
      if (!bar) {
        bar = document.createElement('div');
        bar.className = 'section-collapse-bar';
        bar.innerHTML = `<button type=button onclick="toggleBookingSection('${name}')"><span class=section-chevron>▾</span> ${label}</button>`;
        panel.insertBefore(bar, panel.firstChild);
      }
      bar.querySelector('.section-chevron').textContent = collapsed[name] ? '▸' : '▾';
      [...panel.children].forEach(ch => {
        if (ch !== bar) ch.style.display = collapsed[name] ? 'none' : '';
      });
    });
  }
  const priorTab = window.setBookingTab;
  OpsLifecycle.use("setBookingTab", function (next, name) {
    next(name);
    setTimeout(applyCollapsibleSections, 0);
  });
  const priorRender = window.render;
  OpsLifecycle.use("render", function (next) {
    next();
    setTimeout(applyCollapsibleSections, 0);
  });
  window.addEventListener('load', () => setTimeout(applyCollapsibleSections, 150));
  const style = document.createElement('style');
  style.textContent = `.cal-event{position:relative}.cal-event-actions{display:flex;gap:4px;flex-wrap:wrap;margin-top:5px}.cal-event-actions button{border:0;background:#fff;border-radius:5px;padding:3px 6px;font-size:10px;cursor:pointer;box-shadow:0 0 0 1px rgba(15,60,90,.15)}.cal-event-actions button:hover{background:#eef5fa}.section-collapse-bar{display:flex;justify-content:flex-end;margin:0 0 8px}.section-collapse-bar button{border:1px solid #d9e2ea;background:#f6f9fb;border-radius:7px;padding:6px 10px;font-weight:600;cursor:pointer;color:#173b57}.section-chevron{display:inline-block;width:14px}`;
  document.head.appendChild(style);
})();


;
/* source: app-31.js */
(function () {
  let calendarCollapsed = false;
  function ensureSharedCalendar() {
    const bookings = document.getElementById('bookings'), tabs = bookings?.querySelector('.booking-tabs'), original = document.getElementById('bookingTabCalendar');
    if (!bookings || !tabs || !original) return;
    let shared = document.getElementById('sharedBookingCalendar');
    if (!shared) {
      shared = document.createElement('div');
      shared.id = 'sharedBookingCalendar';
      shared.className = 'shared-booking-calendar';
      shared.innerHTML = '<div class="shared-calendar-head"><div><b>Bookings Calendar</b><span>Week, month, term and availability view</span></div><button type="button" class="s" id="sharedCalendarToggle" onclick="toggleSharedCalendar()"><span id="sharedCalendarChevron">▾</span> Hide calendar</button></div><div id="sharedCalendarBody"></div>';
      tabs.insertAdjacentElement('afterend', shared);
    }
    const body = document.getElementById('sharedCalendarBody');
    if (body && !body.children.length) while (original.firstChild) body.appendChild(original.firstChild);
    original.classList.remove('on');
    original.style.display = 'none';
    applyCalendarCollapse();
  }
  function applyCalendarCollapse() {
    const body = document.getElementById('sharedCalendarBody'), btn = document.getElementById('sharedCalendarToggle'), chev = document.getElementById('sharedCalendarChevron');
    if (body) body.style.display = calendarCollapsed ? 'none' : '';
    if (btn) btn.lastChild.nodeValue = calendarCollapsed ? ' Show calendar' : ' Hide calendar';
    if (chev) chev.textContent = calendarCollapsed ? '▸' : '▾';
  }
  window.toggleSharedCalendar = function () {
    calendarCollapsed = !calendarCollapsed;
    applyCalendarCollapse();
    if (!calendarCollapsed && typeof window.renderBookingCalendar === 'function') setTimeout(() => window.renderBookingCalendar(), 0);
  };
  function activateTabVisual(tab) {
    document.querySelectorAll('.booking-tab[data-btab]').forEach(x => x.classList.remove('active'));
    document.querySelector(`.booking-tab[data-btab="${tab}"]`)?.classList.add('active');
  }
  function showOnlyPanel(id) {
    document.querySelectorAll('.booking-panel').forEach(p => {
      p.classList.remove('on');
      p.style.display = 'none';
    });
    const panel = document.getElementById(id);
    if (panel) {
      panel.classList.add('on');
      panel.style.display = 'block';
      [...panel.children].forEach(ch => ch.style.display = '');
    }
    const original = document.getElementById('bookingTabCalendar');
    if (original) original.style.display = 'none';
    return panel;
  }
  const PANEL_MAP = {
    recurring: 'bookingTabRecurring',
    single: 'bookingTabSingle',
    school: 'bookingTabSchool',
    income: 'bookingTabIncome'
  };
  function enforceSection(tab) {
    const id = PANEL_MAP[tab];
    if (!id) return;
    showOnlyPanel(id);
    activateTabVisual(tab);
    if (tab === 'recurring' && typeof window.renderRecurringBookings === 'function') window.renderRecurringBookings();
    if (tab === 'income') {
      if (typeof window.renderIncomeSummary === 'function') window.renderIncomeSummary(); else if (typeof window.renderPoolUsage === 'function') window.renderPoolUsage();
    }
  }
  const priorSet = window.setBookingTab;
  OpsLifecycle.use("setBookingTab", function (next, tab) {
    ensureSharedCalendar();
    if (tab === 'calendar') {
      document.querySelectorAll('.booking-panel').forEach(x => {
        x.classList.remove('on');
        x.style.display = 'none';
      });
      activateTabVisual('calendar');
      calendarCollapsed = false;
      applyCalendarCollapse();
      if (typeof window.renderBookingCalendar === 'function') setTimeout(() => window.renderBookingCalendar(), 0);
      return;
    }
    if (next) next(tab);
    ensureSharedCalendar();
    enforceSection(tab);
    setTimeout(() => enforceSection(tab), 40);
  });
  document.addEventListener('click', ev => {
    const tab = ev.target.closest('.booking-tab[data-btab]');
    if (!tab) return;
    const name = tab.dataset.btab;
    if (name && name !== 'calendar') {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      window.setBookingTab(name);
    } else setTimeout(ensureSharedCalendar, 0);
  }, true);
  const priorRender = window.render;
  OpsLifecycle.use("render", function (next) {
    const out = next ? next() : undefined;
    setTimeout(() => {
      ensureSharedCalendar();
      if (document.getElementById('bookings')?.classList.contains('on') && !calendarCollapsed && typeof window.renderBookingCalendar === 'function') window.renderBookingCalendar();
    }, 0);
    return out;
  });
  window.addEventListener('load', () => setTimeout(() => {
    ensureSharedCalendar();
    if (typeof window.renderBookingCalendar === 'function') window.renderBookingCalendar();
  }, 250));
  const style = document.createElement('style');
  style.textContent = `.shared-booking-calendar{margin:8px 0 16px}.shared-calendar-head{display:flex;justify-content:space-between;align-items:center;gap:14px;background:#f7fafc;border:1px solid #dce4eb;border-radius:10px 10px 0 0;padding:10px 12px}.shared-calendar-head>div{display:flex;flex-direction:column;gap:2px}.shared-calendar-head>div>b{font-size:15px}.shared-calendar-head>div>span{font-size:12px;color:#6b7280}#sharedBookingCalendar #sharedCalendarBody{border:1px solid #dce4eb;border-top:0;border-radius:0 0 10px 10px;padding:12px;background:#fff}#bookingTabCalendar{display:none!important}@media(max-width:700px){.shared-calendar-head{align-items:flex-start;flex-direction:column}}`;
  document.head.appendChild(style);
})();


;
/* source: app-32.js */
(function () {
  const friendly = {
    'Pool Manager checked': 'Pool Manager approved',
    'Lettings Manager approved': 'Lettings Manager approved',
    'Ready for invoice': 'Ready for Finance'
  };
  function tidyBillingCards() {
    document.querySelectorAll('#monthlyBilling .bill-row').forEach(row => {
      const status = row.querySelector('.bill-status');
      if (!status) return;
      const original = status.textContent.trim();
      if (friendly[original]) status.textContent = friendly[original];
      const statusCol = status.parentElement;
      let help = statusCol.querySelector('.bill-stage-help');
      if (!help) {
        help = document.createElement('div');
        help.className = 'bill-stage-help';
        status.insertAdjacentElement('afterend', help);
      }
      if (original === 'Pool Manager checked' || status.textContent.trim() === 'Pool Manager approved') help.textContent = 'Reviewed and approved for Lettings Manager review'; else if (original === 'Lettings Manager approved') help.textContent = 'Approved for Finance to invoice'; else if (original === 'Ready for invoice' || status.textContent.trim() === 'Ready for Finance') help.textContent = 'Final pool-hire total approved for Finance'; else help.remove();
      const adjustment = statusCol.querySelector('.bill-adjust');
      if (adjustment && ['Pool Manager checked', 'Pool Manager approved', 'Lettings Manager approved', 'Ready for invoice', 'Ready for Finance'].includes(original)) adjustment.style.display = 'none';
      row.querySelectorAll('.bill-actions button').forEach(btn => {
        if (btn.textContent.trim() === 'Ready for invoice') btn.textContent = 'Approve for Finance';
      });
    });
  }
  const prior = window.renderMonthlyBilling;
  OpsLifecycle.use("renderMonthlyBilling", function (next) {
    const out = next();
    setTimeout(tidyBillingCards, 0);
    return out;
  });
  const priorStatement = window.viewBillingStatement;
  window.viewBillingStatement = function (id) {
    priorStatement(id);
    setTimeout(() => {
      document.querySelectorAll('.billing-statement-modal .bill-status,#modal .bill-status').forEach(s => {
        const t = s.textContent.trim();
        if (friendly[t]) s.textContent = friendly[t];
      });
    }, 0);
  };
  const style = document.createElement('style');
  style.textContent = '.bill-stage-help{margin-top:7px;font-size:12px;line-height:1.4;color:#64748b;max-width:245px}';
  document.head.appendChild(style);
})();


;
/* source: app-33.js */
(function () {
  function hideStaffRegister() {
    document.querySelectorAll('nav a, aside a, .sidebar a, button').forEach(el => {
      if ((el.textContent || '').trim() === 'Staff Register') el.style.display = 'none';
    });
    const staffSection = document.getElementById('staff') || document.getElementById('staffPage') || document.querySelector('[data-page="staff"]');
    if (staffSection) staffSection.style.display = 'none';
  }
  hideStaffRegister();
  window.addEventListener('load', () => setTimeout(hideStaffRegister, 100));
  const observer = new MutationObserver(() => hideStaffRegister());
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();


;
/* source: app-34.js */
(function () {
  const FINANCE_ACTION_ROLES = new Set(['owner_admin', 'operations_admin', 'site_manager', 'finance']);
  const FINANCE_VIEW_ROLES = new Set(['owner_admin', 'operations_admin', 'site_manager', 'finance', 'lettings_manager', 'bursar']);
  function money(v) {
    return '£' + Number(v || 0).toLocaleString('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  function monthLabel(v) {
    const d = new Date(String(v).slice(0, 7) + '-01T12:00:00');
    return isNaN(d) ? String(v || '') : d.toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric'
    });
  }
  function canView() {
    return FINANCE_VIEW_ROLES.has(String(P?.role || ''));
  }
  function canAction() {
    return FINANCE_ACTION_ROLES.has(String(P?.role || ''));
  }
  function ensureQueue() {
    const panel = document.getElementById('bookingTabIncome');
    if (!panel || !canView()) return null;
    let wrap = document.getElementById('financeQueue');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'financeQueue';
      wrap.className = 'finance-queue';
      wrap.innerHTML = `<div class="finance-queue-head"><div><h2>Finance Queue</h2><p>Approved monthly pool-hire statements waiting to be invoiced in the school accounts system.</p></div><div class="finance-queue-summary"><span>Waiting</span><b id="financeQueueCount">0</b><span id="financeQueueTotal">£0.00</span></div></div><div id="financeQueueBody" class="card"><div class="muted">Loading approved statements…</div></div>`;
      const monthly = document.getElementById('monthlyBilling');
      if (monthly) monthly.insertAdjacentElement('afterend', wrap); else panel.appendChild(wrap);
    }
    return wrap;
  }
  async function loadQueue() {
    const wrap = ensureQueue();
    if (!wrap) return;
    const body = document.getElementById('financeQueueBody');
    const {data, error} = await sb.from('school_invoice_batches').select('*').eq('status', 'ready').order('usage_month', {
      ascending: true
    });
    if (error) {
      body.innerHTML = `<div class="err">${e(error.message)}</div>`;
      return;
    }
    const rows = data || [];
    document.getElementById('financeQueueCount').textContent = rows.length;
    document.getElementById('financeQueueTotal').textContent = money(rows.reduce((a, r) => a + Number(r.total_amount || 0), 0));
    body.innerHTML = rows.length ? `<div class="finance-table-wrap"><table class="finance-table"><thead><tr><th>Organisation</th><th>Site</th><th>Month</th><th>Net</th><th>VAT</th><th>Total</th><th></th></tr></thead><tbody>${rows.map(r => `<tr><td><b>${e(hn(r.hirer_id) || 'Unknown organisation')}</b></td><td>${e(sn(r.site_id) || '')}</td><td>${e(monthLabel(r.usage_month))}</td><td>${money(r.net_amount)}</td><td>${money(r.vat_amount)}</td><td><b>${money(r.total_amount)}</b></td><td><div class="finance-actions"><button class="s" onclick="financeViewStatement('${r.id}')">View statement</button>${canAction() ? `<button class="p" onclick="financeMarkInvoiced('${r.id}')">Mark invoiced</button>` : ''}</div></td></tr>`).join('')}</tbody></table></div>` : '<div class="finance-empty"><b>No statements waiting for Finance.</b><span>Statements will appear here after the Lettings Manager has approved them and they have been marked Ready for Finance.</span></div>';
  }
  let queueLoadTimer = null;
  function scheduleQueueLoad(delay = 120) {
    if (queueLoadTimer !== null) clearTimeout(queueLoadTimer);
    queueLoadTimer = setTimeout(() => {
      queueLoadTimer = null;
      loadQueue();
    }, delay);
  }
  window.financeViewStatement = id => {
    if (typeof window.viewBillingStatement === 'function') window.viewBillingStatement(id);
  };
  window.financeMarkInvoiced = async function (id) {
    if (!canAction()) return alert('Only Finance or an authorised administrator can mark a statement as invoiced.');
    const selectedBillSite = document.getElementById('billSite')?.value || '';
    const selectedBillMonth = document.getElementById('billMonth')?.value || '';
    const selectedViewingSite = document.getElementById('siteScope')?.value || document.getElementById('siteSelect')?.value || '';
    const ref = prompt('Enter the invoice reference from the school accounts system:', '');
    if (ref === null) return;
    if (!ref.trim()) return alert('Enter an invoice reference.');
    const {data: before, error: readError} = await sb.from('school_invoice_batches').select('*').eq('id', id).single();
    if (readError) return alert(readError.message);
    if (before.status !== 'ready') return alert('This statement is no longer Ready for Finance. Refresh the queue.');
    const now = new Date().toISOString();
    const {data, error} = await sb.from('school_invoice_batches').update({
      status: 'invoiced',
      invoice_reference: ref.trim(),
      invoiced_at: now,
      updated_at: now
    }).eq('id', id).select().single();
    if (error) return alert(error.message);
    await sb.from('school_invoice_batch_events').insert({
      batch_id: id,
      actor_user_id: P.id,
      event_type: 'marked_invoiced',
      old_status: 'ready',
      new_status: 'invoiced',
      old_net_amount: Number(before.net_amount || 0),
      new_net_amount: Number(data.net_amount || 0),
      notes: 'Invoice reference: ' + ref.trim()
    });
    await loadQueue();
    if (typeof window.renderIncomeSummary === 'function') {
      setTimeout(() => {
        window.renderIncomeSummary();
        setTimeout(() => {
          const month = document.getElementById('billMonth');
          if (month && selectedBillMonth) month.value = selectedBillMonth;
          const site = document.getElementById('billSite');
          if (site && selectedBillSite && [...site.options].some(o => o.value === selectedBillSite)) site.value = selectedBillSite;
          const scope = document.getElementById('siteScope') || document.getElementById('siteSelect');
          if (scope && selectedViewingSite && [...scope.options].some(o => o.value === selectedViewingSite)) scope.value = selectedViewingSite;
          if (typeof window.renderMonthlyBilling === 'function') window.renderMonthlyBilling();
        }, 80);
      }, 0);
    }
  };
  const priorIncome = window.renderIncomeSummary;
  OpsLifecycle.use("renderIncomeSummary", function (next) {
    const out = next();
    scheduleQueueLoad();
    return out;
  });
  const priorBilling = window.renderMonthlyBilling;
  OpsLifecycle.use("renderMonthlyBilling", function (next) {
    const out = next();
    scheduleQueueLoad();
    return out;
  });
  const style = document.createElement('style');
  style.textContent = `.finance-queue{margin-top:28px}.finance-queue-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:12px}.finance-queue-head h2{margin:0 0 4px;font-size:22px}.finance-queue-head p{margin:0;color:#657585;line-height:1.45}.finance-queue-summary{display:grid;grid-template-columns:auto auto;gap:2px 10px;align-items:baseline;text-align:right;min-width:145px}.finance-queue-summary span:first-child{font-size:12px;color:#657585}.finance-queue-summary b{font-size:24px}.finance-queue-summary span:last-child{grid-column:1/-1;font-size:13px;color:#405566}.finance-table-wrap{overflow-x:auto}.finance-table{width:100%;border-collapse:collapse}.finance-table th,.finance-table td{padding:11px 10px;border-bottom:1px solid #e7edf2;text-align:left;vertical-align:middle}.finance-table th{font-size:12px;color:#60717f}.finance-actions{display:flex;gap:7px;justify-content:flex-end;flex-wrap:wrap}.finance-empty{display:flex;flex-direction:column;gap:5px;padding:8px 2px}.finance-empty span{color:#657585;font-size:13px}@media(max-width:760px){.finance-queue-head{flex-direction:column}.finance-queue-summary{text-align:left}.finance-actions{justify-content:flex-start}}`;
  document.head.appendChild(style);
})();


;
/* source: app-35.js */
(function () {
  window.deleteKeySchoolDate = async function (id) {
    const item = D.find(x => x.id === id);
    if (!item) return alert('This key date could not be found. Please refresh and try again.');
    const year = Y.find(y => y.id === item.academic_year_id);
    const site = year ? sn(year.site_id) : 'this school';
    const label = item.name || prettyType(item.period_type) || 'key school date';
    const dates = item.starts_on === item.ends_on ? shortUk(item.starts_on) : `${shortUk(item.starts_on)} → ${shortUk(item.ends_on)}`;
    if (!confirm(`Delete ${label}?\n\n${site}\n${dates}\n\nThis cannot be undone.`)) return;
    const {error} = await sb.from('academic_calendar_periods').delete().eq('id', id);
    if (error) return alert(error.message || String(error));
    await load();
  };
  function addDeleteButtons() {
    document.querySelectorAll('#termDates .term-actions').forEach(actions => {
      if (actions.querySelector('.key-date-delete')) return;
      const edit = [...actions.querySelectorAll('button')].find(b => (b.getAttribute('onclick') || '').includes("editDate('"));
      if (!edit) return;
      const match = (edit.getAttribute('onclick') || '').match(/editDate\('([^']+)'\)/);
      if (!match) return;
      const sep = document.createTextNode(' · ');
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'link key-date-delete';
      del.textContent = 'Delete';
      del.onclick = () => window.deleteKeySchoolDate(match[1]);
      actions.appendChild(sep);
      actions.appendChild(del);
    });
  }
  const prior = window.renderTermDates;
  OpsLifecycle.use("renderTermDates", function (next) {
    const out = next();
    setTimeout(addDeleteButtons, 0);
    return out;
  });
  const priorRender = window.render;
  OpsLifecycle.use("render", function (next) {
    const out = next();
    setTimeout(addDeleteButtons, 0);
    return out;
  });
  window.addEventListener('load', () => setTimeout(addDeleteButtons, 150));
})();


;
/* source: app-36.js */
(function () {
  function tidyKeyDateLabels() {
    document.querySelectorAll('#termDates .term-row .term-label').forEach(label => {
      const muted = label.querySelector('.muted');
      if (!muted) return;
      const primary = [...label.childNodes].filter(n => n !== muted).map(n => n.textContent || '').join('').trim().toLowerCase();
      const secondary = (muted.textContent || '').trim().toLowerCase();
      if (primary && secondary && primary === secondary) muted.style.display = 'none'; else muted.style.display = '';
    });
  }
  const prior = window.renderTermDates;
  OpsLifecycle.use("renderTermDates", function (next) {
    const out = next();
    setTimeout(tidyKeyDateLabels, 0);
    return out;
  });
  const priorRender = window.render;
  OpsLifecycle.use("render", function (next) {
    const out = next();
    setTimeout(tidyKeyDateLabels, 0);
    return out;
  });
  window.addEventListener('load', () => setTimeout(tidyKeyDateLabels, 200));
})();


;
/* source: app-37.js */
(function () {
  window.financeMarkInvoiced = async function (id) {
    const allowed = new Set(['owner_admin', 'operations_admin', 'site_manager', 'finance']);
    if (!allowed.has(String(P?.role || ''))) return alert('Only Finance or an authorised administrator can mark a statement as invoiced.');
    const selectedBillSite = document.getElementById('billSite')?.value || '';
    const selectedBillMonth = document.getElementById('billMonth')?.value || '';
    const ref = prompt('Enter the invoice reference from the school accounts system:', '');
    if (ref === null) return;
    if (!ref.trim()) return alert('Enter an invoice reference.');
    const {data: before, error: readError} = await sb.from('school_invoice_batches').select('*').eq('id', id).single();
    if (readError) return alert(readError.message);
    if (before.status !== 'ready') return alert('This statement is no longer Ready for Finance. Refresh the queue.');
    const now = new Date().toISOString();
    const {data, error} = await sb.from('school_invoice_batches').update({
      status: 'invoiced',
      invoice_reference: ref.trim(),
      invoiced_at: now,
      updated_at: now
    }).eq('id', id).select().single();
    if (error) return alert(error.message);
    await sb.from('school_invoice_batch_events').insert({
      batch_id: id,
      actor_user_id: P.id,
      event_type: 'marked_invoiced',
      old_status: 'ready',
      new_status: 'invoiced',
      old_net_amount: Number(before.net_amount || 0),
      new_net_amount: Number(data.net_amount || 0),
      notes: 'Invoice reference: ' + ref.trim()
    });
    const month = document.getElementById('billMonth');
    if (month && selectedBillMonth) month.value = selectedBillMonth;
    const site = document.getElementById('billSite');
    if (site && selectedBillSite && [...site.options].some(o => o.value === selectedBillSite)) site.value = selectedBillSite;
    if (typeof window.renderMonthlyBilling === 'function') await window.renderMonthlyBilling();
  };
})();


;
/* source: app-38.js */
(function () {
  function ensureBookingAddActions() {
    const configs = [{
      id: 'bookingTabSingle',
      cls: 'single-booking-add-action',
      label: '+ Add single booking',
      action: () => window.editBooking && window.editBooking()
    }, {
      id: 'bookingTabSchool',
      cls: 'school-event-add-action',
      label: '+ Add school event',
      action: () => window.editBooking && window.editBooking(null, 'internal')
    }];
    configs.forEach(cfg => {
      const panel = document.getElementById(cfg.id);
      if (!panel || panel.querySelector('.' + cfg.cls)) return;
      const wrap = document.createElement('div');
      wrap.className = 'booking-add-action ' + cfg.cls;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'p';
      btn.textContent = cfg.label;
      btn.onclick = cfg.action;
      wrap.appendChild(btn);
      const collapse = panel.querySelector(':scope > .section-collapse-bar');
      if (collapse) collapse.insertAdjacentElement('afterend', wrap); else panel.insertBefore(wrap, panel.firstChild);
    });
  }
  const oldTab = window.setBookingTab;
  OpsLifecycle.use("setBookingTab", function (next, name) {
    const out = next(name);
    setTimeout(ensureBookingAddActions, 0);
    return out;
  });
  const oldRender = window.render;
  OpsLifecycle.use("render", function (next) {
    const out = next();
    setTimeout(ensureBookingAddActions, 0);
    return out;
  });
  const oldTables = window.renderBookingTables;
  OpsLifecycle.use("renderBookingTables", function (next) {
    const out = next();
    setTimeout(ensureBookingAddActions, 0);
    return out;
  });
  window.addEventListener('load', () => setTimeout(ensureBookingAddActions, 250));
  const style = document.createElement('style');
  style.textContent = '.booking-add-action{display:flex;justify-content:flex-end;margin:2px 0 12px}.booking-add-action .p{white-space:nowrap}';
  document.head.appendChild(style);
})();


;
/* source: app-40.js */
(function () {
  const prior = window.editBookingStaffing;
  if (!prior) return;
  function currentBookingTab() {
    return document.querySelector('.booking-tab.active[data-btab]')?.dataset.btab || (document.getElementById('bookingTabIncome')?.classList.contains('on') ? 'income' : 'single');
  }
  function captureIncomeFilters() {
    const panel = document.getElementById('bookingTabIncome');
    if (!panel) return {};
    const values = {};
    panel.querySelectorAll('select[id],input[id]').forEach(el => values[el.id] = el.value);
    return values;
  }
  function restoreIncomeFilters(values) {
    Object.entries(values || ({})).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.value = value;
    });
  }
  function scrollToStaffing() {
    const candidates = [...document.querySelectorAll('h1,h2,h3,strong,b')];
    const heading = candidates.find(el => (el.textContent || '').includes('Staffing Services'));
    heading?.scrollIntoView({
      block: 'start'
    });
  }
  window.editBookingStaffing = async function (bookingId, entryId) {
    const sourceTab = currentBookingTab();
    const incomeFilters = sourceTab === 'income' ? captureIncomeFilters() : {};
    const out = await prior.apply(this, arguments);
    const save = document.getElementById('ms');
    if (!save) return out;
    save.style.display = 'inline-block';
    save.style.visibility = 'visible';
    save.disabled = false;
    save.textContent = entryId ? 'Save changes' : 'Save staffing';
    save.onclick = async function () {
      if (document.getElementById('bsCustomer')?.value === 'hirer' && !document.getElementById('bsHirer')?.value) return alert('Select the hiring organisation to charge.');
      let existing = {};
      if (entryId) {
        const r = await sb.from('lifeguard_service_entries').select('*').eq('id', entryId).single();
        if (r.error) return alert(r.error.message);
        existing = r.data || ({});
      }
      const count = Number(document.getElementById('bsCount')?.value || 1), hours = Number(document.getElementById('bsHours')?.value || 0);
      const payload = {
        organisation_id: P.organisation_id,
        site_id: document.getElementById('bsSite').value,
        booking_id: bookingId || existing.booking_id || null,
        service_date: document.getElementById('bsDate').value,
        service_type: document.getElementById('bsType').value,
        service_label: document.getElementById('bsLabel').value || null,
        customer_type: document.getElementById('bsCustomer').value,
        customer_hirer_id: document.getElementById('bsCustomer').value === 'hirer' ? document.getElementById('bsHirer').value : null,
        start_time: document.getElementById('bsStart').value || null,
        end_time: document.getElementById('bsEnd').value || null,
        lifeguard_count: count,
        hours_per_lifeguard: hours,
        hourly_rate: Number(document.getElementById('bsRate').value || 0),
        vat_applicable: document.getElementById('bsVat').value === 'true',
        vat_rate: 20,
        status: document.getElementById('bsStatus').value,
        notes: document.getElementById('bsNotes').value || null,
        created_by: existing.created_by || P.id,
        updated_at: new Date().toISOString()
      };
      const q = entryId ? await sb.from('lifeguard_service_entries').update(payload).eq('id', entryId) : await sb.from('lifeguard_service_entries').insert(payload);
      if (q.error) return alert(q.error.message);
      closeM();
      await load();
      const destination = sourceTab === 'income' ? 'income' : 'single';
      if (typeof window.setBookingTab === 'function') window.setBookingTab(destination);
      if (destination === 'income') setTimeout(async () => {
        restoreIncomeFilters(incomeFilters);
        if (typeof window.renderLifeguardServices === 'function') await window.renderLifeguardServices();
        setTimeout(scrollToStaffing, 20);
      }, 80);
      alert('Staffing saved successfully.');
    };
    return out;
  };
})();

