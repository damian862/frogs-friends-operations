/* Maintained consolidated runtime module. */
(function(){
  const registry=new Map();
  const stats={registered:0,resets:0,installed:{}};
  window.OpsLifecycle=Object.freeze({
    use(name,middleware){
      if(typeof middleware!=='function')throw new TypeError('Lifecycle middleware must be a function');
      const list=registry.get(name)||[];list.push(middleware);registry.set(name,list);stats.registered++;
    },
    reset(name){registry.set(name,[]);stats.resets++;},
    install(names){
      names.forEach(name=>{
        const base=window[name];if(typeof base!=='function')return;
        const list=(registry.get(name)||[]).slice();
        let composed=base;
        list.forEach(middleware=>{
          const previous=composed;
          composed=function(...args){
            const next=(...nextArgs)=>previous.apply(this,nextArgs);
            return middleware.apply(this,[next,...args]);
          };
        });
        window[name]=composed;stats.installed[name]=list.length;
      });
    },
    debug(){return JSON.parse(JSON.stringify(stats));}
  });
})();

/* source: shared-utils.js */
(function () {
  function isoDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  function parseDate(value) {
    return new Date(String(value || '') + 'T12:00:00');
  }
  function hoursBetween(start, end) {
    const a = String(start || '00:00').split(':').map(Number);
    const b = String(end || '00:00').split(':').map(Number);
    return Math.max(0, (b[0] * 60 + b[1] - (a[0] * 60 + a[1])) / 60);
  }
  function money(value) {
    return '£' + Number(value || 0).toLocaleString('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  function monthBounds(value) {
    const [y, m] = String(value).split('-').map(Number);
    const from = new Date(y, m - 1, 1, 12);
    const to = new Date(y, m, 0, 12);
    return {
      from: isoDate(from),
      to: isoDate(to),
      usage_month: isoDate(from)
    };
  }
  function monthLabel(value) {
    const [y, m] = String(value).split('-').map(Number);
    return new Date(y, m - 1, 1, 12).toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric'
    });
  }
  function createBurstDeduper(fn, options = {}) {
    const windowMs = Math.max(0, Number(options.windowMs ?? 250));
    const keyFn = typeof options.key === 'function' ? options.key : () => '';
    const active = new Map(), recent = new Map();
    async function run(...args) {
      const key = String(keyFn(...args));
      if (active.has(key)) return active.get(key);
      const cached = recent.get(key);
      if (cached && Date.now() - cached.at < windowMs) return cached.value;
      const promise = Promise.resolve().then(() => fn(...args));
      active.set(key, promise);
      try {
        const value = await promise;
        recent.set(key, {
          at: Date.now(),
          value
        });
        return value;
      } finally {
        if (active.get(key) === promise) active.delete(key);
      }
    }
    run.invalidate = key => {
      if (key === undefined) recent.clear(); else recent.delete(String(key));
    };
    return run;
  }
  const api = Object.freeze({
    isoDate,
    parseDate,
    hoursBetween,
    money,
    monthBounds,
    monthLabel,
    createBurstDeduper
  });
  if (typeof window !== 'undefined') window.OpsUtil = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();


;
/* source: app-1.js */
const sb = supabase.createClient('https://euxgcqkhsubxhuxhtrev.supabase.co', 'sb_publishable_rrACPD0dKGGxRuZjSoJfFw_Y6DBKFIB', {
  auth: {
    detectSessionInUrl: false,
    lock: async (_name, _timeout, fn) => await fn()
  }
});
const $ = x => document.getElementById(x);
let P, S = [], H = [], T = [], B = [], Y = [], D = [], G = [], BR = [], RS = [], EX = [], OV_ORGS = [];
const e = x => String(x ?? '').replace(/[&<>"']/g, m => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
})[m]);
const sn = id => S.find(x => x.id === id)?.name || '', hn = id => H.find(x => x.id === id)?.name || '', ovn = id => OV_ORGS.find(x => x.id === id)?.name || '', calendarOrgName = id => hn(id) || ovn(id) || 'School/Internal', yn = id => Y.find(x => x.id === id)?.name || '';
function showMsg(t, bad = false) {
  $('msg').innerHTML = '<div class="' + (bad ? 'err' : 'note') + '">' + e(t) + '</div>';
}
async function login() {
  try {
    showMsg('Signing in…');
    let {data, error} = await sb.auth.signInWithPassword({
      email: $('email').value.trim(),
      password: $('password').value
    });
    if (error) return showMsg(error.message, true);
    await enter(data.user);
  } catch (x) {
    showMsg(x.message || String(x), true);
  }
}
async function enter(u) {
  let {data, error} = await sb.from('profiles').select('*').eq('id', u.id).single();
  if (error) return showMsg('Profile error: ' + error.message, true);
  P = data;
  $('auth').classList.add('hide');
  $('app').classList.remove('hide');
  $('who').textContent = P.full_name || P.email;
  $('role').textContent = (P.role || '').replaceAll('_', ' ');
  await load();
}
async function load() {
  let r = await Promise.all([sb.from('sites').select('*').order('name'), sb.from('hirers').select('*').order('name'), sb.from('staff').select('*').order('last_name'), sb.from('bookings').select('*').order('booking_date', {
    ascending: false
  }).limit(500), sb.from('academic_years').select('*').order('starts_on', {
    ascending: false
  }), sb.from('academic_calendar_periods').select('*').order('starts_on'), sb.from('recurring_programmes').select('*').order('name'), sb.from('recurring_programme_breaks').select('*').order('starts_on'), sb.from('recurring_programme_sessions').select('*').order('day_of_week').order('start_time'), sb.from('recurring_programme_session_exceptions').select('*').order('exception_date'), sb.rpc('operational_viewer_booking_organisations')]);
  [S, H, T, B, Y, D, G, BR, RS, EX, OV_ORGS] = r.map(x => x.data || []);
  render();
}
function render() {
  $('k1').textContent = S.length;
  $('k2').textContent = T.length;
  $('k3').textContent = H.length;
  $('k4').textContent = B.length;
  $('rSites').innerHTML = S.map(x => `<tr><td>${e(x.name)}</td><td>${e(x.town)}</td><td>${e(x.postcode)}</td><td><button class=link onclick="editSite('${x.id}')">Edit</button></td></tr>`).join('');
  $('rHirers').innerHTML = H.map(x => `<tr><td>${e(x.name)}</td><td>${e(x.billing_email)}</td><td>${e(x.phone)}</td><td>${x.vat_registered ? 'Yes' : 'No'}</td><td>${canManageHirers() ? `<button class=link onclick="editHirer('${x.id}')">Edit</button> · <button class=link onclick="deleteHirer('${x.id}')">Delete</button>` : ''}</td></tr>`).join('');
  $('rStaff').innerHTML = T.map(x => `<tr><td>${e(x.first_name + ' ' + x.last_name)}</td><td>${e(x.primary_role)}</td><td>${e((x.employment_status || '').replaceAll('_', ' '))}</td><td>${e(x.email)}</td><td><button class=link onclick="editStaff('${x.id}')">Edit</button></td></tr>`).join('');
  renderBookingTables();
  renderTermDates();
  renderRecurringBookings();
  renderIncomeSummary();
}
function bookingHours(x) {
  let a = String(x.start_time || '00:00').split(':').map(Number), b = String(x.end_time || '00:00').split(':').map(Number);
  return Math.max(0, (b[0] * 60 + b[1] - a[0] * 60 - a[1]) / 60);
}
function sessionHours(start, end) {
  let a = String(start || '00:00').split(':').map(Number), b = String(end || '00:00').split(':').map(Number);
  return Math.max(0, (b[0] * 60 + b[1] - a[0] * 60 - a[1]) / 60);
}
function bookingChargeHtml(x) {
  if (x.charge_type === 'internal_school_use') return '<span class="charge-badge internal">Internal school use</span>';
  if (x.charge_type === 'free_of_charge') return '<span class="charge-badge foc">Free of charge</span>';
  if (x.rate == null) return '<span class="charge-badge">Rate not set</span>';
  let v = Number(x.rate) * bookingHours(x);
  return `<strong>£${v.toFixed(2)}</strong><div class="muted">£${Number(x.rate).toFixed(2)}/hr · ${x.vat_applicable ? 'VAT applies' : 'No VAT'}</div>`;
}
function bookingOrg(x) {
  return calendarOrgName(x.hirer_id);
}
function renderBookingTables() {
  let row = x => `<tr><td>${e(ukDate(x.booking_date))}</td><td><b>${e(bookingOrg(x))}</b></td><td>${e(x.title)}</td><td>${e(sn(x.site_id))}</td><td>${String(x.start_time || '').slice(0, 5)}–${String(x.end_time || '').slice(0, 5)}</td><td>${bookingChargeHtml(x)}</td><td><button class=link onclick="editBooking('${x.id}')">Edit</button></td></tr>`;
  if ($('rBookings')) $('rBookings').innerHTML = B.map(row).join('') || '<tr><td colspan="7" class="muted">No bookings yet.</td></tr>';
  if ($('rSingleBookings')) $('rSingleBookings').innerHTML = B.filter(x => x.booking_type !== 'school_internal').map(row).join('') || '<tr><td colspan="7" class="muted">No single bookings yet.</td></tr>';
  if ($('rSchoolBookings')) $('rSchoolBookings').innerHTML = B.filter(x => x.booking_type === 'school_internal').map(x => `<tr><td>${e(ukDate(x.booking_date))}</td><td>${e(x.title)}</td><td>${e(sn(x.site_id))}</td><td>${String(x.start_time || '').slice(0, 5)}–${String(x.end_time || '').slice(0, 5)}</td><td>${e(x.status || 'confirmed')}</td><td><button class=link onclick="editBooking('${x.id}')">Edit</button></td></tr>`).join('') || '<tr><td colspan="6" class="muted">No school events yet.</td></tr>';
}
function renderIncomeSummary() {
  let host = $('incomeSummary');
  if (!host) return;
  let confirmed = B.filter(x => x.status !== 'cancelled'), hours = confirmed.reduce((a, x) => a + bookingHours(x), 0), chargeable = confirmed.filter(x => (x.charge_type || 'chargeable') === 'chargeable'), net = chargeable.reduce((a, x) => a + (x.rate == null ? 0 : Number(x.rate) * bookingHours(x)), 0), foc = confirmed.filter(x => x.charge_type === 'free_of_charge' || x.charge_type === 'internal_school_use').reduce((a, x) => a + bookingHours(x), 0);
  host.innerHTML = `<div class="income-grid"><div class="income-card">Total booked hours<b>${hours.toFixed(1)}</b></div><div class="income-card">Chargeable bookings<b>${chargeable.length}</b></div><div class="income-card">Booked net hire income<b>£${net.toFixed(2)}</b></div><div class="income-card">FOC / school hours<b>${foc.toFixed(1)}</b></div></div><div class="note" style="margin-top:12px">Monthly targets and recurring-booking forecasts are stored in the database and will be connected to this reporting view next.</div>`;
}
function setBookingTab(name) {
  document.querySelectorAll('.booking-panel').forEach(x => x.classList.remove('on'));
  document.querySelectorAll('.booking-tab').forEach(x => x.classList.remove('active'));
  let m = {
    all: 'bookingTabAll',
    recurring: 'bookingTabRecurring',
    single: 'bookingTabSingle',
    school: 'bookingTabSchool',
    income: 'bookingTabIncome'
  };
  $(m[name] || m.all)?.classList.add('on');
  document.querySelector(`.booking-tab[data-btab="${name}"]`)?.classList.add('active');
  if (name === 'recurring') renderRecurringBookings();
  if (name === 'income') renderIncomeSummary();
}
document.addEventListener('click', ev => {
  let b = ev.target.closest('.booking-tab');
  if (b) setBookingTab(b.dataset.btab);
});
let OPEN_PROG = null;
function recurringFilterOptions() {
  let site = $('rbSite'), org = $('rbOrg');
  if (site && site.options.length === 0) {
    site.innerHTML = '<option value="">All sites</option>' + S.map(x => `<option value="${x.id}">${e(x.name)}</option>`).join('');
  }
  if (org && org.options.length === 0) {
    org.innerHTML = '<option value="">All organisations</option><option value="internal">School/Internal</option>' + H.map(x => `<option value="${x.id}">${e(x.name)}</option>`).join('');
  }
}
function resetRecurringFilters() {
  if ($('rbSearch')) $('rbSearch').value = '';
  if ($('rbSite')) $('rbSite').value = '';
  if ($('rbOrg')) $('rbOrg').value = '';
  if ($('rbStatus')) $('rbStatus').value = 'active';
  renderRecurringBookings();
}
function manageProgramme(id) {
  OPEN_PROG = OPEN_PROG === id ? null : id;
  renderRecurringBookings();
}
function renderRecurringBookings() {
  let host = $('rProg');
  if (!host) return;
  recurringFilterOptions();
  let days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  let q = ($('rbSearch')?.value || '').trim().toLowerCase(), site = $('rbSite')?.value || '', org = $('rbOrg')?.value || '', status = $('rbStatus')?.value || 'active';
  let rows = G.filter(x => {
    let active = x.active !== false;
    if (status === 'active' && !active) return false;
    if (status === 'archived' && active) return false;
    if (site && x.site_id !== site) return false;
    if (org === 'internal' && x.hirer_id) return false;
    if (org && org !== 'internal' && x.hirer_id !== org) return false;
    if (q && !`${x.name || ''} ${sn(x.site_id)} ${hn(x.hirer_id) || 'school internal'}`.toLowerCase().includes(q)) return false;
    return true;
  }).sort((a, b) => (sn(a.site_id) + hn(a.hirer_id) + (a.name || '')).localeCompare(sn(b.site_id) + hn(b.hirer_id) + (b.name || '')));
  host.innerHTML = rows.map(x => {
    let sessions = RS.filter(r => r.programme_id === x.id && r.active !== false), breaks = BR.filter(r => r.programme_id === x.id), ex = EX.filter(r => r.programme_id === x.id), open = OPEN_PROG === x.id, active = x.active !== false;
    let manage = '';
    if (open) {
      let sessionRows = sessions.length ? sessions.map(r => {
        let hrs = sessionHours(r.start_time, r.end_time), ct = r.charge_type || 'chargeable', total = r.rate == null ? null : Number(r.rate) * hrs;
        return `<div class="term-row"><div class="term-label">${e(days[r.day_of_week] || 'Day')} ${String(r.start_time || '').slice(0, 5)}–${String(r.end_time || '').slice(0, 5)}<div class="muted">${e((r.title || 'Swimming lessons').trim())}<div class="muted">${r.pool_use_type === 'lanes' ? r.lane_count + ' lane' + (Number(r.lane_count) === 1 ? '' : 's') : r.pool_use_type === 'other' ? 'Other pool allocation' : 'Whole pool'}</div></div></div><div class="term-date">${ct !== 'chargeable' ? `<span class="charge-badge ${ct === 'internal_school_use' ? 'internal' : 'foc'}">${ct === 'internal_school_use' ? 'Internal school use' : 'Free of charge'}</span>` : r.rate == null ? '<span class="charge-badge">Rate not set</span>' : `<strong>£${Number(r.rate).toFixed(2)}/hr</strong><div class="muted">${hrs.toFixed(hrs % 1 ? 2 : 0)} hr${hrs === 1 ? '' : 's'} · £${total.toFixed(2)} per session · ${r.vat_applicable ? 'VAT applies' : 'No VAT'}</div>`}</div><div class="term-actions"><button class="link" onclick="editSession('${r.id}','${x.id}')">Edit</button> · <button class="link" onclick="delSession('${r.id}')">Delete</button></div></div>`;
      }).join('') : '<div class="rb-empty">No weekly sessions added yet.</div>';
      let breakRows = breaks.length ? breaks.map(r => `<div class="term-row"><div class="term-label">${e(r.name || 'Break')}<div class="muted">All sessions paused</div></div><div class="term-date">${e(ukDate(r.starts_on) + (r.ends_on && r.ends_on !== r.starts_on ? ' → ' + ukDate(r.ends_on) : ''))}</div><div class="term-actions"><button class="link" onclick="editBreak('${r.id}','${x.id}')">Edit</button> · <button class="link" onclick="delBreak('${r.id}')">Delete</button></div></div>`).join('') : '<div class="rb-empty">No breaks added.</div>';
      let exRows = ex.length ? ex.map(r => {
        let sess = RS.find(s => s.id === r.session_id), label = sess ? `${days[sess.day_of_week]} ${String(sess.start_time || '').slice(0, 5)}–${String(sess.end_time || '').slice(0, 5)}` : 'Whole day';
        return `<div class="term-row"><div class="term-label">${e(label)}<div class="muted">Cancelled${r.notes ? ' — ' + e(r.notes) : ''}</div></div><div class="term-date">${e(ukDate(r.exception_date))}</div><div class="term-actions"><button class="link" onclick="editCancellation('${r.id}','${x.id}')">Edit</button> · <button class="link" onclick="delCancellation('${r.id}')">Delete</button></div></div>`;
      }).join('') : '<div class="rb-empty">No one-off cancellations.</div>';
      manage = `<div class="rb-manage"><div class="rb-manage-grid"><div class="rb-section"><div class="rb-section-head"><span>Weekly sessions</span><div class="actions"><button class="s" onclick="editMultiSession('${x.id}')">+ Add multiple days</button><button class="s" onclick="editSession(null,'${x.id}')">+ Add weekly session</button></div></div>${sessionRows}</div><div class="rb-section"><div class="rb-section-head"><span>Breaks</span><button class="s" onclick="editBreak(null,'${x.id}')">+ Add break</button></div>${breakRows}</div><div class="rb-section"><div class="rb-section-head"><span>Cancellations</span><button class="s" onclick="editCancellation(null,'${x.id}')">+ Cancel session / day</button></div>${exRows}</div></div></div>`;
    }
    return `<div class="rb-item"><div class="rb-summary"><div><div class="rb-name">${e(hn(x.hirer_id) || 'School/Internal')}</div><div class="rb-sub">${e(x.name || 'Recurring booking')}</div></div><div><b>${e(sn(x.site_id))}</b><div class="rb-sub">${shortUk(x.starts_on)} → ${shortUk(x.ends_on)}</div></div><div class="rb-counts"><span class="pill">${sessions.length} session${sessions.length === 1 ? '' : 's'}</span><span class="pill">${breaks.length} break${breaks.length === 1 ? '' : 's'}</span><span class="pill">${ex.length} cancellation${ex.length === 1 ? '' : 's'}</span><span class="rb-status ${active ? 'active' : 'archived'}">${active ? 'Active' : 'Archived'}</span></div><div class="rb-actions"><button class="p" onclick="manageProgramme('${x.id}')">${open ? 'Close' : 'Manage'}</button><button class="s" onclick="editProgramme('${x.id}')">Edit</button><button class="s" onclick="toggleProgrammeArchive('${x.id}',${active})">${active ? 'Archive' : 'Restore'}</button></div></div>${manage}</div>`;
  }).join('') || '<div class="card">No recurring bookings match these filters.</div>';
}
async function toggleProgrammeArchive(id, isActive) {
  let {error} = await sb.from('recurring_programmes').update({
    active: !isActive
  }).eq('id', id);
  if (error) return alert(error.message);
  if (isActive && OPEN_PROG === id) OPEN_PROG = null;
  await load();
}


;
/* source: app-2.js */
function ukDate(v) {
  if (!v) return '';
  let d = new Date(v + 'T12:00:00');
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}
function shortUk(v) {
  if (!v) return '';
  let d = new Date(v + 'T12:00:00');
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}
function termFor(v) {
  if (!v) return 'Other dates';
  let m = Number(v.slice(5, 7));
  if (m >= 8) return 'Autumn';
  if (m <= 3) return 'Spring';
  return 'Summer';
}
function termTitle(term, year) {
  if (term === 'Autumn') return `Autumn Term ${year.starts_on ? year.starts_on.slice(0, 4) : ''}`;
  if (term === 'Spring') return `Spring Term ${year.ends_on ? year.ends_on.slice(0, 4) : ''}`;
  if (term === 'Summer') return `Summer Term ${year.ends_on ? year.ends_on.slice(0, 4) : ''}`;
  return 'Other Dates';
}
function prettyType(v) {
  let map = {
    half_term: 'Half term',
    exeat: 'Exeat',
    christmas_holiday: 'Christmas holiday',
    easter_holiday: 'Easter holiday',
    summer_holiday: 'Summer holiday',
    inset_day: 'Staff INSET',
    bank_holiday: 'Bank holiday',
    term: 'Term',
    other: 'Other'
  };
  return map[v] || String(v || '').replaceAll('_', ' ');
}
function termKind(d) {
  let n = String(d.name || '').toLowerCase();
  if (n.includes('autumn')) return 'Autumn';
  if (n.includes('spring')) return 'Spring';
  if (n.includes('summer')) return 'Summer';
  return termFor(d.starts_on);
}
function renderTermDates() {
  let host = $('termDates');
  if (!host) return;
  host.innerHTML = Y.map(y => {
    let items = D.filter(d => d.academic_year_id === y.id).sort((a, b) => String(a.starts_on).localeCompare(String(b.starts_on)));
    let termRows = items.filter(d => d.period_type === 'term'), keyRows = items.filter(d => d.period_type !== 'term');
    let groups = ['Autumn', 'Spring', 'Summer'].map(term => {
      let tr = termRows.find(d => termKind(d) === term);
      let rows = keyRows.filter(d => termFor(d.starts_on) === term);
      let heading = tr ? `<div class="term-heading"><div><strong>${e(termTitle(term, y))}</strong><div class="muted">${e(shortUk(tr.starts_on))} → ${e(shortUk(tr.ends_on))}</div></div><button class="link" onclick="editTerm('${tr.id}')">Edit term</button></div>` : `<div class="term-heading"><strong>${e(termTitle(term, y))}</strong><button class="link" onclick="editTerm(null,'${y.id}','${term}')">+ Add ${term} term dates</button></div>`;
      let body = rows.length ? rows.map(d => {
        let dates = d.starts_on === d.ends_on ? ukDate(d.starts_on) : `${ukDate(d.starts_on)} → ${ukDate(d.ends_on)}`;
        return `<div class="term-row"><div class="term-label">${e(d.name || prettyType(d.period_type))}<div class="muted">${e(prettyType(d.period_type))}</div></div><div class="term-date">${e(dates)}</div><div class="term-actions"><button class="link" onclick="editDate('${d.id}')">Edit</button></div></div>`;
      }).join('') : `<div class="term-empty">No ${term.toLowerCase()} key dates added yet.</div>`;
      return `<div class="term-panel">${heading}${body}</div>`;
    }).join('');
    let other = keyRows.filter(d => !['Autumn', 'Spring', 'Summer'].includes(termFor(d.starts_on)));
    let otherHtml = other.length ? `<div class="term-panel"><div class="term-heading"><strong>Other dates</strong></div>${other.map(d => {
      let dates = d.starts_on === d.ends_on ? ukDate(d.starts_on) : `${ukDate(d.starts_on)} → ${ukDate(d.ends_on)}`;
      return `<div class="term-row"><div class="term-label">${e(d.name || prettyType(d.period_type))}<div class="muted">${e(prettyType(d.period_type))}</div></div><div class="term-date">${e(dates)}</div><div class="term-actions"><button class="link" onclick="editDate('${d.id}')">Edit</button></div></div>`;
    }).join('')}</div>` : '';
    return `<div class="term-year"><div class="term-year-head"><h2>${e(sn(y.site_id))} — ${e(y.name)}</h2><span class="meta">${shortUk(y.starts_on)} → ${shortUk(y.ends_on)}</span><span class="year-actions"><button class="link" onclick="editYear('${y.id}')">Edit academic year</button><button class="link" onclick="editTerm(null,'${y.id}')">Add term</button><button class="link" onclick="editDate()">Add key date</button></span></div>${groups}${otherHtml}</div>`;
  }).join('') || '<div class="card">No academic years have been added yet.</div>';
}
function opts(a, val, label) {
  return a.map(x => `<option value="${x.id}" ${x.id === val ? 'selected' : ''}>${e(label(x))}</option>`).join('');
}
function modal(title, html, save) {
  $('mt').textContent = title;
  $('mf').innerHTML = html;
  $('ms').onclick = save;
  $('modal').classList.add('on');
}
function closeM() {
  $('modal').classList.remove('on');
}
function editSite(id) {
  let x = S.find(z => z.id === id) || ({});
  modal(id ? 'Edit site' : 'Add site', `<label>Name<input id=f1 value="${e(x.name)}"></label><label>Town<input id=f2 value="${e(x.town)}"></label><label>Postcode<input id=f3 value="${e(x.postcode)}"></label>`, async () => {
    let p = {
      organisation_id: P.organisation_id,
      name: f1.value.trim(),
      town: f2.value || null,
      postcode: f3.value || null
    }, q = id ? sb.from('sites').update(p).eq('id', id) : sb.from('sites').insert(p);
    let {error} = await q;
    if (error) return alert(error.message);
    closeM();
    load();
  });
}
function canManageHirers() {
  return ['owner_admin', 'operations_admin'].includes(String(P?.role || ''));
}
function editHirer(id) {
  if (!canManageHirers()) return alert('You do not have permission to manage hirers.');
  let x = H.find(z => z.id === id) || ({});
  modal(id ? 'Edit hirer' : 'Add hirer', `<label>Name<input id=f1 value="${e(x.name)}" required></label><label>Email<input id=f2 type=email value="${e(x.billing_email)}"></label><label>Phone<input id=f3 value="${e(x.phone)}"></label><label>VAT<select id=f4><option value=false ${!x.vat_registered ? 'selected' : ''}>No</option><option value=true ${x.vat_registered ? 'selected' : ''}>Yes</option></select></label>`, async () => {
    let name = f1.value.trim(), email = f2.value.trim();
    if (!name) return alert('Enter the hirer name.');
    if (email && !f2.checkValidity()) return alert('Enter a valid email address.');
    let p = {
      organisation_id: P.organisation_id,
      name,
      billing_email: email || null,
      phone: f3.value.trim() || null,
      vat_registered: f4.value === 'true'
    }, q = id ? sb.from('hirers').update(p).eq('id', id) : sb.from('hirers').insert(p);
    let {error} = await q;
    if (error) return alert(error.message);
    closeM();
    load();
  });
}
async function hirerUsage(id) {
  let checks = [['bookings', 'hirer_id', 'booking'], ['recurring_programmes', 'hirer_id', 'recurring booking'], ['school_invoice_batches', 'hirer_id', 'billing statement'], ['lifeguard_service_entries', 'customer_hirer_id', 'staffing charge'], ['recurring_staffing_services', 'customer_hirer_id', 'recurring staffing rule']], results = await Promise.all(checks.map(async ([table, column, label]) => {
    let {count, error} = await sb.from(table).select('id', {
      count: 'exact',
      head: true
    }).eq(column, id);
    return {
      label,
      count: count || 0,
      error
    };
  })), failed = results.find(x => x.error);
  if (failed) throw new Error('The system could not safely check linked records: ' + failed.error.message);
  return results.filter(x => x.count > 0);
}
async function deleteHirer(id) {
  if (!canManageHirers()) return alert('You do not have permission to manage hirers.');
  let x = H.find(z => z.id === id);
  if (!x) return alert('Hirer not found.');
  let used;
  try {
    used = await hirerUsage(id);
  } catch (err) {
    return alert(err.message);
  }
  if (used.length) return alert(`${x.name} cannot be deleted because it is linked to ${used.map(z => `${z.count} ${z.label}${z.count === 1 ? '' : 's'}`).join(', ')}. Remove or reassign those records first.`);
  if (!confirm(`Delete ${x.name}?\n\nThis cannot be undone.`)) return;
  let {error} = await sb.from('hirers').delete().eq('id', id);
  if (error) return alert('Hirer could not be deleted: ' + error.message);
  await load();
}
function editStaff(id) {
  let x = T.find(z => z.id === id) || ({});
  modal(id ? 'Edit staff' : 'Add staff', `<label>First name<input id=f1 value="${e(x.first_name)}"></label><label>Last name<input id=f2 value="${e(x.last_name)}"></label><label>Email<input id=f3 value="${e(x.email)}"></label><label>Phone<input id=f4 value="${e(x.phone)}"></label><label>Role<input id=f5 value="${e(x.primary_role)}"></label><label>Employment<select id=f6>${['hourly_employee', 'salaried_full_time', 'salaried_part_time', 'casual_zero_hours', 'self_employed', 'contractor', 'volunteer', 'other'].map(v => `<option value=${v} ${x.employment_status === v ? 'selected' : ''}>${v.replaceAll('_', ' ')}</option>`).join('')}</select></label>`, async () => {
    let p = {
      organisation_id: P.organisation_id,
      first_name: f1.value.trim(),
      last_name: f2.value.trim(),
      email: f3.value || null,
      phone: f4.value || null,
      primary_role: f5.value || null,
      employment_status: f6.value
    }, q = id ? sb.from('staff').update(p).eq('id', id) : sb.from('staff').insert(p);
    let {error} = await q;
    if (error) return alert(error.message);
    closeM();
    load();
  });
}
function editYear(id) {
  let x = Y.find(z => z.id === id) || ({});
  modal(id ? 'Edit academic year' : 'Add academic year', `<label>Site<select id=f1>${opts(S, x.site_id, z => z.name)}</select></label><label>Name<input id=f2 value="${e(x.name)}"></label><label>Start<input id=f3 type=date value="${x.starts_on || ''}"></label><label>End<input id=f4 type=date value="${x.ends_on || ''}"></label>`, async () => {
    let p = {
      site_id: f1.value,
      name: f2.value.trim(),
      starts_on: f3.value,
      ends_on: f4.value
    }, q = id ? sb.from('academic_years').update(p).eq('id', id) : sb.from('academic_years').insert(p);
    let {error} = await q;
    if (error) return alert(error.message);
    closeM();
    load();
  });
}
function editTerm(id, yearId, preset) {
  let x = D.find(z => z.id === id) || ({});
  let yr = Y.find(z => z.id === (yearId || x.academic_year_id));
  let inferred = preset || termKind(x) || 'Autumn';
  modal(id ? 'Edit term' : 'Add term', `<label>Academic year<select id=f1>${opts(Y, yearId || x.academic_year_id, z => sn(z.site_id) + ' — ' + z.name)}</select></label><label>Term<select id=f2>${['Autumn', 'Spring', 'Summer'].map(v => `<option value="${v}" ${inferred === v ? 'selected' : ''}>${v} Term</option>`).join('')}</select></label><label>Start<input id=f3 type=date value="${x.starts_on || ''}"></label><label>End<input id=f4 type=date value="${x.ends_on || ''}"></label>`, async () => {
    let yy = Y.find(z => z.id === f1.value);
    let suffix = f2.value === 'Autumn' ? (yy?.starts_on || '').slice(0, 4) : (yy?.ends_on || '').slice(0, 4);
    let p = {
      academic_year_id: f1.value,
      period_type: 'term',
      name: `${f2.value} Term${suffix ? ' ' + suffix : ''}`,
      starts_on: f3.value,
      ends_on: f4.value,
      blocks_internal_sessions: false,
      blocks_external_hire: false
    }, q = id ? sb.from('academic_calendar_periods').update(p).eq('id', id) : sb.from('academic_calendar_periods').insert(p);
    let {error} = await q;
    if (error) return alert(error.message);
    closeM();
    load();
  });
}
function editDate(id) {
  let x = D.find(z => z.id === id) || ({});
  let types = ['half_term', 'exeat', 'christmas_holiday', 'easter_holiday', 'summer_holiday', 'inset_day', 'bank_holiday', 'other'];
  modal(id ? 'Edit key school date' : 'Add key school date', `<label>Academic year<select id=f1>${opts(Y, x.academic_year_id, z => sn(z.site_id) + ' — ' + z.name)}</select></label><label>Type<select id=f2>${types.map(v => `<option value=${v} ${x.period_type === v ? 'selected' : ''}>${v.replaceAll('_', ' ')}</option>`).join('')}</select></label><label>Name<input id=f3 value="${e(x.name)}"></label><label>Start<input id=f4 type=date value="${x.starts_on || ''}"></label><label>End<input id=f5 type=date value="${x.ends_on || ''}"></label><label>Notes<textarea id=f6>${e(x.operational_notes)}</textarea></label>`, async () => {
    let p = {
      academic_year_id: f1.value,
      period_type: f2.value,
      name: f3.value.trim(),
      starts_on: f4.value,
      ends_on: f5.value,
      blocks_internal_sessions: false,
      blocks_external_hire: false,
      operational_notes: f6.value || null
    }, q = id ? sb.from('academic_calendar_periods').update(p).eq('id', id) : sb.from('academic_calendar_periods').insert(p);
    let {error} = await q;
    if (error) return alert(error.message);
    closeM();
    load();
  });
}
function editBooking(id, preset) {
  let x = B.find(z => z.id === id) || ({}), internal = preset === 'internal' || x.booking_type === 'school_internal';
  let ct = x.charge_type || (internal ? 'internal_school_use' : 'chargeable');
  modal(id ? 'Edit booking' : internal ? 'Add school event' : 'Add single booking', `<label>Site<select id=f1>${opts(S, x.site_id, z => z.name)}</select></label><label>Booking use<select id=f2><option value=external ${!internal ? 'selected' : ''}>External / other booking</option><option value=internal ${internal ? 'selected' : ''}>School / internal use</option></select></label><label>Organisation<select id=f3><option value="">School/Internal</option>${opts(H, x.hirer_id, z => z.name)}</select></label><label>Booking name<input id=f4 value="${e(x.title)}" placeholder="e.g. Gala, Club hire, Swimming lessons"></label><label>Date<input id=f5 type=date value="${x.booking_date || ''}"></label><label>Start<input id=f6 type=time value="${String(x.start_time || '').slice(0, 5)}"></label><label>End<input id=f7 type=time value="${String(x.end_time || '').slice(0, 5)}"></label><label>Charge type<select id=f8><option value=chargeable ${ct === 'chargeable' ? 'selected' : ''}>Chargeable</option><option value=free_of_charge ${ct === 'free_of_charge' ? 'selected' : ''}>Free of charge</option><option value=internal_school_use ${ct === 'internal_school_use' ? 'selected' : ''}>Internal school use</option></select></label><label>Hourly rate (£/hour)<input id=f9 type=number min=0 step=0.01 value="${x.rate ?? ''}" placeholder="0.00"></label><label>VAT<select id=f10><option value=false ${!x.vat_applicable ? 'selected' : ''}>No VAT</option><option value=true ${x.vat_applicable ? 'selected' : ''}>VAT applies</option></select></label><label>FOC / internal reason<textarea id=f11 placeholder="Optional reason for free or school use">${e(x.foc_reason || '')}</textarea></label>`, async () => {
    let i = f2.value === 'internal', charge = i ? 'internal_school_use' : f8.value, p = {
      site_id: f1.value,
      hirer_id: i ? null : f3.value || null,
      booking_type: i ? 'school_internal' : 'external_hire',
      booking_category: i ? null : 'other',
      external_category: i ? null : 'other',
      title: f4.value.trim(),
      booking_date: f5.value,
      start_time: f6.value,
      end_time: f7.value,
      status: x.status || 'confirmed',
      rate: charge === 'chargeable' && f9.value !== '' ? Number(f9.value) : null,
      vat_applicable: charge === 'chargeable' && f10.value === 'true',
      charge_type: charge,
      foc_reason: charge === 'chargeable' ? null : f11.value || null,
      created_by: x.created_by || P.id
    }, q = id ? sb.from('bookings').update(p).eq('id', id) : sb.from('bookings').insert(p);
    let {error} = await q;
    if (error) return alert(error.message);
    closeM();
    load();
  });
}


;
/* source: app-3.js */
function newRecurringWizard() {
  let sessions = [], breaks = [], exceptions = [], breakMode = 'single', step = 1;
  const draw = () => {
    let body = `<div class="wizard-steps">${[1, 2, 3, 4, 5].map((n, i) => `<span class="wizard-step ${step === n ? 'on' : ''}">${n}. ${['Details', 'Timetable', 'Pricing & pool use', 'Breaks & Exceptions', 'Review'][i]}</span>`).join('')}</div>`;
    if (step === 1) body += `<label>Site<select id=wSite>${opts(S, details.site_id || null, z => z.name)}</select></label><label>Organisation<select id=wOrg><option value="" ${details.hirer_id ? '' : 'selected'}>School/Internal</option>${opts(H, details.hirer_id || null, z => z.name)}</select></label><label>Booking name<input id=wName value="${e(details.name || '')}" placeholder="e.g. Pool Hire 2026/27"></label><label>Start date<input id=wStart type=date value="${e(details.starts_on || '')}"></label><label>End date<input id=wEnd type=date value="${e(details.ends_on || '')}"></label><label>Notes<textarea id=wNotes>${e(details.notes || '')}</textarea></label>`;
    if (step === 2) body += `<div class="wizard-block"><h3>Weekly timetable</h3><p class="muted">Add one pattern for days that share the same time. You can add another pattern for a second session on the same day.</p><div class="wizard-days">${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => `<label><input type=checkbox name=wday value=${i}>${d}</label>`).join('')}</div><div class="cols"><label>Start<input id=wST type=time></label><label>End<input id=wET type=time></label></div><label>Description<input id=wDesc value="Swimming lessons"></label><button type=button class=s onclick="wizardAddSession()">+ Add pattern</button><div id=wSessionList></div></div>`;
    if (step === 3) body += `<div class="wizard-block"><h3>Pricing & pool allocation</h3><p class="muted">Set these separately for each weekly pattern.</p><div id=wPriceList></div></div>`;
    if (step === 4) body += `<div class="wizard-block"><h3>Breaks & Exceptions</h3><p class="muted">Use a break when all sessions stop. Use a session cancellation when only one specific weekly session should not run.</p>
<div class="booking-tabs" style="margin:10px 0 14px">
<button type=button class="booking-tab active" id=wModeSingle onclick="wizardBreakMode('single')">Single-day break</button>
<button type=button class="booking-tab" id=wModeRange onclick="wizardBreakMode('range')">Date-range break</button>
<button type=button class="booking-tab" id=wModeSession onclick="wizardBreakMode('session')">Cancel one session</button>
</div>
<div id=wBreakEditor></div>
<div id=wBreakList></div>
<div id=wExceptionList></div>
</div>`;
    if (step === 5) body += `<div class="wizard-review" id=wReview></div>`;
    body += `<div class="wizard-actions">${step > 1 ? '<button type=button class=s id=wBack>Back</button>' : ''}${step < 5 ? '<button type=button class=p id=wNext>Next</button>' : '<button type=button class=p id=wFinish>Save recurring booking</button>'}</div>`;
    $('mf').innerHTML = body;
    $('ms').style.display = 'none';
    if (step === 2) renderWizardSessions();
    if (step === 3) renderWizardPrices();
    if (step === 4) renderWizardBreaks();
    if (step === 5) renderWizardReview();
    if ($('wBack')) $('wBack').onclick = () => {
      captureWizard();
      step--;
      draw();
    };
    if ($('wNext')) $('wNext').onclick = () => {
      if (!captureWizard(true)) return;
      step++;
      draw();
    };
    if ($('wFinish')) $('wFinish').onclick = finishWizard;
  };
  let details = {};
  window.wizardAddSession = () => {
    let days = [...document.querySelectorAll('input[name=wday]:checked')].map(x => Number(x.value));
    if (!days.length) return alert('Select at least one day.');
    if (!$('wST').value || !$('wET').value || $('wET').value <= $('wST').value) return alert('Enter a valid start and end time.');
    sessions.push({
      days,
      start: $('wST').value,
      end: $('wET').value,
      title: $('wDesc').value.trim() || 'Swimming lessons',
      charge_type: 'chargeable',
      rate: '',
      vat: false,
      pool_use_type: 'whole_pool',
      lane_count: ''
    });
    document.querySelectorAll('input[name=wday]').forEach(x => x.checked = false);
    $('wST').value = '';
    $('wET').value = '';
    renderWizardSessions();
  };
  window.wizardRemoveSession = i => {
    sessions.splice(i, 1);
    renderWizardSessions();
  };
  window.wizardBreakMode = mode => {
    breakMode = mode;
    renderBreakEditor();
  };
  window.wizardAddBreak = () => {
    if (!$('wBF')?.value) return alert('Enter the break date.');
    let end = breakMode === 'single' ? $('wBF').value : $('wBT')?.value || $('wBF').value;
    if (end < $('wBF').value) return alert('The end date cannot be before the start date.');
    breaks.push({
      name: $('wBN').value.trim() || (breakMode === 'single' ? 'Single-day break' : 'Break'),
      starts_on: $('wBF').value,
      ends_on: end
    });
    renderWizardBreaks();
    renderBreakEditor();
  };
  window.wizardRemoveBreak = i => {
    breaks.splice(i, 1);
    renderWizardBreaks();
  };
  window.wizardRefreshSessionChoices = () => {
    let date = $('wXD')?.value, sel = $('wXS');
    if (!sel) return;
    let day = date ? new Date(date + 'T12:00:00').getDay() : null;
    sel.innerHTML = '<option value="">Choose session</option>' + sessions.map((s, i) => ({
      s,
      i
    })).filter(x => day !== null && x.s.days.includes(day)).map(x => `<option value=${x.i}>${x.s.start}–${x.s.end} · ${e(x.s.title)}</option>`).join('');
    if (date && sel.options.length === 1) sel.innerHTML += '<option value="" disabled>No sessions scheduled on this date</option>';
  };
  window.wizardAddException = () => {
    let date = $('wXD')?.value, sidx = Number($('wXS')?.value);
    if (!date) return alert('Choose the cancellation date first.');
    if (!Number.isInteger(sidx) || !sessions[sidx]) return alert('Choose the session to cancel.');
    let day = new Date(date + 'T12:00:00').getDay();
    if (!sessions[sidx].days.includes(day)) return alert('That session does not run on the selected date.');
    exceptions.push({
      exception_date: date,
      session_index: sidx,
      notes: $('wXN')?.value.trim() || ''
    });
    renderWizardBreaks();
    renderBreakEditor();
  };
  window.wizardRemoveException = i => {
    exceptions.splice(i, 1);
    renderWizardBreaks();
  };
  function renderWizardSessions() {
    let h = $('wSessionList');
    if (h) h.innerHTML = sessions.map((s, i) => `<div class="wizard-session"><b>${s.days.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}</b><span>${s.start}–${s.end}</span><span>${e(s.title)}</span><button class=link onclick="wizardRemoveSession(${i})">Remove</button></div>`).join('') || '<div class="rb-empty">No patterns added yet.</div>';
  }
  function renderWizardPrices() {
    let h = $('wPriceList');
    if (!h) return;
    h.innerHTML = sessions.map((s, i) => `<div class="wizard-block" style="margin:8px 0"><b>${s.days.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')} · ${s.start}–${s.end}</b><div class=cols><label>Charge type<select data-i=${i} data-k=charge_type><option value=chargeable ${s.charge_type === 'chargeable' ? 'selected' : ''}>Chargeable</option><option value=free_of_charge ${s.charge_type === 'free_of_charge' ? 'selected' : ''}>Free of charge</option><option value=internal_school_use ${s.charge_type === 'internal_school_use' ? 'selected' : ''}>Internal school use</option></select></label><label>Hourly rate (£/hour)<input data-i=${i} data-k=rate type=number min=0 step=.01 value="${s.rate}"></label><label>VAT<select data-i=${i} data-k=vat><option value=false ${!s.vat ? 'selected' : ''}>No VAT</option><option value=true ${s.vat ? 'selected' : ''}>VAT applies</option></select></label><label>Pool use<select data-i=${i} data-k=pool_use_type><option value=whole_pool ${s.pool_use_type === 'whole_pool' ? 'selected' : ''}>Whole pool</option><option value=lanes ${s.pool_use_type === 'lanes' ? 'selected' : ''}>Number of lanes</option><option value=other ${s.pool_use_type === 'other' ? 'selected' : ''}>Other</option></select></label><label>Number of lanes<input data-i=${i} data-k=lane_count type=number min=1 step=1 value="${s.lane_count}"></label></div></div>`).join('');
  }
  function renderBreakEditor() {
    let h = $('wBreakEditor');
    if (!h) return;
    ['wModeSingle', 'wModeRange', 'wModeSession'].forEach(id => $(id)?.classList.remove('active'));
    $(breakMode === 'single' ? 'wModeSingle' : breakMode === 'range' ? 'wModeRange' : 'wModeSession')?.classList.add('active');
    if (breakMode === 'single') h.innerHTML = `<div class="wizard-break"><input id=wBN placeholder="Reason/name, e.g. Bank Holiday"><input id=wBF type=date><span></span><button type=button class=s onclick="wizardAddBreak()">Add single day</button></div>`; else if (breakMode === 'range') h.innerHTML = `<div class="wizard-break"><input id=wBN placeholder="Break name, e.g. Christmas Holiday"><input id=wBF type=date><input id=wBT type=date><button type=button class=s onclick="wizardAddBreak()">Add date range</button></div>`; else h.innerHTML = `<div class="wizard-break"><input id=wXD type=date onchange="wizardRefreshSessionChoices()"><select id=wXS><option value="">Choose date first</option></select><input id=wXN placeholder="Reason / notes"><button type=button class=s onclick="wizardAddException()">Cancel session</button></div><div class="muted" style="margin-top:6px">Choose the date first. Only sessions that actually run on that day will then be available to cancel.</div>`;
  }
  function renderWizardBreaks() {
    renderBreakEditor();
    let h = $('wBreakList');
    if (h) h.innerHTML = `<h4 style="margin:14px 0 6px">Breaks</h4>` + (breaks.map((b, i) => `<div class="wizard-session"><b>${e(b.name)}</b><span>${shortUk(b.starts_on)}</span><span>${b.ends_on === b.starts_on ? 'Single day' : shortUk(b.ends_on)}</span><button class=link onclick="wizardRemoveBreak(${i})">Remove</button></div>`).join('') || '<div class="rb-empty">No breaks added.</div>');
    let x = $('wExceptionList');
    if (x) x.innerHTML = `<h4 style="margin:14px 0 6px">Individual session cancellations</h4>` + (exceptions.map((z, i) => {
      let s = sessions[z.session_index];
      return `<div class="wizard-session"><b>${shortUk(z.exception_date)}</b><span>${s ? s.days.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ') + ' · ' + s.start + '–' + s.end : 'Session'}</span><span>${e(z.notes || 'Cancelled')}</span><button class=link onclick="wizardRemoveException(${i})">Remove</button></div>`;
    }).join('') || '<div class="rb-empty">No individual session cancellations added.</div>');
  }
  function renderWizardReview() {
    let h = $('wReview');
    if (!h) return;
    h.innerHTML = `<h3>${e(hn(details.hirer_id) || 'School/Internal')}</h3><b>${e(details.name)}</b><p>${shortUk(details.starts_on)} → ${shortUk(details.ends_on)}</p><h4>Weekly timetable</h4>${sessions.map(s => `<div>${s.days.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')} · ${s.start}–${s.end} · ${s.pool_use_type === 'lanes' ? s.lane_count + ' lanes' : s.pool_use_type.replaceAll('_', ' ')} · ${s.charge_type === 'chargeable' ? s.rate ? '£' + Number(s.rate).toFixed(2) + '/hr' : 'Rate not set' : s.charge_type.replaceAll('_', ' ')}</div>`).join('')}<h4>Breaks</h4>${breaks.length ? breaks.map(b => `<div>${e(b.name)} · ${shortUk(b.starts_on)}${b.ends_on !== b.starts_on ? ' → ' + shortUk(b.ends_on) : ' (single day)'}</div>`).join('') : 'None added'}<h4>Individual session cancellations</h4>${exceptions.length ? exceptions.map(z => {
      let s = sessions[z.session_index];
      return `<div>${shortUk(z.exception_date)} · ${s ? s.days.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ') + ' ' + s.start + '–' + s.end : 'Session'}${z.notes ? ' · ' + e(z.notes) : ''}</div>`;
    }).join('') : 'None added'}`;
  }
  function captureWizard(validate = false) {
    if (step === 1) {
      details = {
        site_id: $('wSite').value,
        hirer_id: $('wOrg').value || null,
        name: $('wName').value.trim(),
        starts_on: $('wStart').value,
        ends_on: $('wEnd').value,
        notes: $('wNotes').value || null
      };
      if (validate && (!details.site_id || !details.name || !details.starts_on || !details.ends_on)) {
        alert('Complete the booking details and dates.');
        return false;
      }
    }
    if (step === 2 && validate && !sessions.length) {
      alert('Add at least one weekly timetable pattern.');
      return false;
    }
    if (step === 3) {
      document.querySelectorAll('[data-i][data-k]').forEach(el => {
        let s = sessions[Number(el.dataset.i)], k = el.dataset.k, v = el.value;
        if (k === 'vat') v = v === 'true';
        s[k] = v;
      });
      if (validate) {
        let bad = sessions.find(s => s.pool_use_type === 'lanes' && (!s.lane_count || Number(s.lane_count) < 1));
        if (bad) {
          alert('Enter the number of lanes for lane bookings.');
          return false;
        }
      }
    }
    return true;
  }
  async function finishWizard() {
    captureWizard();
    let programme = {
      site_id: details.site_id,
      academic_year_id: null,
      hirer_id: details.hirer_id,
      name: details.name,
      booking_type: details.hirer_id ? 'external_hire' : 'school_internal',
      external_category: details.hirer_id ? 'other' : null,
      holiday_policy: null,
      starts_on: details.starts_on,
      ends_on: details.ends_on,
      notes: details.notes,
      created_by: P.id
    };
    let {data: pg, error} = await sb.from('recurring_programmes').insert(programme).select().single();
    if (error) return alert(error.message);
    let rows = [];
    sessions.forEach(s => s.days.forEach(day => rows.push({
      programme_id: pg.id,
      day_of_week: day,
      start_time: s.start,
      end_time: s.end,
      title: s.title,
      rate: s.charge_type === 'chargeable' && s.rate !== '' ? Number(s.rate) : null,
      vat_applicable: s.charge_type === 'chargeable' && !!s.vat,
      charge_type: s.charge_type,
      foc_reason: null,
      pool_use_type: s.pool_use_type,
      lane_count: s.pool_use_type === 'lanes' ? Number(s.lane_count) : null,
      active: true
    })));
    let createdSessions = [];
    if (rows.length) {
      let r = await sb.from('recurring_programme_sessions').insert(rows).select();
      if (r.error) return alert('Booking created, but sessions need attention: ' + r.error.message);
      createdSessions = r.data || [];
    }
    if (breaks.length) {
      let r = await sb.from('recurring_programme_breaks').insert(breaks.map(b => ({
        ...b,
        programme_id: pg.id,
        notes: null
      })));
      if (r.error) return alert('Booking created, but breaks need attention: ' + r.error.message);
    }
    if (exceptions.length) {
      let exRows = [];
      exceptions.forEach(z => {
        let pattern = sessions[z.session_index];
        if (!pattern) return;
        let day = new Date(z.exception_date + 'T12:00:00').getDay();
        let match = createdSessions.find(cs => Number(cs.day_of_week) === Number(day) && String(cs.start_time || '').slice(0, 5) === pattern.start && String(cs.end_time || '').slice(0, 5) === pattern.end);
        if (match) exRows.push({
          programme_id: pg.id,
          session_id: match.id,
          exception_date: z.exception_date,
          exception_type: 'cancelled',
          notes: z.notes || null
        });
      });
      if (exRows.length) {
        let r = await sb.from('recurring_programme_session_exceptions').insert(exRows);
        if (r.error) return alert('Booking created, but session cancellations need attention: ' + r.error.message);
      }
    }
    closeM();
    $('ms').style.display = '';
    OPEN_PROG = pg.id;
    await load();
    setBookingTab('recurring');
  }
  modal('Create recurring booking', '', () => {});
  draw();
}


;
/* source: app-4.js */
function editProgramme(id) {
  let x = G.find(z => z.id === id) || ({});
  modal(id ? 'Edit recurring booking' : 'Add recurring booking', `<label>Site<select id=f1>${opts(S, x.site_id, z => z.name)}</select></label><label>Organisation<select id=f2><option value="">School/Internal</option>${opts(H, x.hirer_id, z => z.name)}</select></label><label>Booking name<input id=f3 value="${e(x.name)}" placeholder="e.g. ABC Swim School"></label><label>Start date<input id=f4 type=date value="${x.starts_on || ''}"></label><label>End date<input id=f5 type=date value="${x.ends_on || ''}"></label><label>Notes<textarea id=f6>${e(x.notes)}</textarea></label>`, async () => {
    let p = {
      site_id: f1.value,
      academic_year_id: null,
      hirer_id: f2.value || null,
      name: f3.value.trim(),
      booking_type: f2.value ? 'external_hire' : 'school_internal',
      external_category: f2.value ? 'other' : null,
      holiday_policy: null,
      starts_on: f4.value,
      ends_on: f5.value,
      notes: f6.value || null,
      created_by: x.created_by || P.id
    }, q = id ? sb.from('recurring_programmes').update(p).eq('id', id) : sb.from('recurring_programmes').insert(p);
    let {error} = await q;
    if (error) return alert(error.message);
    closeM();
    load();
  });
}
function editSession(id, pid) {
  let x = RS.find(z => z.id === id) || ({});
  let p = G.find(z => z.id === (pid || x.programme_id));
  let ct = x.charge_type || 'chargeable';
  modal(id ? 'Edit weekly session' : 'Add weekly session', `<label>Recurring booking<input value="${e(p?.name || '')}" disabled></label><label>Day<select id=f1>${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d, i) => `<option value=${i} ${Number(x.day_of_week) === i ? 'selected' : ''}>${d}</option>`).join('')}</select></label><label>Start time<input id=f2 type=time value="${String(x.start_time || '').slice(0, 5)}"></label><label>End time<input id=f3 type=time value="${String(x.end_time || '').slice(0, 5)}"></label><label>Session description<input id=f4 value="${e(x.title || 'Swimming lessons')}" placeholder="e.g. Swimming lessons"></label><label>Charge type<select id=f7><option value=chargeable ${ct === 'chargeable' ? 'selected' : ''}>Chargeable</option><option value=free_of_charge ${ct === 'free_of_charge' ? 'selected' : ''}>Free of charge</option><option value=internal_school_use ${ct === 'internal_school_use' ? 'selected' : ''}>Internal school use</option></select></label><label>Hourly rate (£/hour)<input id=f5 type=number min=0 step=0.01 value="${x.rate ?? ''}" placeholder="0.00"></label><label>VAT<select id=f6><option value=false ${!x.vat_applicable ? 'selected' : ''}>No VAT</option><option value=true ${x.vat_applicable ? 'selected' : ''}>VAT applies</option></select></label><label>Pool use<select id=f9><option value=whole_pool ${!x.pool_use_type || x.pool_use_type === 'whole_pool' ? 'selected' : ''}>Whole pool</option><option value=lanes ${x.pool_use_type === 'lanes' ? 'selected' : ''}>Number of lanes</option><option value=other ${x.pool_use_type === 'other' ? 'selected' : ''}>Other</option></select></label><label>Number of lanes<input id=f10 type=number min=1 step=1 value="${x.lane_count ?? ''}" placeholder="Only when Number of lanes is selected"></label><label>FOC / internal reason<textarea id=f8>${e(x.foc_reason || '')}</textarea></label>`, async () => {
    let ct = f7.value, pay = {
      programme_id: pid || x.programme_id,
      day_of_week: Number(f1.value),
      start_time: f2.value,
      end_time: f3.value,
      title: f4.value.trim() || 'Swimming lessons',
      rate: ct === 'chargeable' && f5.value !== '' ? Number(f5.value) : null,
      vat_applicable: ct === 'chargeable' && f6.value === 'true',
      charge_type: ct,
      foc_reason: ct === 'chargeable' ? null : f8.value || null,
      pool_use_type: f9.value,
      lane_count: f9.value === 'lanes' && f10.value ? Number(f10.value) : null,
      active: true
    }, q = id ? sb.from('recurring_programme_sessions').update(pay).eq('id', id) : sb.from('recurring_programme_sessions').insert(pay);
    let {error} = await q;
    if (error) return alert(error.message);
    closeM();
    load();
  });
}
function editMultiSession(pid) {
  let p = G.find(z => z.id === pid);
  let dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  modal('Add sessions on multiple days', `<label>Recurring booking<input value="${e(p?.name || '')}" disabled></label><div class="multi-days"><div class="muted" style="margin-bottom:8px">Select every day that uses the same time, rate and VAT setting.</div>${dayNames.map((d, i) => `<label class="day-check"><input type=checkbox name=multiDay value=${i} ${i >= 1 && i <= 5 ? 'checked' : ''}> ${d}</label>`).join('')}</div><label>Start time<input id=mf2 type=time></label><label>End time<input id=mf3 type=time></label><label>Session description<input id=mf4 value="Swimming lessons" placeholder="e.g. Swimming lessons"></label><label>Charge type<select id=mf7><option value=chargeable>Chargeable</option><option value=free_of_charge>Free of charge</option><option value=internal_school_use>Internal school use</option></select></label><label>Hourly rate (£/hour)<input id=mf5 type=number min=0 step=0.01 placeholder="0.00"></label><label>VAT<select id=mf6><option value=false>No VAT</option><option value=true>VAT applies</option></select></label><label>Pool use<select id=mf9><option value=whole_pool>Whole pool</option><option value=lanes>Number of lanes</option><option value=other>Other</option></select></label><label>Number of lanes<input id=mf10 type=number min=1 step=1 placeholder="Only when Number of lanes is selected"></label><label>FOC / internal reason<textarea id=mf8></textarea></label>`, async () => {
    let selected = [...document.querySelectorAll('input[name=multiDay]:checked')].map(x => Number(x.value));
    if (!selected.length) return alert('Select at least one day.');
    if (!mf2.value || !mf3.value) return alert('Enter a start and end time.');
    if (mf3.value <= mf2.value) return alert('End time must be after start time.');
    let duplicates = selected.filter(d => RS.some(r => r.programme_id === pid && r.active !== false && Number(r.day_of_week) === d && String(r.start_time || '').slice(0, 5) === mf2.value && String(r.end_time || '').slice(0, 5) === mf3.value));
    if (duplicates.length && !confirm(`${duplicates.map(d => dayNames[d]).join(', ')} already ${duplicates.length === 1 ? 'has' : 'have'} a session at this time. Add duplicate session${duplicates.length === 1 ? '' : 's'} anyway?`)) return;
    let ct = mf7.value, rows = selected.map(day => ({
      programme_id: pid,
      day_of_week: day,
      start_time: mf2.value,
      end_time: mf3.value,
      title: mf4.value.trim() || 'Swimming lessons',
      rate: ct === 'chargeable' && mf5.value !== '' ? Number(mf5.value) : null,
      vat_applicable: ct === 'chargeable' && mf6.value === 'true',
      charge_type: ct,
      foc_reason: ct === 'chargeable' ? null : mf8.value || null,
      pool_use_type: mf9.value,
      lane_count: mf9.value === 'lanes' && mf10.value ? Number(mf10.value) : null,
      active: true
    }));
    let {error} = await sb.from('recurring_programme_sessions').insert(rows);
    if (error) return alert(error.message);
    closeM();
    load();
  });
}
function editBreak(id, pid) {
  let x = BR.find(z => z.id === id) || ({});
  let p = G.find(z => z.id === (pid || x.programme_id));
  modal(id ? 'Edit break' : 'Add break', `<label>Recurring booking<input value="${e(p?.name || '')}" disabled></label><label>Break name<input id=f1 value="${e(x.name)}" placeholder="e.g. October Half Term"></label><label>From<input id=f2 type=date value="${x.starts_on || ''}"></label><label>To<input id=f3 type=date value="${x.ends_on || x.starts_on || ''}"></label><label>Notes<textarea id=f4>${e(x.notes)}</textarea></label>`, async () => {
    let pay = {
      programme_id: pid || x.programme_id,
      name: f1.value.trim(),
      starts_on: f2.value,
      ends_on: f3.value || f2.value,
      notes: f4.value || null
    }, q = id ? sb.from('recurring_programme_breaks').update(pay).eq('id', id) : sb.from('recurring_programme_breaks').insert(pay);
    let {error} = await q;
    if (error) return alert(error.message);
    closeM();
    load();
  });
}
function editCancellation(id, pid) {
  let x = EX.find(z => z.id === id) || ({});
  let programmeId = pid || x.programme_id;
  let sess = RS.filter(s => s.programme_id === programmeId && s.active !== false);
  modal(id ? 'Edit cancellation' : 'Cancel session / day', `<label>Date<input id=f1 type=date value="${x.exception_date || ''}"></label><label>What to cancel<select id=f2><option value="" ${!x.session_id ? 'selected' : ''}>All sessions on this day</option>${sess.map(s => `<option value="${s.id}" ${x.session_id === s.id ? 'selected' : ''}>${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][s.day_of_week]} ${String(s.start_time || '').slice(0, 5)}–${String(s.end_time || '').slice(0, 5)} ${e(s.title || '')}</option>`).join('')}</select></label><label>Reason / notes<textarea id=f3>${e(x.notes)}</textarea></label>`, async () => {
    let pay = {
      programme_id: programmeId,
      session_id: f2.value || null,
      exception_date: f1.value,
      exception_type: 'cancelled',
      notes: f3.value || null
    }, q = id ? sb.from('recurring_programme_session_exceptions').update(pay).eq('id', id) : sb.from('recurring_programme_session_exceptions').insert(pay);
    let {error} = await q;
    if (error) return alert(error.message);
    closeM();
    load();
  });
}
async function delProgramme(id) {
  if (!confirm('Delete this recurring booking and all its weekly sessions, breaks and cancellations?')) return;
  let {error} = await sb.from('recurring_programmes').delete().eq('id', id);
  if (error) return alert(error.message);
  load();
}
async function delSession(id) {
  if (!confirm('Delete this weekly session?')) return;
  let {error} = await sb.from('recurring_programme_sessions').delete().eq('id', id);
  if (error) return alert(error.message);
  load();
}
async function delBreak(id) {
  if (!confirm('Delete this break?')) return;
  let {error} = await sb.from('recurring_programme_breaks').delete().eq('id', id);
  if (error) return alert(error.message);
  load();
}
async function delCancellation(id) {
  if (!confirm('Delete this cancellation?')) return;
  let {error} = await sb.from('recurring_programme_session_exceptions').delete().eq('id', id);
  if (error) return alert(error.message);
  load();
}
$('signin').onclick = login;
$('refresh').onclick = load;
$('signout').onclick = async () => {
  await sb.auth.signOut();
  location.reload();
};
document.querySelectorAll('[data-v]').forEach(b => b.onclick = () => {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('on'));
  $(b.dataset.v).classList.add('on');
});
(async () => {
  let {data: {session}} = await sb.auth.getSession();
  if (session) await enter(session.user);
})();

