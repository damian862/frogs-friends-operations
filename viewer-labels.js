(function () {
  const restrictionText = "Your account is restricted to this school's pool operations.";
  function isOperationalViewer() {
    return String(window.P?.role || window.P?.role || '').toLowerCase() === 'operational_viewer';
  }
  function assignedSiteName() {
    const homeId = window.P?.home_site_id;
    const fromData = Array.isArray(window.S) ? window.S.find(s => s.id === homeId)?.name : '';
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
    target.classList.add('viewer-restriction-copy');
    target.innerHTML = `<b>${typeof e === 'function' ? e(site) : site}</b><span>${restrictionText}</span>`;
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
  window.addEventListener('load', () => setTimeout(apply, 0));
  const observer = new MutationObserver(() => requestAnimationFrame(apply));
  observer.observe(document.body, {childList:true,subtree:true});
  setTimeout(apply, 0);
})();
