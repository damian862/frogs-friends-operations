(function(){
  const moneyMonth=v=>{if(!v)return '';const [y,m]=String(v).slice(0,7).split('-').map(Number);return new Date(y,m-1,1,12).toLocaleDateString('en-GB',{month:'long',year:'numeric'})};

  function rulesForSessions(sessions){
    const rules=window.RSTAFF||[];
    return rules.filter(r=>r.active!==false&&(r.session_id?sessions.some(s=>s.id===r.session_id):sessions.some(s=>s.programme_id===r.programme_id)));
  }
  function ruleLabel(r){return r.service_label||({lifeguard:'Lifeguard',swimming_teacher:'Swimming teacher',teacher:'Teacher',other:'Other staffing'})[r.service_type]||'Staffing'}

  function addManageableTimetableStaffing(){
    document.querySelectorAll('.rb-item').forEach(card=>{
      const manageBtn=[...card.querySelectorAll('button')].find(b=>(b.getAttribute('onclick')||'').includes('manageProgramme('));
      const m=(manageBtn?.getAttribute('onclick')||'').match(/manageProgramme\('([^']+)'\)/);if(!m)return;
      const pid=m[1],overview=card.querySelector('.rb-overview');if(!overview)return;
      const rows=[...overview.querySelectorAll('.rb-ov-row')];
      rows.forEach(row=>{
        const staffing=row.querySelector('.rb-ov-staffing-visible');if(!staffing)return;
        const rowText=row.textContent||'';
        const sessions=RS.filter(s=>s.programme_id===pid&&s.active!==false).filter(s=>rowText.includes(String(s.start_time||'').slice(0,5))&&rowText.includes(String(s.end_time||'').slice(0,5)));
        const rules=rulesForSessions(sessions);
        staffing.querySelectorAll('.rb-staff-rule-managed').forEach(x=>x.remove());
        staffing.querySelectorAll('.staffing-rule-badge').forEach(x=>x.style.display='none');
        rules.forEach(r=>{
          const wrap=document.createElement('span');wrap.className='rb-staff-rule-managed';
          wrap.innerHTML=`<span class="staffing-rule-badge">${Number(r.staff_count||1)} ${e(ruleLabel(r))}</span><button class="link" onclick="editRecurringStaffing('${r.id}','${pid}')">Edit</button><button class="link danger-link" onclick="deleteRecurringStaffing('${r.id}')">Remove</button>`;
          staffing.insertBefore(wrap,staffing.firstChild);
        });
      });
    });
  }

  const prevRecurring=window.renderRecurringBookings;
  window.renderRecurringBookings=function(){prevRecurring();setTimeout(addManageableTimetableStaffing,80)};

  function staffingMonthHint(){
    const month=$('lgMonth')?.value,host=$('lgRows');if(!month||!host)return;
    let hint=document.getElementById('staffingMonthHint');
    if(hint)hint.remove();
    const hasVisible=host.querySelector('tr td:not([colspan])');
    if(hasVisible)return;
    const site=$('lgSite')?.value||'';
    const candidates=(window.RSTAFF||[]).filter(r=>r.active!==false&&(!site||r.site_id===site)&&r.starts_on).sort((a,b)=>String(a.starts_on).localeCompare(String(b.starts_on)));
    const other=candidates.find(r=>String(r.starts_on).slice(0,7)!==month);
    if(!other)return;
    hint=document.createElement('div');hint.id='staffingMonthHint';hint.className='note staffing-month-hint';
    hint.innerHTML=`Recurring staffing is recorded beginning <b>${e(moneyMonth(other.starts_on))}</b>. Select that month above to view the generated staffing dates and income.`;
    const table=host.closest('table');if(table)table.parentElement.insertBefore(hint,table);
  }

  const prevLg=window.renderLifeguardServices;
  if(prevLg)window.renderLifeguardServices=async function(){await prevLg();setTimeout(staffingMonthHint,30)};

  const prevTab=window.setBookingTab;
  window.setBookingTab=function(tab){prevTab(tab);if(tab==='income')setTimeout(()=>{if(window.renderLifeguardServices)window.renderLifeguardServices()},80)};

  const style=document.createElement('style');style.textContent=`
    .rb-staff-rule-managed{display:inline-flex;align-items:center;gap:6px;margin-right:8px;padding-right:8px;border-right:1px solid #dfe6eb}
    .rb-staff-rule-managed .link{font-size:11px}
    .danger-link{color:#b42318!important}
    .staffing-month-hint{margin:10px 0}
  `;document.head.appendChild(style);
})();
