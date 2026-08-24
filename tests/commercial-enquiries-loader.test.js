const fs=require('fs');
const assert=require('assert');
const js=fs.readFileSync('commercial-enquiries.js','utf8');
assert(js.includes("window.dispatchEvent(new Event('load'))"),'loader must replay commercial enquiry startup');
assert(js.includes('attempts<40'),'loader must retry while authenticated context is becoming ready');
assert(js.includes('profileReady()'),'loader must wait for the authenticated profile before retrying startup');
assert(js.includes("document.getElementById('commercialEnquiries')"),'loader must stop once the panel exists');
assert(js.includes('commercial-enquiries-core.js?v=20260824-5'),'core module must be cache-busted');
console.log('commercial enquiry loader tests passed');
