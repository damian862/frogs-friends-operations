/* Operational dashboard reporting built from the same booking/staffing source data. */
(function () {
  const DAY = 86400000;
  let refreshTimer = null;
  let requestToken = 0;

  const esc = v => typeof e === 'function' ? e(v) : String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const money = v => '£' + Number(v || 0).toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  const hoursBetween = (a, b) => {
    const x = String(a || '00:00').split(':').map(Number), y = String(b || '00:00').split(':').map(Number);
    return Math.max(0, (y[0] * 60 + y[1] - x[0] * 60 - x[1]) / 60);
  };
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const monthBounds = value => {
    const [y, m] = String(value).split('-').map(Number);
    return {from: `${y}-${String(m).padStart(2, '0')}-01`, to: iso(new Date(y, m, 0, 12))};
  };
  const profile = () => typeof P !== 'undefined' ? P : null;
  const viewer = () => String(profile()?.role || '').toLowerCase() === 'operational_viewer';

  function recurringOccurrences(from, to, siteId) {
    const out = [];
    (G || []).filter(p => p.active !== false && (!siteId || p.site_id === siteId) && p.starts_on <= to && p.ends_on >= from).forEach(p => {
      const start = new Date((p.starts_on > from ? p.starts_on : from) + 'T12:00:00');
      const end = new Date((p.ends_on < to ? p.ends_on : to) + 'T12:00:00');
      const sessions = (RS || []).filter(s => s.programme_id === p.id && s.active !== false);
      const breaks = (BR || []).filter(b => b.programme_id === p.id);
      const exceptions = (EX || []).filter(x => x.programme_id === p.id && x.exception_type === 'cancelled');
      for (let d = new Date(start); d <= end; d = new Date(d.getTime() + DAY)) {
        const date = iso(d);
        if (breaks.some(b => b.starts_on <= date && b.ends_on >= date)) continue;
        sessions.filter(s => Number(s.day_of_week) === d.getDay()).forEach(s => {
          if (exceptions.some(x => x.session_id === s.id && x.exception_date === date)) return;
          const hours = hoursBetween(s.start_time, s.end_time);
          out.push({date, site_id: p.site_id, hirer_id: p.hirer_id, hours, charge_type: s.charge_type || 'chargeable', rate: s.rate, vat_applicable: !!s.vat_applicable, source: 'recurring'});
        });
      }
    });
    return out;
  }

  function oneOffOccurrences(from, to, siteId) {
    return (B || []).filter(b => b.status !== 'cancelled' && b.booking_date >= from && b.booking_date <= to && (!siteId || b.site_id === siteId) && !b.recurring_programme_id).map(b => ({
      date: b.booking_date, site_id: b.site_id, hirer_id: b.hirer_id, hours: hoursBetween(b.start_time, b.end_time), charge_type: b.charge_type || 'chargeable', rate: b.rate, vat_applicable: !!b.vat_applicable, source: 'single'
    }));
  }

  function sourceRows(from, to, siteId) {
    return [...recurringOccurrences(from, to, siteId), ...oneOffOccurrences(from, to, siteId)];
  }

  function ensurePanel() {
    const dash = document.getElementById('dash');
    if (!dash || viewer()) return null;
    let panel = document.getElementById('opsDashboardReporting');
    if (panel) return panel;
    panel = document.createElement('div');
    panel.id = 'opsDashboardReporting';
    panel.innerHTML = `
      <div class="dash-report-head">
        <div><h2>Operational overview</h2><p>Pool usage, school hire income, Frogs & Friends staffing and invoice progress.</p></div>
        <div class="dash-report-filters"><label>Month<input id="dashReportMonth" type="month"></label><label>Site<select id="dashReportSite"></select></label></div>
      </div>
      <div id="dashReportKpis" class="dash-report-kpis"></div>
      <div class="dash-report-two">
        <div class="card"><div class="dash-card-title">Hire income by organisation</div><div id="dashOrgBreakdown"></div></div>
        <div class="card"><div class="dash-card-title">Invoice position</div><div id="dashInvoicePosition"></div></div>
      </div>
      <div class="card dash-upcoming"><div class="dash-card-title">Next 30 days</div><div id="dashUpcoming"></div></div>`;
    const note = dash.querySelector('.note');
    if (note) note.insertAdjacentElement('afterend', panel); else dash.appendChild(panel);
    const now = new Date();
    document.getElementById('dashReportMonth').value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    document.getElementById('dashReportMonth').addEventListener('change', refreshDashboardReporting);
    document.getElementById('dashReportSite').addEventListener('change', refreshDashboardReporting);
    return panel;
  }

  function fillSiteFilter() {
    const select = document.getElementById('dashReportSite');
    if (!select) return '';
    const current = select.value;
    select.innerHTML = '<option value="">All sites</option>' + (S || []).map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
    if ([...select.options].some(o => o.value === current)) select.value = current;
    return select.value;
  }

  function orgName(id) {
    if (!id) return 'School/Internal';
    return (H || []).find(x => x.id === id)?.name || (typeof OV_ORGS !== 'undefined' ? OV_ORGS.find(x => x.id === id)?.name : '') || 'Organisation';
  }

  async function refreshDashboardReporting() {
    if (viewer()) {
      document.getElementById('opsDashboardReporting')?.remove();
      return;
    }
    const panel = ensurePanel();
    if (!panel || typeof sb === 'undefined' || !Array.isArray(G) || !Array.isArray(B)) return;
    const token = ++requestToken;
    const month = document.getElementById('dashReportMonth')?.value;
    if (!month) return;
    const siteId = fillSiteFilter();
    const {from, to} = monthBounds(month);
    const rows = sourceRows(from, to, siteId);
    const chargeable = rows.filter(r => r.charge_type === 'chargeable');
    const bookedHours = rows.reduce((a, r) => a + r.hours, 0);
    const chargeHours = chargeable.reduce((a, r) => a + r.hours, 0);
    const poolNet = chargeable.reduce((a, r) => a + (r.rate == null ? 0 : Number(r.rate) * r.hours), 0);

    document.getElementById('dashReportKpis').innerHTML = `
      <div class="dash-kpi"><span>Booked pool hours</span><b>${bookedHours.toFixed(1)}</b><small>${month}</small></div>
      <div class="dash-kpi"><span>Chargeable hours</span><b>${chargeHours.toFixed(1)}</b><small>Excludes school/internal & FOC</small></div>
      <div class="dash-kpi"><span>School pool-hire income</span><b>${money(poolNet)}</b><small>Net forecast for selected month</small></div>
      <div class="dash-kpi"><span>F&F staffing income</span><b id="dashStaffIncome">…</b><small>Confirmed staffing services</small></div>`;

    const byOrg = new Map();
    chargeable.forEach(r => {
      const key = r.hirer_id || 'internal';
      const v = byOrg.get(key) || {hours: 0, net: 0};
      v.hours += r.hours;
      v.net += r.rate == null ? 0 : Number(r.rate) * r.hours;
      byOrg.set(key, v);
    });
    const orgRows = [...byOrg.entries()].sort((a, b) => b[1].net - a[1].net);
    document.getElementById('dashOrgBreakdown').innerHTML = orgRows.length ? `<table class="dash-mini-table"><thead><tr><th>Organisation</th><th>Hours</th><th>Net</th></tr></thead><tbody>${orgRows.map(([id, v]) => `<tr><td>${esc(orgName(id === 'internal' ? null : id))}</td><td>${v.hours.toFixed(1)}</td><td><b>${money(v.net)}</b></td></tr>`).join('')}</tbody></table>` : '<div class="muted">No chargeable pool-hire activity in this month.</div>';

    const today = new Date();
    const nextFrom = iso(today), nextTo = iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 29, 12));
    const upcoming = sourceRows(nextFrom, nextTo, siteId).sort((a, b) => a.date.localeCompare(b.date));
    const upcomingHours = upcoming.reduce((a, r) => a + r.hours, 0);
    const activeDays = new Set(upcoming.map(r => r.date)).size;
    const nextDate = upcoming[0]?.date;
    document.getElementById('dashUpcoming').innerHTML = `<div class="dash-upcoming-grid"><div><span>Booked hours</span><b>${upcomingHours.toFixed(1)}</b></div><div><span>Days with pool activity</span><b>${activeDays}</b></div><div><span>Next booked date</span><b>${nextDate ? new Date(nextDate + 'T12:00:00').toLocaleDateString('en-GB', {day:'numeric', month:'short'}) : 'None'}</b></div></div>`;

    let staffing = sb.from('lifeguard_service_entries').select('net_amount,status,site_id').gte('service_date', from).lte('service_date', to).neq('status', 'cancelled');
    if (siteId) staffing = staffing.eq('site_id', siteId);
    let invoices = sb.from('school_invoice_batches').select('status,total_amount,site_id').eq('usage_month', from);
    if (siteId) invoices = invoices.eq('site_id', siteId);
    const [staffRes, invRes] = await Promise.all([staffing, invoices]);
    if (token !== requestToken) return;

    const staffIncome = staffRes.error ? null : (staffRes.data || []).reduce((a, x) => a + Number(x.net_amount || 0), 0);
    const staffEl = document.getElementById('dashStaffIncome');
    if (staffEl) staffEl.textContent = staffIncome == null ? '—' : money(staffIncome);

    if (invRes.error) {
      document.getElementById('dashInvoicePosition').innerHTML = '<div class="muted">Invoice status is not available for this role.</div>';
    } else {
      const inv = invRes.data || [];
      const count = status => inv.filter(x => x.status === status).length;
      const awaiting = inv.filter(x => ['draft','pool_manager_checked','lettings_manager_approved','ready','adjustment_required'].includes(x.status));
      const outstandingValue = awaiting.reduce((a, x) => a + Number(x.total_amount || 0), 0);
      document.getElementById('dashInvoicePosition').innerHTML = `<div class="dash-invoice-grid"><div><span>Awaiting completion</span><b>${awaiting.length}</b><small>${money(outstandingValue)}</small></div><div><span>Ready for Finance</span><b>${count('ready')}</b></div><div><span>Invoiced</span><b>${count('invoiced')}</b></div><div><span>Paid</span><b>${count('paid')}</b></div></div>`;
    }
  }

  function scheduleRefresh(delay = 60) {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(refreshDashboardReporting, delay);
  }

  const style = document.createElement('style');
  style.textContent = `
    #opsDashboardReporting{margin-top:22px}.dash-report-head{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:12px}.dash-report-head h2{margin:0 0 4px}.dash-report-head p{margin:0;color:#667788}.dash-report-filters{display:flex;gap:10px;flex-wrap:wrap}.dash-report-filters label{font-size:12px;color:#5d6d7a}.dash-report-filters input,.dash-report-filters select{display:block;margin-top:4px;min-width:150px}.dash-report-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:12px}.dash-kpi{background:#fff;border:1px solid #dfe6eb;border-radius:11px;padding:15px}.dash-kpi span,.dash-upcoming-grid span,.dash-invoice-grid span{display:block;font-size:12px;color:#607282}.dash-kpi b{display:block;font-size:24px;margin:5px 0}.dash-kpi small,.dash-invoice-grid small{color:#7b8995}.dash-report-two{display:grid;grid-template-columns:1.15fr .85fr;gap:12px;margin-bottom:12px}.dash-card-title{font-weight:800;margin-bottom:10px}.dash-mini-table{width:100%;border-collapse:collapse}.dash-mini-table th,.dash-mini-table td{text-align:left;padding:8px 6px;border-top:1px solid #edf1f4}.dash-mini-table th{font-size:11px;text-transform:uppercase;color:#71808d}.dash-invoice-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.dash-invoice-grid>div,.dash-upcoming-grid>div{background:#f7f9fb;border-radius:8px;padding:11px}.dash-invoice-grid b,.dash-upcoming-grid b{display:block;font-size:19px;margin-top:3px}.dash-upcoming-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}@media(max-width:950px){.dash-report-kpis{grid-template-columns:1fr 1fr}.dash-report-two{grid-template-columns:1fr}}@media(max-width:650px){.dash-report-head{align-items:flex-start;flex-direction:column}.dash-report-kpis,.dash-upcoming-grid{grid-template-columns:1fr}.dash-invoice-grid{grid-template-columns:1fr 1fr}}`;
  document.head.appendChild(style);

  window.addEventListener('load', () => scheduleRefresh(250));
  document.addEventListener('click', ev => {
    if (ev.target.closest('button[data-v="dash"]') || ev.target.closest('#refresh')) scheduleRefresh(250);
  });
  const kpi = document.getElementById('k4');
  if (kpi) new MutationObserver(() => scheduleRefresh(40)).observe(kpi, {childList: true, characterData: true, subtree: true});
  scheduleRefresh(300);
})();
