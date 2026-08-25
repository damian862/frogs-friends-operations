/* Load booking history beyond the fast initial 500-row page only when needed. */
(function () {
  const PAGE_SIZE = 500;
  let loading = false;
  let complete = false;

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
    panel.innerHTML = '<div class="commercial-head"><div><h2>Commercial enquiries</h2><p>Track pool-hire opportunities, temporary holds and conversion into confirmed bookings.</p></div><button type="button" class="p" onclick="newCommercialEnquiry()">+ Add enquiry</button></div><div class="commercial-kpis" id="commercialEnquiryKpis"></div><div class="commercial-toolbar"><label>Status<select id="commercialStatus"><option value="open">Open enquiries & holds</option><option value="enquiry">Enquiries</option><option value="held">On hold</option><option value="converted">Converted</option><option value="lost">Lost</option><option value="archived">Archived</option><option value="all">All</option></select></label><label>Site<select id="commercialSite"><option value="">All accessible sites</option></select></label></div><div id="commercialEnquiryList" class="commercial-list"><div class="muted">Loading enquiries…</div></div>';
    host.appendChild(panel);
    setTimeout(() => {
      try { window.dispatchEvent(new Event('load')); } catch (_) {}
    }, 0);
  }

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
  }

  const app = document.getElementById('app');
  if (app) {
    new MutationObserver(() => {
      if (!app.classList.contains('hide')) schedule(false);
    }).observe(app, { attributes: true, attributeFilter: ['class'] });
  }

  document.addEventListener('click', event => {
    if (event.target?.id === 'refresh') schedule(true);
    if (event.target?.dataset?.btab === 'calendar') setTimeout(ensureCommercialEnquiriesPanel, 0);
  }, true);

  window.addEventListener('load', () => schedule(false));
  schedule(false);
})();
