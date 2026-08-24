const fs=require('fs');
const assert=require('assert');
const js=fs.readFileSync('commercial-enquiries.js','utf8');
assert(js.includes("document.readyState==='complete'"),'loader must detect modules that finish after page load');
assert(js.includes("window.dispatchEvent(new Event('load'))"),'loader must replay bootstrap when lazy load finishes late');
assert(js.includes('commercial-enquiries-core.js?v=20260824-4'),'core module must be cache-busted');
console.log('commercial enquiry loader tests passed');
