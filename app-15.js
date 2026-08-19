(function(){
  // Final recurring-booking UI stabiliser. Loaded after site-context wrappers.
  const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  window.manageProgramme=function(id){
    OPEN_PROG=OPEN_PROG===id?null:id;
    window.renderRecurringBookings();
  };

  function programmeId(card){
    const btn=[...card.querySelectorAll('button')].find(b=>(b.getAttribute('onclick')||'').includes('manageProgramme('));
    const m=(btn?.getAttribute('onclick')||'').match(/manageProgramme\('([^']+)'\)/);
    return m?m[1]:null;
  }

  function sessionGroups(pid){
    const sessions=RS.filter(s=>s.programme_id===pid&&s.active!==false), map=new Map();
    sessions.forEach(s=>{
      const key=[String(s.start_time||'').slice(0,5),String(s.end_time||'').slice(0,5),(s.title||'Swimming lessons').trim(),s.charge_type||'chargeable',s.rate??'',!!s.vat_applicable,s.pool_use_type||'whole_pool',s.lane_count??''].join('|');
      if(!map.has(key))map.set(key,[]);
      map.get(key).push(s);
    });
    return [...map.values()].sort((a,b)=>Math.min(...a.map(x=>Number(x.day_of_week)))-Math.min(...b.map(x=>Number(x.day_of_week)))||String(a[0].start_time).localeCompare(String(b[0].start_time)));
  }

  function ruleSummary(sessions){
    if(typeof RSTAFF==='undefined')return '';
    const rules=RSTAFF.filter(r=>r.active!==false&&(r.session_id?sessions.some(s=>s.id===r.session_id):sessions.some(s=>s.programme_id===r.programme_id)));
    const names=[];
    rules.forEach(r=>{
      const label=(r.service_label||({lifeguard:'Lifeguard',swimming_teacher:'Swimming teacher',teacher:'Teacher',other:'Other staffing'})[r.service_type]||'Staffing');
      const text=`${Number(r.staff_count||1)} ${label}`;
      if(!names.includes(text))names.push(text);
    });
    return names.join(', ');
  }

  function addVisibleStaffingRows(){
    document.querySelectorAll('.rb-item').forEach(card=>{
      const pid=programmeId(card), overview=card.querySelector('.rb-overview');
      if(!pid||!overview)return;
      const rows=[...overview.querySelectorAll('.rb-ov-row')], groups=sessionGroups(pid);
      rows.forEach((row,i)=>{
        const sessions=groups[i];
        if(!sessions)return;
        row.querySelectorAll('.rb-ov-staffing').forEach(x=>x.remove());
        const box=document.createElement('div');
        box.className='rb-ov-staffing rb-ov-staffing-visible';
        const summary=ruleSummary(sessions);
        if(summary)box.insertAdjacentHTML('beforeend',`<span class="staffing-rule-badge">${e(summary)}</span>`);
        if(sessions.length===1){
          box.insertAdjacentHTML('beforeend',`<button class="s staffing-session-btn" onclick="editRecurringStaffing(null,'${pid}','${sessions[0].id}')">+ Staffing for ${days[Number(sessions[0].day_of_week)]}</button>`);
        }else{
          box.insertAdjacentHTML('beforeend',`<span class="rb-ov-staff-note">Add staffing to an individual day:</span>`);
          sessions.sort((a,b)=>Number(a.day_of_week)-Number(b.day_of_week)).forEach(s=>box.insertAdjacentHTML('beforeend',`<button class="s staffing-session-btn" onclick="editRecurringStaffing(null,'${pid}','${s.id}')">+ ${days[Number(s.day_of_week)]}</button>`));
        }
        row.appendChild(box);
      });
    });
  }

  const previous=window.renderRecurringBookings;
  window.renderRecurringBookings=function(){
    previous();
    setTimeout(addVisibleStaffingRows,20);
  };

  const style=document.createElement('style');
  style.textContent=`
    .rb-ov-row{flex-wrap:wrap!important;align-items:center}
    .rb-ov-staffing-visible{flex:0 0 100%;display:flex;align-items:center;gap:7px;flex-wrap:wrap;padding:7px 0 2px 102px;border-top:1px dashed #e3e9ef;margin-top:2px}
    .rb-ov-staff-note{font-size:12px;color:#657585;margin-right:3px}
    .staffing-session-btn{padding:5px 8px;font-size:12px}
    @media(max-width:800px){.rb-ov-staffing-visible{padding-left:0}}
  `;
  document.head.appendChild(style);
})();

(function(){
  const css=document.createElement('link');css.rel='stylesheet';css.href='admin-access.css';document.head.appendChild(css);
  const s=document.createElement('script');s.src='app-16.js';
  s.onload=()=>{
    const fix=document.createElement('script');fix.src='app-17.js';
    fix.onload=()=>{
      const staffing=document.createElement('script');staffing.src='app-18.js';
      staffing.onload=()=>{
        const dynamic=document.createElement('script');dynamic.src='app-19.js';
        dynamic.onload=()=>{
          const billing=document.createElement('script');billing.src='app-20.js';
          billing.onload=()=>{
            const recurringGuard=document.createElement('script');recurringGuard.src='app-21.js';
            recurringGuard.onload=()=>{
              const reveal=document.createElement('script');reveal.src='app-22.js';
              reveal.onload=()=>{
                const finalReveal=document.createElement('script');finalReveal.src='app-23.js';
                finalReveal.onload=()=>{
                  const calendarDefault=document.createElement('script');calendarDefault.src='app-24.js';
                  calendarDefault.onload=()=>{const staffingManage=document.createElement('script');staffingManage.src='app-25.js';document.body.appendChild(staffingManage)};
                  document.body.appendChild(calendarDefault)
                };
                document.body.appendChild(finalReveal)
              };
              document.body.appendChild(reveal)
            };
            document.body.appendChild(recurringGuard)
          };
          document.body.appendChild(billing)
        };
        document.body.appendChild(dynamic)
      };
      document.body.appendChild(staffing)
    };
    document.body.appendChild(fix)
  };
  document.body.appendChild(s);
})();