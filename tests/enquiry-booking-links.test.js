const fs=require('fs');
const assert=require('assert');
const enquiry=fs.readFileSync('commercial-enquiries-core.js','utf8');
const core=fs.readFileSync('core.js','utf8');
assert(enquiry.includes('View booking')&&enquiry.includes('View recurring programme'),'converted enquiries must link to their resulting records');
assert(enquiry.includes('showOriginatingCommercialEnquiry')&&enquiry.includes('originatingCommercialEnquiryLink'),'resulting records must link back to their enquiry');
assert(core.includes('data-booking-id')&&core.includes('data-programme-id'),'booking targets must be addressable');
assert(core.includes("originatingEnquiryLink('booking'")&&core.includes("originatingEnquiryLink('recurring'"),'single and recurring records must render reverse links');
console.log('enquiry and booking link tests passed');
