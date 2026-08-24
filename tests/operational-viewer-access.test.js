const fs=require('fs');
const assert=require('assert');
const viewer=fs.readFileSync('viewer-access.js','utf8');
const labels=fs.readFileSync('viewer-labels.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const invite=fs.readFileSync('supabase/functions/invite-operations-user/index.ts','utf8');

assert(viewer.includes("operational_viewer"),'viewer role must be detected');
assert(viewer.includes("v.id === 'bookings'") || viewer.includes("v.id==='bookings'"),'viewer must be forced into Bookings');
assert(viewer.includes("v.id === 'bookingTabCalendar'") || viewer.includes("v.id==='bookingTabCalendar'"),'viewer must be forced into Calendar');
assert(viewer.includes('#bookingTabIncome'),'primary viewer policy must hide finance panel');
assert(labels.includes("bookingTabIncome"),'viewer privacy guard must explicitly suppress Pool Usage & Income');
assert(labels.includes("roleText === 'operational viewer'"),'viewer privacy guard must survive transient runtime profile state');
assert(!labels.includes('dashboard-lifecycle.js'),'viewer labels must not load deleted dashboard lifecycle helper');
assert(index.includes("location.hostname!=='frogs-friends-operations.vercel.app'"),'production must not redirect away from itself');
assert(invite.includes('https://frogs-friends-operations.vercel.app/?invite=1'),'invitations must target the stable production URL');
assert(invite.includes('operational_viewer:{can_view_finance:false,can_edit_bookings:false,can_manage_events:false}'),'viewer membership must be read-only and exclude finance');
console.log('operational viewer access tests passed');
