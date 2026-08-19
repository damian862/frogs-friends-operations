(function(){
const DAY=86400000,OPEN_MIN=6*60,CLOSE_MIN=22*60;
let AVAIL_MODE=false;
function toMin(t){let [h,m]=String(t||'00:00').slice(0,5).split(':').map(Number);return h*60+m}
function fromMin(n){let h=Math.floor(n/60),m=n%60;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`}
function isoLocal(d){let y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`}
function localDate(v){return new Date(v+'T12:00:00')}
function addDays(d,n){return new Date(d.getTime()+n*DAY)}
function weekStart(d){let x=new Date(d),shift=(x.getDay()+6)%7;return addDays(x,-shift)}
function inBreak(pid,date){return BR.some(b=>b.programme_id===pid&&b.starts_on<=date&&(b.ends_on||b.starts_on)>=date)}
function cancelled(pid,sid,date){return EX.some(x=>x.programme_id===pid&&x.exception_date===date&&x.session_id===sid)}
function siteEvents(siteId,date){let blocking=[],partial=[];
 B.filter(x=>x.site_id===siteId&&x.booking_date===date&&x.status!=='cancelled').forEach(x=>blocking.push({start:toMin(x.start_time),end:toMin(x.end_time),label:x.title||'Booking',org:hn(x.hirer_id)||'School/Internal'}));
 G.filter(p=>p.active!==false&&p.site_id===siteId&&p.starts_on<=date&&p.ends_on>=date&&!inBreak(p.id,date)).forEach(p=>{
  let dow=localDate(date).getDay();RS.filter(r=>r.programme_id===p.id&&r.active!==false&&Number(r.day_of_week)===dow&&!cancelled(p.id,r.id,date)).forEach(r=>{
   let item={start:toMin(r.start_time),end:toMin(r.end_time),label:r.title||p.name||'Recurring booking',org:hn(p.hirer_id)||'School/Internal',lanes:Number(r.lane_count||0)};
   if(r.pool_use_type==='lanes')partial.push(item);else blocking.push(item)
  })
 });
 return {blocking,partial}
}
function mergeIntervals(items){let a=items.map(x=>[Math.max(OPEN_MIN,x.start),Math.min(CLOSE_MIN,x.end)]).filter(x=>x[1]>x[0]).sort((x,y)=>x[0]-y[0]),out=[];for(let cur of a){let last=out[out.length-1];if(last&&cur[0]<=last[1])last[1]=Math.max(last[1],cur[1]);else out.push(cur.slice())}return out}
function gaps(blocking){let busy=mergeIntervals(blocking),g=[],cursor=OPEN_MIN;busy.forEach(([s,e])=>{if(s>cursor)g.push([cursor,s]);cursor=Math.max(cursor,e)});if(cursor<CLOSE_MIN)g.push([cursor,CLOSE_MIN]);return g}
function hrs(slots){return slots.reduce((a,[s,e])=>a+(e-s)/60,0)}
function slotHtml(s){return `<div class=availability-slot><b>${fromMin(s[0])}–${fromMin(s[1])}</b><span>${((s[1]-s[0])/60).toFixed(((s[1]-s[0])%60)?1:0)} available hr${(s[1]-s[0])===60?'':'s'}</span></div>`}
function partialHtml(x){return `<div class=availability-partial>${e(fromMin(x.start))}–${e(fromMin(x.end))} · ${e(x.org)} · ${e(x.label)}${x.lanes?` · ${x.lanes} lane${x.lanes===1?'':'s'} in use`:''}</div>`}
function selectedSites(){let v=$('calSite')?.value||'';return v?S.filter(s=>s.id===v):S.filter(s=>s.active!==false)}
function renderAvailability(){let anchor=$('calAnchor')?.value?localDate($('calAnchor').value):new Date(),start=weekStart(anchor),days=Array.from({length:7},(_,i)=>addDays(start,i)),sites=selectedSites();let total=0,largest=0,slotCount=0;let siteHtml=sites.map(site=>{let dhtml=days.map(d=>{let date=isoLocal(d),ev=siteEvents(site.id,date),gs=gaps(ev.blocking),dh=hrs(gs);total+=dh;slotCount+=gs.length;gs.forEach(x=>largest=Math.max(largest,(x[1]-x[0])/60));return `<div class=availability-day><div class=availability-day-head>${d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})}<div class=availability-hours>${dh.toFixed(1)} hrs open</div></div>${gs.length?gs.map(slotHtml).join(''):'<div class=availability-none>No fully open time</div>'}${ev.partial.length?`<div class=availability-partial><b>Partial pool use</b></div>${ev.partial.map(partialHtml).join('')}`:''}</div>`}).join('');return `<div class=availability-site><div class=availability-site-head><h3>${e(site.name)}</h3><span>Pool opening hours 06:00–22:00</span></div><div class=availability-days>${dhtml}</div></div>`}).join('');
 $('calendarRange').textContent=`Availability: ${days[0].toLocaleDateString('en-GB',{day:'numeric',month:'long'})} – ${days[6].toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}`;
 $('calendarBody').innerHTML=`<div class=availability-summary><div class=availability-kpi><span>Fully open hours</span><b>${total.toFixed(1)}</b></div><div class=availability-kpi><span>Available time slots</span><b>${slotCount}</b></div><div class=availability-kpi><span>Largest open window</span><b>${largest.toFixed(1)} hrs</b></div></div><div class=availability-note><b>Commercial availability:</b> green slots are fully open and could potentially be offered for hire. Amber entries show recurring sessions using only part of the pool; these may still offer lane capacity. Exact lane availability will be added once each site's total lane count is recorded.</div>${siteHtml||'<div class=calendar-empty>No active sites available.</div>'}`;
}
const oldSetMode=window.setCalendarMode,oldRender=window.renderBookingCalendar;
window.setCalendarMode=function(m){AVAIL_MODE=false;document.querySelectorAll('.cal-mode').forEach(b=>b.classList.toggle('active',b.dataset.mode===m));return oldSetMode(m)};
window.setAvailabilityMode=function(){AVAIL_MODE=true;if(oldSetMode)oldSetMode('week');AVAIL_MODE=true;document.querySelectorAll('.cal-mode').forEach(b=>b.classList.toggle('active',b.dataset.mode==='availability'));$('calAnchorWrap').style.display='';$('calTermWrap').style.display='none';renderAvailability()};
window.renderBookingCalendar=function(){if(AVAIL_MODE)return renderAvailability();return oldRender()};
const oldMove=window.moveCalendar;window.moveCalendar=function(dir){if(!AVAIL_MODE)return oldMove(dir);AVAIL_MODE=false;oldMove(dir);AVAIL_MODE=true;renderAvailability()};
const oldToday=window.calendarToday;window.calendarToday=function(){if(!AVAIL_MODE)return oldToday();AVAIL_MODE=false;oldToday();AVAIL_MODE=true;renderAvailability()};
const oldAnchor=window.calendarAnchorChanged;window.calendarAnchorChanged=function(){if(!AVAIL_MODE)return oldAnchor();renderAvailability()};
function inject(){let nav=document.querySelector('#bookingTabCalendar .calendar-nav:nth-of-type(2)');if(nav&&!nav.querySelector('[data-mode="availability"]')){let b=document.createElement('button');b.className='booking-tab cal-mode';b.dataset.mode='availability';b.textContent='Availability';b.onclick=window.setAvailabilityMode;nav.appendChild(b)}}
inject();
})();