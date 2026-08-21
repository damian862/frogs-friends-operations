(function(){
  function wire(){
    const body=document.getElementById('rSingleBookings');
    if(!body||!Array.isArray(window.B))return;
    const bookings=window.B.filter(x=>x.booking_type!=='school_internal');
    const rows=[...body.querySelectorAll('tr')];
    bookings.forEach((b,i)=>{
      const tr=rows[i];if(!tr)return;
      const cell=tr.lastElementChild;if(!cell)return;
      cell.innerHTML=`<button type="button" class="link" onclick="editBooking('${b.id}')">Edit</button> · <button type="button" class="link" onclick="window.editBookingStaffing('${b.id}')">+ Staffing</button>`;
    });
  }
  const prior=window.renderBookingTables;
  if(prior)window.renderBookingTables=function(){const out=prior.apply(this,arguments);setTimeout(wire,50);return out};
  window.addEventListener('load',()=>setTimeout(wire,700));
})();