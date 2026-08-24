/* Ensure dashboard reporting refreshes after restored or fresh authenticated sessions. */
(function () {
  let timer = null;

  function dashboardIsActive() {
    return document.getElementById('dash')?.classList.contains('on');
  }

  function triggerReportingRefresh(delay = 80) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!dashboardIsActive()) return;
      const button = document.querySelector('button[data-v="dash"]');
      if (!button) return;
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }, delay);
  }

  const app = document.getElementById('app');
  if (app) {
    new MutationObserver(() => {
      if (!app.classList.contains('hide')) triggerReportingRefresh(120);
    }).observe(app, { attributes: true, attributeFilter: ['class'] });

    if (!app.classList.contains('hide')) triggerReportingRefresh(120);
  }

  document.addEventListener('change', event => {
    if (event.target?.id === 'siteScope' || event.target?.id === 'siteSelect') {
      triggerReportingRefresh(100);
    }
  });

  window.addEventListener('pageshow', () => triggerReportingRefresh(120));
})();
