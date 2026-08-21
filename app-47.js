(function(){
  async function removeBooking(id){
    const booking=(typeof B!=='undefined'?B:[]).find(x=>x.id===id);
    if(!booking)return alert('This booking could not be found. Please refresh and try again.');
    const label=booking.title||'booking';
    const date=typeof ukDate==='function'?ukDate(booking.booking_date):booking.booking_date;
    const isSchool=booking.booking_type==='school_internal';
    const wording=isSchool?'school event':'single booking';
    if(!confirm(`Delete this ${wording}?\n\n${label}\n${date}\n${String(booking.start_time||'').slice(0,5)}–${String(booking.end_time||'').slice(0,5)}\n\nAny staffing linked directly to this booking will also be removed. Monthly billing will recalculate from the remaining bookings.\n\nThis cannot be undone.`))return;
    const linked=await sb.from('lifeguard_service_entries').select('id').eq('booking_id',id);
    if(linked.error)return alert(linked.error.message);
    if((linked.data||[]).length){const delStaff=await sb.from('lifeguard_service_entries').delete().eq('booking_id',id);if(delStaff.error)return alert(delStaff.error.message)}
    const del=await sb.from('bookings').delete().eq('id',id);if(del.error)return alert(del.error.message);
    await load();
    if(typeof window.renderBookingCalendar==='function')window.renderBookingCalendar();
    if(typeof window.renderIncomeSummary==='function')window.renderIncomeSummary();
  }
  window.deleteSingleBooking=removeBooking;
  window.deleteSchoolEvent=removeBooking;
  function addDeleteButtons(){
    ['rSingleBookings','rSchoolBookings'].forEach(bodyId=>{
      const body=document.getElementById(bodyId);if(!body)return;
      body.querySelectorAll('tr').forEach(tr=>{
        const edit=[...tr.querySelectorAll('button')].find(b=>(b.getAttribute('onclick')||'').includes("editBooking('"));
        if(!edit||tr.querySelector('.booking-delete'))return;
        const m=(edit.getAttribute('onclick')||'').match(/editBooking\('([^']+)'/);if(!m)return;
        const del=document.createElement('button');del.type='button';del.className='link booking-delete';del.textContent='Delete';del.onclick=()=>removeBooking(m[1]);
        edit.insertAdjacentText('afterend',' · ');edit.insertAdjacentElement('afterend',del);edit.insertAdjacentText('afterend',' · ');
      });
    });
  }
  const prior=window.renderBookingTables;
  if(prior)window.renderBookingTables=function(){const out=prior.apply(this,arguments);setTimeout(addDeleteButtons,0);return out};
  window.addEventListener('load',()=>setTimeout(addDeleteButtons,400));
  const style=document.createElement('style');style.textContent='.booking-delete{color:#b42318!important}';document.head.appendChild(style);
})();