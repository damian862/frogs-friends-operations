(function(){
  let staffingCustomerTouched=false;

  function fixStaffingFilter(){
    const sel=document.getElementById('lgCustomer');
    if(!sel)return;
    const label=sel.closest('label');
    if(label&&label.firstChild&&label.firstChild.nodeType===Node.TEXT_NODE)label.firstChild.nodeValue='Customer filter';
    if(!staffingCustomerTouched){sel.value='';}
    sel.onchange=()=>{staffingCustomerTouched=true;if(window.renderLifeguardServices)window.renderLifeguardServices()};
  }

  const prevLg=window.renderLifeguardServices;
  if(prevLg){window.renderLifeguardServices=async function(){fixStaffingFilter();await prevLg();fixStaffingFilter()}}

  function forceCalendarVisible(){
    const panel=document.getElementById('bookingTabCalendar'),tab=document.querySelector('.booking-tab[data-btab="calendar"]');
    if(!panel||!tab)return;
    document.querySelectorAll('.booking-panel').forEach(x=>{x.classList.remove('on');x.style.display=''});
    document.querySelectorAll('.booking-tab').forEach(x=>x.classList.remove('active'));
    panel.classList.add('on');tab.classList.add('active');
    if(typeof window.renderBookingCalendar==='function')window.renderBookingCalendar();
  }

  const prevTab=window.setBookingTab;
  window.setBookingTab=function(tab){
    const cal=document.getElementById('bookingTabCalendar');if(cal)cal.style.display='';
    if(tab==='calendar'){if(prevTab)prevTab('calendar');setTimeout(forceCalendarVisible,0);return}
    return prevTab?prevTab(tab):undefined;
  };

  document.addEventListener('click',ev=>{
    const cal=ev.target.closest('.booking-tab[data-btab="calendar"]');if(cal)setTimeout(forceCalendarVisible,0);
    const income=ev.target.closest('.booking-tab[data-btab="income"]');if(income){staffingCustomerTouched=false;setTimeout(()=>{fixStaffingFilter();if(window.renderLifeguardServices)window.renderLifeguardServices()},80)}
  });

  window.addEventListener('load',()=>{setTimeout(()=>{const cal=document.getElementById('bookingTabCalendar');if(cal)cal.style.display='';if(document.querySelector('.booking-tab[data-btab="calendar"]')?.classList.contains('active'))forceCalendarVisible();fixStaffingFilter()},200)});
})();