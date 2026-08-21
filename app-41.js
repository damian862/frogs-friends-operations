(function(){
  function bookingIdFromRow(btn){
    const tr=btn.closest('tr');if(!tr)return null;
    const text=(tr.children[2]?.textContent||'').trim();
    const date=(tr.children[0]?.textContent||'').trim();
    const time=(tr.children[4]?.textContent||'').trim();
    const candidates=B.filter(b=>(b.title||'').trim()===text);
    if(candidates.length===1)return candidates[0].id;
    const found=candidates.find(b=>{
      const d=typeof ukDate==='function'?ukDate(b.booking_date):b.booking_date;
      const t=`${String(b.start_time||'').slice(0,5)}–${String(b.end_time||'').slice(0,5)}`;
      return (!date||d.includes(date.replace(/^\w+\s+/,''))||date.includes(String(b.booking_date)))&&(!time||t===time);
    });
    return found?.id||null;
  }
  document.addEventListener('click',function(ev){
    const btn=ev.target.closest('.booking-staffing-btn');if(!btn)return;
    ev.preventDefault();ev.stopPropagation();
    let id=null;
    const oc=btn.getAttribute('onclick')||'';
    const m=oc.match(/editBookingStaffing\('([^']+)'/);if(m)id=m[1];
    if(!id)id=bookingIdFromRow(btn);
    if(!id)return alert('Could not identify this booking. Please refresh and try again.');
    if(typeof window.editBookingStaffing!=='function')return alert('Staffing form is still loading. Please refresh the page and try again.');
    window.editBookingStaffing(id);
  },true);
})();