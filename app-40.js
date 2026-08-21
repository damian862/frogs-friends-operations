(function(){
  const prior=window.editBookingStaffing;
  if(!prior)return;
  function currentBookingTab(){
    return document.querySelector('.booking-tab.active[data-btab]')?.dataset.btab||
      (document.getElementById('bookingTabIncome')?.classList.contains('on')?'income':'single');
  }
  function captureIncomeFilters(){
    const panel=document.getElementById('bookingTabIncome');if(!panel)return {};
    const values={};panel.querySelectorAll('select[id],input[id]').forEach(el=>values[el.id]=el.value);return values;
  }
  function restoreIncomeFilters(values){
    Object.entries(values||{}).forEach(([id,value])=>{const el=document.getElementById(id);if(el)el.value=value});
  }
  function scrollToStaffing(){
    const candidates=[...document.querySelectorAll('h1,h2,h3,strong,b')];
    const heading=candidates.find(el=>(el.textContent||'').includes('Staffing Services'));
    heading?.scrollIntoView({block:'start'});
  }
  window.editBookingStaffing=async function(bookingId,entryId){
    const sourceTab=currentBookingTab();
    const incomeFilters=sourceTab==='income'?captureIncomeFilters():{};
    const out=await prior.apply(this,arguments);
    const save=document.getElementById('ms');
    if(!save)return out;
    save.style.display='inline-block';save.style.visibility='visible';save.disabled=false;
    save.textContent=entryId?'Save changes':'Save staffing';
    save.onclick=async function(){
      if(document.getElementById('bsCustomer')?.value==='hirer'&&!document.getElementById('bsHirer')?.value)return alert('Select the hiring organisation to charge.');
      let existing={};
      if(entryId){const r=await sb.from('lifeguard_service_entries').select('*').eq('id',entryId).single();if(r.error)return alert(r.error.message);existing=r.data||{}}
      const count=Number(document.getElementById('bsCount')?.value||1),hours=Number(document.getElementById('bsHours')?.value||0);
      const payload={organisation_id:P.organisation_id,site_id:document.getElementById('bsSite').value,booking_id:bookingId||existing.booking_id||null,service_date:document.getElementById('bsDate').value,service_type:document.getElementById('bsType').value,service_label:document.getElementById('bsLabel').value||null,customer_type:document.getElementById('bsCustomer').value,customer_hirer_id:document.getElementById('bsCustomer').value==='hirer'?document.getElementById('bsHirer').value:null,start_time:document.getElementById('bsStart').value||null,end_time:document.getElementById('bsEnd').value||null,lifeguard_count:count,hours_per_lifeguard:hours,hourly_rate:Number(document.getElementById('bsRate').value||0),vat_applicable:document.getElementById('bsVat').value==='true',vat_rate:20,status:document.getElementById('bsStatus').value,notes:document.getElementById('bsNotes').value||null,created_by:existing.created_by||P.id,updated_at:new Date().toISOString()};
      const q=entryId?await sb.from('lifeguard_service_entries').update(payload).eq('id',entryId):await sb.from('lifeguard_service_entries').insert(payload);
      if(q.error)return alert(q.error.message);
      closeM();
      await load();
      const destination=sourceTab==='income'?'income':'single';
      if(typeof window.setBookingTab==='function')window.setBookingTab(destination);
      if(destination==='income')setTimeout(async()=>{restoreIncomeFilters(incomeFilters);if(typeof window.renderLifeguardServices==='function')await window.renderLifeguardServices();setTimeout(scrollToStaffing,20)},80);
      alert('Staffing saved successfully.');
    };
    return out;
  };
})();