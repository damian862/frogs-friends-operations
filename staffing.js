/* Maintained consolidated runtime module. */
/* source: app-12.js */
(function () {
  let LG = [];
  const lgMoney = v => '£' + Number(v || 0).toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  function lgMonthBounds(v) {
    let [y, m] = String(v).split('-').map(Number), last = new Date(y, m, 0, 12);
    return {
      from: `${y}-${String(m).padStart(2, '0')}-01`,
      to: `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`
    };
  }
  function lgVat(x) {
    return x.vat_applicable ? Number(x.net_amount || 0) * Number(x.vat_rate || 20) / 100 : 0;
  }
  function serviceName(x) {
    return x.service_label || ({
      lifeguard: 'Lifeguard',
      swimming_teacher: 'Swimming teacher',
      teacher: 'Teacher',
      other: 'Other staffing'
    })[x.service_type] || String(x.service_type || 'Staffing').replaceAll('_', ' ');
  }
  function customerName(x) {
    return x.customer_type === 'hirer' ? hn(x.customer_hirer_id) || 'External hirer' : sn(x.site_id) || 'School';
  }
  async function loadLg() {
    let q = await sb.from('lifeguard_service_entries').select('*').order('service_date', {
      ascending: false
    });
    LG = q.data || [];
  }
  function ensureLgSection() {
    let income = $('incomeSummary');
    if (!income) return null;
    let host = $('lifeguardServices');
    if (!host) {
      host = document.createElement('div');
      host.id = 'lifeguardServices';
      host.className = 'lg-section';
      income.parentElement.appendChild(host);
      let now = new Date(), def = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      host.innerHTML = `<div class="term-top compact"><div><h2>Frogs & Friends — Staffing Services</h2><p class=muted>Chargeable lifeguards, swimming teachers and other staffing supplied by Frogs & Friends. These charges are separate from the school's pool-hire income.</p></div><button class=p onclick="editLifeguardEntry()">+ Add staffing charge</button></div><div class="card lg-toolbar"><label>Month<input id=lgMonth type=month value="${def}" onchange="renderLifeguardServices()"></label><label>School / site<select id=lgSite onchange="renderLifeguardServices()"></select></label><label>Charge to<select id=lgCustomer onchange="renderLifeguardServices()"><option value="">All customers</option><option value="school">School</option><option value="hirer">External hirers</option></select></label></div><div id=lgKpis class=lg-kpis></div><div class=card><table class=lg-table><thead><tr><th>Date</th><th>Service</th><th>Customer</th><th>Time</th><th>Staff</th><th>Hours each</th><th>Total staff hours</th><th>Rate</th><th>F&F income</th><th>Status</th><th></th></tr></thead><tbody id=lgRows></tbody></table></div><div class="note"><b>Accounting treatment:</b> school pool-hire income remains school income. Any staffing supplied by Frogs & Friends is separate Frogs & Friends service income and is invoiced to whichever customer received that staffing service.</div>`;
    }
    let s = $('lgSite'), v = s.value;
    s.innerHTML = '<option value="">All sites</option>' + S.map(x => `<option value="${x.id}">${e(x.name)}</option>`).join('');
    if ([...s.options].some(o => o.value === v)) s.value = v;
    return host;
  }
  (OpsLifecycle.reset("renderLifeguardServices"), window.renderLifeguardServices = async function () {
    let host = ensureLgSection();
    if (!host) return;
    await loadLg();
    let month = $('lgMonth').value, site = $('lgSite').value, cust = $('lgCustomer').value, {from, to} = lgMonthBounds(month);
    let rows = LG.filter(x => x.service_date >= from && x.service_date <= to && (!site || x.site_id === site) && (!cust || x.customer_type === cust));
    let active = rows.filter(x => x.status !== 'cancelled'), hours = active.reduce((a, x) => a + Number(x.total_lifeguard_hours || 0), 0), net = active.reduce((a, x) => a + Number(x.net_amount || 0), 0), schoolNet = active.filter(x => x.customer_type === 'school').reduce((a, x) => a + Number(x.net_amount || 0), 0), hirerNet = active.filter(x => x.customer_type === 'hirer').reduce((a, x) => a + Number(x.net_amount || 0), 0);
    $('lgKpis').innerHTML = `<div class=lg-kpi><span>Total staffing hours</span><b>${hours.toFixed(2)}</b></div><div class=lg-kpi><span>Frogs & Friends staffing income</span><b>${lgMoney(net)}</b></div><div class=lg-kpi><span>Charged to school</span><b>${lgMoney(schoolNet)}</b></div><div class=lg-kpi><span>Charged to external hirers</span><b>${lgMoney(hirerNet)}</b></div>`;
    $('lgRows').innerHTML = rows.map(x => `<tr><td>${e(shortUk(x.service_date))}</td><td><b>${e(serviceName(x))}</b></td><td>${e(customerName(x))}<div class=lg-note>${x.customer_type === 'hirer' ? 'External customer' : 'School expenditure'}</div></td><td>${x.start_time ? e(String(x.start_time).slice(0, 5)) : '—'}${x.end_time ? '–' + e(String(x.end_time).slice(0, 5)) : ''}</td><td>${x.lifeguard_count}</td><td>${Number(x.hours_per_lifeguard || 0).toFixed(2)}</td><td><b>${Number(x.total_lifeguard_hours || 0).toFixed(2)}</b></td><td>${lgMoney(x.hourly_rate)}/hr</td><td><b>${lgMoney(x.net_amount)}</b>${lgVat(x) ? `<div class=lg-note>+ ${lgMoney(lgVat(x))} VAT</div>` : ''}</td><td><span class="lg-status ${e(x.status)}">${e(x.status)}</span></td><td class=lg-actions><button class=link onclick="editLifeguardEntry('${x.id}')">Edit</button></td></tr>`).join('') || '<tr><td colspan=11 class=muted>No staffing charges recorded for this month.</td></tr>';
  });
  window.staffCustomerChanged = function () {
    let isHirer = $('lg11').value === 'hirer';
    $('lg12wrap').style.display = isHirer ? '' : 'none';
  };
  window.editLifeguardEntry = function (id) {
    let x = LG.find(z => z.id === id) || ({}), site = x.site_id || S[0]?.id || '', date = x.service_date || new Date().toISOString().slice(0, 10), stype = x.service_type || 'lifeguard', cust = x.customer_type || 'school';
    modal(id ? 'Edit staffing charge' : 'Add staffing charge', `<label>School / pool site<select id=lg1>${opts(S, site, z => z.name)}</select></label><label>Date<input id=lg2 type=date value="${date}"></label><label>Service type<select id=lg13><option value=lifeguard ${stype === 'lifeguard' ? 'selected' : ''}>Lifeguard</option><option value=swimming_teacher ${stype === 'swimming_teacher' ? 'selected' : ''}>Swimming teacher</option><option value=teacher ${stype === 'teacher' ? 'selected' : ''}>Teacher</option><option value=other ${stype === 'other' ? 'selected' : ''}>Other staffing</option></select></label><label>Service description<input id=lg14 value="${e(x.service_label || '')}" placeholder="Optional, e.g. Swimming teacher cover"></label><label>Charge Frogs & Friends service to<select id=lg11 onchange="staffCustomerChanged()"><option value=school ${cust === 'school' ? 'selected' : ''}>School</option><option value=hirer ${cust === 'hirer' ? 'selected' : ''}>Hiring organisation</option></select></label><label id=lg12wrap style="display:${cust === 'hirer' ? '' : 'none'}">Hiring organisation<select id=lg12><option value="">Select organisation</option>${opts(H, x.customer_hirer_id, z => z.name)}</select></label><label>Start time<input id=lg3 type=time value="${String(x.start_time || '').slice(0, 5)}"></label><label>End time<input id=lg4 type=time value="${String(x.end_time || '').slice(0, 5)}"></label><label>Number of staff<input id=lg5 type=number min=1 step=1 value="${x.lifeguard_count || 1}"></label><label>Hours per staff member<input id=lg6 type=number min=0 step=0.25 value="${x.hours_per_lifeguard ?? ''}" placeholder="e.g. 2.5"></label><label>Charge rate per staff hour (£)<input id=lg7 type=number min=0 step=0.01 value="${x.hourly_rate ?? ''}" placeholder="0.00"></label><label>VAT<select id=lg8><option value=false ${!x.vat_applicable ? 'selected' : ''}>No VAT</option><option value=true ${x.vat_applicable ? 'selected' : ''}>VAT applies</option></select></label><label>Status<select id=lg9><option value=draft ${x.status === 'draft' ? 'selected' : ''}>Draft</option><option value=confirmed ${!x.status || x.status === 'confirmed' ? 'selected' : ''}>Confirmed</option><option value=cancelled ${x.status === 'cancelled' ? 'selected' : ''}>Cancelled</option></select></label><label>Notes<textarea id=lg10 placeholder="e.g. Two teachers provided for visiting school session">${e(x.notes || '')}</textarea></label>`, async () => {
      if (lg11.value === 'hirer' && !lg12.value) return alert('Select the hiring organisation to charge.');
      let p = {
        organisation_id: P.organisation_id,
        site_id: lg1.value,
        service_date: lg2.value,
        service_type: lg13.value,
        service_label: lg14.value || null,
        customer_type: lg11.value,
        customer_hirer_id: lg11.value === 'hirer' ? lg12.value : null,
        start_time: lg3.value || null,
        end_time: lg4.value || null,
        lifeguard_count: Number(lg5.value || 1),
        hours_per_lifeguard: Number(lg6.value || 0),
        hourly_rate: Number(lg7.value || 0),
        vat_applicable: lg8.value === 'true',
        vat_rate: 20,
        status: lg9.value,
        notes: lg10.value || null,
        created_by: x.created_by || P.id,
        updated_at: new Date().toISOString()
      }, q = id ? sb.from('lifeguard_service_entries').update(p).eq('id', id) : sb.from('lifeguard_service_entries').insert(p);
      let {error} = await q;
      if (error) return alert(error.message);
      closeM();
      await loadLg();
      renderLifeguardServices();
    });
  };
  const oldIncome = window.renderIncomeSummary;
  OpsLifecycle.use("renderIncomeSummary", function (next) {
    next();
    setTimeout(() => renderLifeguardServices(), 0);
  });
})();


;
/* source: app-13.js */
(function () {
  let RSTAFF = [];
  window.RSTAFF = RSTAFF;
  const rsMoney = v => '£' + Number(v || 0).toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const rsServiceName = x => x.service_label || ({
    lifeguard: 'Lifeguard',
    swimming_teacher: 'Swimming teacher',
    teacher: 'Teacher',
    other: 'Other staffing'
  })[x.service_type] || 'Staffing';
  const rsCustomerName = x => x.customer_type === 'external_hirer' ? hn(x.customer_hirer_id) || 'External hirer' : sn(x.site_id) || 'School';
  const rsSessionLabel = s => s ? `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][Number(s.day_of_week)]} ${String(s.start_time || '').slice(0, 5)}–${String(s.end_time || '').slice(0, 5)}` : 'All sessions in recurring booking';
  async function loadRecurringStaffing() {
    let q = await sb.from('recurring_staffing_services').select('*').order('created_at');
    RSTAFF = q.data || [];
    window.RSTAFF = RSTAFF;
    return RSTAFF;
  }
  function timeHours(a, b) {
    let x = String(a || '').split(':').map(Number), y = String(b || '').split(':').map(Number);
    if (x.length < 2 || y.length < 2 || Number.isNaN(x[0]) || Number.isNaN(y[0])) return 0;
    return Math.max(0, (y[0] * 60 + y[1] - x[0] * 60 - x[1]) / 60);
  }
  function ruleHours(x, session) {
    return timeHours(x.start_time || session?.start_time, x.end_time || session?.end_time);
  }
  function programmeStaffingHtml(pid) {
    let rules = RSTAFF.filter(x => x.programme_id === pid && x.active !== false);
    return `<div class="rb-section"><div class="rb-section-head"><span>Frogs & Friends staffing</span><button class="s" onclick="editRecurringStaffing(null,'${pid}')">+ Add staffing rule</button></div>${rules.length ? `<div class=staffing-rule-list>${rules.map(x => {
      let s = RS.find(r => r.id === x.session_id), hrs = ruleHours(x, s);
      return `<div class=staffing-rule><div><div class=staffing-rule-title>${e(rsServiceName(x))} × ${Number(x.staff_count || 1)}</div><div class=staffing-rule-sub>${e(rsSessionLabel(s))}${x.start_time && x.end_time ? ` · staffing ${e(String(x.start_time).slice(0, 5))}–${e(String(x.end_time).slice(0, 5))}` : ' · follows booking time'}</div></div><div><span class=staffing-rule-badge>${e(rsCustomerName(x))}</span><div class=staffing-rule-sub>${x.customer_type === 'external_hirer' ? 'F&F invoices hirer' : 'F&F invoices school'}</div></div><div class=staffing-rule-money><b>${rsMoney(x.hourly_rate)}/staff hr</b><div class=staffing-rule-sub>${s ? hrs.toFixed(2) + ' hr × ' + Number(x.staff_count || 1) + ' staff' : 'Calculated per session'}</div></div><div class=staffing-rule-actions><button class=link onclick="editRecurringStaffing('${x.id}','${pid}')">Edit</button><button class=link onclick="deleteRecurringStaffing('${x.id}')">Delete</button></div></div>`;
    }).join('')}</div>` : '<div class=rb-empty>No recurring staffing attached.</div>'}</div>`;
  }
  function injectStaffingSections() {
    document.querySelectorAll('.rb-item').forEach(item => {
      let manage = item.querySelector('.rb-manage-grid');
      if (!manage || manage.querySelector('.staffing-added')) return;
      let button = [...item.querySelectorAll('button')].find(b => (b.getAttribute('onclick') || '').includes('editProgramme('));
      if (!button) return;
      let m = (button.getAttribute('onclick') || '').match(/editProgramme\('([^']+)'\)/);
      if (!m) return;
      let wrap = document.createElement('div');
      wrap.className = 'staffing-added';
      wrap.innerHTML = programmeStaffingHtml(m[1]);
      manage.appendChild(wrap);
    });
  }
  window.rsSessionChanged = function () {
    let sid = $('rs1')?.value, s = RS.find(x => x.id === sid);
    if ($('rsUseBookingTime')?.checked) {
      if ($('rs5')) $('rs5').value = s ? String(s.start_time || '').slice(0, 5) : '';
      if ($('rs6')) $('rs6').value = s ? String(s.end_time || '').slice(0, 5) : '';
    }
    let note = $('rsSessionHelp');
    if (note) note.textContent = sid ? 'This staffing applies only to ' + rsSessionLabel(s) + '.' : 'This staffing applies to every weekly session in this recurring booking.';
  };
  window.rsTimeModeChanged = function () {
    let use = $('rsUseBookingTime')?.checked, wrap = $('rsTimeOverride');
    if (wrap) wrap.style.display = use ? 'none' : '';
    if (use) rsSessionChanged();
  };
  window.rsCustomerChanged = function () {
    let wrap = $('rs10wrap');
    if (wrap) wrap.style.display = $('rs9')?.value === 'external_hirer' ? '' : 'none';
  };
  window.editRecurringStaffing = async function (id, pid, presetSessionId) {
    if (!RSTAFF.length) await loadRecurringStaffing();
    let x = RSTAFF.find(z => z.id === id) || ({}), p = G.find(z => z.id === pid), sessions = RS.filter(s => s.programme_id === pid && s.active !== false);
    if (!p) return alert('Recurring booking could not be found. Please refresh and try again.');
    if (!sessions.length) return alert('Add at least one weekly session before adding staffing.');
    let stype = x.service_type || 'lifeguard', cust = x.customer_type || 'school', session = id ? x.session_id || '' : presetSessionId || sessions[0]?.id || '', sel = sessions.find(s => s.id === session), useBookingTime = !x.start_time && !x.end_time;
    modal(id ? 'Edit recurring staffing' : 'Add recurring staffing', `<label>Recurring booking<input value="${e((hn(p.hirer_id) || 'School/Internal') + ' — ' + (p.name || ''))}" disabled></label><label>Apply staffing to<select id=rs1 onchange="rsSessionChanged()"><option value="" ${session === '' ? 'selected' : ''}>All sessions in this recurring booking</option>${sessions.map(s => `<option value="${s.id}" ${s.id === session ? 'selected' : ''}>${e(rsSessionLabel(s))}</option>`).join('')}</select><div id=rsSessionHelp class=muted style="margin:2px 0 8px">${session ? `This staffing applies only to ${e(rsSessionLabel(sel))}.` : 'This staffing applies to every weekly session in this recurring booking.'}</div></label><label>Service type<select id=rs2><option value=lifeguard ${stype === 'lifeguard' ? 'selected' : ''}>Lifeguard</option><option value=swimming_teacher ${stype === 'swimming_teacher' ? 'selected' : ''}>Swimming teacher</option><option value=teacher ${stype === 'teacher' ? 'selected' : ''}>Teacher</option><option value=other ${stype === 'other' ? 'selected' : ''}>Other staffing</option></select></label><label>Service description<input id=rs3 value="${e(x.service_label || '')}"></label><label>Number of staff<input id=rs4 type=number min=1 step=1 value="${x.staff_count || 1}"></label><label style="grid-column:1/-1"><span style="display:flex;align-items:center;gap:8px"><input id=rsUseBookingTime type=checkbox style="width:auto;margin:0" ${useBookingTime ? 'checked' : ''} onchange="rsTimeModeChanged()"> Use the booking session start/end time for staffing</span></label><div id=rsTimeOverride style="display:${useBookingTime ? 'none' : 'contents'}"><label>Staffing start<input id=rs5 type=time value="${String(x.start_time || sel?.start_time || '').slice(0, 5)}"></label><label>Staffing end<input id=rs6 type=time value="${String(x.end_time || sel?.end_time || '').slice(0, 5)}"></label></div><label>Charge per staff hour (£)<input id=rs7 type=number min=0 step=.01 value="${x.hourly_rate ?? ''}"></label><label>VAT<select id=rs8><option value=false ${!x.vat_applicable ? 'selected' : ''}>No VAT</option><option value=true ${x.vat_applicable ? 'selected' : ''}>VAT applies</option></select></label><label>Charge Frogs & Friends service to<select id=rs9 onchange="rsCustomerChanged()"><option value=school ${cust === 'school' ? 'selected' : ''}>School</option><option value=external_hirer ${cust === 'external_hirer' ? 'selected' : ''}>Hiring organisation</option></select></label><label id=rs10wrap style="display:${cust === 'external_hirer' ? '' : 'none'}">Hiring organisation<select id=rs10><option value="">Select organisation</option>${opts(H, x.customer_hirer_id, z => z.name)}</select></label><label>Starts on<input id=rs11 type=date value="${x.starts_on || p.starts_on || ''}"></label><label>Ends on<input id=rs12 type=date value="${x.ends_on || p.ends_on || ''}"></label><label>Notes<textarea id=rs13>${e(x.notes || '')}</textarea></label>`, async () => {
      if (rs9.value === 'external_hirer' && !rs10.value) return alert('Select the hiring organisation to charge.');
      if (!$('rsUseBookingTime').checked && (!rs5.value || !rs6.value)) return alert('Enter the staffing start and end time, or use the booking session time.');
      let q = {
        organisation_id: P.organisation_id,
        site_id: p.site_id,
        programme_id: pid,
        session_id: rs1.value || null,
        service_type: rs2.value,
        service_label: rs3.value || null,
        staff_count: Number(rs4.value || 1),
        start_time: $('rsUseBookingTime').checked ? null : rs5.value || null,
        end_time: $('rsUseBookingTime').checked ? null : rs6.value || null,
        hourly_rate: Number(rs7.value || 0),
        vat_applicable: rs8.value === 'true',
        vat_rate: 20,
        customer_type: rs9.value,
        customer_hirer_id: rs9.value === 'external_hirer' ? rs10.value : null,
        starts_on: rs11.value || null,
        ends_on: rs12.value || null,
        active: true,
        notes: rs13.value || null,
        created_by: x.created_by || P.id,
        updated_at: new Date().toISOString()
      };
      let res = id ? await sb.from('recurring_staffing_services').update(q).eq('id', id) : await sb.from('recurring_staffing_services').insert(q);
      if (res.error) return alert(res.error.message);
      closeM();
      await loadRecurringStaffing();
      renderRecurringBookings();
    });
  };
  window.deleteRecurringStaffing = async function (id) {
    if (!confirm('Delete this recurring staffing rule?')) return;
    let q = await sb.from('recurring_staffing_services').delete().eq('id', id);
    if (q.error) return alert(q.error.message);
    await loadRecurringStaffing();
    renderRecurringBookings();
  };
  const oldRenderRecurring = window.renderRecurringBookings;
  OpsLifecycle.use("renderRecurringBookings", function (next) {
    next();
    setTimeout(async () => {
      await loadRecurringStaffing();
      injectStaffingSections();
    }, 0);
  });
})();


;
/* source: app-14.js */
(function () {
  let SITE_CONTEXT = '';
  const ownerRole = () => ['owner_admin', 'operations_admin'].includes(String(P?.role || ''));
  const siteName = id => S.find(s => s.id === id)?.name || '';
  function currentSite() {
    if (!ownerRole()) return P?.home_site_id || S[0]?.id || '';
    return SITE_CONTEXT || '';
  }
  function addContextUi() {
    let top = document.querySelector('.top');
    if (!top || document.getElementById('siteContext')) return;
    let wrap = document.createElement('div');
    wrap.id = 'siteContext';
    wrap.className = 'site-context';
    if (ownerRole()) {
      wrap.innerHTML = `<span class=site-context-label>Viewing</span><select id=globalSiteContext><option value="">All Sites</option>${S.map(s => `<option value="${s.id}">${e(s.name)}</option>`).join('')}</select>`;
      top.insertBefore(wrap, document.querySelector('.top .sp'));
      let saved = localStorage.getItem('ff_site_context') || '';
      if (saved && S.some(s => s.id === saved)) SITE_CONTEXT = saved;
      $('globalSiteContext').value = SITE_CONTEXT;
      $('globalSiteContext').onchange = () => {
        SITE_CONTEXT = $('globalSiteContext').value;
        localStorage.setItem('ff_site_context', SITE_CONTEXT);
        applyContextFilters();
        render();
      };
    } else {
      document.body.classList.add('site-restricted');
      let sid = currentSite(), name = siteName(sid) || 'School';
      wrap.innerHTML = `<span class=site-context-badge>🏫 ${e(name)}</span>`;
      top.insertBefore(wrap, document.querySelector('.top .sp'));
      hideOrganisationAdmin();
    }
  }
  function hideOrganisationAdmin() {
    document.querySelectorAll('.nav button').forEach(b => {
      let v = b.dataset.v;
      if (['sites'].includes(v)) b.style.display = 'none';
    });
    document.querySelectorAll('#sites .p,#sites .link,#staff>.p').forEach(x => x.style.display = 'none');
    let addHirer = document.querySelector('#hirers>.p');
    if (addHirer) addHirer.style.display = ownerRole() ? '' : 'none';
  }
  function setSelect(id) {
    let el = $(id), sid = currentSite();
    if (!el || !sid) return;
    if ([...el.options].some(o => o.value === sid)) {
      el.value = sid;
      el.disabled = !ownerRole();
    }
  }
  function applyContextFilters() {
    let sid = currentSite();
    if (!sid) return;
    ['rbSite', 'calSite', 'repSite', 'billSite', 'lgSite'].forEach(setSelect);
  }
  function renderDashboardContext() {
    let sid = currentSite();
    if ($('k1')) $('k1').textContent = sid ? 1 : S.length;
    if ($('k4')) $('k4').textContent = sid ? B.filter(x => x.site_id === sid).length : B.length;
  }
  function withContextYears(fn) {
    let sid = currentSite(), all = Y;
    if (sid) Y = Y.filter(y => y.site_id === sid);
    try {
      return fn();
    } finally {
      Y = all;
    }
  }
  function schoolBanner() {
    if (ownerRole() || document.getElementById('siteSchoolBanner')) return;
    let sid = currentSite(), name = siteName(sid);
    if (!name) return;
    let main = document.querySelector('.main'), top = document.querySelector('.top');
    if (!main || !top) return;
    let b = document.createElement('div');
    b.id = 'siteSchoolBanner';
    b.className = 'site-school-banner';
    b.innerHTML = `<b>${e(name)}</b><span>Your account is restricted to this school's pool operations.</span>`;
    top.insertAdjacentElement('afterend', b);
  }
  const oldTermDates = window.renderTermDates;
  OpsLifecycle.use("renderTermDates", function (next) {
    return withContextYears(next);
  });
  const oldEditYear = window.editYear;
  window.editYear = function (id) {
    let out = oldEditYear(id), sid = currentSite(), site = $('f1');
    if (!id && sid && site) site.value = sid;
    return out;
  };
  const oldEditTerm = window.editTerm;
  window.editTerm = function (...args) {
    return withContextYears(() => oldEditTerm(...args));
  };
  const oldEditDate = window.editDate;
  window.editDate = function (...args) {
    return withContextYears(() => oldEditDate(...args));
  };
  const oldRender = window.render;
  OpsLifecycle.use("render", function (next) {
    next();
    addContextUi();
    schoolBanner();
    applyContextFilters();
    renderTermDates();
    renderDashboardContext();
    hideOrganisationAdmin();
  });
  const oldRecurring = window.renderRecurringBookings;
  OpsLifecycle.use("renderRecurringBookings", function (next) {
    next();
    setTimeout(applyContextFilters, 0);
  });
  const oldIncome = window.renderIncomeSummary;
  OpsLifecycle.use("renderIncomeSummary", function (next) {
    next();
    setTimeout(applyContextFilters, 0);
  });
  const oldCal = window.renderBookingCalendar;
  if (oldCal) OpsLifecycle.use("renderBookingCalendar", function (next) {
    next();
    setTimeout(applyContextFilters, 0);
  });
  const oldEnter = window.enter;
  OpsLifecycle.use("enter", async function (next, u) {
    await next(u);
    addContextUi();
    schoolBanner();
    applyContextFilters();
    renderDashboardContext();
  });
})();


;
/* source: app-15.js */
(function () {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  window.manageProgramme = function (id) {
    OPEN_PROG = OPEN_PROG === id ? null : id;
    window.renderRecurringBookings();
  };
  function programmeId(card) {
    const btn = [...card.querySelectorAll('button')].find(b => (b.getAttribute('onclick') || '').includes('manageProgramme('));
    const m = (btn?.getAttribute('onclick') || '').match(/manageProgramme\('([^']+)'\)/);
    return m ? m[1] : null;
  }
  function sessionGroups(pid) {
    const sessions = RS.filter(s => s.programme_id === pid && s.active !== false), map = new Map();
    sessions.forEach(s => {
      const key = [String(s.start_time || '').slice(0, 5), String(s.end_time || '').slice(0, 5), (s.title || 'Swimming lessons').trim(), s.charge_type || 'chargeable', s.rate ?? '', !!s.vat_applicable, s.pool_use_type || 'whole_pool', s.lane_count ?? ''].join('|');
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    });
    return [...map.values()].sort((a, b) => Math.min(...a.map(x => Number(x.day_of_week))) - Math.min(...b.map(x => Number(x.day_of_week))) || String(a[0].start_time).localeCompare(String(b[0].start_time)));
  }
  function ruleSummary(sessions) {
    if (typeof RSTAFF === 'undefined') return '';
    const rules = RSTAFF.filter(r => r.active !== false && (r.session_id ? sessions.some(s => s.id === r.session_id) : sessions.some(s => s.programme_id === r.programme_id))), names = [];
    rules.forEach(r => {
      const label = r.service_label || ({
        lifeguard: 'Lifeguard',
        swimming_teacher: 'Swimming teacher',
        teacher: 'Teacher',
        other: 'Other staffing'
      })[r.service_type] || 'Staffing', text = `${Number(r.staff_count || 1)} ${label}`;
      if (!names.includes(text)) names.push(text);
    });
    return names.join(', ');
  }
  function addVisibleStaffingRows() {
    document.querySelectorAll('.rb-item').forEach(card => {
      const pid = programmeId(card), overview = card.querySelector('.rb-overview');
      if (!pid || !overview) return;
      const rows = [...overview.querySelectorAll('.rb-ov-row')], groups = sessionGroups(pid);
      rows.forEach((row, i) => {
        const sessions = groups[i];
        if (!sessions) return;
        row.querySelectorAll('.rb-ov-staffing').forEach(x => x.remove());
        const box = document.createElement('div');
        box.className = 'rb-ov-staffing rb-ov-staffing-visible';
        const summary = ruleSummary(sessions);
        if (summary) box.insertAdjacentHTML('beforeend', `<span class="staffing-rule-badge">${e(summary)}</span>`);
        if (sessions.length === 1) box.insertAdjacentHTML('beforeend', `<button class="s staffing-session-btn" onclick="editRecurringStaffing(null,'${pid}','${sessions[0].id}')">+ Staffing for ${days[Number(sessions[0].day_of_week)]}</button>`); else {
          box.insertAdjacentHTML('beforeend', `<span class="rb-ov-staff-note">Add staffing to an individual day:</span>`);
          sessions.sort((a, b) => Number(a.day_of_week) - Number(b.day_of_week)).forEach(s => box.insertAdjacentHTML('beforeend', `<button class="s staffing-session-btn" onclick="editRecurringStaffing(null,'${pid}','${s.id}')">+ ${days[Number(s.day_of_week)]}</button>`));
        }
        row.appendChild(box);
      });
    });
  }
  const previous = window.renderRecurringBookings;
  OpsLifecycle.use("renderRecurringBookings", function (next) {
    next();
    setTimeout(addVisibleStaffingRows, 20);
  });
  const style = document.createElement('style');
  style.textContent = `.rb-ov-row{flex-wrap:wrap!important;align-items:center}.rb-ov-staffing-visible{flex:0 0 100%;display:flex;align-items:center;gap:7px;flex-wrap:wrap;padding:7px 0 2px 102px;border-top:1px dashed #e3e9ef;margin-top:2px}.rb-ov-staff-note{font-size:12px;color:#657585;margin-right:3px}.staffing-session-btn{padding:5px 8px;font-size:12px}@media(max-width:800px){.rb-ov-staffing-visible{padding-left:0}}`;
  document.head.appendChild(style);
})();

