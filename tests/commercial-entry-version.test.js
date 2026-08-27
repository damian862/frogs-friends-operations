const fs=require('fs');
const assert=require('assert');
const html=fs.readFileSync('index.html','utf8');
assert(html.includes('commercial-enquiries.js?v=20260827-12'),'index must load the membership-aware commercial enquiries asset');
assert(html.includes('booking-scale.js?v=20260827-6'),'index must load the site-scoped fallback asset');
console.log('commercial entry version test passed');
