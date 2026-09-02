const fs = require('fs');
const assert = require('assert');

const js = fs.readFileSync('dashboard-reporting.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

assert(js.includes("dashboardFinanceRoles = new Set(['owner_admin', 'operations_admin', 'site_manager', 'lettings_manager', 'finance', 'bursar'])"), 'operational finance dashboard must be limited to finance-enabled roles');
assert(js.includes("if(!canViewDashboardFinance()){ panel.style.display='none'; return false; }"), 'non-finance roles, including Pool Manager, must not see the operational finance dashboard');
assert(!js.includes("dashboardFinanceRoles = new Set(['pool_manager'"), 'Pool Manager must not be granted broad dashboard finance access');
assert(html.includes('dashboard-reporting.js?v=20260902-1'), 'dashboard reporting cache key must be refreshed');

console.log('dashboard finance access tests passed');
