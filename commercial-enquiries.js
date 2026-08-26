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
  function ensurePanelShell(){
    if(document.getElementById('commercialEnquiries')||viewer())return;
    const host=document.getElementById('bookingTabCalendar');
    if(!host)return;
    const panel=document.createElement('section');
    panel.id='commercialEnquiries';
    panel.className='commercial-enquiries';
    panel.innerHTML='<div class="commercial-head"><div><h2>Commercial enquiries</h2><p>Track pool-hire opportunities, temporary holds and conversion into confirmed bookings.</p></div><button type="button" class="p">+ Add enquiry</button></div><div class="commercial-kpis" id="commercialEnquiryKpis"></div><div class="commercial-toolbar"><label>Status<select id="commercialStatus"><option value="open">Open enquiries & holds</option><option value="enquiry">Enquiries</option><option value="held">On hold</option><option value="converted">Converted</option><option value="lost">Lost</option><option value="archived">Archived</option><option value="all">All</option></select></label><label>Site<select id="commercialSite"></select></label></div><div id="commercialEnquiryList" class="commercial-list"><div class="muted">Loading enquiries…</div></div>';
    host.appendChild(panel);
  }
  function ensureStarted(){
    let attempts=0;
    const tick=()=>{
      if(viewer())return;
      const bookings=document.getElementById('bookings');
      if(bookings&&profileReady()){
        ensurePanelShell();
        if(typeof window.refreshCommercialEnquiries==='function')window.refreshCommercialEnquiries();
        replayStartup();
      }
      attempts++;
      if((!document.getElementById('commercialEnquiries')||document.getElementById('commercialEnquiryList')?.textContent.includes('Loading enquiries'))&&attempts<40)setTimeout(tick,250);
    };
    tick();
  }
  load('commercial-enquiries-core.js?v=20260825-2')
    .then(()=>load('commercial-enquiry-archive.js?v=20260825-1'))
    .then(()=>load('commercial-enquiry-button-fix.js?v=20260826-2'))
    .then(()=>setTimeout(ensureStarted,0))
    .catch(err=>console.error('Commercial enquiry module failed to load',err));
})();
