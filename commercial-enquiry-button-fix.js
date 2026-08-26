(function(){
  const MANAGE_ROLES=new Set(['owner_admin','operations_admin','site_manager','pool_manager','lettings_manager']);
  const esc=v=>typeof e==='function'?e(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const profile=()=>{try{return typeof P!=='undefined'?P:(window.P||null);}catch(_){return window.P||null;}};
  const canManage=()=>MANAGE_ROLES.has(String(profile()?.role||''));
  const activeSite=()=>typeof window.getActiveSiteId==='function'?window.getActiveSiteId():(document.getElementById('calSite')?.value||'');
  const siteOptions=selected=>(S||[]).map(s=>`<option value="${s.id}" ${s.id===selected?'selected':''}>${esc(s.name)}</option>`).join('');
  const hirerOptions=()=>'<option value="">Prospective / not yet a hirer</option>'+(H||[]).map(h=>`<option value="${h.id}">${esc(h.name)}</option>`).join('');

  function openNewEnquiry(prefill={}){
    if(!canManage()) return alert('You do not have permission to add commercial enquiries.');
    const p=profile();
    const site=prefill.site_id||activeSite()||(S||[])[0]?.id||'';
    const date=prefill.requested_date||'';
    const start=prefill.start_time||'';
    const end=prefill.end_time||'';
    modal('Add commercial enquiry',`<label>Site<select id=ceSite>${siteOptions(site)}</select></label><label>Existing hirer<select id=ceHirer>${hirerOptions()}</select></label><label>Enquiry / organisation name<input id=ceTitle placeholder="e.g. ABC Swim Club pool hire"></label><label>Contact name<input id=ceContact></label><label>Email<input id=ceEmail type=email></label><label>Phone<input id=cePhone></label><label>Date<input id=ceDate type=date value="${esc(date)}"></label><label>Start<input id=ceStart type=time value="${esc(start)}"></label><label>End<input id=ceEnd type=time value="${esc(end)}"></label><label>Notes<textarea id=ceNotes></textarea></label>`,async()=>{
      const siteEl=document.getElementById('ceSite'), title=document.getElementById('ceTitle'), dateEl=document.getElementById('ceDate'), startEl=document.getElementById('ceStart'), endEl=document.getElementById('ceEnd'), email=document.getElementById('ceEmail');
      if(!siteEl?.value||!title?.value.trim()||!dateEl?.value||!startEl?.value||!endEl?.value)return alert('Complete the site, enquiry name, date and times.');
      if(endEl.value<=startEl.value)return alert('End time must be after start time.');
      if(email?.value&&!email.checkValidity())return alert('Enter a valid email address.');
      const payload={organisation_id:p?.organisation_id,site_id:siteEl.value,hirer_id:document.getElementById('ceHirer')?.value||null,enquiry_title:title.value.trim(),contact_name:document.getElementById('ceContact')?.value.trim()||null,contact_email:email?.value.trim()||null,contact_phone:document.getElementById('cePhone')?.value.trim()||null,requested_date:dateEl.value,start_time:startEl.value,end_time:endEl.value,notes:document.getElementById('ceNotes')?.value.trim()||null,created_by:p?.id,status:'enquiry',updated_at:new Date().toISOString()};
      const {error}=await sb.from('pool_hire_enquiries').insert(payload);
      if(error)return alert(error.message);
      closeM();
      if(typeof window.refreshCommercialEnquiries==='function')await window.refreshCommercialEnquiries();
    });
  }

  window.newCommercialEnquiry=openNewEnquiry;

  document.addEventListener('click',ev=>{
    const btn=ev.target.closest('#commercialEnquiries .commercial-head button');
    if(!btn)return;
    ev.preventDefault();
    ev.stopPropagation();
    openNewEnquiry();
  },true);
})();
