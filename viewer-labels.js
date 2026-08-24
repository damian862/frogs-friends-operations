(function () {
  function isOperationalViewer() {
    const roleText = (document.getElementById('role')?.textContent || '').trim().toLowerCase();
    return document.body.classList.contains('operational-viewer') || roleText === 'operational viewer';
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

  let observer;
  function attachObserver() {
    const select = document.getElementById('calOrg');
    if (!select) return;
    if (observer) observer.disconnect();
    observer = new MutationObserver(relabelOrganisationFilter);
    observer.observe(select, {childList: true, subtree: true});
    relabelOrganisationFilter();
  }

  const bodyObserver = new MutationObserver(() => {
    attachObserver();
    relabelOrganisationFilter();
  });
  bodyObserver.observe(document.body, {childList: true, subtree: true, attributes: true, attributeFilter: ['class']});

  window.addEventListener('load', () => {
    attachObserver();
    relabelOrganisationFilter();
    setTimeout(relabelOrganisationFilter, 100);
    setTimeout(relabelOrganisationFilter, 500);
  });

  document.addEventListener('change', event => {
    if (['calSite', 'calOrg', 'calTerm'].includes(event.target?.id)) relabelOrganisationFilter();
  });

  if (!document.querySelector('script[data-booking-scale]')) {
    const script = document.createElement('script');
    script.src = 'booking-scale.js?v=20260824-1';
    script.dataset.bookingScale = '1';
    document.head.appendChild(script);
  }

  attachObserver();
  relabelOrganisationFilter();
})();
