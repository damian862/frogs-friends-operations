(function(){
  const MANAGE_ROLES=new Set(['owner_admin','operations_admin','site_manager','pool_manager','lettings_manager']);
  let ENQUIRIES=[];
  let enquiryLoadPromise=null;
  const $id=id=>document.getElementById(id);
  const esc=value=>typeof e==='function'?e(value):String(value??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const shortTime=v=>String(v||'').slice(0,5);
  const profile=()=>{try{return typeof P!=='undefined'?P:(window.P||null);}catch(_){return window.P||null;}};
  const canManage=siteId=>MANAGE_ROLES.has(String(profile()?.role||''))||(typeof window.canManageCommercialSite==='function'&&window.canManageCommercialSite(siteId||activeSite()));
  const isViewer=()=>String(profile()?.role||'')==='operational_viewer';
  const activeSite=()=>typeof window.getActiveSiteId==='function'?window.getActiveSiteId():($id('calSite')?.value||'');
  const siteName=id=>(S||[]).find(x=>x.id===id)?.name||'';
  const hirerName=id=>(H||[]).find(x=>x.id===id)?.name||'';
  const uk=v=>{if(!v)return'';const d=new Date(v+'T12:00:00');return d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});};
  function ensurePanel(){
    if(isViewer())return null;
    const bookings=$id('bookings');
    if(!bookings)return null;
    let panel=$id('commercialEnquiries');
    if(!panel){
      panel=document.createElement('section');
      panel.id='commercialEnquiries';
      panel.className='commercial-enquiries';
      panel.innerHTML=`<div class="commercial-head"><div><h2>Commercial enquiries</h2><p>Track pool-hire opportunities, temporary holds and conversion into confirmed bookings.</p></div>${canManage()?'<button type="button" class="p" onclick="newCommercialEnquiry()">+ Add enquiry</button>':''}</div><div class="commercial-kpis" id="commercialEnquiryKpis"></div><div class="commercial-toolbar"><label>Status<select id="commercialStatus"><option value="open">Open enquiries & holds</option><option value="enquiry">Enquiries</option><option value="held">On hold</option><option value="converted">Converted</option><option value="lost">Lost</option><option value="archived">Archived</option><option value="all">All</option></select></label><label>Site<select id="commercialSite"></select></label></div><div id="commercialEnquiryList" class="commercial-list"><div class="muted">Loading enquiries…</div></div>`;
      const shared=$id('sharedBookingCalendar');
      if(shared)shared.insertAdjacentElement('afterend',panel);else bookings.appendChild(panel);
    }
    $id('commercialStatus').onchange=render;
    $id('commercialSite').onchange=render;
    return panel;
  }
  function refreshSiteOptions(){
    const sel=$id('commercialSite');if(!sel)return;
    const current=sel.value,context=activeSite();
    sel.innerHTML='<option value="">All accessible sites</option>'+(S||[]).map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('');
    const wanted=context||current;if([...sel.options].some(o=>o.value===wanted))sel.value=wanted;
  }
  async function loadEnquiries(force=false){
    if(isViewer())return;
    if(!profile()?.id)return;
    const panel=ensurePanel();if(!panel)return;
    const list=$id('commercialEnquiryList');
    if(enquiryLoadPromise){
      await enquiryLoadPromise;
      if(!force)return;
    }
    enquiryLoadPromise=(async()=>{
    try{
      const {data,error}=await sb.rpc('visible_commercial_enquiries');
      if(error)throw error;
      ENQUIRIES=data||[];refreshSiteOptions();render();
      if(typeof window.renderBookingTables==='function')window.renderBookingTables();
      if(typeof window.renderRecurringBookings==='function')window.renderRecurringBookings();
    }catch(error){
      if(list)list.innerHTML=`<div class="err">${esc(error?.message||error)}</div>`;
    }finally{
      enquiryLoadPromise=null;
    }
    })();
    await enquiryLoadPromise;
  }
  window.refreshCommercialEnquiries=()=>loadEnquiries(true);
  function visibleRows(){
    const status=$id('commercialStatus')?.value||'open',site=$id('commercialSite')?.value||'';
    return ENQUIRIES.filter(x=>{
      if(site&&x.site_id!==site)return false;
      if(status==='open'&&!['enquiry','held'].includes(x.status))return false;
      if(status!=='all'&&status!=='open'&&x.status!==status)return false;
      return true;
    });
  }
  function render(){
    const list=$id('commercialEnquiryList'),kpis=$id('commercialEnquiryKpis');if(!list||!kpis)return;
    const now=Date.now(),open=ENQUIRIES.filter(x=>['enquiry','held'].includes(x.status)),holds=ENQUIRIES.filter(x=>x.status==='held'),expiring=holds.filter(x=>x.hold_until&&new Date(x.hold_until).getTime()<=now+48*3600000);
    kpis.innerHTML=`<div><span>Open opportunities</span><b>${open.length}</b></div><div><span>Active holds</span><b>${holds.length}</b></div><div><span>Holds due within 48h</span><b>${expiring.length}</b></div>`;
    const rows=visibleRows();
    list.innerHTML=rows.length?rows.map(x=>{
      const expired=x.status==='held'&&x.hold_until&&new Date(x.hold_until).getTime()<now;
      const hold=x.status==='held'?`<span class="commercial-hold ${expired?'expired':''}">${expired?'Hold expired':'Held until'} ${x.hold_until?new Date(x.hold_until).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):''}</span>`:'';
      const linked=x.converted_booking_id?`<button class="s" onclick="openConvertedSingleBooking('${x.converted_booking_id}')">View booking</button>`:x.converted_recurring_programme_id?`<button class="s" onclick="openConvertedRecurringProgramme('${x.converted_recurring_programme_id}')">View recurring programme</button>`:'';
      return `<div class="commercial-row" data-enquiry-id="${x.id}"><div><b>${esc(x.enquiry_title)}</b><span>${esc(hirerName(x.hirer_id)||x.contact_name||'Prospective hirer')}</span></div><div><b>${esc(uk(x.requested_date))}</b><span>${shortTime(x.start_time)}–${shortTime(x.end_time)} · ${esc(siteName(x.site_id))}</span></div><div><span class="commercial-status ${x.status}">${esc(x.status)}</span>${hold}</div><div class="commercial-actions">${canManage(x.site_id)?`<button class="s" onclick="editCommercialEnquiry('${x.id}')">Edit</button>${linked}${x.status==='enquiry'?`<button class="s" onclick="holdCommercialEnquiry('${x.id}')">Place hold</button>`:''}${['enquiry','held'].includes(x.status)?`<button class="p" onclick="convertCommercialEnquiry('${x.id}')">Convert to single booking</button><button class="p" onclick="convertCommercialEnquiryRecurring('${x.id}')">Convert to recurring</button><button class="link" onclick="closeCommercialEnquiry('${x.id}','lost')">Lost</button>`:''}`:''}</div></div>`;
    }).join(''):'<div class="commercial-empty">No enquiries match this selection.</div>';
  }
  function hirerOptions(selected){return '<option value="">Prospective / not yet a hirer</option>'+(H||[]).map(h=>`<option value="${h.id}" ${h.id===selected?'selected':''}>${esc(h.name)}</option>`).join('');}
  function siteOptions(selected){return (S||[]).map(s=>`<option value="${s.id}" ${s.id===selected?'selected':''}>${esc(s.name)}</option>`).join('');}
  window.newCommercialEnquiry=function(prefill={}){if(!canManage())return;openEditor(null,prefill);};
  window.editCommercialEnquiry=function(id){const x=ENQUIRIES.find(r=>r.id===id);if(!x||!canManage(x.site_id))return;openEditor(x,{});};
  function focusTarget(selector){setTimeout(()=>{const el=document.querySelector(selector);if(!el)return;el.scrollIntoView({behavior:'smooth',block:'center'});el.classList.add('linked-record-focus');setTimeout(()=>el.classList.remove('linked-record-focus'),2200);},60);}
  window.openConvertedSingleBooking=function(id){if(typeof window.setBookingTab==='function')window.setBookingTab('single');focusTarget(`[data-booking-id="${id}"]`);};
  window.openConvertedRecurringProgramme=function(id){
    const programme=(typeof G!=='undefined'?G:[]).find(x=>x.id===id);
    if(typeof window.setBookingTab==='function')window.setBookingTab('recurring');
    if($id('rbStatus'))$id('rbStatus').value=programme?.active===false?'archived':'active';
    if($id('rbSearch'))$id('rbSearch').value='';if($id('rbSite'))$id('rbSite').value='';if($id('rbOrg'))$id('rbOrg').value='';
    if(typeof window.renderRecurringBookings==='function')window.renderRecurringBookings();focusTarget(`[data-programme-id="${id}"]`);
  };
  window.originatingCommercialEnquiryLink=function(kind,id){
    const x=ENQUIRIES.find(r=>kind==='booking'?r.converted_booking_id===id:r.converted_recurring_programme_id===id);
    return x?`<button class="link enquiry-origin-link" onclick="showOriginatingCommercialEnquiry('${x.id}')">View enquiry</button>`:'';
  };
  window.showOriginatingCommercialEnquiry=function(id){
    const x=ENQUIRIES.find(r=>r.id===id);if(!x)return;
    ensurePanel();if($id('commercialStatus'))$id('commercialStatus').value='all';if($id('commercialSite'))$id('commercialSite').value=x.site_id||'';render();focusTarget(`[data-enquiry-id="${id}"]`);
  };
  function openEditor(existing,prefill){
    const x=existing||{},site=prefill.site_id||x.site_id||activeSite()||(S||[])[0]?.id||'',date=prefill.requested_date||x.requested_date||'',start=prefill.start_time||shortTime(x.start_time),end=prefill.end_time||shortTime(x.end_time);
    modal(existing?'Edit commercial enquiry':'Add commercial enquiry',`<label>Site<select id=ceSite>${siteOptions(site)}</select></label><label>Existing hirer<select id=ceHirer>${hirerOptions(x.hirer_id||'')}</select></label><label>Enquiry / organisation name<input id=ceTitle value="${esc(x.enquiry_title||'')}" placeholder="e.g. ABC Swim Club pool hire"></label><label>Contact name<input id=ceContact value="${esc(x.contact_name||'')}"></label><label>Email<input id=ceEmail type=email value="${esc(x.contact_email||'')}"></label><label>Phone<input id=cePhone value="${esc(x.contact_phone||'')}"></label><label>Date<input id=ceDate type=date value="${esc(date)}"></label><label>Start<input id=ceStart type=time value="${esc(start)}"></label><label>End<input id=ceEnd type=time value="${esc(end)}"></label><label>Notes<textarea id=ceNotes>${esc(x.notes||'')}</textarea></label>`,async()=>{
      if(!ceSite.value||!ceTitle.value.trim()||!ceDate.value||!ceStart.value||!ceEnd.value)return alert('Complete the site, enquiry name, date and times.');
      if(ceEnd.value<=ceStart.value)return alert('End time must be after start time.');
      if(ceEmail.value&&!ceEmail.checkValidity())return alert('Enter a valid email address.');
      const p=profile();
      const payload={organisation_id:p?.organisation_id,site_id:ceSite.value,hirer_id:ceHirer.value||null,enquiry_title:ceTitle.value.trim(),contact_name:ceContact.value.trim()||null,contact_email:ceEmail.value.trim()||null,contact_phone:cePhone.value.trim()||null,requested_date:ceDate.value,start_time:ceStart.value,end_time:ceEnd.value,notes:ceNotes.value.trim()||null,updated_at:new Date().toISOString()};
      if(!existing){payload.created_by=p?.id;payload.status='enquiry';}
      const q=existing?sb.from('pool_hire_enquiries').update(payload).eq('id',existing.id):sb.from('pool_hire_enquiries').insert(payload);
      const {error}=await q;if(error)return alert(error.message);closeM();await loadEnquiries(true);
    });
  }
  window.holdCommercialEnquiry=function(id){
    const x=ENQUIRIES.find(r=>r.id===id);if(!x||!canManage(x.site_id))return;
    const defaultUntil=new Date(Date.now()+48*3600000);defaultUntil.setMinutes(defaultUntil.getMinutes()-defaultUntil.getTimezoneOffset());
    modal('Place temporary hold',`<label>Enquiry<input value="${esc(x.enquiry_title)}" disabled></label><label>Hold until<input id=ceHoldUntil type=datetime-local value="${defaultUntil.toISOString().slice(0,16)}"></label><div class="note">A hold is operational only; it does not create pool-hire income until converted to a booking.</div>`,async()=>{
      if(!ceHoldUntil.value)return alert('Choose when the hold expires.');
      const {error}=await sb.from('pool_hire_enquiries').update({status:'held',hold_until:new Date(ceHoldUntil.value).toISOString(),updated_at:new Date().toISOString()}).eq('id',id);if(error)return alert(error.message);closeM();await loadEnquiries(true);
    });
  };
  window.closeCommercialEnquiry=async function(id,status){const x=ENQUIRIES.find(r=>r.id===id);if(!x||!canManage(x.site_id))return;const {error}=await sb.from('pool_hire_enquiries').update({status,hold_until:null,updated_at:new Date().toISOString()}).eq('id',id);if(error)return alert(error.message);await loadEnquiries(true);};
  window.convertCommercialEnquiry=function(id){
    const x=ENQUIRIES.find(r=>r.id===id);if(!x||!canManage(x.site_id))return;
    if(!x.hirer_id)return alert('Assign an existing hirer to the enquiry before converting it to a booking.');
    modal('Convert enquiry to booking',`<label>Site<input value="${esc(siteName(x.site_id))}" disabled></label><label>Organisation<input value="${esc(hirerName(x.hirer_id))}" disabled></label><label>Booking name<input id=cbTitle value="${esc(x.enquiry_title)}"></label><label>Date<input id=cbDate type=date value="${x.requested_date}"></label><label>Start<input id=cbStart type=time value="${shortTime(x.start_time)}"></label><label>End<input id=cbEnd type=time value="${shortTime(x.end_time)}"></label><label>Hourly rate (£/hour)<input id=cbRate type=number min=0 step=.01></label><label>VAT<select id=cbVat><option value=false>No VAT</option><option value=true>VAT applies</option></select></label>`,async()=>{
      if(!cbTitle.value.trim()||!cbDate.value||!cbStart.value||!cbEnd.value)return alert('Complete the booking details.');
      if(cbEnd.value<=cbStart.value)return alert('End time must be after start time.');
      const p=profile();
      const booking={site_id:x.site_id,hirer_id:x.hirer_id,booking_type:'external_hire',booking_category:'other',external_category:'other',title:cbTitle.value.trim(),booking_date:cbDate.value,start_time:cbStart.value,end_time:cbEnd.value,status:'confirmed',rate:cbRate.value!==''?Number(cbRate.value):null,vat_applicable:cbVat.value==='true',charge_type:'chargeable',foc_reason:null,created_by:p?.id};
      const {data,error}=await sb.from('bookings').insert(booking).select().single();if(error)return alert(error.message);
      const upd=await sb.from('pool_hire_enquiries').update({status:'converted',hold_until:null,converted_booking_id:data.id,updated_at:new Date().toISOString()}).eq('id',id);if(upd.error)return alert('Booking created, but the enquiry could not be marked converted: '+upd.error.message);
      closeM();await load();await loadEnquiries(true);if(typeof window.setBookingTab==='function')window.setBookingTab('single');
    });
  };
  window.convertCommercialEnquiryRecurring=function(id){
    const x=ENQUIRIES.find(r=>r.id===id);if(!x||!canManage(x.site_id))return;
    if(!x.hirer_id)return alert('Assign an existing hirer to the enquiry before converting it to a recurring booking.');
    const requestedDay=new Date(x.requested_date+'T12:00:00').getDay();
    const dayNames=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    modal('Convert enquiry to recurring booking',`<label>Site<input value="${esc(siteName(x.site_id))}" disabled></label><label>Organisation<input value="${esc(hirerName(x.hirer_id))}" disabled></label><label>Booking name<input id=crTitle value="${esc(x.enquiry_title)}"></label><label>Start date<input id=crStartDate type=date value="${x.requested_date}"></label><label>End date<input id=crEndDate type=date></label><fieldset><legend>Weekly pattern</legend>${dayNames.map((d,i)=>`<label class="day-check"><input type=checkbox name=crDay value=${i} ${i===requestedDay?'checked':''}> ${d}</label>`).join('')}</fieldset><label>Start time<input id=crStart type=time value="${shortTime(x.start_time)}"></label><label>End time<input id=crEnd type=time value="${shortTime(x.end_time)}"></label><label>Hourly rate (£/hour)<input id=crRate type=number min=0 step=.01></label><label>VAT<select id=crVat><option value=false>No VAT</option><option value=true>VAT applies</option></select></label><fieldset><legend>Optional first break</legend><label>Name<input id=crBreakName placeholder="e.g. October half term"></label><label>From<input id=crBreakStart type=date></label><label>To<input id=crBreakEnd type=date></label></fieldset>`,async()=>{
      const days=[...document.querySelectorAll('input[name=crDay]:checked')].map(el=>Number(el.value));
      if(!crTitle.value.trim()||!crStartDate.value||!crEndDate.value||!crStart.value||!crEnd.value)return alert('Complete the booking details and dates.');
      if(crEndDate.value<crStartDate.value)return alert('End date must be on or after the start date.');
      if(crEnd.value<=crStart.value)return alert('End time must be after start time.');
      if(!days.length)return alert('Select at least one weekly day.');
      const hasBreak=crBreakName.value.trim()||crBreakStart.value||crBreakEnd.value;
      if(hasBreak&&(!crBreakName.value.trim()||!crBreakStart.value))return alert('Complete the break name and start date, or leave the break blank.');
      const breaks=hasBreak?[{name:crBreakName.value.trim(),starts_on:crBreakStart.value,ends_on:crBreakEnd.value||crBreakStart.value}]:[];
      const {data,error}=await sb.rpc('convert_commercial_enquiry_to_recurring',{p_enquiry_id:id,p_name:crTitle.value.trim(),p_starts_on:crStartDate.value,p_ends_on:crEndDate.value,p_days:days,p_start_time:crStart.value,p_end_time:crEnd.value,p_rate:crRate.value!==''?Number(crRate.value):null,p_vat_applicable:crVat.value==='true',p_breaks:breaks});
      if(error)return alert(error.message);
      closeM();await load();await loadEnquiries(true);if(typeof window.setBookingTab==='function')window.setBookingTab('recurring');
      if(data&&typeof window.manageProgramme==='function')window.manageProgramme(data);
    });
  };
  function slotFromElement(el){
    const slot=el.closest('.availability-slot');if(!slot)return null;
    const text=(slot.querySelector('b')?.textContent||slot.textContent||'').match(/(\d{2}:\d{2})\s*[–-]\s*(\d{2}:\d{2})/);if(!text)return null;
    const day=slot.closest('.availability-day');const head=day?.querySelector('.availability-day-head')?.textContent||'';const dm=head.match(/(\d{1,2})\s+([A-Za-z]{3})/);if(!dm)return null;
    const anchor=$id('calAnchor')?.value;if(!anchor)return null;const a=new Date(anchor+'T12:00:00'),months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],month=months.indexOf(dm[2]),year=a.getFullYear();let d=new Date(year,month,Number(dm[1]),12);if(month===11&&a.getMonth()===0)d.setFullYear(year-1);if(month===0&&a.getMonth()===11)d.setFullYear(year+1);
    return {site_id:$id('calSite')?.value||activeSite(),requested_date:d.toISOString().slice(0,10),start_time:text[1],end_time:text[2]};
  }
  function enhanceAvailabilitySlots(){
    if(!canManage())return;
    document.querySelectorAll('.availability-slot').forEach(slot=>{if(slot.querySelector('.availability-enquiry-btn'))return;const btn=document.createElement('button');btn.type='button';btn.className='link availability-enquiry-btn';btn.textContent='Create enquiry';btn.onclick=ev=>{ev.stopPropagation();const prefill=slotFromElement(btn);window.newCommercialEnquiry(prefill||{});};slot.appendChild(btn);});
  }
  function bootstrapData(){
    let attempts=0,busy=false;
    const tick=async()=>{
      if(isViewer())return;
      const ready=!!profile()?.role&&!!$id('commercialEnquiries')&&typeof sb!=='undefined';
      if(ready&&!busy){
        busy=true;
        await loadEnquiries();
        busy=false;
        const list=$id('commercialEnquiryList');
        if(list&&!list.textContent.includes('Loading enquiries'))return;
      }
      attempts++;
      if(attempts<60)setTimeout(tick,250);
    };
    setTimeout(tick,0);
  }
  const observer=new MutationObserver(()=>{ensurePanel();enhanceAvailabilitySlots();});
  observer.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('change',ev=>{if(['siteScope','siteSelect','calSite'].includes(ev.target?.id)){refreshSiteOptions();render();}});
  window.addEventListener('load',()=>setTimeout(()=>{ensurePanel();loadEnquiries();enhanceAvailabilitySlots();},250));
  if(typeof window.render==='function')OpsLifecycle.use('render',function(next){const out=next();setTimeout(()=>{ensurePanel();loadEnquiries();enhanceAvailabilitySlots();},0);return out;});
  bootstrapData();
  const linkStyle=document.createElement('style');linkStyle.textContent='.linked-record-focus{outline:3px solid #2f80ed!important;outline-offset:2px;transition:outline-color .2s}.enquiry-origin-link{margin-left:8px}';document.head.appendChild(linkStyle);
})();
