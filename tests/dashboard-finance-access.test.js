const fs = require('fs');
const assert = require('assert');

const js = fs.readFileSync('dashboard-reporting.js', 'utf8');
const bookings = fs.readFileSync('bookings.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

assert(js.includes("dashboardFinanceRoles = new Set(['owner_admin', 'operations_admin', 'site_manager', 'lettings_manager', 'finance', 'bursar'])"), 'operational finance dashboard must be limited to finance-enabled roles');
assert(js.includes("if(!canViewDashboardFinance()){ panel.style.display='none'; return false; }"), 'non-finance roles, including Pool Manager, must not see the operational finance dashboard');
assert(!js.includes("dashboardFinanceRoles = new Set(['pool_manager'"), 'Pool Manager must not be granted broad dashboard finance access');
assert(html.includes('dashboard-reporting.js?v=20260902-1'), 'dashboard reporting cache key must be refreshed');
assert(bookings.includes("if (role() !== 'pool_manager') return;"), 'Pool Manager must receive the restricted billing-only view');
assert(bookings.includes("x.textContent = 'Monthly Billing Check'"), 'Pool Manager finance tab must be labelled for its limited purpose');
assert(bookings.includes("reportControls.style.display = 'none'"), 'Pool Manager must not see general income reporting controls');
assert(bookings.includes("incomeSummary.style.display = 'none'"), 'Pool Manager must not see general usage and income summaries');
assert(bookings.includes("staffingServices.style.display = 'none'"), 'Pool Manager must not see staffing income reporting');
assert(bookings.includes("collapseButton.lastChild.nodeValue = ' Monthly Billing Check'"), 'the collapsible section must use the restricted billing label');
assert(html.includes('bookings.js?v=20260902-2'), 'bookings cache key must be refreshed');

console.log('dashboard finance access tests passed');
