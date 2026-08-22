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
    const matches = [...document.querySelectorAll('.main *')].filter(el => {
      const text = (el.textContent || '').trim();
      if (!text.includes(restrictionText)) return false;
      return ![...el.children].some(child => (child.textContent || '').includes(restrictionText));
    });
    const target = matches[0];
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
    if (select?.options?.length && select.options[0].textContent === 'All organisations') {
      select.options[0].textContent = 'All booked organisations';
    }
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
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      apply();
    });
  };
  window.addEventListener('load', schedule);
  const observer = new MutationObserver(schedule);
  observer.observe(document.body, {childList:true,subtree:true});
  schedule();
})();
