const assert=require('assert');
const fs=require('fs');
const path=require('path');
const {execFileSync}=require('child_process');

const root=path.resolve(__dirname,'..');
execFileSync(process.execPath,[path.join(root,'scripts/build-bundles.js')],{cwd:root,stdio:'inherit'});

const dist=path.join(root,'dist');
const manifest=JSON.parse(fs.readFileSync(path.join(dist,'runtime-manifest.json'),'utf8'));
const flattenReport=JSON.parse(fs.readFileSync(path.join(dist,'runtime-wrapper-report.json'),'utf8'));
assert.strictEqual(manifest.bundleCount,7);
assert.strictEqual(manifest.sourceCount,46); // shared-utils + 45 loaded app scripts
assert(manifest.flattenedWrappers>=50,`expected the legacy lifecycle chains to be flattened, got ${manifest.flattenedWrappers}`);
assert.strictEqual(flattenReport.flattenedWrappers,manifest.flattenedWrappers);
assert(manifest.lifecycleTargets.includes('render'));
assert(manifest.lifecycleTargets.includes('setBookingTab'));
assert(manifest.lifecycleTargets.includes('renderRecurringBookings'));

const expectedBundles=['core.js','bookings.js','staffing.js','access.js','calendar.js','billing.js','viewer-access.js'];
assert.deepStrictEqual(Object.keys(manifest.bundles),expectedBundles);

const index=fs.readFileSync(path.join(dist,'index.html'),'utf8');
for(const bundle of expectedBundles){
  assert(index.includes(`<script src="${bundle}"></script>`),`index missing ${bundle}`);
}
assert(!/<script src="app-\d+\.js"><\/script>/.test(index),'legacy app-N script tag remains in built index');
assert(!index.includes('shared-utils.js"></script>'),'shared-utils should be inside core.js');
assert(index.includes('href="admin-access.css"'),'admin access stylesheet must remain loaded after removing app-15 loader');

const sourceMarkers=[];
let generatedRuntime='';
for(const bundle of expectedBundles){
  const file=path.join(dist,bundle);
  execFileSync(process.execPath,['--check',file],{cwd:root,stdio:'pipe'});
  const content=fs.readFileSync(file,'utf8');
  generatedRuntime+=content+'\n';
  for(const match of content.matchAll(/\/\* source: ([^*]+) \*\//g))sourceMarkers.push(match[1].trim());
  assert(!content.includes("const chain=['app-16.js'"),'legacy dynamic app loader remains in a bundle');
}
assert.strictEqual(sourceMarkers.length,46);
assert.strictEqual(new Set(sourceMarkers).size,46,'a runtime source was bundled more than once');
assert(sourceMarkers.includes('app-49.js'));
assert(!sourceMarkers.includes('app-39.js'));
assert(!sourceMarkers.includes('app-41.js'));
assert(!sourceMarkers.includes('app-42.js'));
assert(!sourceMarkers.includes('app-43.js'));
assert(generatedRuntime.includes('window.OpsLifecycle=Object.freeze'));
assert(generatedRuntime.includes('OpsLifecycle.install(['));
assert((generatedRuntime.match(/OpsLifecycle\.use\(/g)||[]).length>=manifest.flattenedWrappers,'flattened middleware registrations are missing from generated runtime');

console.log('Consolidated runtime build tests passed.');
