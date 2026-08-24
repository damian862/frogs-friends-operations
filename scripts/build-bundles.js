const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const dist=path.join(root,'dist');
const runtime=['core.js','bookings.js','staffing.js','access.js','calendar.js','billing.js','viewer-access.js'];
fs.rmSync(dist,{recursive:true,force:true});fs.mkdirSync(dist,{recursive:true});
for(const file of [...runtime,'index.html'])fs.copyFileSync(path.join(root,file),path.join(dist,file));
const indexHtml=fs.readFileSync(path.join(root,'index.html'),'utf8');
const localScripts=[...indexHtml.matchAll(/<script\s+[^>]*src=["']([^"']+\.js)(?:\?[^"']*)?["'][^>]*><\/script>/gi)]
  .map(match=>match[1])
  .filter(src=>!/^https?:\/\//i.test(src)&&!src.startsWith('//'));
for(const file of [...new Set(localScripts)]){
  const source=path.join(root,file);
  if(!fs.existsSync(source))throw new Error(`index.html references missing local script: ${file}`);
  const target=path.join(dist,file);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.copyFileSync(source,target);
}
const corePath=path.join(dist,'core.js');
let core=fs.readFileSync(corePath,'utf8');
const oldPrice=`<strong>£${'${Number(r.rate).toFixed(2)}'}/hr</strong><div class="muted">${'${hrs.toFixed(hrs % 1 ? 2 : 0)}'} hr${"${hrs === 1 ? '' : 's'}"} · £${'${total.toFixed(2)}'} per session · ${"${r.vat_applicable ? 'VAT applies' : 'No VAT'}"}</div>`;
const newPrice=`<strong>£${'${total.toFixed(2)}'}</strong><div class="muted">${'${hrs.toFixed(hrs % 1 ? 2 : 0)}'} hour${"${hrs === 1 ? '' : 's'}"} per session · ${"${r.vat_applicable ? 'VAT applies' : 'No VAT'}"}</div>`;
if(core.split(oldPrice).length!==2)throw new Error('Recurring session price template changed; review display normalisation.');
core=core.replace(oldPrice,newPrice);fs.writeFileSync(corePath,core);
const calendarPath=path.join(dist,'calendar.js');
fs.appendFileSync(calendarPath,'\n\n'+fs.readFileSync(path.join(root,'scripts/calendar-context.js'),'utf8'));
for(const entry of fs.readdirSync(root,{withFileTypes:true}))if(entry.isFile()&&/\.(css|png|jpe?g|svg|ico|webp|woff2?)$/i.test(entry.name))fs.copyFileSync(path.join(root,entry.name),path.join(dist,entry.name));
fs.writeFileSync(path.join(dist,'runtime-manifest.json'),JSON.stringify({bundleCount:runtime.length,sourceCount:runtime.length,bundles:runtime,localScripts:[...new Set(localScripts)]},null,2)+'\n');
console.log(`Built ${runtime.length} maintained runtime modules and ${new Set(localScripts).size} referenced local scripts.`);
