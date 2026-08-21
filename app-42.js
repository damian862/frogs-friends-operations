(function(){
  function findBookingFromSingleRow(tr){
    if(!tr)return null;
    const title=(tr.children[2]?.textContent||'').trim();
    const site=(tr.children[3]?.textContent||'').trim();
    const time=(tr.children[4]?.textContent||'').trim();
    let matches=(window.B||[]).filter(b=>(b.title||'').trim()===title && (!site||sn(b.site_id)===site));
    if(matches.length>1&&time){matches=matches.filter(b=>`${String(b.start_time||'').slice(0,5)}–${String(b.end_time||'').slice(0,5)}`===time)}
    return matches[0]||null;
  }
  function wireSingleStaffing(){
    const body=document.getElementById('rSingleBookings');if(!body)return;
    body.querySelectorAll('tr').forEach(tr=>{
      const btn=tr.querySelector('.booking-staffing-btn');if(!btn)return;
      const booking=findBookingFromSingleRow(tr);if(!booking)return;
      btn.removeAttribute('onclick');
      btn.dataset.bookingId=booking.id;
      btn.onclick=function(ev){ev.preventDefault();ev.stopPropagation();if(typeof window.editBookingStaffing==='function')window.editBookingStaffing(booking.id);else alert('Staffing form is still loading. Please refresh and try again.')};
    });
  }
  const priorTables=window.renderBookingTables;
  if(priorTables)window.renderBookingTables=function(){const out=priorTables.apply(this,arguments);setTimeout(wireSingleStaffing,120);return out};
  const priorSingle=window.renderSingleBookings;
  if(priorSingle)window.renderSingleBookings=function(){const out=priorSingle.apply(this,arguments);setTimeout(wireSingleStaffing,120);return out};
  document.addEventListener('click',function(ev){const btn=ev.target.closest('#rSingleBookings .booking-staffing-btn');if(!btn)return;const id=btn.dataset.bookingId;if(!id)return;ev.preventDefault();ev.stopImmediatePropagation();if(typeof window.editBookingStaffing==='function')window.editBookingStaffing(id)},true);
  window.addEventListener('load',()=>setTimeout(wireSingleStaffing,700));
})();