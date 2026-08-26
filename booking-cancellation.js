(function(){
  const canEdit=()=>['owner_admin','operations_admin','site_manager','pool_manager','lettings_manager'].includes(String(P?.role||''));

  window.cancelOneOffBooking=async function(id){
    if(!canEdit())return alert('You do not have permission to cancel bookings.');
    const booking=(B||[]).find(x=>x.id===id);
    if(!booking)return alert('This booking could not be found. Please refresh and try again.');
    if(booking.status==='cancelled')return alert('This booking is already cancelled.');
    const kind=booking.booking_type==='school_internal'?'school event':'single booking';
    const date=typeof ukDate==='function'?ukDate(booking.booking_date):booking.booking_date;
    const message=`Cancel this ${kind}?\n\n${booking.title||'Untitled booking'}\n${date} · ${String(booking.start_time||'').slice(0,5)}–${String(booking.end_time||'').slice(0,5)}\n\nIt will be removed from active calendar usage and hire-income calculations. The record will be retained for audit/history.`;
    if(!confirm(message))return;
    const now=new Date().toISOString();
    let payload={status:'cancelled'};
    if(booking.updated_at!==undefined)payload.updated_at=now;
    let {error}=await sb.from('bookings').update(payload).eq('id',id);
    if(error&&payload.updated_at){({error}=await sb.from('bookings').update({status:'cancelled'}).eq('id',id));}
    if(error)return alert(error.message||String(error));
    await load();
    alert('Booking cancelled. It has been removed from active usage and hire-income calculations.');
  };

  function addCancelButtons(){
    if(!canEdit())return;
    ['rBookings','rSingleBookings','rSchoolBookings'].forEach(id=>{
      const host=document.getElementById(id);if(!host)return;
      host.querySelectorAll('tr').forEach(tr=>{
        const edit=[...tr.querySelectorAll('button')].find(b=>(b.getAttribute('onclick')||'').includes("editBooking('"));
        if(!edit||tr.querySelector('.booking-cancel-action'))return;
        const m=(edit.getAttribute('onclick')||'').match(/editBooking\('([^']+)'/);if(!m)return;
        const booking=(B||[]).find(x=>x.id===m[1]);if(!booking||booking.status==='cancelled')return;
        const btn=document.createElement('button');btn.type='button';btn.className='link booking-cancel-action';btn.textContent='Cancel booking';btn.onclick=()=>cancelOneOffBooking(m[1]);
        edit.insertAdjacentText('afterend',' · ');edit.insertAdjacentElement('afterend',btn);
      });
    });
  }

  if(window.OpsLifecycle)OpsLifecycle.use('renderBookingTables',function(next){const out=next();setTimeout(addCancelButtons,0);return out;});
  else{
    const prior=window.renderBookingTables;
    if(prior)window.renderBookingTables=function(){const out=prior.apply(this,arguments);setTimeout(addCancelButtons,0);return out};
  }
  window.addEventListener('load',()=>setTimeout(addCancelButtons,400));
  const style=document.createElement('style');style.textContent='.booking-cancel-action{color:#b42318!important;white-space:nowrap}';document.head.appendChild(style);
})();