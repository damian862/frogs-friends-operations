(function () {
  const restrictionText = "Your account is restricted to this school's pool operations.";
  const profile = () => (typeof P !== 'undefined' ? P : window.P);
  const sites = () => (typeof S !== 'undefined' ? S : window.S);

  function isOperationalViewer() {
    return String(profile()?.role || '').toLowerCase() === 'operational_viewer';
  }

  function assignedSiteName() {
    const homeId = profile()?.home_site_id;
    const list = sites();
    const fromData = Array.isArray(list) ? list.find(s => s.id === homeId)?.name : '';
    const fromSelector = document.getElementById('calSite')?.selectedOptions?.[0]?.textContent || '';
    return fromData || fromSelector || 'Your school';
  }

  function tidyRestrictionCopy() {
    if (!isOperationalViewer()) return;
    const candidates = [...document.querySelectorAll('.main *')].filter(el => {
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text.includes('Your account is restricted') || !text.includes('pool operations')) return false;
      return ![...el.children].some(child => {
        const childText = (child.textContent || '').replace(/\s+/g, ' ').trim();
        return childText.includes('Your account is restricted') && childText.includes('pool operations');
      });
    });
    const target = candidates[0];
    if (!target) return;
    const site = assignedSiteName();
    if (target.classList.contains('viewer-restriction-copy') && target.querySelector('b')?.textContent === site) return;
    target.classList.add('viewer-restriction-copy');
    const safeSite = typeof e === 'function' ? e(site) : site;
    target.innerHTML = `<b>${safeSite}</b><span>${restrictionText}</span>`;
  }

  function tidyOrganisationLabel() {
    if (!isOperationalViewer()) return;
    const select = document.getElementById('calOrg');
    if (!select?.options?.length) return;
    const allOption = [...select.options].find(option => option.value === '') || select.options[0];
    if (allOption) allOption.textContent = 'All booked organisations';
  }

  function apply() {
    if (!isOperationalViewer()) return;
    tidyRestrictionCopy();
    tidyOrganisationLabel();
  }

  const style = document.createElement('style');
  style.textContent = '.viewer-restriction-copy{display:block;line-height:1.45;margin:8px 0 14px}.viewer-restriction-copy b,.viewer-restriction-copy span{display:block}.viewer-restriction-copy span{color:#526575;margin-top:2px}';
  document.head.appendChild(style);

  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      apply();
    });
  }

  function applyAfter(name) {
    const original = window[name];
    if (typeof original !== 'function' || original.__viewerLabelsWrapped) return;
    function wrapped() {
      const result = original.apply(this, arguments);
      if (result && typeof result.then === 'function') {
        return result.finally(schedule);
      }
      schedule();
      return result;
    }
    wrapped.__viewerLabelsWrapped = true;
    window[name] = wrapped;
  }

  ['enter', 'render', 'renderBookingCalendar', 'setBookingTab', 'calendarAnchorChanged', 'setCalendarMode'].forEach(applyAfter);
  window.addEventListener('load', schedule);
  document.addEventListener('change', event => {
    if (event.target?.id === 'calSite' || event.target?.id === 'calOrg' || event.target?.id === 'calTerm') schedule();
  });
  schedule();
})();
