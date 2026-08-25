const fs=require('fs');
const assert=require('assert');
const html=fs.readFileSync('index.html','utf8');
assert(html.includes('commercial-enquiries.js?v=20260825-1'),'index must load the current commercial enquiries entry asset');
console.log('commercial entry version test passed');
