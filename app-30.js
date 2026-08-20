(function(){
  function calendarRecordForCard(card){
    const time=(card.querySelector('.cal-time')?.textContent||'').split('–'),org=(card.querySelector('.cal-org')?.textContent||'').trim(),title=(card.children[2]?.textContent||'').trim();
    const day=card.closest('[data-date]')?.dataset.date;
    return {time,org,title,day};
  }
  function findBooking(card){
    const r=calendarRecordForCard(card);if(!r.day)return null;
    return B.find(b=>b.booking_date===r.day&&String(b.start_time||'').slice(0,5)===r.time[0]&&String(b.end_time||'').slice(0,5)===r.time[1]&&(b.title||'Booking')===r.title&&(hn(b.hirer_id)||'School/Internal')===r.org)||null;
  }
  function findRecurring(card){
    const r=calendarRecordForCard(card);if(!r.day)return null;const dow=new Date(r.day+'T12:00:00').getDay();
    for(const p of G){if(p.active===false||p.starts_on>r.day||p.ends_on<r.day||(hn(p.hirer_id)||'School/Internal')!==r.org)continue;const s=RS.find(x=>x.programme_id===p.id&&x.active!==false&&Number(x.day_of_week)===dow&&String(x.start_time||'').slice(0,5)===r.time[0]&&String(x.end_time||'').slice(0,5)===r.time[1]&&(x.title||p.name||'Recurring booking')===r.title);if(s)return {p,s}}
    return null;
  }
  window.calendarEditEvent=function(btn){const card=btn.closest('.cal-event');if(!card)return;const b=findBooking(card);if(b)return editBooking(b.id);const rr=findRecurring(card);if(rr)return editSession(rr.s.id,rr.p.id);alert('This calendar item could not be matched to its booking record.')};
  window.calendarManageRecurring=function(btn){const card=btn.closest('.cal-event'),rr=findRecurring(card);if(!rr)return alert('This recurring session could not be matched.');OPEN_PROG=rr.p.id;setBookingTab('recurring');setTimeout(()=>{renderRecurringBookings();document.querySelector('.rb-item button[onclick*="'+rr.p.id+'"]')?.closest('.rb-item')?.scrollIntoView({behavior:'smooth',block:'center'})},80)};
  function addCalendarActions(){document.querySelectorAll('.cal-event').forEach(card=>{if(card.querySelector('.cal-event-actions'))return;const isRecurring=(card.querySelector('.cal-meta')?.textContent||'').includes('Recurring');const actions=document.createElement('div');actions.className='cal-event-actions';actions.innerHTML=`<button type=button onclick="event.stopPropagation();calendarEditEvent(this)">Edit</button>${isRecurring?'<button type=button onclick="event.stopPropagation();calendarManageRecurring(this)">Manage series</button>':''}`;card.appendChild(actions)})}
  const priorCal=window.renderBookingCalendar;window.renderBookingCalendar=function(){priorCal();setTimeout(addCalendarActions,0)};

  const panels=[['recurring','bookingTabRecurring','Recurring Bookings'],['single','bookingTabSingle','Single Booking'],['school','bookingTabSchool','School Events'],['income','bookingTabIncome','Pool Usage & Income']];
  const collapsed={};
  window.toggleBookingSection=function(name){collapsed[name]=!collapsed[name];applyCollapsibleSections()};
  function applyCollapsibleSections(){panels.forEach(([name,id,label])=>{const panel=document.getElementById(id);if(!panel)return;let bar=panel.querySelector(':scope > .section-collapse-bar');if(!bar){bar=document.createElement('div');bar.className='section-collapse-bar';bar.innerHTML=`<button type=button onclick="toggleBookingSection('${name}')"><span class=section-chevron>▾</span> ${label}</button>`;panel.insertBefore(bar,panel.firstChild)}bar.querySelector('.section-chevron').textContent=collapsed[name]?'▸':'▾';[...panel.children].forEach(ch=>{if(ch!==bar)ch.style.display=collapsed[name]?'none':''})})}
  const priorTab=window.setBookingTab;window.setBookingTab=function(name){priorTab(name);setTimeout(applyCollapsibleSections,0)};
  const priorRender=window.render;window.render=function(){priorRender();setTimeout(applyCollapsibleSections,0)};
  window.addEventListener('load',()=>setTimeout(applyCollapsibleSections,150));

  const style=document.createElement('style');style.textContent=`.cal-event{position:relative}.cal-event-actions{display:flex;gap:4px;flex-wrap:wrap;margin-top:5px}.cal-event-actions button{border:0;background:#fff;border-radius:5px;padding:3px 6px;font-size:10px;cursor:pointer;box-shadow:0 0 0 1px rgba(15,60,90,.15)}.cal-event-actions button:hover{background:#eef5fa}.section-collapse-bar{display:flex;justify-content:flex-end;margin:0 0 8px}.section-collapse-bar button{border:1px solid #d9e2ea;background:#f6f9fb;border-radius:7px;padding:6px 10px;font-weight:600;cursor:pointer;color:#173b57}.section-chevron{display:inline-block;width:14px}`;document.head.appendChild(style);
})();