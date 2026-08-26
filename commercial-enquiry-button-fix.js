(function(){
  const MANAGE_ROLES=new Set(['owner_admin','operations_admin','site_manager','pool_manager','lettings_manager']);
  const esc=v=>typeof e==='function'?e(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const profile=()=>{try{return typeof P!=='undefined'?P:(window.P||null);}catch(_){return window.P||null;}};
  const canManage=()=>MANAGE_ROLES.has(String(profile()?.role||''));
  const activeSite=()=>typeof window.getActiveSiteId==='function'?window.getActiveSiteId():(document.getElementById('calSite')?.value||'');
  const sites=()=>{try{return Array.isArray(S)?S:[];}catch(_){return []}};
  const hirers=()=>{try{return Array.isArray(H)?H:[];}catch(_){return []}};
  const siteOptions=selected=>sites().map(s=>`<option value="${s.id}" ${s.id===selected?'selected':''}>${esc(s.name)}</option>`).join('');
  const hirerOptions=()=>'<option value="">Prospective / not yet a hirer</option>'+hirers().map(h=>`<option value="${h.id}">${esc(h.name)}</option>`).join('');

  function closeStandalone(){document.getElementById('ceStandaloneOverlay')?.remove();}

  function openNewEnquiry(prefill={}){
    if(!canManage())return alert('You do not have permission to add commercial enquiries.');
    closeStandalone();
    const p=profile();
    const site=prefill.site_id||activeSite()||sites()[0]?.id||'';
    const overlay=document.createElement('div');
    overlay.id='ceStandaloneOverlay';
    overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:100000;display:flex;align-items:center;justify-content:center;padding:20px';
    overlay.innerHTML=`<div style="background:#fff;border-radius:12px;max-width:760px;width:100%;max-height:92vh;overflow:auto;padding:20px;box-shadow:0 16px 50px rgba(0,0,0,.25)"><h2 style="margin:0 0 16px">Add commercial enquiry</h2><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px" id="ceStandaloneFields"><label>Site<select id="ceSite" style="width:100%">${siteOptions(site)}</select></label><label>Existing hirer<select id="ceHirer" style="width:100%">${hirerOptions()}</select></label><label>Enquiry / organisation name<input id="ceTitle" style="width:100%" placeholder="e.g. ABC Swim Club pool hire"></label><label>Contact name<input id="ceContact" style="width:100%"></label><label>Email<input id="ceEmail" type="email" style="width:100%"></label><label>Phone<input id="cePhone" style="width:100%"></label><label>Date<input id="ceDate" type="date" style="width:100%" value="${esc(prefill.requested_date||'')}"></label><label>Start<input id="ceStart" type="time" style="width:100%" value="${esc(prefill.start_time||'')}"></label><label>End<input id="ceEnd" type="time" style="width:100%" value="${esc(prefill.end_time||'')}"></label><label style="grid-column:1/-1">Notes<textarea id="ceNotes" style="width:100%;min-height:80px"></textarea></label></div><div id="ceStandaloneError" style="display:none;color:#a40000;background:#fff0f0;border-radius:6px;padding:9px;margin-top:12px"></div><div style="display:flex;gap:8px;margin-top:16px"><button type="button" class="p" id="ceStandaloneSave">Save</button><button type="button" class="s" id="ceStandaloneCancel">Cancel</button></div></div>`;
    document.body.appendChild(overlay);
    const siteEl=document.getElementById('ceSite');
    if(siteEl&&sites().length===1)siteEl.disabled=true;
    document.getElementById('ceStandaloneCancel').onclick=closeStandalone;
    overlay.addEventListener('click',ev=>{if(ev.target===overlay)closeStandalone();});
    document.getElementById('ceStandaloneSave').onclick=async()=>{
      const title=document.getElementById('ceTitle'),dateEl=document.getElementById('ceDate'),startEl=document.getElementById('ceStart'),endEl=document.getElementById('ceEnd'),email=document.getElementById('ceEmail'),err=document.getElementById('ceStandaloneError');
      const fail=msg=>{err.textContent=msg;err.style.display='block';};
      if(!siteEl?.value||!title?.value.trim()||!dateEl?.value||!startEl?.value||!endEl?.value)return fail('Complete the site, enquiry name, date and times.');
      if(endEl.value<=startEl.value)return fail('End time must be after start time.');
      if(email?.value&&!email.checkValidity())return fail('Enter a valid email address.');
      const save=document.getElementById('ceStandaloneSave');save.disabled=true;save.textContent='Saving…';err.style.display='none';
      const payload={organisation_id:p?.organisation_id,site_id:siteEl.value,hirer_id:document.getElementById('ceHirer')?.value||null,enquiry_title:title.value.trim(),contact_name:document.getElementById('ceContact')?.value.trim()||null,contact_email:email?.value.trim()||null,contact_phone:document.getElementById('cePhone')?.value.trim()||null,requested_date:dateEl.value,start_time:startEl.value,end_time:endEl.value,notes:document.getElementById('ceNotes')?.value.trim()||null,created_by:p?.id,status:'enquiry',updated_at:new Date().toISOString()};
      try{
        const {error}=await sb.from('pool_hire_enquiries').insert(payload);
        if(error)throw error;
        closeStandalone();
        if(typeof window.refreshCommercialEnquiries==='function')await window.refreshCommercialEnquiries();
      }catch(error){save.disabled=false;save.textContent='Save';fail(error?.message||String(error));}
    };
  }

  window.newCommercialEnquiry=openNewEnquiry;

  function bindButton(){
    const btn=document.querySelector('#commercialEnquiries .commercial-head button');
    if(!btn||btn.dataset.ceBound==='1')return;
    btn.dataset.ceBound='1';
    btn.removeAttribute('onclick');
    btn.type='button';
    btn.onclick=ev=>{ev.preventDefault();ev.stopPropagation();openNewEnquiry();};
  }
  const observer=new MutationObserver(bindButton);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  bindButton();
  let tries=0;const timer=setInterval(()=>{bindButton();if(++tries>80)clearInterval(timer);},250);
})();
