const fs=require('fs');
const assert=require('assert');
const core=fs.readFileSync('commercial-enquiries-core.js','utf8');
const fallback=fs.readFileSync('booking-scale.js','utf8');
for(const source of [core,fallback]){
  assert(source.includes('Expired holds'),'expired holds must have a KPI and filter');
  assert(source.includes("value=\"expired\""),'expired holds must be directly filterable');
}
assert(core.includes('isExpiredHold')&&core.includes('Renew hold')&&core.includes('Return to enquiry'),'expired holds must be derived safely and offer follow-up actions');
assert(core.includes("x.status==='held'&&!isExpiredHold(x)"),'expired holds must not count as active');
console.log('expired hold handling tests passed');
