global.window=global;
require('../shared-utils.js');
const assert=require('assert');

assert.strictEqual(OpsUtil.isoDate(new Date(2026,8,7,12)),'2026-09-07');
assert.strictEqual(OpsUtil.parseDate('2026-09-07').getFullYear(),2026);
assert.strictEqual(OpsUtil.hoursBetween('18:00','19:30'),1.5);
assert.strictEqual(OpsUtil.hoursBetween('06:15','07:45'),1.5);
assert.strictEqual(OpsUtil.money(4284),'£4,284.00');
assert.deepStrictEqual(OpsUtil.monthBounds('2026-09'),{from:'2026-09-01',to:'2026-09-30',usage_month:'2026-09-01'});
assert.strictEqual(OpsUtil.monthLabel('2026-09'),'September 2026');

console.log('Shared utility smoke tests passed.');
