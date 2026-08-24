(function(){
  function load(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});}
  function profileReady(){
    try{return typeof P!=='undefined'&&!!P&&!!P.role;}catch(_){return false;}
  }
  function viewer(){
    try{return profileReady()&&String(P.role)==='operational_viewer';}catch(_){return false;}
  }
  function replayStartup(){
    try{window.dispatchEvent(new Event('load'));}catch(err){console.error('Commercial enquiry startup replay failed',err);}
  }
  function ensureStarted(){
    let attempts=0;
    const tick=()=>{
      if(document.getElementById('commercialEnquiries')||viewer())return;
      const bookings=document.getElementById('bookings');
      if(bookings&&profileReady())replayStartup();
      attempts++;
      if(!document.getElementById('commercialEnquiries')&&!viewer()&&attempts<40)setTimeout(tick,250);
    };
    tick();
  }
  load('commercial-enquiries-core.js?v=20260824-5')
    .then(()=>load('commercial-enquiry-archive.js?v=20260824-4'))
    .then(()=>setTimeout(ensureStarted,0))
    .catch(err=>console.error('Commercial enquiry module failed to load',err));
})();
