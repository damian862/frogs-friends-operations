(function(){
  const isOperationalViewer=()=>String(P?.role||'').toLowerCase()==='operational_viewer';
  const style=document.createElement('style');
  style.textContent=`
    body.operational-viewer .nav button:not([data-v="bookings"]),
    body.operational-viewer #userAccessNav,
    body.operational-viewer #bookings>.term-top,
    body.operational-viewer .booking-tab[data-btab]:not([data-btab="calendar"]),
    body.operational-viewer #bookingTabAll,
    body.operational-viewer #bookingTabRecurring,
    body.operational-viewer #bookingTabSingle,
    body.operational-viewer #bookingTabSchool,
    body.operational-viewer #bookingTabIncome,
    body.operational-viewer .cal-event-actions,
    body.operational-viewer #bookingTabCalendar .cal-event button,
    body.operational-viewer #bookingTabCalendar [onclick*="edit" i],
    body.operational-viewer #bookingTabCalendar [onclick*="delete" i],
    body.operational-viewer #bookingTabCalendar [onclick*="add" i] {display:none!important}
  `;
  document.head.appendChild(style);

  function showViewerCalendar(){
    const enabled=isOperationalViewer();
    document.body.classList.toggle('operational-viewer',enabled);
    if(!enabled)return;
    document.querySelectorAll('.view').forEach(v=>v.classList.toggle('on',v.id==='bookings'));
    document.querySelectorAll('.booking-panel').forEach(v=>v.classList.toggle('on',v.id==='bookingTabCalendar'));
    document.querySelectorAll('.booking-tab[data-btab]').forEach(v=>v.classList.toggle('active',v.dataset.btab==='calendar'));
    document.querySelectorAll('#bookingTabCalendar button').forEach(button=>{
      const action=String(button.getAttribute('onclick')||'').toLowerCase();
      if(/edit|delete|add|manage|archive|save/.test(action))button.hidden=true;
    });
  }

  const originalSetBookingTab=window.setBookingTab;
  window.setBookingTab=function(name){
    const result=originalSetBookingTab(isOperationalViewer()?'calendar':name);
    showViewerCalendar();
    return result;
  };

  document.addEventListener('click',event=>{
    if(!isOperationalViewer())return;
    const nav=event.target.closest('.nav button[data-v]');
    if(nav&&nav.dataset.v!=='bookings'){
      event.preventDefault();event.stopImmediatePropagation();showViewerCalendar();
    }
  },true);

  const originalRender=window.render;
  window.render=function(){const result=originalRender();showViewerCalendar();return result};
  const originalEnter=window.enter;
  window.enter=async function(user){const result=await originalEnter(user);showViewerCalendar();window.setBookingTab('calendar');return result};
  const originalCalendar=window.renderBookingCalendar;
  if(originalCalendar)window.renderBookingCalendar=function(){const result=originalCalendar();showViewerCalendar();return result};

  const observer=new MutationObserver(showViewerCalendar);
  observer.observe(document.body,{childList:true,subtree:true});
  showViewerCalendar();
})();
