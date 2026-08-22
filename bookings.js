/* Maintained consolidated runtime module. */
/* source: app-5.js */
(function () {
  const baseRenderRecurringBookings = renderRecurringBookings;
  const overviewDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function sessionPriceText(r) {
    let ct = r.charge_type || 'chargeable';
    if (ct === 'internal_school_use') return 'Internal school use';
    if (ct === 'free_of_charge') return 'Free of charge';
    if (r.rate == null) return 'Rate not set';
    return `£${Number(r.rate).toFixed(2)}/hr${r.vat_applicable ? ' + VAT' : ' · no VAT'}`;
  }
  function poolText(r) {
    if (r.pool_use_type === 'lanes') return `${r.lane_count || '?'} lane${Number(r.lane_count) === 1 ? '' : 's'}`;
    if (r.pool_use_type === 'other') return 'Other pool allocation';
    return 'Whole pool';
  }
  function groupedSessions(items) {
    let m = new Map();
    items.forEach(r => {
      let key = [String(r.start_time || '').slice(0, 5), String(r.end_time || '').slice(0, 5), (r.title || 'Swimming lessons').trim(), r.charge_type || 'chargeable', r.rate ?? '', !!r.vat_applicable, r.pool_use_type || 'whole_pool', r.lane_count ?? ''].join('|');
      if (!m.has(key)) m.set(key, {
        sample: r,
        days: []
      });
      m.get(key).days.push(Number(r.day_of_week));
    });
    return [...m.values()].sort((a, b) => Math.min(...a.days) - Math.min(...b.days) || String(a.sample.start_time).localeCompare(String(b.sample.start_time)));
  }
  function cardRows() {
    let q = ($('rbSearch')?.value || '').trim().toLowerCase(), site = $('rbSite')?.value || '', org = $('rbOrg')?.value || '', status = $('rbStatus')?.value || 'active';
    return G.filter(x => {
      let active = x.active !== false;
      if (status === 'active' && !active) return false;
      if (status === 'archived' && active) return false;
      if (site && x.site_id !== site) return false;
      if (org === 'internal' && x.hirer_id) return false;
      if (org && org !== 'internal' && x.hirer_id !== org) return false;
      if (q && !`${x.name || ''} ${sn(x.site_id)} ${hn(x.hirer_id) || 'school internal'}`.toLowerCase().includes(q)) return false;
      return true;
    }).sort((a, b) => (sn(a.site_id) + hn(a.hirer_id) + (a.name || '')).localeCompare(sn(b.site_id) + hn(b.hirer_id) + (b.name || '')));
  }
  function overviewFor(x) {
    let sessions = RS.filter(r => r.programme_id === x.id && r.active !== false), breaks = BR.filter(r => r.programme_id === x.id).sort((a, b) => String(a.starts_on).localeCompare(String(b.starts_on))), ex = EX.filter(r => r.programme_id === x.id).sort((a, b) => String(a.exception_date).localeCompare(String(b.exception_date)));
    let timetable = groupedSessions(sessions).map(g => {
      let r = g.sample, ds = [...new Set(g.days)].sort((a, b) => a - b).map(d => overviewDays[d]).join(', ');
      return `<div class="rb-ov-row"><div class="rb-ov-main"><b>${e(ds)}</b><span>${String(r.start_time || '').slice(0, 5)}–${String(r.end_time || '').slice(0, 5)}</span><span>${e((r.title || 'Swimming lessons').trim())}</span></div><div class="rb-ov-meta"><span>${e(poolText(r))}</span><span>${e(sessionPriceText(r))}</span></div></div>`;
    }).join('') || '<div class="rb-ov-empty">No weekly sessions</div>';
    let breakHtml = breaks.map(b => `<div class="rb-ov-chip break"><b>${e(b.name || 'Break')}</b><span>${shortUk(b.starts_on)}${b.ends_on && b.ends_on !== b.starts_on ? ' → ' + shortUk(b.ends_on) : ''}</span></div>`).join('') || '<span class="rb-ov-empty">No breaks</span>';
    let exHtml = ex.map(z => {
      let s = RS.find(r => r.id === z.session_id);
      let label = s ? `${overviewDays[Number(s.day_of_week)]} ${String(s.start_time || '').slice(0, 5)}–${String(s.end_time || '').slice(0, 5)}` : 'All sessions';
      return `<div class="rb-ov-chip cancel"><b>${shortUk(z.exception_date)}</b><span>${e(label)}${z.notes ? ' · ' + e(z.notes) : ''}</span></div>`;
    }).join('') || '<span class="rb-ov-empty">No cancellations</span>';
    return `<div class="rb-overview"><div class="rb-ov-section"><div class="rb-ov-title">Weekly timetable</div>${timetable}</div><div class="rb-ov-two"><div class="rb-ov-section"><div class="rb-ov-title">Breaks</div><div class="rb-ov-chips">${breakHtml}</div></div><div class="rb-ov-section"><div class="rb-ov-title">Cancellations</div><div class="rb-ov-chips">${exHtml}</div></div></div></div>`;
  }
  OpsLifecycle.use("renderRecurringBookings", function (next) {
    next();
    let host = $('rProg');
    if (!host) return;
    let rows = cardRows(), cards = [...host.querySelectorAll('.rb-item')];
    cards.forEach((card, i) => {
      let x = rows[i];
      if (!x) return;
      let existing = card.querySelector('.rb-overview');
      if (existing) existing.remove();
      let summary = card.querySelector('.rb-summary');
      if (summary) summary.insertAdjacentHTML('afterend', overviewFor(x));
    });
  });
  const st = document.createElement('style');
  st.textContent = `.rb-overview{border-top:1px solid #e3e9ef;padding:12px 16px 14px;background:#fbfcfe}.rb-ov-section{min-width:0}.rb-ov-title{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:#53687a;margin:0 0 7px}.rb-ov-row{display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-top:1px solid #edf1f4}.rb-ov-row:first-of-type{border-top:0}.rb-ov-main{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}.rb-ov-main b{min-width:92px}.rb-ov-main span:last-child{color:#526473}.rb-ov-meta{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;font-size:12px;color:#53687a}.rb-ov-meta span{background:#eef3f7;border-radius:999px;padding:3px 7px}.rb-ov-two{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:12px}.rb-ov-chips{display:flex;gap:6px;flex-wrap:wrap}.rb-ov-chip{display:inline-flex;gap:6px;align-items:center;border-radius:8px;padding:6px 8px;font-size:12px}.rb-ov-chip.break{background:#fff7e6;border:1px solid #f0dfb5}.rb-ov-chip.cancel{background:#fff0f0;border:1px solid #efcdcd}.rb-ov-chip span{color:#53687a}.rb-ov-empty{font-size:12px;color:#81909d}@media(max-width:800px){.rb-ov-two{grid-template-columns:1fr}.rb-ov-row{display:block}.rb-ov-meta{justify-content:flex-start;margin-top:5px}}`;
  document.head.appendChild(st);
})();
editCancellation = function (id, pid) {
  let x = EX.find(z => z.id === id) || ({}), programmeId = pid || x.programme_id;
  let all = RS.filter(s => s.programme_id === programmeId && s.active !== false);
  const optionsForDate = (date, selected) => {
    if (!date) return '<option value="">Choose a date first</option>';
    let day = new Date(date + 'T12:00:00').getDay();
    let matches = all.filter(s => Number(s.day_of_week) === day).sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));
    if (!matches.length) return '<option value="">No recurring sessions run on this date</option>';
    return matches.map(s => `<option value="${s.id}" ${selected === s.id ? 'selected' : ''}>${String(s.start_time || '').slice(0, 5)}–${String(s.end_time || '').slice(0, 5)} · ${e(s.title || 'Swimming lessons')}</option>`).join('');
  };
  modal(id ? 'Edit cancellation' : 'Cancel one session', `<label>Date<input id=f1 type=date value="${x.exception_date || ''}"></label><label>Session<select id=f2>${optionsForDate(x.exception_date || '', x.session_id)}</select></label><label>Reason / notes<textarea id=f3>${e(x.notes)}</textarea></label>`, async () => {
    if (!f1.value) return alert('Choose the cancellation date.');
    if (!f2.value) return alert('Choose the session to cancel.');
    let pay = {
      programme_id: programmeId,
      session_id: f2.value,
      exception_date: f1.value,
      exception_type: 'cancelled',
      notes: f3.value || null
    }, q = id ? sb.from('recurring_programme_session_exceptions').update(pay).eq('id', id) : sb.from('recurring_programme_session_exceptions').insert(pay);
    let {error} = await q;
    if (error) return alert(error.message);
    closeM();
    load();
  });
  setTimeout(() => {
    if ($('f1')) $('f1').onchange = () => {
      let selected = $('f2')?.value || '';
      $('f2').innerHTML = optionsForDate($('f1').value, selected);
    };
  }, 0);
};


;
/* source: app-6.js */
(function () {
  const previousRenderRecurringBookings = renderRecurringBookings;
  const openSchedules = new Set();
  function programmeIdFromCard(card) {
    let btn = [...card.querySelectorAll('button')].find(b => (b.getAttribute('onclick') || '').includes('manageProgramme('));
    let m = (btn?.getAttribute('onclick') || '').match(/manageProgramme\('([^']+)'\)/);
    return m ? m[1] : null;
  }
  window.toggleRecurringSchedule = function (id) {
    if (openSchedules.has(id)) openSchedules.delete(id); else openSchedules.add(id);
    renderRecurringBookings();
  };
  OpsLifecycle.use("renderRecurringBookings", function (next) {
    next();
    let host = $('rProg');
    if (!host) return;
    [...host.querySelectorAll('.rb-item')].forEach(card => {
      let id = programmeIdFromCard(card);
      if (!id) return;
      let overview = card.querySelector('.rb-overview');
      if (overview) overview.style.display = openSchedules.has(id) ? 'block' : 'none';
      let actions = card.querySelector('.rb-actions');
      if (actions && !actions.querySelector('.rb-view-schedule')) {
        let btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 's rb-view-schedule';
        btn.textContent = openSchedules.has(id) ? 'Hide schedule' : 'View schedule';
        btn.onclick = () => toggleRecurringSchedule(id);
        actions.insertBefore(btn, actions.firstChild);
      }
    });
  });
  const st = document.createElement('style');
  st.textContent = `.rb-view-schedule{white-space:nowrap}.rb-item .rb-overview{transition:none}.rb-summary{cursor:default}`;
  document.head.appendChild(st);
})();


;
/* source: app-7.js */
(function () {
  const DAY = 86400000;
  function isoLocal(d) {
    let y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  function parseDate(v) {
    return new Date(v + 'T12:00:00');
  }
  function maxDate(a, b) {
    return a > b ? a : b;
  }
  function minDate(a, b) {
    return a < b ? a : b;
  }
  function hoursBetween(a, b) {
    let x = String(a || '00:00').split(':').map(Number), y = String(b || '00:00').split(':').map(Number);
    return Math.max(0, (y[0] * 60 + y[1] - x[0] * 60 - x[1]) / 60);
  }
  function money(v) {
    return '£' + Number(v || 0).toLocaleString('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  function rangeDefaults(mode) {
    let now = new Date(), from, to;
    if (mode === 'year') {
      let y = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
      from = new Date(y, 8, 1, 12);
      to = new Date(y + 1, 7, 31, 12);
    } else if (mode === 'week') {
      let d = new Date(now);
      let diff = (d.getDay() + 6) % 7;
      from = new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff, 12);
      to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 6, 12);
    } else {
      from = new Date(now.getFullYear(), now.getMonth(), 1, 12);
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 12);
    }
    return [isoLocal(from), isoLocal(to)];
  }
  function reportingControls() {
    let host = $('incomeSummary');
    if (!host) return null;
    if (!$('reportControls')) {
      let p = host.parentElement;
      let controls = document.createElement('div');
      controls.id = 'reportControls';
      controls.className = 'report-toolbar card';
      controls.innerHTML = `<label>Period<select id=repPeriod><option value=month>This month</option><option value=week>This week</option><option value=year>Academic year</option><option value=custom>Custom dates</option></select></label><label>From<input id=repFrom type=date></label><label>To<input id=repTo type=date></label><label>Site<select id=repSite></select></label><label>Organisation<select id=repOrg></select></label><button class=s id=repRefresh>Refresh</button>`;
      p.insertBefore(controls, host);
      let [f, t] = rangeDefaults('month');
      $('repFrom').value = f;
      $('repTo').value = t;
      $('repPeriod').onchange = () => {
        let mode = $('repPeriod').value;
        if (mode !== 'custom') {
          let r = rangeDefaults(mode);
          $('repFrom').value = r[0];
          $('repTo').value = r[1];
        }
        renderIncomeSummary();
      };
      ['repFrom', 'repTo', 'repSite', 'repOrg'].forEach(id => $(id).onchange = () => {
        if (id === 'repFrom' || id === 'repTo') $('repPeriod').value = 'custom';
        renderIncomeSummary();
      });
      $('repRefresh').onclick = renderIncomeSummary;
    }
    let site = $('repSite'), org = $('repOrg'), sv = site.value, ov = org.value;
    site.innerHTML = '<option value="">All sites</option>' + S.map(x => `<option value="${x.id}">${e(x.name)}</option>`).join('');
    org.innerHTML = '<option value="">All users</option><option value="internal">School/Internal</option>' + H.map(x => `<option value="${x.id}">${e(x.name)}</option>`).join('');
    if ([...site.options].some(o => o.value === sv)) site.value = sv;
    if ([...org.options].some(o => o.value === ov)) org.value = ov;
    return {
      from: $('repFrom').value,
      to: $('repTo').value,
      site: site.value,
      org: org.value
    };
  }
  function orgMatches(hirerId, filter) {
    if (!filter) return true;
    if (filter === 'internal') return !hirerId;
    return hirerId === filter;
  }
  function siteMatches(siteId, filter) {
    return !filter || siteId === filter;
  }
  function isBreak(programmeId, date) {
    return BR.some(b => b.programme_id === programmeId && b.starts_on <= date && (b.ends_on || b.starts_on) >= date);
  }
  function isCancelled(programmeId, sessionId, date) {
    return EX.some(x => x.programme_id === programmeId && x.exception_date === date && (!x.session_id || x.session_id === sessionId));
  }
  function recurringOccurrences(cfg) {
    let out = [];
    if (!cfg.from || !cfg.to || cfg.from > cfg.to) return out;
    G.filter(p => p.active !== false && siteMatches(p.site_id, cfg.site) && orgMatches(p.hirer_id, cfg.org) && p.starts_on <= cfg.to && p.ends_on >= cfg.from).forEach(p => {
      let start = maxDate(p.starts_on, cfg.from), end = minDate(p.ends_on, cfg.to);
      RS.filter(s => s.programme_id === p.id && s.active !== false).forEach(s => {
        let d = parseDate(start), last = parseDate(end);
        while (d <= last) {
          if (d.getDay() === Number(s.day_of_week)) {
            let date = isoLocal(d);
            if (!isBreak(p.id, date) && !isCancelled(p.id, s.id, date)) {
              let hrs = hoursBetween(s.start_time, s.end_time), charge = s.charge_type || 'chargeable', income = charge === 'chargeable' && s.rate != null ? Number(s.rate) * hrs : 0;
              out.push({
                kind: 'Recurring',
                date,
                site_id: p.site_id,
                hirer_id: p.hirer_id,
                name: p.name || s.title || 'Recurring booking',
                hours: hrs,
                income,
                charge_type: charge
              });
            }
          }
          d = new Date(d.getTime() + DAY);
        }
      });
    });
    return out;
  }
  function singleOccurrences(cfg) {
    return B.filter(x => x.status !== 'cancelled' && x.booking_date >= cfg.from && x.booking_date <= cfg.to && siteMatches(x.site_id, cfg.site) && orgMatches(x.hirer_id, cfg.org)).map(x => {
      let hrs = bookingHours(x), charge = x.charge_type || 'chargeable', income = charge === 'chargeable' && x.rate != null ? Number(x.rate) * hrs : 0;
      return {
        kind: 'Single',
        date: x.booking_date,
        site_id: x.site_id,
        hirer_id: x.hirer_id,
        name: x.title || 'Booking',
        hours: hrs,
        income,
        charge_type: charge
      };
    });
  }
  function userName(id) {
    return hn(id) || 'School/Internal';
  }
  function summaryByUser(rows) {
    let map = new Map();
    rows.forEach(r => {
      let key = r.hirer_id || 'internal';
      if (!map.has(key)) map.set(key, {
        name: userName(r.hirer_id),
        hours: 0,
        income: 0,
        sessions: 0
      });
      let z = map.get(key);
      z.hours += r.hours;
      z.income += r.income;
      z.sessions++;
    });
    return [...map.values()].sort((a, b) => b.income - a.income || b.hours - a.hours);
  }
  (OpsLifecycle.reset("renderIncomeSummary"), renderIncomeSummary = function () {
    let host = $('incomeSummary');
    if (!host) return;
    let cfg = reportingControls();
    if (!cfg || !cfg.from || !cfg.to) {
      host.innerHTML = '<div class="note">Choose a reporting date range.</div>';
      return;
    }
    if (cfg.from > cfg.to) {
      host.innerHTML = '<div class="err">The From date must be before the To date.</div>';
      return;
    }
    let recurring = recurringOccurrences(cfg), single = singleOccurrences(cfg), all = [...recurring, ...single];
    let hours = all.reduce((a, x) => a + x.hours, 0), income = all.reduce((a, x) => a + x.income, 0), chargeable = all.filter(x => x.charge_type === 'chargeable'), foc = all.filter(x => x.charge_type === 'free_of_charge'), internal = all.filter(x => x.charge_type === 'internal_school_use');
    let forecastRecurring = recurring.reduce((a, x) => a + x.income, 0), singleIncome = single.reduce((a, x) => a + x.income, 0), users = summaryByUser(all);
    host.innerHTML = `<div class="income-grid report-kpis"><div class="income-card">Pool use<b>${hours.toFixed(1)} hrs</b><span>${all.length} session${all.length === 1 ? '' : 's'}</span></div><div class="income-card">Hire income<b>${money(income)}</b><span>Net, before any VAT</span></div><div class="income-card">Recurring forecast<b>${money(forecastRecurring)}</b><span>Breaks & cancellations removed</span></div><div class="income-card">Single booking income<b>${money(singleIncome)}</b><span>${single.length} booking${single.length === 1 ? '' : 's'}</span></div></div><div class="report-split"><div class="card"><div class="card-head"><b>Usage mix</b><span class="muted">${shortUk(cfg.from)} → ${shortUk(cfg.to)}</span></div><div class="usage-mix"><div><b>${chargeable.reduce((a, x) => a + x.hours, 0).toFixed(1)}</b><span>Chargeable hours</span></div><div><b>${foc.reduce((a, x) => a + x.hours, 0).toFixed(1)}</b><span>Free-of-charge hours</span></div><div><b>${internal.reduce((a, x) => a + x.hours, 0).toFixed(1)}</b><span>School/internal hours</span></div></div></div><div class="card"><div class="card-head"><b>Income & use by organisation</b></div><table><thead><tr><th>Organisation</th><th>Sessions</th><th>Hours</th><th>Net income</th></tr></thead><tbody>${users.map(u => `<tr><td><b>${e(u.name)}</b></td><td>${u.sessions}</td><td>${u.hours.toFixed(1)}</td><td><b>${money(u.income)}</b></td></tr>`).join('') || '<tr><td colspan=4 class=muted>No pool use in this period.</td></tr>'}</tbody></table></div></div><div class="note report-note">Recurring forecast is calculated from the weekly timetable within the selected dates and excludes recorded breaks and cancellations. Free-of-charge and school/internal sessions count towards usage hours but not hire income.</div>`;
  });
  const st = document.createElement('style');
  st.textContent = `.report-toolbar{display:flex;gap:10px;align-items:end;flex-wrap:wrap;margin-bottom:14px}.report-toolbar label{min-width:145px}.report-toolbar input,.report-toolbar select{margin-top:4px}.report-kpis .income-card span{display:block;color:#6b7b88;font-size:12px;margin-top:4px}.report-split{display:grid;grid-template-columns:minmax(280px,.8fr) minmax(440px,1.5fr);gap:14px;margin-top:14px}.usage-mix{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.usage-mix>div{background:#f5f8fa;border-radius:10px;padding:12px;text-align:center}.usage-mix b{display:block;font-size:22px}.usage-mix span{font-size:12px;color:#687985}.report-note{margin-top:14px}@media(max-width:900px){.report-split{grid-template-columns:1fr}.usage-mix{grid-template-columns:1fr}}`;
  document.head.appendChild(st);
})();


;
/* source: app-8.js */
(function () {
  const DAY = 86400000;
  let BILL_BATCHES = [], BILL_EVENTS = [];
  function billIso(d) {
    let y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  function billParse(v) {
    return new Date(v + 'T12:00:00');
  }
  function billHours(a, b) {
    let x = String(a || '00:00').split(':').map(Number), y = String(b || '00:00').split(':').map(Number);
    return Math.max(0, (y[0] * 60 + y[1] - x[0] * 60 - x[1]) / 60);
  }
  function billMoney(v) {
    return '£' + Number(v || 0).toLocaleString('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  function monthBounds(v) {
    let [y, m] = v.split('-').map(Number), from = new Date(y, m - 1, 1, 12), to = new Date(y, m, 0, 12);
    return {
      from: billIso(from),
      to: billIso(to),
      usage_month: billIso(from)
    };
  }
  function monthLabel(v) {
    let [y, m] = v.split('-').map(Number);
    return new Date(y, m - 1, 1, 12).toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric'
    });
  }
  function vatRate(hirerId) {
    return Number(H.find(h => h.id === hirerId)?.vat_rate || 20);
  }
  function billBreak(pid, date) {
    return BR.some(b => b.programme_id === pid && b.starts_on <= date && (b.ends_on || b.starts_on) >= date);
  }
  function billCancelled(pid, sid, date) {
    return EX.some(x => x.programme_id === pid && x.exception_date === date && x.session_id === sid);
  }
  function monthRows(hirerId, siteId, month) {
    let {from, to} = monthBounds(month), out = [];
    G.filter(p => p.active !== false && p.hirer_id === hirerId && p.site_id === siteId && p.starts_on <= to && p.ends_on >= from).forEach(p => {
      let start = p.starts_on > from ? p.starts_on : from, end = p.ends_on < to ? p.ends_on : to;
      RS.filter(s => s.programme_id === p.id && s.active !== false && (s.charge_type || 'chargeable') === 'chargeable').forEach(s => {
        let d = billParse(start), last = billParse(end);
        while (d <= last) {
          if (d.getDay() === Number(s.day_of_week)) {
            let date = billIso(d);
            if (!billBreak(p.id, date) && !billCancelled(p.id, s.id, date)) {
              let hrs = billHours(s.start_time, s.end_time), net = s.rate == null ? 0 : Number(s.rate) * hrs, vr = s.vat_applicable ? vatRate(hirerId) : 0;
              out.push({
                kind: 'Recurring',
                date,
                start: String(s.start_time || '').slice(0, 5),
                end: String(s.end_time || '').slice(0, 5),
                title: s.title || p.name || 'Recurring booking',
                hours: hrs,
                rate: s.rate,
                net,
                vat: net * vr / 100,
                total: net * (1 + vr / 100),
                vat_applicable: !!s.vat_applicable,
                source_id: s.id,
                programme_id: p.id
              });
            }
          }
          d = new Date(d.getTime() + DAY);
        }
      });
    });
    B.filter(x => x.hirer_id === hirerId && x.site_id === siteId && x.booking_date >= from && x.booking_date <= to && x.status !== 'cancelled' && (x.charge_type || 'chargeable') === 'chargeable').forEach(x => {
      let hrs = bookingHours(x), net = x.rate == null ? 0 : Number(x.rate) * hrs, vr = x.vat_applicable ? vatRate(hirerId) : 0;
      out.push({
        kind: 'Single',
        date: x.booking_date,
        start: String(x.start_time || '').slice(0, 5),
        end: String(x.end_time || '').slice(0, 5),
        title: x.title || 'Booking',
        hours: hrs,
        rate: x.rate,
        net,
        vat: net * vr / 100,
        total: net * (1 + vr / 100),
        vat_applicable: !!x.vat_applicable,
        source_id: x.id
      });
    });
    return out.sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
  }
  function totals(rows) {
    return rows.reduce((a, r) => ({
      net: a.net + r.net,
      vat: a.vat + r.vat,
      total: a.total + r.total,
      hours: a.hours + r.hours
    }), {
      net: 0,
      vat: 0,
      total: 0,
      hours: 0
    });
  }
  function statusLabel(s) {
    return ({
      draft: 'Draft',
      pool_manager_checked: 'Pool Manager checked',
      lettings_manager_approved: 'Lettings Manager approved',
      ready: 'Ready for invoice',
      invoiced: 'Invoiced',
      paid: 'Paid',
      adjustment_required: 'Adjustment required'
    })[s] || s || 'Draft';
  }
  function statusClass(s) {
    return s === 'adjustment_required' ? 'danger' : ['lettings_manager_approved', 'ready', 'invoiced', 'paid'].includes(s) ? 'good' : s === 'pool_manager_checked' ? 'warn' : '';
  }
  async function loadBillingData() {
    let [b, e2] = await Promise.all([sb.from('school_invoice_batches').select('*').order('usage_month', {
      ascending: false
    }), sb.from('school_invoice_batch_events').select('*').order('created_at', {
      ascending: false
    })]);
    BILL_BATCHES = b.data || [];
    BILL_EVENTS = e2.data || [];
  }
  function batchFor(siteId, hirerId, month) {
    let u = monthBounds(month).usage_month;
    return BILL_BATCHES.find(b => b.site_id === siteId && b.hirer_id === hirerId && b.usage_month === u);
  }
  async function logBill(batch, eventType, oldStatus, newStatus, oldNet, newNet, notes) {
    await sb.from('school_invoice_batch_events').insert({
      batch_id: batch.id,
      actor_user_id: P.id,
      event_type: eventType,
      old_status: oldStatus || null,
      new_status: newStatus || null,
      old_net_amount: oldNet ?? null,
      new_net_amount: newNet ?? null,
      notes: notes || null
    });
  }
  async function ensureBatch(siteId, hirerId, month) {
    let rows = monthRows(hirerId, siteId, month), t = totals(rows), existing = batchFor(siteId, hirerId, month);
    if (existing) {
      let changed = Math.abs(Number(existing.net_amount || 0) - t.net) > .005 || Math.abs(Number(existing.vat_amount || 0) - t.vat) > .005;
      let wasApproved = ['pool_manager_checked', 'lettings_manager_approved', 'ready', 'invoiced', 'paid'].includes(existing.status);
      let nextStatus = changed && wasApproved ? 'adjustment_required' : existing.status;
      let upd = {
        net_amount: t.net,
        vat_amount: t.vat,
        total_amount: t.total,
        updated_at: new Date().toISOString()
      };
      if (nextStatus !== existing.status) upd.status = nextStatus;
      let {data, error} = await sb.from('school_invoice_batches').update(upd).eq('id', existing.id).select().single();
      if (error) throw error;
      if (changed) await logBill(data, nextStatus === 'adjustment_required' ? 'adjustment_required' : 'recalculated', existing.status, nextStatus, Number(existing.net_amount || 0), t.net, nextStatus === 'adjustment_required' ? 'Calculated booking total changed after review/approval.' : 'Monthly statement recalculated.');
      return data;
    }
    let {data, error} = await sb.from('school_invoice_batches').insert({
      site_id: siteId,
      usage_month: monthBounds(month).usage_month,
      hirer_id: hirerId,
      net_amount: t.net,
      vat_amount: t.vat,
      total_amount: t.total,
      status: 'draft'
    }).select().single();
    if (error) throw error;
    await logBill(data, 'created', null, 'draft', null, t.net, 'Monthly pool hire statement created.');
    return data;
  }
  window.prepareMonthlyBilling = async () => {
    let month = $('billMonth')?.value, site = $('billSite')?.value;
    if (!month) return alert('Choose a month.');
    let pairs = [];
    H.forEach(h => S.filter(s => !site || s.id === site).forEach(s => {
      if (monthRows(h.id, s.id, month).length) pairs.push([s.id, h.id]);
    }));
    if (!pairs.length) return alert('There are no chargeable organisation bookings for this month.');
    try {
      for (let [sid, hid] of pairs) await ensureBatch(sid, hid, month);
      await loadBillingData();
      renderMonthlyBilling();
    } catch (err) {
      alert(err.message || String(err));
    }
  };
  window.billingAction = async (id, action) => {
    let b = BILL_BATCHES.find(x => x.id === id);
    if (!b) return;
    let old = b.status, upd = {
      updated_at: new Date().toISOString()
    }, etype = '', notes = '';
    if (action === 'pool') {
      upd.status = 'pool_manager_checked';
      upd.pool_manager_checked_by = P.id;
      upd.pool_manager_checked_at = new Date().toISOString();
      upd.approved_net_amount = b.net_amount;
      upd.approved_vat_amount = b.vat_amount;
      upd.approved_total_amount = b.total_amount;
      etype = 'pool_manager_checked';
    }
    if (action === 'lettings') {
      if (!['pool_manager_checked', 'adjustment_required'].includes(old)) return alert('The Pool Manager must check this statement first.');
      upd.status = 'lettings_manager_approved';
      upd.lettings_manager_approved_by = P.id;
      upd.lettings_manager_approved_at = new Date().toISOString();
      upd.approved_net_amount = b.net_amount;
      upd.approved_vat_amount = b.vat_amount;
      upd.approved_total_amount = b.total_amount;
      etype = 'lettings_manager_approved';
    }
    if (action === 'ready') {
      if (old !== 'lettings_manager_approved') return alert('The Lettings Manager must approve this statement first.');
      upd.status = 'ready';
      etype = 'marked_ready';
    }
    if (action === 'invoice') {
      let ref = prompt('Enter the invoice reference from the school accounts system:', '');
      if (ref === null) return;
      if (!ref.trim()) return alert('Enter an invoice reference.');
      upd.status = 'invoiced';
      upd.invoice_reference = ref.trim();
      upd.invoiced_at = new Date().toISOString();
      etype = 'marked_invoiced';
      notes = 'Invoice reference: ' + ref.trim();
    }
    if (action === 'reopen') {
      let reason = prompt('Reason for reopening/adjusting this statement:', '');
      if (reason === null) return;
      if (!reason.trim()) return alert('Enter the reason for the adjustment.');
      upd.status = 'adjustment_required';
      upd.last_adjustment_reason = reason.trim();
      upd.last_adjusted_by = P.id;
      upd.last_adjusted_at = new Date().toISOString();
      etype = 'reopened';
      notes = reason.trim();
    }
    let {data, error} = await sb.from('school_invoice_batches').update(upd).eq('id', id).select().single();
    if (error) return alert(error.message);
    await logBill(data, etype, old, upd.status, Number(b.net_amount || 0), Number(data.net_amount || 0), notes);
    await loadBillingData();
    renderMonthlyBilling();
  };
  window.viewBillingStatement = id => {
    let b = BILL_BATCHES.find(x => x.id === id);
    if (!b) return;
    let month = String(b.usage_month).slice(0, 7), rows = monthRows(b.hirer_id, b.site_id, month), t = totals(rows), ev = BILL_EVENTS.filter(x => x.batch_id === id);
    let body = `<div class=bill-statement-head><div><b>${e(hn(b.hirer_id))}</b><div class=muted>${e(sn(b.site_id))} · ${e(monthLabel(month))}</div></div><span class="bill-status ${statusClass(b.status)}">${e(statusLabel(b.status))}</span></div><table><thead><tr><th>Date</th><th>Session</th><th>Hours</th><th>Rate</th><th>Net</th><th>VAT</th><th>Total</th></tr></thead><tbody>${rows.map(r => `<tr><td>${e(shortUk(r.date))}</td><td><b>${e(r.title)}</b><div class=muted>${e(r.start + '–' + r.end)} · ${e(r.kind)}</div></td><td>${r.hours.toFixed(2)}</td><td>${r.rate == null ? '—' : billMoney(r.rate) + '/hr'}</td><td>${billMoney(r.net)}</td><td>${billMoney(r.vat)}</td><td><b>${billMoney(r.total)}</b></td></tr>`).join('') || '<tr><td colspan=7 class=muted>No chargeable sessions.</td></tr>'}</tbody><tfoot><tr><th colspan=4>Calculated total</th><th>${billMoney(t.net)}</th><th>${billMoney(t.vat)}</th><th>${billMoney(t.total)}</th></tr></tfoot></table><h3 style="margin-top:18px">Review & adjustment history</h3>${ev.map(x => `<div class=bill-event><b>${e(statusLabel(x.new_status) || x.event_type)}</b><span>${new Date(x.created_at).toLocaleString('en-GB')}</span><div>${e(x.notes || '')}</div>${x.old_net_amount != null && x.new_net_amount != null && Number(x.old_net_amount) !== Number(x.new_net_amount) ? `<div class=muted>${billMoney(x.old_net_amount)} → ${billMoney(x.new_net_amount)}</div>` : ''}</div>`).join('') || '<div class=muted>No review events recorded yet.</div>'}`;
    modal('Monthly pool hire statement', body, () => {});
    $('ms').style.display = 'none';
  };
  function billingControls() {
    let host = $('incomeSummary');
    if (!host) return null;
    let wrap = $('monthlyBilling');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'monthlyBilling';
      wrap.className = 'monthly-billing';
      host.parentElement.appendChild(wrap);
    }
    let now = new Date(), def = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (!wrap.dataset.ready) {
      wrap.innerHTML = `<div class="term-top compact" style="margin-top:22px"><div><h2>Monthly Billing</h2><p class=muted>Review each organisation's monthly pool hire, approve it and hand the confirmed total to the school finance team.</p></div></div><div class="bill-toolbar card"><label>Month<input id=billMonth type=month value="${def}"></label><label>Site<select id=billSite></select></label><button class=p onclick="prepareMonthlyBilling()">Prepare / recalculate statements</button></div><div id=billList></div>`;
      wrap.dataset.ready = '1';
      $('billMonth').onchange = renderMonthlyBilling;
      $('billSite').onchange = renderMonthlyBilling;
    }
    let site = $('billSite'), v = site.value;
    site.innerHTML = '<option value="">All sites</option>' + S.map(s => `<option value="${s.id}">${e(s.name)}</option>`).join('');
    if ([...site.options].some(o => o.value === v)) site.value = v;
    return wrap;
  }
  (OpsLifecycle.reset("renderMonthlyBilling"), window.renderMonthlyBilling = function () {
    let wrap = billingControls();
    if (!wrap) return;
    let month = $('billMonth').value, site = $('billSite').value, usage = monthBounds(month).usage_month;
    let batches = BILL_BATCHES.filter(b => b.usage_month === usage && (!site || b.site_id === site)).sort((a, b) => (hn(a.hirer_id) + sn(a.site_id)).localeCompare(hn(b.hirer_id) + sn(b.site_id)));
    $('billList').innerHTML = batches.map(b => {
      let actions = [];
      if (['draft', 'adjustment_required'].includes(b.status)) actions.push(`<button class=s onclick="billingAction('${b.id}','pool')">Pool Manager check</button>`);
      if (b.status === 'pool_manager_checked') actions.push(`<button class=s onclick="billingAction('${b.id}','lettings')">Lettings Manager approve</button>`);
      if (b.status === 'lettings_manager_approved') actions.push(`<button class=s onclick="billingAction('${b.id}','ready')">Ready for invoice</button>`);
      if (b.status === 'ready') actions.push(`<button class=s onclick="billingAction('${b.id}','invoice')">Mark invoiced</button>`);
      if (['pool_manager_checked', 'lettings_manager_approved', 'ready', 'invoiced'].includes(b.status)) actions.push(`<button class=link onclick="billingAction('${b.id}','reopen')">Reopen / adjustment</button>`);
      return `<div class=bill-row><div><b>${e(hn(b.hirer_id))}</b><div class=muted>${e(sn(b.site_id))}</div></div><div><span class="bill-status ${statusClass(b.status)}">${e(statusLabel(b.status))}</span>${b.last_adjustment_reason ? `<div class="muted bill-adjust">${e(b.last_adjustment_reason)}</div>` : ''}</div><div class=bill-values><span>Net <b>${billMoney(b.net_amount)}</b></span><span>VAT <b>${billMoney(b.vat_amount)}</b></span><span>Total <b>${billMoney(b.total_amount)}</b></span></div><div class=bill-actions><button class=s onclick="viewBillingStatement('${b.id}')">View statement</button>${actions.join('')}</div></div>`;
    }).join('') || '<div class="card muted">No monthly statements have been prepared for this month yet. Click <b>Prepare / recalculate statements</b>.</div>';
  });
  const baseIncome = renderIncomeSummary;
  OpsLifecycle.use("renderIncomeSummary", function (next) {
    next();
    (async () => {
      await loadBillingData();
      renderMonthlyBilling();
    })();
  });
  const st = document.createElement('style');
  st.textContent = `.monthly-billing{margin-top:18px}.bill-toolbar{display:flex;gap:10px;align-items:end;flex-wrap:wrap;margin-bottom:12px}.bill-toolbar label{min-width:180px}.bill-row{display:grid;grid-template-columns:minmax(180px,1.2fr) minmax(170px,.8fr) minmax(280px,1.1fr) minmax(280px,1.4fr);gap:14px;align-items:center;background:#fff;border:1px solid #dfe6eb;border-radius:12px;padding:13px 15px;margin:8px 0}.bill-status{display:inline-block;padding:5px 9px;border-radius:999px;background:#eef2f5;font-size:12px;font-weight:800}.bill-status.good{background:#e9f7ee;color:#21643a}.bill-status.warn{background:#fff6dd;color:#775b07}.bill-status.danger{background:#fff0f0;color:#9b2d2d}.bill-values{display:flex;gap:14px;flex-wrap:wrap}.bill-values span{font-size:12px;color:#657581}.bill-values b{display:block;color:#1f2d36;font-size:15px}.bill-actions{display:flex;gap:7px;align-items:center;justify-content:flex-end;flex-wrap:wrap}.bill-adjust{margin-top:4px}.bill-statement-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:12px}.bill-event{border-left:3px solid #d9e3e9;padding:7px 10px;margin:7px 0;background:#f8fafb;border-radius:0 8px 8px 0}.bill-event>span{margin-left:10px;font-size:12px;color:#778792}@media(max-width:1000px){.bill-row{grid-template-columns:1fr 1fr}.bill-actions{justify-content:flex-start}}@media(max-width:650px){.bill-row{grid-template-columns:1fr}}`;
  document.head.appendChild(st);
})();


;
/* source: app-9.js */
(function () {
  const baseViewBillingStatement = window.viewBillingStatement;
  if (baseViewBillingStatement) {
    window.viewBillingStatement = function (id) {
      baseViewBillingStatement(id);
      const modalEl = document.getElementById('modal');
      if (modalEl) modalEl.classList.add('billing-statement-modal');
    };
  }
  const baseCloseM = window.closeM;
  if (baseCloseM) {
    window.closeM = function () {
      const modalEl = document.getElementById('modal');
      if (modalEl) modalEl.classList.remove('billing-statement-modal');
      return baseCloseM();
    };
  }
})();


;
/* source: app-10.js */
(function () {
  const DAY = 86400000;
  const role = () => String(P?.role || '').toLowerCase();
  const isOwner = () => role() === 'owner_admin';
  const canPoolCheck = () => isOwner() || role() === 'pool_manager';
  const canLettingsApprove = () => isOwner() || role() === 'lettings_manager';
  const canMarkReady = () => isOwner() || role() === 'lettings_manager';
  const canInvoice = () => isOwner() || role() === 'finance';
  const canViewFinance = () => isOwner() || ['pool_manager', 'lettings_manager', 'finance', 'bursar'].includes(role());
  const canEditBookings = () => isOwner() || ['pool_manager', 'lettings_manager', 'booking_admin'].includes(role());
  function applyRoleUi() {
    document.querySelectorAll('[data-btab="income"]').forEach(x => x.style.display = canViewFinance() ? '' : 'none');
    document.querySelectorAll('#bookings .p').forEach(btn => {
      const t = (btn.textContent || '').toLowerCase();
      if ((t.includes('add single') || t.includes('add booking') || t.includes('add school') || t.includes('add recurring')) && !canEditBookings()) btn.style.display = 'none';
    });
    applyBillingButtons();
  }
  function applyBillingButtons() {
    const root = document.getElementById('monthlyBilling');
    if (!root) return;
    root.querySelectorAll('button').forEach(btn => {
      const oc = btn.getAttribute('onclick') || '';
      if (oc.includes("'pool'")) btn.style.display = canPoolCheck() ? '' : 'none'; else if (oc.includes("'lettings'")) btn.style.display = canLettingsApprove() ? '' : 'none'; else if (oc.includes("'ready'")) btn.style.display = canMarkReady() ? '' : 'none'; else if (oc.includes("'invoice'")) btn.style.display = canInvoice() ? '' : 'none'; else if (oc.includes("'reopen'")) btn.style.display = isOwner() || canPoolCheck() || canLettingsApprove() ? '' : 'none';
    });
  }
  const originalBillingAction = window.billingAction;
  if (originalBillingAction) {
    window.billingAction = async function (id, action) {
      const ok = ({
        pool: canPoolCheck(),
        lettings: canLettingsApprove(),
        ready: canMarkReady(),
        invoice: canInvoice(),
        reopen: isOwner() || canPoolCheck() || canLettingsApprove()
      })[action];
      if (!ok) return alert('Your account does not have permission to perform this billing action.');
      return originalBillingAction(id, action);
    };
  }
  const observer = new MutationObserver(() => applyBillingButtons());
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  function iso(d) {
    return d.toISOString().slice(0, 10);
  }
  function localDate(v) {
    return new Date(v + 'T12:00:00');
  }
  function addDays(d, n) {
    return new Date(d.getTime() + n * DAY);
  }
  function startOfWeek(d) {
    let x = new Date(d), shift = (x.getDay() + 6) % 7;
    return addDays(x, -shift);
  }
  function endOfWeek(d) {
    return addDays(startOfWeek(d), 6);
  }
  function startOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth(), 1, 12);
  }
  function endOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0, 12);
  }
  function inBreak(pid, date) {
    return BR.some(b => b.programme_id === pid && b.starts_on <= date && (b.ends_on || b.starts_on) >= date);
  }
  function cancelled(pid, sid, date) {
    return EX.some(x => x.programme_id === pid && x.exception_date === date && x.session_id === sid);
  }
  function eventOrg(hirerId) {
    return calendarOrgName(hirerId);
  }
  function calendarEvents(from, to) {
    let out = [];
    B.filter(x => x.status !== 'cancelled' && x.booking_date >= from && x.booking_date <= to).forEach(x => out.push({
      date: x.booking_date,
      start: String(x.start_time || '').slice(0, 5),
      end: String(x.end_time || '').slice(0, 5),
      title: x.title || 'Booking',
      org: eventOrg(x.hirer_id),
      site: sn(x.site_id),
      site_id: x.site_id,
      hirer_id: x.hirer_id,
      type: x.booking_type === 'school_internal' ? 'school' : 'single',
      kind: x.booking_type === 'school_internal' ? 'School event' : 'Single booking'
    }));
    G.filter(p => p.active !== false && p.starts_on <= to && p.ends_on >= from).forEach(p => {
      let s = p.starts_on > from ? p.starts_on : from, e = p.ends_on < to ? p.ends_on : to, d = localDate(s), last = localDate(e);
      RS.filter(r => r.programme_id === p.id && r.active !== false).forEach(r => {
        for (let x = new Date(d); x <= last; x = addDays(x, 1)) {
          if (x.getDay() !== Number(r.day_of_week)) continue;
          let date = iso(x);
          if (inBreak(p.id, date) || cancelled(p.id, r.id, date)) continue;
          out.push({
            date,
            start: String(r.start_time || '').slice(0, 5),
            end: String(r.end_time || '').slice(0, 5),
            title: r.title || p.name || 'Recurring booking',
            org: eventOrg(p.hirer_id),
            site: sn(p.site_id),
            site_id: p.site_id,
            hirer_id: p.hirer_id,
            type: p.hirer_id ? 'recurring' : 'school',
            kind: 'Recurring'
          });
        }
      });
    });
    return out.sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
  }
  function filteredEvents(from, to) {
    let ev = calendarEvents(from, to), site = $('calSite')?.value || '', org = $('calOrg')?.value || '', kind = $('calKind')?.value || '';
    return ev.filter(x => (!site || x.site_id === site) && (!org || (org === 'internal' ? !x.hirer_id : x.hirer_id === org)) && (!kind || x.type === kind));
  }
  function calEventHtml(x, compact = false) {
    return `<div class="cal-event ${x.type}"><div class=cal-time>${e(x.start)}–${e(x.end)}</div><div class=cal-org>${e(x.org)}</div><div>${e(x.title)}</div>${compact ? '' : `<div class=cal-meta>${e(x.site)} · ${e(x.kind)}</div>`}</div>`;
  }
  function setupCalendarFilters() {
    let site = $('calSite'), org = $('calOrg');
    if (site) {
      let v = site.value;
      site.innerHTML = '<option value="">All sites</option>' + S.map(s => `<option value="${s.id}">${e(s.name)}</option>`).join('');
      site.value = v;
    }
    if (org) {
      let v = org.value, orgRows = role() === 'operational_viewer' ? OV_ORGS : H;
      org.innerHTML = '<option value="">All organisations</option><option value="internal">School/Internal</option>' + orgRows.map(h => `<option value="${h.id}">${e(h.name)}</option>`).join('');
      org.value = v;
    }
    let term = $('calTerm');
    if (term) {
      let v = term.value;
      let periods = D.filter(x => x.starts_on && x.ends_on).sort((a, b) => a.starts_on.localeCompare(b.starts_on));
      term.innerHTML = periods.map(x => `<option value="${x.id}">${e(x.name || x.period_type || 'School period')} — ${e(shortUk(x.starts_on))} to ${e(shortUk(x.ends_on))}</option>`).join('');
      if (v && periods.some(x => x.id === v)) term.value = v; else {
        let today = iso(new Date());
        let cur = periods.find(x => x.starts_on <= today && x.ends_on >= today) || periods[0];
        if (cur) term.value = cur.id;
      }
    }
  }
  let CAL_MODE = 'week', CAL_ANCHOR = new Date();
  window.setCalendarMode = function (m) {
    CAL_MODE = m;
    document.querySelectorAll('.cal-mode').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
    $('calAnchorWrap').style.display = m === 'term' ? 'none' : '';
    $('calTermWrap').style.display = m === 'term' ? '' : 'none';
    renderBookingCalendar();
  };
  window.moveCalendar = function (dir) {
    if (CAL_MODE === 'week') CAL_ANCHOR = addDays(CAL_ANCHOR, 7 * dir); else if (CAL_MODE === 'month') CAL_ANCHOR = new Date(CAL_ANCHOR.getFullYear(), CAL_ANCHOR.getMonth() + dir, 1, 12);
    renderBookingCalendar();
  };
  window.calendarToday = function () {
    CAL_ANCHOR = new Date();
    renderBookingCalendar();
  };
  window.calendarAnchorChanged = function () {
    let v = $('calAnchor').value;
    if (v) CAL_ANCHOR = localDate(v);
    renderBookingCalendar();
  };
  window.printBookingCalendar = function () {
    window.print();
  };
  function renderWeek() {
    let a = startOfWeek(CAL_ANCHOR), z = endOfWeek(CAL_ANCHOR), from = iso(a), to = iso(z), ev = filteredEvents(from, to), days = [];
    for (let i = 0; i < 7; i++) days.push(addDays(a, i));
    $('calendarRange').textContent = `Week: ${a.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long'
    })} – ${z.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })}`;
    $('calendarBody').innerHTML = `<div class=cal-week>${days.map(d => {
      let ds = iso(d), dayEv = ev.filter(x => x.date === ds), today = ds === iso(new Date());
      return `<div class="cal-day ${today ? 'today' : ''}"><div class=cal-day-head><b>${d.toLocaleDateString('en-GB', {
        weekday: 'short'
      })}</b><span>${d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short'
      })}</span></div>${dayEv.map(x => calEventHtml(x)).join('') || '<div class=muted>No bookings</div>'}</div>`;
    }).join('')}</div>`;
  }
  function renderMonth() {
    let first = startOfMonth(CAL_ANCHOR), last = endOfMonth(CAL_ANCHOR), gridStart = startOfWeek(first), gridEnd = endOfWeek(last), ev = filteredEvents(iso(gridStart), iso(gridEnd)), days = [];
    for (let d = new Date(gridStart); d <= gridEnd; d = addDays(d, 1)) days.push(new Date(d));
    $('calendarRange').textContent = first.toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric'
    });
    let heads = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(x => `<div class=cal-month-head>${x}</div>`).join('');
    $('calendarBody').innerHTML = `<div class=cal-month>${heads}${days.map(d => {
      let ds = iso(d), dayEv = ev.filter(x => x.date === ds), out = d.getMonth() !== first.getMonth();
      return `<div class="cal-cell ${out ? 'out' : ''}"><div class=num>${d.getDate()}</div>${dayEv.map(x => calEventHtml(x, true)).join('')}</div>`;
    }).join('')}</div>`;
  }
  function renderTerm() {
    let p = D.find(x => x.id === $('calTerm').value);
    if (!p) {
      $('calendarRange').textContent = 'No term selected';
      $('calendarBody').innerHTML = '<div class=calendar-empty>No school term/period is available.</div>';
      return;
    }
    let ev = filteredEvents(p.starts_on, p.ends_on);
    $('calendarRange').textContent = `${p.name || p.period_type || 'School period'}: ${shortUk(p.starts_on)} – ${shortUk(p.ends_on)}`;
    let dates = [...new Set(ev.map(x => x.date))];
    $('calendarBody').innerHTML = dates.length ? `<div class=cal-term-list>${dates.map(ds => {
      let d = localDate(ds);
      return `<div class=cal-term-day><div class=cal-term-date>${d.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })}</div><div class=cal-term-events>${ev.filter(x => x.date === ds).map(x => calEventHtml(x)).join('')}</div></div>`;
    }).join('')}</div>` : '<div class=calendar-empty>No bookings in this period.</div>';
  }
  (OpsLifecycle.reset("renderBookingCalendar"), window.renderBookingCalendar = function () {
    if (!$('calendarBody')) return;
    setupCalendarFilters();
    $('calAnchor').value = iso(CAL_ANCHOR);
    if (CAL_MODE === 'week') renderWeek(); else if (CAL_MODE === 'month') renderMonth(); else renderTerm();
    applyRoleUi();
  });
  const oldSetBookingTab = window.setBookingTab;
  OpsLifecycle.use("setBookingTab", function (next, name) {
    if (name !== 'calendar') return next(name);
    document.querySelectorAll('.booking-panel').forEach(x => x.classList.remove('on'));
    document.querySelectorAll('.booking-tab').forEach(x => x.classList.remove('active'));
    $('bookingTabCalendar')?.classList.add('on');
    document.querySelector('.booking-tab[data-btab="calendar"]')?.classList.add('active');
    renderBookingCalendar();
  });
  const oldRender = window.render;
  OpsLifecycle.use("render", function (next) {
    next();
    applyRoleUi();
    if (document.querySelector('#bookingTabCalendar.on')) renderBookingCalendar();
  });
  document.addEventListener('DOMContentLoaded', applyRoleUi);
})();


;
/* source: app-11.js */
(function () {
  const DAY = 86400000, OPEN_MIN = 6 * 60, CLOSE_MIN = 22 * 60;
  let AVAIL_MODE = false;
  function toMin(t) {
    let [h, m] = String(t || '00:00').slice(0, 5).split(':').map(Number);
    return h * 60 + m;
  }
  function fromMin(n) {
    let h = Math.floor(n / 60), m = n % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  function isoLocal(d) {
    let y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  function localDate(v) {
    return new Date(v + 'T12:00:00');
  }
  function addDays(d, n) {
    return new Date(d.getTime() + n * DAY);
  }
  function weekStart(d) {
    let x = new Date(d), shift = (x.getDay() + 6) % 7;
    return addDays(x, -shift);
  }
  function inBreak(pid, date) {
    return BR.some(b => b.programme_id === pid && b.starts_on <= date && (b.ends_on || b.starts_on) >= date);
  }
  function cancelled(pid, sid, date) {
    return EX.some(x => x.programme_id === pid && x.exception_date === date && x.session_id === sid);
  }
  function siteEvents(siteId, date) {
    let blocking = [], partial = [];
    B.filter(x => x.site_id === siteId && x.booking_date === date && x.status !== 'cancelled').forEach(x => blocking.push({
      start: toMin(x.start_time),
      end: toMin(x.end_time),
      label: x.title || 'Booking',
      org: hn(x.hirer_id) || 'School/Internal'
    }));
    G.filter(p => p.active !== false && p.site_id === siteId && p.starts_on <= date && p.ends_on >= date && !inBreak(p.id, date)).forEach(p => {
      let dow = localDate(date).getDay();
      RS.filter(r => r.programme_id === p.id && r.active !== false && Number(r.day_of_week) === dow && !cancelled(p.id, r.id, date)).forEach(r => {
        let item = {
          start: toMin(r.start_time),
          end: toMin(r.end_time),
          label: r.title || p.name || 'Recurring booking',
          org: hn(p.hirer_id) || 'School/Internal',
          lanes: Number(r.lane_count || 0)
        };
        if (r.pool_use_type === 'lanes') partial.push(item); else blocking.push(item);
      });
    });
    return {
      blocking,
      partial
    };
  }
  function mergeIntervals(items) {
    let a = items.map(x => [Math.max(OPEN_MIN, x.start), Math.min(CLOSE_MIN, x.end)]).filter(x => x[1] > x[0]).sort((x, y) => x[0] - y[0]), out = [];
    for (let cur of a) {
      let last = out[out.length - 1];
      if (last && cur[0] <= last[1]) last[1] = Math.max(last[1], cur[1]); else out.push(cur.slice());
    }
    return out;
  }
  function gaps(blocking) {
    let busy = mergeIntervals(blocking), g = [], cursor = OPEN_MIN;
    busy.forEach(([s, e]) => {
      if (s > cursor) g.push([cursor, s]);
      cursor = Math.max(cursor, e);
    });
    if (cursor < CLOSE_MIN) g.push([cursor, CLOSE_MIN]);
    return g;
  }
  function hrs(slots) {
    return slots.reduce((a, [s, e]) => a + (e - s) / 60, 0);
  }
  function slotHtml(s) {
    return `<div class=availability-slot><b>${fromMin(s[0])}–${fromMin(s[1])}</b><span>${((s[1] - s[0]) / 60).toFixed((s[1] - s[0]) % 60 ? 1 : 0)} available hr${s[1] - s[0] === 60 ? '' : 's'}</span></div>`;
  }
  function partialHtml(x) {
    return `<div class=availability-partial>${e(fromMin(x.start))}–${e(fromMin(x.end))} · ${e(x.org)} · ${e(x.label)}${x.lanes ? ` · ${x.lanes} lane${x.lanes === 1 ? '' : 's'} in use` : ''}</div>`;
  }
  function selectedSites() {
    let v = $('calSite')?.value || '';
    return v ? S.filter(s => s.id === v) : S.filter(s => s.active !== false);
  }
  function renderAvailability() {
    let anchor = $('calAnchor')?.value ? localDate($('calAnchor').value) : new Date(), start = weekStart(anchor), days = Array.from({
      length: 7
    }, (_, i) => addDays(start, i)), sites = selectedSites();
    let total = 0, largest = 0, slotCount = 0;
    let siteHtml = sites.map(site => {
      let dhtml = days.map(d => {
        let date = isoLocal(d), ev = siteEvents(site.id, date), gs = gaps(ev.blocking), dh = hrs(gs);
        total += dh;
        slotCount += gs.length;
        gs.forEach(x => largest = Math.max(largest, (x[1] - x[0]) / 60));
        return `<div class=availability-day><div class=availability-day-head>${d.toLocaleDateString('en-GB', {
          weekday: 'short',
          day: 'numeric',
          month: 'short'
        })}<div class=availability-hours>${dh.toFixed(1)} hrs open</div></div>${gs.length ? gs.map(slotHtml).join('') : '<div class=availability-none>No fully open time</div>'}${ev.partial.length ? `<div class=availability-partial><b>Partial pool use</b></div>${ev.partial.map(partialHtml).join('')}` : ''}</div>`;
      }).join('');
      return `<div class=availability-site><div class=availability-site-head><h3>${e(site.name)}</h3><span>Pool opening hours 06:00–22:00</span></div><div class=availability-days>${dhtml}</div></div>`;
    }).join('');
    $('calendarRange').textContent = `Availability: ${days[0].toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long'
    })} – ${days[6].toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })}`;
    $('calendarBody').innerHTML = `<div class=availability-summary><div class=availability-kpi><span>Fully open hours</span><b>${total.toFixed(1)}</b></div><div class=availability-kpi><span>Available time slots</span><b>${slotCount}</b></div><div class=availability-kpi><span>Largest open window</span><b>${largest.toFixed(1)} hrs</b></div></div><div class=availability-note><b>Commercial availability:</b> green slots are fully open and could potentially be offered for hire. Amber entries show recurring sessions using only part of the pool; these may still offer lane capacity. Exact lane availability will be added once each site's total lane count is recorded.</div>${siteHtml || '<div class=calendar-empty>No active sites available.</div>'}`;
  }
  const oldSetMode = window.setCalendarMode, oldRender = window.renderBookingCalendar;
  window.setCalendarMode = function (m) {
    AVAIL_MODE = false;
    document.querySelectorAll('.cal-mode').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
    return oldSetMode(m);
  };
  window.setAvailabilityMode = function () {
    AVAIL_MODE = true;
    if (oldSetMode) oldSetMode('week');
    AVAIL_MODE = true;
    document.querySelectorAll('.cal-mode').forEach(b => b.classList.toggle('active', b.dataset.mode === 'availability'));
    $('calAnchorWrap').style.display = '';
    $('calTermWrap').style.display = 'none';
    renderAvailability();
  };
  OpsLifecycle.use("renderBookingCalendar", function (next) {
    if (AVAIL_MODE) return renderAvailability();
    return next();
  });
  const oldMove = window.moveCalendar;
  window.moveCalendar = function (dir) {
    if (!AVAIL_MODE) return oldMove(dir);
    AVAIL_MODE = false;
    oldMove(dir);
    AVAIL_MODE = true;
    renderAvailability();
  };
  const oldToday = window.calendarToday;
  window.calendarToday = function () {
    if (!AVAIL_MODE) return oldToday();
    AVAIL_MODE = false;
    oldToday();
    AVAIL_MODE = true;
    renderAvailability();
  };
  const oldAnchor = window.calendarAnchorChanged;
  window.calendarAnchorChanged = function () {
    if (!AVAIL_MODE) return oldAnchor();
    renderAvailability();
  };
  function inject() {
    let nav = document.querySelector('#bookingTabCalendar .calendar-nav:nth-of-type(2)');
    if (nav && !nav.querySelector('[data-mode="availability"]')) {
      let b = document.createElement('button');
      b.className = 'booking-tab cal-mode';
      b.dataset.mode = 'availability';
      b.textContent = 'Availability';
      b.onclick = window.setAvailabilityMode;
      nav.appendChild(b);
    }
  }
  inject();
})();

