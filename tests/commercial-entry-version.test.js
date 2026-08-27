const fs=require('fs');
const assert=require('assert');
const html=fs.readFileSync('index.html','utf8');
assert(html.includes('commercial-enquiries.js?v=20260827-10'),'index must load the expired-hold commercial enquiries asset');
assert(html.includes('booking-scale.js?v=20260827-5'),'index must load the expired-hold fallback asset');
console.log('commercial entry version test passed');
