(function () {
  function isOperationalViewer() {
    const roleText = (document.getElementById('role')?.textContent || '').trim().toLowerCase();
    return document.body.classList.contains('operational-viewer') || roleText === 'operational viewer';
  }

  const style = document.createElement('style');
  style.textContent = `
    body.operational-viewer #bookingTabIncome,
    body.operational-viewer [data-btab="income"],
    body.operational-viewer #incomeSummary,
    body.operational-viewer .income-grid,
    body.operational-viewer .monthly-staffing-summary,
    body.operational-viewer #lgRows,
    body.operational-viewer #billingRows,
    body.operational-viewer #financeQueue { display:none!important; }
  `;
  document.head.appendChild(style);

  function enforceViewerPrivacy() {
    const viewer = isOperationalViewer();
    document.body.classList.toggle('operational-viewer', viewer);
    if (!viewer) return;
    ['bookingTabIncome', 'incomeSummary', 'lgRows', 'billingRows', 'financeQueue'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.setProperty('display', 'none', 'important');
    });
    document.querySelectorAll('[data-btab="income"], .monthly-staffing-summary').forEach(el => {
      el.style.setProperty('display', 'none', 'important');
    });
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
    observer = new MutationObserver(() => {
      relabelOrganisationFilter();
      enforceViewerPrivacy();
    });
    observer.observe(select, {childList: true, subtree: true});
    relabelOrganisationFilter();
  }

  const bodyObserver = new MutationObserver(() => {
    attachObserver();
    relabelOrganisationFilter();
    enforceViewerPrivacy();
  });
  bodyObserver.observe(document.body, {childList: true, subtree: true, attributes: true, attributeFilter: ['class']});

  window.addEventListener('load', () => {
    attachObserver();
    relabelOrganisationFilter();
    enforceViewerPrivacy();
    setTimeout(() => { relabelOrganisationFilter(); enforceViewerPrivacy(); }, 100);
    setTimeout(() => { relabelOrganisationFilter(); enforceViewerPrivacy(); }, 500);
  });

  document.addEventListener('change', event => {
    if (['calSite', 'calOrg', 'calTerm', 'calAnchor'].includes(event.target?.id)) {
      relabelOrganisationFilter();
      enforceViewerPrivacy();
    }
  });

  document.addEventListener('click', () => {
    if (isOperationalViewer()) setTimeout(enforceViewerPrivacy, 0);
  }, true);

  attachObserver();
  relabelOrganisationFilter();
  enforceViewerPrivacy();
})();
