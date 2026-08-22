(function(){
  function isoDate(date){
    const y=date.getFullYear();
    const m=String(date.getMonth()+1).padStart(2,'0');
    const d=String(date.getDate()).padStart(2,'0');
    return `${y}-${m}-${d}`;
  }
  function parseDate(value){
    return new Date(String(value||'')+'T12:00:00');
  }
  function hoursBetween(start,end){
    const a=String(start||'00:00').split(':').map(Number);
    const b=String(end||'00:00').split(':').map(Number);
    return Math.max(0,((b[0]*60+b[1])-(a[0]*60+a[1]))/60);
  }
  function money(value){
    return '£'+Number(value||0).toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2});
  }
  function monthBounds(value){
    const [y,m]=String(value).split('-').map(Number);
    const from=new Date(y,m-1,1,12);
    const to=new Date(y,m,0,12);
    return {from:isoDate(from),to:isoDate(to),usage_month:isoDate(from)};
  }
  function monthLabel(value){
    const [y,m]=String(value).split('-').map(Number);
    return new Date(y,m-1,1,12).toLocaleDateString('en-GB',{month:'long',year:'numeric'});
  }
  function createBurstDeduper(fn,options={}){
    const windowMs=Math.max(0,Number(options.windowMs??250));
    const keyFn=typeof options.key==='function'?options.key:()=>'';
    const active=new Map(),recent=new Map();
    async function run(...args){
      const key=String(keyFn(...args));
      if(active.has(key))return active.get(key);
      const cached=recent.get(key);
      if(cached&&Date.now()-cached.at<windowMs)return cached.value;
      const promise=Promise.resolve().then(()=>fn(...args));
      active.set(key,promise);
      try{
        const value=await promise;
        recent.set(key,{at:Date.now(),value});
        return value;
      }finally{
        if(active.get(key)===promise)active.delete(key);
      }
    }
    run.invalidate=key=>{if(key===undefined)recent.clear();else recent.delete(String(key))};
    return run;
  }
  const api=Object.freeze({isoDate,parseDate,hoursBetween,money,monthBounds,monthLabel,createBurstDeduper});
  if(typeof window!=='undefined')window.OpsUtil=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})();
