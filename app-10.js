(function(){
const DAY=86400000;
const role=()=>String(P?.role||'').toLowerCase();
const isOwner=()=>role()==='owner_admin';
const canPoolCheck=()=>isOwner()||role()==='pool_manager';
const canLettingsApprove=()=>isOwner()||role()==='lettings_manager';
const canMarkReady=()=>isOwner()||role()==='lettings_manager';
const canInvoice=()=>isOwner()||role()==='finance';
const canViewFinance=()=>isOwner()||['pool_manager','lettings_manager','finance','bursar'].includes(role());
const canEditBookings=()=>isOwner()||['pool_manager','lettings_manager','booking_admin'].includes(role());

function applyRoleUi(){
 document.querySelectorAll('[data-btab="income"]').forEach(x=>x.style.display=canViewFinance()?'':'none');
 document.querySelectorAll('#bookings .p').forEach(btn=>{
   const t=(btn.textContent||'').toLowerCase();
   if((t.includes('add single')||t.includes('add booking')||t.includes('add school')||t.includes('add recurring'))&&!canEditBookings())btn.style.display='none';
 });
 applyBillingButtons();
}
function applyBillingButtons(){
 const root=document.getElementById('monthlyBilling');if(!root)return;
 root.querySelectorAll('button').forEach(btn=>{
   const oc=btn.getAttribute('onclick')||'';
   if(oc.includes("'pool'"))btn.style.display=canPoolCheck()?'':'none';
   else if(oc.includes("'lettings'"))btn.style.display=canLettingsApprove()?'':'none';
   else if(oc.includes("'ready'"))btn.style.display=canMarkReady()?'':'none';
   else if(oc.includes("'invoice'"))btn.style.display=canInvoice()?'':'none';
   else if(oc.includes("'reopen'"))btn.style.display=(isOwner()||canPoolCheck()||canLettingsApprove())?'':'none';
 });
}
const originalBillingAction=window.billingAction;
if(originalBillingAction){window.billingAction=async function(id,action){
 const ok={pool:canPoolCheck(),lettings:canLettingsApprove(),ready:canMarkReady(),invoice:canInvoice(),reopen:isOwner()||canPoolCheck()||canLettingsApprove()}[action];
 if(!ok)return alert('Your account does not have permission to perform this billing action.');
 return originalBillingAction(id,action);
}}
const observer=new MutationObserver(()=>applyBillingButtons());observer.observe(document.body,{childList:true,subtree:true});

function iso(d){return d.toISOString().slice(0,10)}
function localDate(v){return new Date(v+'T12:00:00')}
function addDays(d,n){return new Date(d.getTime()+n*DAY)}
function startOfWeek(d){let x=new Date(d),shift=(x.getDay()+6)%7;return addDays(x,-shift)}
function endOfWeek(d){return addDays(startOfWeek(d),6)}
function startOfMonth(d){return new Date(d.getFullYear(),d.getMonth(),1,12)}
function endOfMonth(d){return new Date(d.getFullYear(),d.getMonth()+1,0,12)}
function inBreak(pid,date){return BR.some(b=>b.programme_id===pid&&b.starts_on<=date&&(b.ends_on||b.starts_on)>=date)}
function cancelled(pid,sid,date){return EX.some(x=>x.programme_id===pid&&x.exception_date===date&&x.session_id===sid)}
function eventOrg(hirerId){return hn(hirerId)||'School/Internal'}
function calendarEvents(from,to){
 let out=[];
 B.filter(x=>x.status!=='cancelled'&&x.booking_date>=from&&x.booking_date<=to).forEach(x=>out.push({date:x.booking_date,start:String(x.start_time||'').slice(0,5),end:String(x.end_time||'').slice(0,5),title:x.title||'Booking',org:eventOrg(x.hirer_id),site:sn(x.site_id),site_id:x.site_id,hirer_id:x.hirer_id,type:x.booking_type==='school_internal'?'school':'single',kind:x.booking_type==='school_internal'?'School event':'Single booking'}));
 G.filter(p=>p.active!==false&&p.starts_on<=to&&p.ends_on>=from).forEach(p=>{
   let s=p.starts_on>from?p.starts_on:from,e=p.ends_on<to?p.ends_on:to,d=localDate(s),last=localDate(e);
   RS.filter(r=>r.programme_id===p.id&&r.active!==false).forEach(r=>{for(let x=new Date(d);x<=last;x=addDays(x,1)){if(x.getDay()!==Number(r.day_of_week))continue;let date=iso(x);if(inBreak(p.id,date)||cancelled(p.id,r.id,date))continue;out.push({date,start:String(r.start_time||'').slice(0,5),end:String(r.end_time||'').slice(0,5),title:r.title||p.name||'Recurring booking',org:eventOrg(p.hirer_id),site:sn(p.site_id),site_id:p.site_id,hirer_id:p.hirer_id,type:p.hirer_id?'recurring':'school',kind:'Recurring'});}})
 });
 return out.sort((a,b)=>a.date.localeCompare(b.date)||a.start.localeCompare(b.start));
}
function filteredEvents(from,to){let ev=calendarEvents(from,to),site=$('calSite')?.value||'',org=$('calOrg')?.value||'',kind=$('calKind')?.value||'';return ev.filter(x=>(!site||x.site_id===site)&&(!org||(org==='internal'?!x.hirer_id:x.hirer_id===org))&&(!kind||x.type===kind))}
function calEventHtml(x,compact=false){return `<div class="cal-event ${x.type}"><div class=cal-time>${e(x.start)}–${e(x.end)}</div><div class=cal-org>${e(x.org)}</div><div>${e(x.title)}</div>${compact?'':`<div class=cal-meta>${e(x.site)} · ${e(x.kind)}</div>`}</div>`}
function setupCalendarFilters(){let site=$('calSite'),org=$('calOrg');if(site){let v=site.value;site.innerHTML='<option value="">All sites</option>'+S.map(s=>`<option value="${s.id}">${e(s.name)}</option>`).join('');site.value=v}if(org){let v=org.value;org.innerHTML='<option value="">All organisations</option><option value="internal">School/Internal</option>'+H.map(h=>`<option value="${h.id}">${e(h.name)}</option>`).join('');org.value=v}let term=$('calTerm');if(term){let v=term.value;let periods=D.filter(x=>x.starts_on&&x.ends_on).sort((a,b)=>a.starts_on.localeCompare(b.starts_on));term.innerHTML=periods.map(x=>`<option value="${x.id}">${e(x.name||x.period_type||'School period')} — ${e(shortUk(x.starts_on))} to ${e(shortUk(x.ends_on))}</option>`).join('');if(v&&periods.some(x=>x.id===v))term.value=v;else{let today=iso(new Date());let cur=periods.find(x=>x.starts_on<=today&&x.ends_on>=today)||periods[0];if(cur)term.value=cur.id}}}
let CAL_MODE='week',CAL_ANCHOR=new Date();
window.setCalendarMode=function(m){CAL_MODE=m;document.querySelectorAll('.cal-mode').forEach(b=>b.classList.toggle('active',b.dataset.mode===m));$('calAnchorWrap').style.display=m==='term'?'none':'';$('calTermWrap').style.display=m==='term'?'':'none';renderBookingCalendar()}
window.moveCalendar=function(dir){if(CAL_MODE==='week')CAL_ANCHOR=addDays(CAL_ANCHOR,7*dir);else if(CAL_MODE==='month')CAL_ANCHOR=new Date(CAL_ANCHOR.getFullYear(),CAL_ANCHOR.getMonth()+dir,1,12);renderBookingCalendar()}
window.calendarToday=function(){CAL_ANCHOR=new Date();renderBookingCalendar()}
window.calendarAnchorChanged=function(){let v=$('calAnchor').value;if(v)CAL_ANCHOR=localDate(v);renderBookingCalendar()}
window.printBookingCalendar=function(){window.print()}
function renderWeek(){let a=startOfWeek(CAL_ANCHOR),z=endOfWeek(CAL_ANCHOR),from=iso(a),to=iso(z),ev=filteredEvents(from,to),days=[];for(let i=0;i<7;i++)days.push(addDays(a,i));$('calendarRange').textContent=`Week: ${a.toLocaleDateString('en-GB',{day:'numeric',month:'long'})} – ${z.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}`;$('calendarBody').innerHTML=`<div class=cal-week>${days.map(d=>{let ds=iso(d),dayEv=ev.filter(x=>x.date===ds),today=ds===iso(new Date());return `<div class="cal-day ${today?'today':''}"><div class=cal-day-head><b>${d.toLocaleDateString('en-GB',{weekday:'short'})}</b><span>${d.toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</span></div>${dayEv.map(x=>calEventHtml(x)).join('')||'<div class=muted>No bookings</div>'}</div>`}).join('')}</div>`}
function renderMonth(){let first=startOfMonth(CAL_ANCHOR),last=endOfMonth(CAL_ANCHOR),gridStart=startOfWeek(first),gridEnd=endOfWeek(last),ev=filteredEvents(iso(gridStart),iso(gridEnd)),days=[];for(let d=new Date(gridStart);d<=gridEnd;d=addDays(d,1))days.push(new Date(d));$('calendarRange').textContent=first.toLocaleDateString('en-GB',{month:'long',year:'numeric'});let heads=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(x=>`<div class=cal-month-head>${x}</div>`).join('');$('calendarBody').innerHTML=`<div class=cal-month>${heads}${days.map(d=>{let ds=iso(d),dayEv=ev.filter(x=>x.date===ds),out=d.getMonth()!==first.getMonth();return `<div class="cal-cell ${out?'out':''}"><div class=num>${d.getDate()}</div>${dayEv.map(x=>calEventHtml(x,true)).join('')}</div>`}).join('')}</div>`}
function renderTerm(){let p=D.find(x=>x.id===$('calTerm').value);if(!p){$('calendarRange').textContent='No term selected';$('calendarBody').innerHTML='<div class=calendar-empty>No school term/period is available.</div>';return}let ev=filteredEvents(p.starts_on,p.ends_on);$('calendarRange').textContent=`${p.name||p.period_type||'School period'}: ${shortUk(p.starts_on)} – ${shortUk(p.ends_on)}`;let dates=[...new Set(ev.map(x=>x.date))];$('calendarBody').innerHTML=dates.length?`<div class=cal-term-list>${dates.map(ds=>{let d=localDate(ds);return `<div class=cal-term-day><div class=cal-term-date>${d.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div><div class=cal-term-events>${ev.filter(x=>x.date===ds).map(x=>calEventHtml(x)).join('')}</div></div>`}).join('')}</div>`:'<div class=calendar-empty>No bookings in this period.</div>'}
window.renderBookingCalendar=function(){if(!$('calendarBody'))return;setupCalendarFilters();$('calAnchor').value=iso(CAL_ANCHOR);if(CAL_MODE==='week')renderWeek();else if(CAL_MODE==='month')renderMonth();else renderTerm();applyRoleUi()}

const oldSetBookingTab=window.setBookingTab;
window.setBookingTab=function(name){if(name!=='calendar')return oldSetBookingTab(name);document.querySelectorAll('.booking-panel').forEach(x=>x.classList.remove('on'));document.querySelectorAll('.booking-tab').forEach(x=>x.classList.remove('active'));$('bookingTabCalendar')?.classList.add('on');document.querySelector('.booking-tab[data-btab="calendar"]')?.classList.add('active');renderBookingCalendar()}
const oldRender=window.render;
window.render=function(){oldRender();applyRoleUi();if(document.querySelector('#bookingTabCalendar.on'))renderBookingCalendar()}
document.addEventListener('DOMContentLoaded',applyRoleUi);
})();