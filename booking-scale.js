/* Load booking history beyond the fast initial 500-row page only when needed. */
(function () {
  const PAGE_SIZE = 500;
  let loading = false;
  let complete = false;
  let enquiryFallbackRows = [];
  let enquiryFallbackSites = [];
  let enquiryFallbackMemberships = [];

  const esc = value => String(value ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const shortTime = value => String(value || '').slice(0, 5);
  const ORGANISATION_WIDE_ENQUIRY_ROLES = new Set(['owner_admin', 'operations_admin']);
  const canManageCommercialEnquiries = siteId => {
    try {
      if (ORGANISATION_WIDE_ENQUIRY_ROLES.has(String(typeof P !== 'undefined' && P ? P.role || '' : ''))) return true;
    } catch (_) {}
    return enquiryFallbackMemberships.some(m => m.can_edit_bookings === true && (!siteId || m.site_id === siteId));
  };
  window.canManageCommercialSite = canManageCommercialEnquiries;
  window.getCommercialAccessibleSites = () => enquiryFallbackSites.filter(site => canManageCommercialEnquiries(site.id));
  const siteName = id => {
    const fallback = enquiryFallbackSites.find(x => x.id === id)?.name;
    if (fallback) return fallback;
    try { return (S || []).find(x => x.id === id)?.name || ''; } catch (_) { return ''; }
  };
  const hirerName = id => {
    try { return (H || []).find(x => x.id === id)?.name || ''; } catch (_) { return ''; }
  };
  const ukDate = value => {
    if (!value) return '';
    return new Date(value + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  function ensureCommercialEnquiriesPanel() {
    if (document.getElementById('commercialEnquiries')) return;
    const host = document.getElementById('bookingTabCalendar');
    if (!host) return;
    let role = '';
    try { role = String(typeof P !== 'undefined' && P ? P.role || '' : ''); } catch (_) {}
    if (role === 'operational_viewer') return;
    const panel = document.createElement('section');
    panel.id = 'commercialEnquiries';
    panel.className = 'commercial-enquiries';
    panel.innerHTML = '<div class="commercial-head"><div><h2>Commercial enquiries</h2><p>Track pool-hire opportunities, temporary holds and conversion into confirmed bookings.</p></div><button type="button" class="p" onclick="newCommercialEnquiry()">+ Add enquiry</button></div><div class="commercial-kpis" id="commercialEnquiryKpis"></div><div class="commercial-toolbar"><label>Status<select id="commercialStatus"><option value="open">Open enquiries & holds</option><option value="enquiry">Enquiries</option><option value="held">On hold</option><option value="expired">Expired holds</option><option value="converted">Converted</option><option value="lost">Lost</option><option value="archived">Archived</option><option value="all">All</option></select></label><label>Site<select id="commercialSite"><option value="">All accessible sites</option></select></label></div><div id="commercialEnquiryList" class="commercial-list"><div class="muted">Loading enquiries…</div></div>';
    host.appendChild(panel);
    setTimeout(() => {
      try { window.dispatchEvent(new Event('load')); } catch (_) {}
    }, 0);
  }

  function renderCommercialEnquiryFallback() {
    const list = document.getElementById('commercialEnquiryList');
    const kpis = document.getElementById('commercialEnquiryKpis');
    const statusEl = document.getElementById('commercialStatus');
    const siteEl = document.getElementById('commercialSite');
    if (!list || !kpis || !statusEl || !siteEl) return;

    const status = statusEl.value || 'open';
    const site = siteEl.value || '';
    const now = Date.now();
    const open = enquiryFallbackRows.filter(x => ['enquiry', 'held'].includes(x.status));
    const expiredHolds = enquiryFallbackRows.filter(x => x.status === 'held' && x.hold_until && new Date(x.hold_until).getTime() < now);
    const holds = enquiryFallbackRows.filter(x => x.status === 'held' && !expiredHolds.includes(x));
    const expiring = holds.filter(x => x.hold_until && new Date(x.hold_until).getTime() <= now + 48 * 3600000);
    kpis.innerHTML = `<div><span>Open opportunities</span><b>${open.length}</b></div><div><span>Active holds</span><b>${holds.length}</b></div><div><span>Holds due within 48h</span><b>${expiring.length}</b></div><div><span>Expired holds</span><b>${expiredHolds.length}</b></div>`;

    const rows = enquiryFallbackRows.filter(x => {
      if (site && x.site_id !== site) return false;
      if (status === 'open' && !['enquiry', 'held'].includes(x.status)) return false;
      if (status === 'expired' && !expiredHolds.includes(x)) return false;
      if (!['all', 'open', 'expired'].includes(status) && x.status !== status) return false;
      return true;
    });

    list.innerHTML = rows.length ? rows.map(x => {
      const who = hirerName(x.hirer_id) || x.contact_name || 'Prospective hirer';
      const canArchive = ['converted', 'lost', 'cancelled'].includes(x.status);
      const canManage = canManageCommercialEnquiries(x.site_id);
      const edit = canManage && typeof window.editCommercialEnquiry === 'function' ? `<button class="s" onclick="editCommercialEnquiry('${x.id}')">Edit</button>` : '';
      const hold = canManage && x.status === 'enquiry' && typeof window.holdCommercialEnquiry === 'function' ? `<button class="s" onclick="holdCommercialEnquiry('${x.id}')">Place hold</button>` : '';
      const convert = canManage && ['enquiry', 'held'].includes(x.status) && typeof window.convertCommercialEnquiry === 'function' ? `<button class="p" onclick="convertCommercialEnquiry('${x.id}')">Convert to booking</button>` : '';
      const lost = canManage && ['enquiry', 'held'].includes(x.status) && typeof window.closeCommercialEnquiry === 'function' ? `<button class="link" onclick="closeCommercialEnquiry('${x.id}','lost')">Lost</button>` : '';
      const archive = canArchive ? `<button class="link" onclick="archiveCommercialEnquiryFallback('${x.id}')">Archive</button>` : '';
      return `<div class="commercial-row"><div><b>${esc(x.enquiry_title)}</b><span>${esc(who)}</span></div><div><b>${esc(ukDate(x.requested_date))}</b><span>${shortTime(x.start_time)}–${shortTime(x.end_time)} · ${esc(siteName(x.site_id))}</span></div><div><span class="commercial-status ${esc(x.status)}">${esc(x.status)}</span></div><div class="commercial-actions">${edit}${hold}${convert}${lost}${archive}</div></div>`;
    }).join('') : '<div class="commercial-empty">No enquiries match this selection.</div>';
  }

  async function loadCommercialEnquiriesFallback(force = false) {
    ensureCommercialEnquiriesPanel();
    const list = document.getElementById('commercialEnquiryList');
    if (!list) return;
    if (typeof window.refreshCommercialEnquiries === 'function') {
      await window.refreshCommercialEnquiries();
      return;
    }
    if (!force && !list.textContent.includes('Loading enquiries')) return;
    try {
      let userId = '';
      try { userId = typeof P !== 'undefined' && P ? P.id || '' : ''; } catch (_) {}
      if (!userId) return;
      const [enquiryResult, siteResult, membershipResult] = await Promise.all([
        sb.rpc('visible_commercial_enquiries'),
        sb.from('sites').select('id,name').order('name'),
        sb.from('site_memberships').select('site_id,can_edit_bookings').eq('user_id', userId)
      ]);
      if (enquiryResult.error) throw enquiryResult.error;
      if (siteResult.error) throw siteResult.error;
      if (membershipResult.error) throw membershipResult.error;
      enquiryFallbackRows = enquiryResult.data || [];
      enquiryFallbackSites = siteResult.data || [];
      enquiryFallbackMemberships = membershipResult.data || [];
      const accessibleSites = window.getCommercialAccessibleSites();
      const siteEl = document.getElementById('commercialSite');
      if (siteEl) {
        const current = siteEl.value;
        siteEl.innerHTML = '<option value="">All accessible sites</option>' + accessibleSites.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
        if ([...siteEl.options].some(o => o.value === current)) siteEl.value = current;
        siteEl.onchange = renderCommercialEnquiryFallback;
      }
      const statusEl = document.getElementById('commercialStatus');
      if (statusEl) statusEl.onchange = renderCommercialEnquiryFallback;
      renderCommercialEnquiryFallback();
    } catch (err) {
      list.innerHTML = `<div class="err">${esc(err?.message || err)}</div>`;
    }
  }

  window.archiveCommercialEnquiryFallback = async function (id) {
    if (!confirm('Archive this enquiry? It will remain available under the Archived filter.')) return;
    try {
      const result = await sb.from('pool_hire_enquiries').update({ status: 'archived', hold_until: null, updated_at: new Date().toISOString() }).eq('id', id);
      if (result.error) throw result.error;
      await loadCommercialEnquiriesFallback(true);
      const statusEl = document.getElementById('commercialStatus');
      if (statusEl) {
        statusEl.value = 'archived';
        renderCommercialEnquiryFallback();
      }
    } catch (err) {
      alert(err?.message || String(err));
    }
  };

  async function refreshFullBookingHistoryIfNeeded(force = false) {
    if (force) complete = false;
    if (loading || complete || typeof B === 'undefined' || !Array.isArray(B)) return;
    if (B.length < PAGE_SIZE) {
      complete = true;
      return;
    }

    loading = true;
    try {
      const countResult = await sb.from('bookings').select('id', { count: 'exact', head: true });
      if (countResult.error) throw countResult.error;
      const total = Number(countResult.count || 0);
      if (total <= B.length) {
        complete = true;
        return;
      }

      const all = [];
      for (let from = 0; from < total; from += PAGE_SIZE) {
        const result = await sb.from('bookings')
          .select('*')
          .order('booking_date', { ascending: false })
          .order('created_at', { ascending: false })
          .range(from, Math.min(from + PAGE_SIZE - 1, total - 1));
        if (result.error) throw result.error;
        all.push(...(result.data || []));
        if ((result.data || []).length < PAGE_SIZE) break;
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      B = all;
      complete = true;
      if (document.getElementById('k4')) document.getElementById('k4').textContent = String(B.length);
      if (typeof renderBookingTables === 'function') renderBookingTables();
      if (typeof renderIncomeSummary === 'function') renderIncomeSummary();
      if (typeof renderBookingCalendar === 'function' && document.getElementById('bookingTabCalendar')?.classList.contains('on')) {
        renderBookingCalendar();
      }
    } catch (err) {
      console.warn('Additional booking history could not be loaded', err);
    } finally {
      loading = false;
    }
  }

  function schedule(force = false) {
    ensureCommercialEnquiriesPanel();
    setTimeout(() => refreshFullBookingHistoryIfNeeded(force), 0);
    setTimeout(() => loadCommercialEnquiriesFallback(force), 900);
  }

  const app = document.getElementById('app');
  if (app) {
    new MutationObserver(() => {
      if (!app.classList.contains('hide')) schedule(false);
    }).observe(app, { attributes: true, attributeFilter: ['class'] });
  }

  document.addEventListener('click', event => {
    if (event.target?.id === 'refresh') schedule(true);
    if (event.target?.dataset?.btab === 'calendar') setTimeout(() => {
      ensureCommercialEnquiriesPanel();
      loadCommercialEnquiriesFallback(false);
    }, 900);
  }, true);

  window.addEventListener('commercial-enquiry-saved', () => {
    setTimeout(() => loadCommercialEnquiriesFallback(true), 0);
  });

  window.addEventListener('load', () => schedule(false));
  schedule(false);
})();
