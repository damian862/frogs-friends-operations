(function(){
  let STAFF_ENTRIES=[], RECUR_RULES=[];
  const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const money=v=>'£'+Number(v||0).toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2});
  const serviceName=x=>x.service_label||({lifeguard:'Lifeguard',swimming_teacher:'Swimming teacher',teacher:'Teacher',other:'Other staffing'})[x.service_type]||'Staffing';
  const hoursBetween=(a,b)=>{let x=String(a||'').split(':').map(Number),y=String(b||'').split(':').map(Number);if(x.length<2||y.length<2)return 0;return Math.max(0,(y[0]*60+y[1]-x[0]*60-x[1])/60)};
  const monthBounds=v=>{let [y,m]=String(v).split('-').map(Number),last=new Date(y,m,0,12);return {from:`${y}-${String(m).padStart(2,'0')}-01`,to:`${last.getFullYear()}-${String(last.getMonth()+1).padStart(2,'0')}-${String(last.getDate()).padStart(2,'0')}`}};
  const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const maxDate=(...v)=>v.filter(Boolean).sort().at(-1);
  const minDate=(...v)=>v.filter(Boolean).sort()[0];

  async function loadUnifiedStaffing(){
    const [a,b]=await Promise.all([
      sb.from('lifeguard_service_entries').select('*').order('service_date',{ascending:false}),
      sb.from('recurring_staffing_services').select('*').order('created_at')
    ]);
    STAFF_ENTRIES=a.data||[];RECUR_RULES=b.data||[];window.RSTAFF=RECUR_RULES;
  }

  function isBreak(pid,date){return BR.some(b=>b.programme_id===pid&&b.starts_on<=date&&(b.ends_on||b.starts_on)>=date)}
  function isCancelled(pid,sid,date){return EX.some(x=>x.programme_id===pid&&x.exception_date===date&&(!x.session_id||x.session_id===sid))}

  function generatedRecurring(month){
    const {from,to}=monthBounds(month),out=[];
    RECUR_RULES.filter(r=>r.active!==false&&(!r.starts_on||r.starts_on<=to)&&(!r.ends_on||r.ends_on>=from)).forEach(r=>{
      const p=G.find(g=>g.id===r.programme_id);if(!p||p.active===false||p.starts_on>to||p.ends_on<from)return;
      const sessions=r.session_id?RS.filter(s=>s.id===r.session_id&&s.active!==false):RS.filter(s=>s.programme_id===p.id&&s.active!==false);
      const start=maxDate(from,p.starts_on,r.starts_on),end=minDate(to,p.ends_on,r.ends_on);
      if(!start||!end||start>end)return;
      sessions.forEach(s=>{
        let d=new Date(start+'T12:00:00'),last=new Date(end+'T12:00:00');
        while(d<=last){
          const date=iso(d);
          if(d.getDay()===Number(s.day_of_week)&&!isBreak(p.id,date)&&!isCancelled(p.id,s.id,date)){
            const h=hoursBetween(r.start_time||s.start_time,r.end_time||s.end_time),count=Number(r.staff_count||1),net=h*count*Number(r.hourly_rate||0);
            out.push({id:`rec:${r.id}:${date}:${s.id}`,generated:true,recurring_rule_id:r.id,programme_id:p.id,session_id:s.id,site_id:r.site_id||p.site_id,booking_id:null,service_date:date,start_time:r.start_time||s.start_time,end_time:r.end_time||s.end_time,lifeguard_count:count,hours_per_lifeguard:h,total_lifeguard_hours:h*count,hourly_rate:Number(r.hourly_rate||0),vat_applicable:!!r.vat_applicable,vat_rate:Number(r.vat_rate||20),net_amount:net,status:'recurring',service_type:r.service_type,service_label:r.service_label,customer_type:r.customer_type==='external_hirer'?'hirer':'school',customer_hirer_id:r.customer_hirer_id,notes:r.notes||null});
          }
          d=new Date(d.getTime()+86400000);
        }
      });
    });
    return out;
  }

  function customerName(x){return x.customer_type==='hirer'?(hn(x.customer_hirer_id)||'External hirer'):(sn(x.site_id)||'School')}
  function vatAmount(x){return x.vat_applicable?Number(x.net_amount||0)*Number(x.vat_rate||20)/100:0}

  const priorStaffRender=window.renderLifeguardServices;
  window.renderLifeguardServices=async function(){
    if(priorStaffRender)await priorStaffRender();
    if(!$('lgMonth')||!$('lgRows'))return;
    await loadUnifiedStaffing();
    const month=$('lgMonth').value,site=$('lgSite')?.value||'',cust=$('lgCustomer')?.value||'',{from,to}=monthBounds(month);
    let rows=STAFF_ENTRIES.filter(x=>x.service_date>=from&&x.service_date<=to).concat(generatedRecurring(month));
    rows=rows.filter(x=>(!site||x.site_id===site)&&(!cust||x.customer_type===cust)).sort((a,b)=>String(a.service_date).localeCompare(String(b.service_date))||String(a.start_time||'').localeCompare(String(b.start_time||'')));
    const active=rows.filter(x=>x.status!=='cancelled'),hours=active.reduce((a,x)=>a+Number(x.total_lifeguard_hours||0),0),net=active.reduce((a,x)=>a+Number(x.net_amount||0),0),schoolNet=active.filter(x=>x.customer_type==='school').reduce((a,x)=>a+Number(x.net_amount||0),0),hirerNet=active.filter(x=>x.customer_type==='hirer').reduce((a,x)=>a+Number(x.net_amount||0),0);
    $('lgKpis').innerHTML=`<div class=lg-kpi><span>Total staffing hours</span><b>${hours.toFixed(2)}</b></div><div class=lg-kpi><span>Frogs & Friends staffing income</span><b>${money(net)}</b></div><div class=lg-kpi><span>Charged to school</span><b>${money(schoolNet)}</b></div><div class=lg-kpi><span>Charged to external hirers</span><b>${money(hirerNet)}</b></div>`;
    $('lgRows').innerHTML=rows.map(x=>`<tr><td>${e(shortUk(x.service_date))}</td><td><b>${e(serviceName(x))}</b>${x.generated?'<div class=lg-note>From recurring booking</div>':x.booking_id?'<div class=lg-note>Linked to booking/event</div>':''}</td><td>${e(customerName(x))}<div class=lg-note>${x.customer_type==='hirer'?'External customer':'School expenditure'}</div></td><td>${x.start_time?e(String(x.start_time).slice(0,5)):'—'}${x.end_time?'–'+e(String(x.end_time).slice(0,5)):''}</td><td>${Number(x.lifeguard_count||1)}</td><td>${Number(x.hours_per_lifeguard||0).toFixed(2)}</td><td><b>${Number(x.total_lifeguard_hours||0).toFixed(2)}</b></td><td>${money(x.hourly_rate)}/hr</td><td><b>${money(x.net_amount)}</b>${vatAmount(x)?`<div class=lg-note>+ ${money(vatAmount(x))} VAT</div>`:''}</td><td><span class="lg-status ${e(x.status||'confirmed')}">${x.generated?'Recurring':e(x.status||'confirmed')}</span></td><td class=lg-actions>${x.generated?'<span class=lg-note>Managed from recurring booking</span>':`<button class=link onclick="editBookingStaffing(null,'${x.id}')">Edit</button>`}</td></tr>`).join('')||'<tr><td colspan=11 class=muted>No staffing charges recorded for this month.</td></tr>';
  };

  function staffingForBooking(id){return STAFF_ENTRIES.filter(x=>x.booking_id===id&&x.status!=='cancelled')}
  function injectBookingStaffingButtons(){
    const add=(tbodyId,bookings)=>{const body=$(tbodyId);if(!body)return;const rows=[...body.querySelectorAll('tr')];bookings.forEach((b,i)=>{const tr=rows[i];if(!tr)return;const cell=tr.lastElementChild;if(!cell||cell.querySelector('.booking-staffing-btn'))return;const count=staffingForBooking(b.id).length;cell.insertAdjacentHTML('beforeend',`${cell.innerHTML.trim()?' · ':''}<button class="link booking-staffing-btn" onclick="editBookingStaffing('${b.id}')">${count?`Staffing (${count})`:'+ Staffing'}</button>`)});};
    add('rBookings',B);add('rSingleBookings',B.filter(x=>x.booking_type!=='school_internal'));add('rSchoolBookings',B.filter(x=>x.booking_type==='school_internal'));
  }

  const priorBookingTables=window.renderBookingTables;
  window.renderBookingTables=function(){priorBookingTables();setTimeout(async()=>{await loadUnifiedStaffing();injectBookingStaffingButtons()},0)};

  window.bookingStaffCustomerChanged=function(){let wrap=$('bsHirerWrap');if(wrap)wrap.style.display=$('bsCustomer')?.value==='hirer'?'':'none'};
  window.bookingStaffTimesChanged=function(){let a=$('bsStart')?.value,b=$('bsEnd')?.value,h=$('bsHours');if(a&&b&&h)h.value=hoursBetween(a,b).toFixed(2)};

  window.editBookingStaffing=async function(bookingId,entryId){
    await loadUnifiedStaffing();
    const x=STAFF_ENTRIES.find(z=>z.id===entryId)||{},booking=bookingId?B.find(b=>b.id===bookingId):(x.booking_id?B.find(b=>b.id===x.booking_id):null);
    const site=x.site_id||booking?.site_id||S[0]?.id||'',date=x.service_date||booking?.booking_date||new Date().toISOString().slice(0,10),stype=x.service_type||'lifeguard';
    const defaultCustomer=booking?.booking_type==='school_internal'?'school':(booking?.hirer_id?'hirer':'school'),cust=x.customer_type||defaultCustomer,hirer=x.customer_hirer_id||booking?.hirer_id||'';
    const start=String(x.start_time||booking?.start_time||'').slice(0,5),end=String(x.end_time||booking?.end_time||'').slice(0,5),hours=x.hours_per_lifeguard??hoursBetween(start,end);
    modal(entryId?'Edit staffing charge':booking?'Add staffing to booking':'Add staffing charge',`${booking?`<div style="grid-column:1/-1" class="note"><b>${e(booking.title||'Booking')}</b> · ${e(shortUk(booking.booking_date))} · ${e(String(booking.start_time||'').slice(0,5))}–${e(String(booking.end_time||'').slice(0,5))}</div>`:''}<label>School / pool site<select id=bsSite>${opts(S,site,z=>z.name)}</select></label><label>Date<input id=bsDate type=date value="${date}"></label><label>Service type<select id=bsType><option value=lifeguard ${stype==='lifeguard'?'selected':''}>Lifeguard</option><option value=swimming_teacher ${stype==='swimming_teacher'?'selected':''}>Swimming teacher</option><option value=teacher ${stype==='teacher'?'selected':''}>Teacher</option><option value=other ${stype==='other'?'selected':''}>Other staffing</option></select></label><label>Service description<input id=bsLabel value="${e(x.service_label||'')}"></label><label>Charge Frogs & Friends service to<select id=bsCustomer onchange="bookingStaffCustomerChanged()"><option value=school ${cust==='school'?'selected':''}>School</option><option value=hirer ${cust==='hirer'?'selected':''}>Hiring organisation</option></select></label><label id=bsHirerWrap style="display:${cust==='hirer'?'':'none'}">Hiring organisation<select id=bsHirer><option value="">Select organisation</option>${opts(H,hirer,z=>z.name)}</select></label><label>Start time<input id=bsStart type=time value="${start}" onchange="bookingStaffTimesChanged()"></label><label>End time<input id=bsEnd type=time value="${end}" onchange="bookingStaffTimesChanged()"></label><label>Number of staff<input id=bsCount type=number min=1 step=1 value="${x.lifeguard_count||1}"></label><label>Hours per staff member<input id=bsHours type=number min=0 step=.25 value="${Number(hours||0).toFixed(2)}"></label><label>Charge rate per staff hour (£)<input id=bsRate type=number min=0 step=.01 value="${x.hourly_rate??''}"></label><label>VAT<select id=bsVat><option value=false ${!x.vat_applicable?'selected':''}>No VAT</option><option value=true ${x.vat_applicable?'selected':''}>VAT applies</option></select></label><label>Status<select id=bsStatus><option value=draft ${x.status==='draft'?'selected':''}>Draft</option><option value=confirmed ${(!x.status||x.status==='confirmed')?'selected':''}>Confirmed</option><option value=cancelled ${x.status==='cancelled'?'selected':''}>Cancelled</option></select></label><label>Notes<textarea id=bsNotes>${e(x.notes||'')}</textarea></label>`,async()=>{
      if(bsCustomer.value==='hirer'&&!bsHirer.value)return alert('Select the hiring organisation to charge.');
      const count=Number(bsCount.value||1),h=Number(bsHours.value||0),rate=Number(bsRate.value||0);
      const p={organisation_id:P.organisation_id,site_id:bsSite.value,booking_id:booking?.id||x.booking_id||null,service_date:bsDate.value,service_type:bsType.value,service_label:bsLabel.value||null,customer_type:bsCustomer.value,customer_hirer_id:bsCustomer.value==='hirer'?bsHirer.value:null,start_time:bsStart.value||null,end_time:bsEnd.value||null,lifeguard_count:count,hours_per_lifeguard:h,total_lifeguard_hours:h*count,hourly_rate:rate,net_amount:h*count*rate,vat_applicable:bsVat.value==='true',vat_rate:20,status:bsStatus.value,notes:bsNotes.value||null,created_by:x.created_by||P.id,updated_at:new Date().toISOString()};
      const q=entryId?await sb.from('lifeguard_service_entries').update(p).eq('id',entryId):await sb.from('lifeguard_service_entries').insert(p);if(q.error)return alert(q.error.message);
      closeM();await loadUnifiedStaffing();renderBookingTables();if($('lgMonth'))await renderLifeguardServices();
    });
  };

  const style=document.createElement('style');style.textContent='.booking-staffing-btn{white-space:nowrap}.lg-status.recurring{background:#e8f1fb;color:#174f7a}.lg-note{font-size:11px;color:#6b7b88;margin-top:2px}';document.head.appendChild(style);

  window.addEventListener('load',()=>setTimeout(async()=>{await loadUnifiedStaffing();injectBookingStaffingButtons();if($('lgMonth'))renderLifeguardServices()},100));
})();