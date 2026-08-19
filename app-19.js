(function(){
  const hoursBetween=(a,b)=>{
    const x=String(a||'').split(':').map(Number),y=String(b||'').split(':').map(Number);
    if(x.length<2||y.length<2||Number.isNaN(x[0])||Number.isNaN(y[0]))return 0;
    return Math.max(0,(y[0]*60+y[1]-x[0]*60-x[1])/60);
  };

  window.bookingStaffTimesChanged=function(){
    const a=$('bsStart')?.value,b=$('bsEnd')?.value,h=$('bsHours');
    if(h)h.value=(a&&b?hoursBetween(a,b):0).toFixed(2);
  };

  window.bookingStaffCustomerChanged=function(){
    const wrap=$('bsHirerWrap');
    if(wrap)wrap.style.display=$('bsCustomer')?.value==='hirer'?'':'none';
  };

  window.editBookingStaffing=async function(bookingId,entryId){
    let x={};
    if(entryId){
      const r=await sb.from('lifeguard_service_entries').select('*').eq('id',entryId).single();
      if(r.error)return alert(r.error.message);
      x=r.data||{};
    }
    const booking=bookingId?B.find(b=>b.id===bookingId):(x.booking_id?B.find(b=>b.id===x.booking_id):null);
    const site=x.site_id||booking?.site_id||S[0]?.id||'';
    const date=x.service_date||booking?.booking_date||new Date().toISOString().slice(0,10);
    const stype=x.service_type||'lifeguard';
    const defaultCustomer=booking?.booking_type==='school_internal'?'school':(booking?.hirer_id?'hirer':'school');
    const cust=x.customer_type||defaultCustomer;
    const hirer=x.customer_hirer_id||booking?.hirer_id||'';
    const start=String(x.start_time||booking?.start_time||'').slice(0,5);
    const end=String(x.end_time||booking?.end_time||'').slice(0,5);
    const hours=hoursBetween(start,end);

    modal(entryId?'Edit staffing charge':booking?'Add staffing to booking':'Add staffing charge',`${booking?`<div style="grid-column:1/-1" class="note"><b>${e(booking.title||'Booking')}</b> · ${e(shortUk(booking.booking_date))} · booking ${e(String(booking.start_time||'').slice(0,5))}–${e(String(booking.end_time||'').slice(0,5))}<div class="lg-note">Staffing times below can be shorter, longer, earlier or later than the booking.</div></div>`:''}<label>School / pool site<select id=bsSite>${opts(S,site,z=>z.name)}</select></label><label>Date<input id=bsDate type=date value="${date}"></label><label>Service type<select id=bsType><option value=lifeguard ${stype==='lifeguard'?'selected':''}>Lifeguard</option><option value=swimming_teacher ${stype==='swimming_teacher'?'selected':''}>Swimming teacher</option><option value=teacher ${stype==='teacher'?'selected':''}>Teacher</option><option value=other ${stype==='other'?'selected':''}>Other staffing</option></select></label><label>Service description<input id=bsLabel value="${e(x.service_label||'')}"></label><label>Charge Frogs & Friends service to<select id=bsCustomer onchange="bookingStaffCustomerChanged()"><option value=school ${cust==='school'?'selected':''}>School</option><option value=hirer ${cust==='hirer'?'selected':''}>Hiring organisation</option></select></label><label id=bsHirerWrap style="display:${cust==='hirer'?'':'none'}">Hiring organisation<select id=bsHirer><option value="">Select organisation</option>${opts(H,hirer,z=>z.name)}</select></label><label>Staff start<input id=bsStart type=time value="${start}" onchange="bookingStaffTimesChanged()" oninput="bookingStaffTimesChanged()"></label><label>Staff finish<input id=bsEnd type=time value="${end}" onchange="bookingStaffTimesChanged()" oninput="bookingStaffTimesChanged()"></label><label>Number of staff<input id=bsCount type=number min=1 step=1 value="${x.lifeguard_count||1}"></label><label>Hours per staff member<input id=bsHours type=number value="${hours.toFixed(2)}" readonly><div class="lg-note">Calculated automatically from staff start/finish.</div></label><label>Charge rate per staff hour (£)<input id=bsRate type=number min=0 step=0.01 value="${x.hourly_rate??''}"></label><label>VAT<select id=bsVat><option value=false ${!x.vat_applicable?'selected':''}>No VAT</option><option value=true ${x.vat_applicable?'selected':''}>VAT applies</option></select></label><label>Status<select id=bsStatus><option value=draft ${x.status==='draft'?'selected':''}>Draft</option><option value=confirmed ${(!x.status||x.status==='confirmed')?'selected':''}>Confirmed</option><option value=cancelled ${x.status==='cancelled'?'selected':''}>Cancelled</option></select></label><label>Notes<textarea id=bsNotes>${e(x.notes||'')}</textarea></label>`,async()=>{
      if(bsCustomer.value==='hirer'&&!bsHirer.value)return alert('Select the hiring organisation to charge.');
      if(!bsStart.value||!bsEnd.value)return alert('Enter the staff start and finish times.');
      const h=hoursBetween(bsStart.value,bsEnd.value);
      if(h<=0)return alert('Staff finish time must be after staff start time.');
      const count=Number(bsCount.value||1),rate=Number(bsRate.value||0);
      const p={
        organisation_id:P.organisation_id,
        site_id:bsSite.value,
        booking_id:booking?.id||x.booking_id||null,
        service_date:bsDate.value,
        service_type:bsType.value,
        service_label:bsLabel.value||null,
        customer_type:bsCustomer.value,
        customer_hirer_id:bsCustomer.value==='hirer'?bsHirer.value:null,
        start_time:bsStart.value||null,
        end_time:bsEnd.value||null,
        lifeguard_count:count,
        hours_per_lifeguard:h,
        hourly_rate:rate,
        vat_applicable:bsVat.value==='true',
        vat_rate:20,
        status:bsStatus.value,
        notes:bsNotes.value||null,
        created_by:x.created_by||P.id,
        updated_at:new Date().toISOString()
      };
      const q=entryId?await sb.from('lifeguard_service_entries').update(p).eq('id',entryId):await sb.from('lifeguard_service_entries').insert(p);
      if(q.error)return alert(q.error.message);
      closeM();
      if(typeof renderBookingTables==='function')renderBookingTables();
      if($('lgMonth')&&typeof renderLifeguardServices==='function')await renderLifeguardServices();
    });
    setTimeout(()=>bookingStaffTimesChanged(),0);
  };
})();