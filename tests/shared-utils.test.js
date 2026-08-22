global.window=global;
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const core=fs.readFileSync(path.join(__dirname,'..','core.js'),'utf8'),marker=core.indexOf('/* source: app-1.js */');if(marker<0)throw new Error('Unable to isolate shared utilities in core.js');
vm.runInThisContext(core.slice(0,marker),{filename:'core-utils.js'});
assert.strictEqual(OpsUtil.isoDate(new Date(2026,8,7,12)),'2026-09-07');assert.strictEqual(OpsUtil.parseDate('2026-09-07').getFullYear(),2026);assert.strictEqual(OpsUtil.hoursBetween('18:00','19:30'),1.5);assert.strictEqual(OpsUtil.money(4284),'£4,284.00');assert.deepStrictEqual(OpsUtil.monthBounds('2026-09'),{from:'2026-09-01',to:'2026-09-30',usage_month:'2026-09-01'});
(async()=>{let calls=0;const d=OpsUtil.createBurstDeduper(async key=>{calls++;return key+':'+calls},{windowMs:50,key:key=>key});const[a,b]=await Promise.all([d('x'),d('x')]);assert.strictEqual(a,'x:1');assert.strictEqual(b,'x:1');assert.strictEqual(calls,1);d.invalidate('x');assert.strictEqual(await d('x'),'x:2');console.log('Shared utility smoke tests passed.');})().catch(error=>{console.error(error);process.exitCode=1});
