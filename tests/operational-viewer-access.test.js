const fs=require('fs');
const assert=require('assert');
const viewer=fs.readFileSync('app-49.js','utf8');
const chain=fs.readFileSync('app-15.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const invite=fs.readFileSync('supabase/functions/invite-operations-user/index.ts','utf8');

assert(chain.includes("'app-49.js'"),'viewer policy must be loaded last');
assert(viewer.includes("operational_viewer"),'viewer role must be detected');
assert(viewer.includes("v.id==='bookings'"),'viewer must be forced into Bookings');
assert(viewer.includes("v.id==='bookingTabCalendar'"),'viewer must be forced into Calendar');
assert(viewer.includes('#bookingTabIncome'),'finance panel must be hidden');
assert(index.includes("location.hostname!=='frogs-friends-operations.vercel.app'"),'production must not redirect away from itself');
assert(invite.includes('https://frogs-friends-operations.vercel.app/?invite=1'),'invitations must target the stable production URL');
assert(invite.includes('operational_viewer:{can_view_finance:false,can_edit_bookings:false,can_manage_events:false}'),'viewer membership must be read-only and exclude finance');
console.log('operational viewer access tests passed');
