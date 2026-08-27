(function(){
  function load(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});}
  function profileReady(){
    try{return typeof P!=='undefined'&&!!P&&!!P.role;}catch(_){return false;}
  }
  function profile(){
    try{return typeof P!=='undefined'?P:(window.P||null);}catch(_){return window.P||null;}
  }
  function viewer(){
    try{return profileReady()&&String(P.role)==='operational_viewer';}catch(_){return false;}
  }
  function listSites(){
    try{
      const sites=Array.isArray(S)?S:[];
      if(typeof window.getCommercialAccessibleSites==='function')return window.getCommercialAccessibleSites();
      if(typeof window.canManageCommercialSite==='function')return sites.filter(site=>window.canManageCommercialSite(site.id));
      return sites;
    }catch(_){return [];}
  }
  function listHirers(){try{return Array.isArray(H)?H:[];}catch(_){return [];}}
  function esc(v){return typeof e==='function'?e(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function activeSite(){
    if(typeof window.getActiveSiteId==='function')return window.getActiveSiteId()||'';
    return document.getElementById('calSite')?.value||'';
  }
  function closeEnquiryForm(){document.getElementById('ceStandaloneOverlay')?.remove();}

  async function refreshAfterSave(){
    window.dispatchEvent(new CustomEvent('commercial-enquiry-saved'));
    for(let attempt=0;attempt<20;attempt++){
      if(typeof window.refreshCommercialEnquiries==='function'){
        await window.refreshCommercialEnquiries();
        return;
      }
      await new Promise(resolve=>setTimeout(resolve,100));
    }
  }

  function openEnquiryForm(prefill={}){
    closeEnquiryForm();
    const p=profile();
    const sites=listSites();
    const hirers=listHirers();
    const site=prefill.site_id||activeSite()||sites[0]?.id||'';
    const siteOptions=sites.map(s=>`<option value="${esc(s.id)}" ${s.id===site?'selected':''}>${esc(s.name)}</option>`).join('');
    const hirerOptions='<option value="">Prospective / not yet a hirer</option>'+hirers.map(h=>`<option value="${esc(h.id)}">${esc(h.name)}</option>`).join('');
    const overlay=document.createElement('div');
    overlay.id='ceStandaloneOverlay';
    overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:100000;display:flex;align-items:center;justify-content:center;padding:20px';
    overlay.innerHTML=`<div style="background:#fff;border-radius:12px;max-width:760px;width:100%;max-height:92vh;overflow:auto;padding:20px;box-shadow:0 16px 50px rgba(0,0,0,.25)">
      <h2 style="margin:0 0 16px">Add commercial enquiry</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <label>Site<select id="ceSite" style="width:100%">${siteOptions}</select></label>
        <label>Existing hirer<select id="ceHirer" style="width:100%">${hirerOptions}</select></label>
        <label>Enquiry / organisation name<input id="ceTitle" style="width:100%" placeholder="e.g. ABC Swim Club pool hire"></label>
        <label>Contact name<input id="ceContact" style="width:100%"></label>
        <label>Email<input id="ceEmail" type="email" style="width:100%"></label>
        <label>Phone<input id="cePhone" style="width:100%"></label>
        <label>Date<input id="ceDate" type="date" style="width:100%" value="${esc(prefill.requested_date||'')}"></label>
        <label>Start<input id="ceStart" type="time" style="width:100%" value="${esc(prefill.start_time||'')}"></label>
        <label>End<input id="ceEnd" type="time" style="width:100%" value="${esc(prefill.end_time||'')}"></label>
        <label style="grid-column:1/-1">Notes<textarea id="ceNotes" style="width:100%;min-height:80px"></textarea></label>
      </div>
      <div id="ceStandaloneError" style="display:none;color:#a40000;background:#fff0f0;border-radius:6px;padding:9px;margin-top:12px"></div>
      <div style="display:flex;gap:8px;margin-top:16px"><button type="button" class="p" id="ceStandaloneSave">Save</button><button type="button" class="s" id="ceStandaloneCancel">Cancel</button></div>
    </div>`;
    document.body.appendChild(overlay);
    const siteEl=document.getElementById('ceSite');
    if(siteEl&&sites.length===1)siteEl.disabled=true;
    document.getElementById('ceStandaloneCancel').onclick=closeEnquiryForm;
    overlay.addEventListener('click',ev=>{if(ev.target===overlay)closeEnquiryForm();});
    document.getElementById('ceStandaloneSave').onclick=async()=>{
      const title=document.getElementById('ceTitle');
      const dateEl=document.getElementById('ceDate');
      const startEl=document.getElementById('ceStart');
      const endEl=document.getElementById('ceEnd');
      const email=document.getElementById('ceEmail');
      const err=document.getElementById('ceStandaloneError');
      const fail=msg=>{err.textContent=msg;err.style.display='block';};
      if(!siteEl?.value||!title?.value.trim()||!dateEl?.value||!startEl?.value||!endEl?.value)return fail('Complete the site, enquiry name, date and times.');
      if(endEl.value<=startEl.value)return fail('End time must be after start time.');
      if(email?.value&&!email.checkValidity())return fail('Enter a valid email address.');
      const save=document.getElementById('ceStandaloneSave');
      save.disabled=true;save.textContent='Saving…';err.style.display='none';
      const payload={
        organisation_id:p?.organisation_id,
        site_id:siteEl.value,
        hirer_id:document.getElementById('ceHirer')?.value||null,
        enquiry_title:title.value.trim(),
        contact_name:document.getElementById('ceContact')?.value.trim()||null,
        contact_email:email?.value.trim()||null,
        contact_phone:document.getElementById('cePhone')?.value.trim()||null,
        requested_date:dateEl.value,
        start_time:startEl.value,
        end_time:endEl.value,
        notes:document.getElementById('ceNotes')?.value.trim()||null,
        created_by:p?.id,
        status:'enquiry',
        updated_at:new Date().toISOString()
      };
      try{
        const {error}=await sb.from('pool_hire_enquiries').insert(payload);
        if(error)throw error;
        closeEnquiryForm();
        await refreshAfterSave();
      }catch(error){save.disabled=false;save.textContent='Save';fail(error?.message||String(error));}
    };
  }

  window.newCommercialEnquiry=openEnquiryForm;
  document.addEventListener('click',ev=>{
    const btn=ev.target.closest('#commercialEnquiries .commercial-head button');
    if(!btn)return;
    ev.preventDefault();
    ev.stopPropagation();
    openEnquiryForm();
  },true);

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
  load('commercial-enquiries-core.js?v=20260827-11')
    .then(()=>load('commercial-enquiry-archive.js?v=20260826-2'))
    .then(()=>setTimeout(ensureStarted,0))
    .catch(err=>console.error('Commercial enquiry module failed to load',err));
})();
