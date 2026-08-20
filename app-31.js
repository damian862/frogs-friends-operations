(function(){
  let calendarCollapsed=false;

  function ensureSharedCalendar(){
    const bookings=document.getElementById('bookings');
    const tabs=bookings?.querySelector('.booking-tabs');
    const original=document.getElementById('bookingTabCalendar');
    if(!bookings||!tabs||!original)return;
    let shared=document.getElementById('sharedBookingCalendar');
    if(!shared){
      shared=document.createElement('div');
      shared.id='sharedBookingCalendar';shared.className='shared-booking-calendar';
      shared.innerHTML='<div class="shared-calendar-head"><div><b>Bookings Calendar</b><span>Week, month, term and availability view</span></div><button type="button" class="s" id="sharedCalendarToggle" onclick="toggleSharedCalendar()"><span id="sharedCalendarChevron">▾</span> Hide calendar</button></div><div id="sharedCalendarBody"></div>';
      tabs.insertAdjacentElement('afterend',shared);
    }
    const body=document.getElementById('sharedCalendarBody');
    if(body&&!body.children.length)while(original.firstChild)body.appendChild(original.firstChild);
    original.classList.remove('on');original.style.display='none';applyCalendarCollapse();
  }

  function applyCalendarCollapse(){
    const body=document.getElementById('sharedCalendarBody'),btn=document.getElementById('sharedCalendarToggle'),chev=document.getElementById('sharedCalendarChevron');
    if(body)body.style.display=calendarCollapsed?'none':'';
    if(btn)btn.lastChild.nodeValue=calendarCollapsed?' Show calendar':' Hide calendar';
    if(chev)chev.textContent=calendarCollapsed?'▸':'▾';
  }
  window.toggleSharedCalendar=function(){calendarCollapsed=!calendarCollapsed;applyCalendarCollapse();if(!calendarCollapsed&&typeof window.renderBookingCalendar==='function')setTimeout(()=>window.renderBookingCalendar(),0)};

  function activateTabVisual(tab){document.querySelectorAll('.booking-tab[data-btab]').forEach(x=>x.classList.remove('active'));document.querySelector(`.booking-tab[data-btab="${tab}"]`)?.classList.add('active')}
  function showOnlyPanel(id){
    document.querySelectorAll('.booking-panel').forEach(p=>{p.classList.remove('on');p.style.display='none'});
    const panel=document.getElementById(id);
    if(panel){panel.classList.add('on');panel.style.display='block';[...panel.children].forEach(ch=>ch.style.display='')}
    const original=document.getElementById('bookingTabCalendar');if(original)original.style.display='none';
    return panel;
  }

  const priorSet=window.setBookingTab;
  window.setBookingTab=function(tab){
    ensureSharedCalendar();
    if(tab==='calendar'){
      document.querySelectorAll('.booking-panel').forEach(x=>{x.classList.remove('on');x.style.display='none'});activateTabVisual('calendar');calendarCollapsed=false;applyCalendarCollapse();if(typeof window.renderBookingCalendar==='function')setTimeout(()=>window.renderBookingCalendar(),0);return;
    }
    const result=priorSet?priorSet(tab):undefined;ensureSharedCalendar();const original=document.getElementById('bookingTabCalendar');if(original){original.classList.remove('on');original.style.display='none'}return result;
  };

  function directManageSeries(card){
    const pid=card?.dataset.programmeId;
    if(!pid){alert('This recurring session could not be matched.');return}
    const programme=G.find(g=>String(g.id)===String(pid));
    if(!programme){alert('This recurring booking could not be found.');return}

    ensureSharedCalendar();
    OPEN_PROG=programme.id;
    showOnlyPanel('bookingTabRecurring');
    activateTabVisual('recurring');

    const site=document.getElementById('rbSite'),org=document.getElementById('rbOrg'),search=document.getElementById('rbSearch'),status=document.getElementById('rbStatus');
    if(search)search.value='';
    if(site&&[...site.options].some(o=>String(o.value)===String(programme.site_id||'')))site.value=programme.site_id||'';
    if(org){const wanted=programme.hirer_id||'internal';if([...org.options].some(o=>String(o.value)===String(wanted)))org.value=wanted}
    if(status)status.value='active';

    if(typeof window.renderRecurringBookings==='function')window.renderRecurringBookings();
    OPEN_PROG=programme.id;

    // Some older render wrappers can re-collapse/re-hide the panel. Reassert the
    // intended state after all synchronous and delayed render work has completed.
    [20,100,250].forEach(delay=>setTimeout(()=>{
      showOnlyPanel('bookingTabRecurring');activateTabVisual('recurring');OPEN_PROG=programme.id;
      if(typeof window.renderRecurringBookings==='function'&&delay===20)window.renderRecurringBookings();
      const cards=[...document.querySelectorAll('#rProg .rb-item')];
      const target=cards.find(el=>[...el.querySelectorAll('button')].some(b=>(b.getAttribute('onclick')||'').includes(String(programme.id))));
      if(target){target.style.display='';target.querySelectorAll(':scope > *').forEach(ch=>ch.style.display='');if(delay===250)target.scrollIntoView({behavior:'smooth',block:'start'})}
    },delay));
  }

  window.calendarManageRecurring=function(btn){directManageSeries(btn?.closest('.cal-event'))};
  // Capture the click before older inline/wrapper handlers can interfere.
  document.addEventListener('click',ev=>{
    const manage=ev.target.closest('.cal-event-actions button');
    if(manage&&manage.textContent.trim()==='Manage series'){
      ev.preventDefault();ev.stopImmediatePropagation();directManageSeries(manage.closest('.cal-event'));return;
    }
    const tab=ev.target.closest('.booking-tab[data-btab]');if(tab)setTimeout(ensureSharedCalendar,0);
  },true);

  const priorRender=window.render;
  window.render=function(){const out=priorRender?priorRender():undefined;setTimeout(()=>{ensureSharedCalendar();if(document.getElementById('bookings')?.classList.contains('on')&&!calendarCollapsed&&typeof window.renderBookingCalendar==='function')window.renderBookingCalendar()},0);return out};
  window.addEventListener('load',()=>setTimeout(()=>{ensureSharedCalendar();if(typeof window.renderBookingCalendar==='function')window.renderBookingCalendar()},250));

  const style=document.createElement('style');style.textContent=`.shared-booking-calendar{margin:8px 0 16px}.shared-calendar-head{display:flex;justify-content:space-between;align-items:center;gap:14px;background:#f7fafc;border:1px solid #dce4eb;border-radius:10px 10px 0 0;padding:10px 12px}.shared-calendar-head>div{display:flex;flex-direction:column;gap:2px}.shared-calendar-head>div>b{font-size:15px}.shared-calendar-head>div>span{font-size:12px;color:#6b7280}#sharedCalendarBody{border:1px solid #dce4eb;border-top:0;border-radius:0 0 10px 10px;padding:12px;background:#fff}#sharedCalendarBody .term-top.compact{margin-top:0}#bookingTabCalendar{display:none!important}@media(max-width:700px){.shared-calendar-head{align-items:flex-start;flex-direction:column}}`;document.head.appendChild(style);
})();