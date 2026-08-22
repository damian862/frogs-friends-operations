(function () {
  const profile = () => (typeof P !== 'undefined' ? P : window.P);

  function isOperationalViewer() {
    return String(profile()?.role || '').toLowerCase() === 'operational_viewer';
  }

  function relabelOrganisationFilter() {
    if (!isOperationalViewer()) return;
    const select = document.getElementById('calOrg');
    if (!select?.options?.length) return;
    const allOption = [...select.options].find(option => option.value === '') || select.options[0];
    if (allOption && allOption.textContent !== 'All booked organisations') {
      allOption.textContent = 'All booked organisations';
    }
  }

  function schedule() {
    requestAnimationFrame(relabelOrganisationFilter);
  }

  function wrapAfter(name) {
    const original = window[name];
    if (typeof original !== 'function' || original.__viewerOrgLabelWrapped) return;
    function wrapped() {
      const result = original.apply(this, arguments);
      if (result && typeof result.then === 'function') {
        return result.finally(schedule);
      }
      schedule();
      return result;
    }
    wrapped.__viewerOrgLabelWrapped = true;
    window[name] = wrapped;
  }

  ['renderBookingCalendar', 'render', 'enter', 'setBookingTab', 'calendarAnchorChanged', 'setCalendarMode'].forEach(wrapAfter);

  const select = document.getElementById('calOrg');
  if (select) {
    new MutationObserver(schedule).observe(select, {childList: true, subtree: true});
  }
  window.addEventListener('load', schedule);
  document.addEventListener('change', event => {
    if (['calSite', 'calOrg', 'calTerm'].includes(event.target?.id)) schedule();
  });
  schedule();
})();
