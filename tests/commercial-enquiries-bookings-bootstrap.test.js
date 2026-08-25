const fs=require('fs');
const assert=require('assert');
const js=fs.readFileSync('booking-scale.js','utf8');
assert(js.includes('function ensureCommercialEnquiriesPanel()'),'bookings path must provide commercial enquiries bootstrap');
assert(js.includes("document.getElementById('bookingTabCalendar')"),'bootstrap must target the Calendar panel');
assert(js.includes("panel.id = 'commercialEnquiries'"),'bootstrap must create the commercial enquiries panel');
assert(js.includes('<option value="archived">Archived</option>'),'bootstrap must expose Archived status');
assert(js.includes("event.target?.dataset?.btab === 'calendar'"),'opening Calendar must ensure the panel exists');
console.log('commercial enquiries bookings bootstrap tests passed');
