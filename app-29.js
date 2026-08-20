(function(){
  function enhanceStaffingCustomerFilter(){
    const sel=document.getElementById('lgCustomer');
    if(!sel||sel.dataset.ffCustomerEnhanced==='1')return;
    const current=sel.value;
    sel.innerHTML='<option value="">All customers</option><option value="school">School</option><optgroup label="External hirers">'+H.map(h=>`<option value="hirer:${h.id}">${e(h.name)}</option>`).join('')+'</optgroup>';
    if(current==='school')sel.value='school';else if(current&&current.startsWith('hirer:'))sel.value=current;else sel.value='';
    sel.dataset.ffCustomerEnhanced='1';
  }

  const prior=window.renderLifeguardServices;
  window.renderLifeguardServices=async function(){
    enhanceStaffingCustomerFilter();
    const sel=document.getElementById('lgCustomer');
    const chosen=sel?.value||'';
    // The underlying renderer understands school/hirer only. Render all hirers,
    // then narrow to an individual hirer below when required.
    if(sel&&chosen.startsWith('hirer:'))sel.value='hirer';
    await prior();
    enhanceStaffingCustomerFilter();
    if(sel)sel.value=chosen;

    const tbody=document.getElementById('lgRows');
    if(!tbody)return;
    if(chosen.startsWith('hirer:')){
      const id=chosen.slice(6),name=hn(id);
      [...tbody.querySelectorAll('tr')].forEach(tr=>{const customer=tr.children[2]?.textContent||'';tr.style.display=customer.includes(name)?'':'none'});
      const visible=[...tbody.querySelectorAll('tr')].filter(tr=>tr.style.display!=='none');
      let hours=0,net=0;
      visible.forEach(tr=>{hours+=Number((tr.children[6]?.textContent||'0').replace(/[^0-9.-]/g,''))||0;net+=Number((tr.children[8]?.textContent||'0').replace(/[^0-9.-]/g,''))||0});
      const k=document.getElementById('lgKpis');
      if(k)k.innerHTML=`<div class=lg-kpi><span>${e(name)} staffing hours</span><b>${hours.toFixed(2)}</b></div><div class=lg-kpi><span>Amount to invoice ${e(name)}</span><b>£${net.toFixed(2)}</b></div><div class=lg-kpi><span>Customer</span><b>${e(name)}</b></div><div class=lg-kpi><span>Month</span><b>${e(document.getElementById('lgMonth')?.value||'')}</b></div>`;
    }
    addMonthlyCustomerSummary();
  };

  function addMonthlyCustomerSummary(){
    const tbody=document.getElementById('lgRows');if(!tbody)return;
    let box=document.getElementById('ffStaffMonthlySummary');
    if(!box){box=document.createElement('div');box.id='ffStaffMonthlySummary';box.className='ff-staff-summary';tbody.closest('table')?.parentElement?.insertAdjacentElement('afterend',box)}
    if(!box)return;
    const totals=new Map();
    [...tbody.querySelectorAll('tr')].filter(tr=>tr.style.display!=='none'&&tr.children.length>3).forEach(tr=>{
      const customer=(tr.children[2]?.textContent||'').split('\n')[0].trim(),hours=Number((tr.children[6]?.textContent||'0').replace(/[^0-9.-]/g,''))||0,net=Number((tr.children[8]?.textContent||'0').replace(/[^0-9.-]/g,''))||0;
      if(!customer)return;const t=totals.get(customer)||{hours:0,net:0,count:0};t.hours+=hours;t.net+=net;t.count++;totals.set(customer,t)
    });
    const grand=[...totals.values()].reduce((a,t)=>({hours:a.hours+t.hours,net:a.net+t.net,count:a.count+t.count}),{hours:0,net:0,count:0});
    box.innerHTML=`<div class="ff-staff-summary-head"><div><h3>Monthly Frogs & Friends staffing charges</h3><div class=muted>Amounts to invoice for staffing services in the selected month.</div></div><div class=ff-staff-grand><span>Monthly total</span><b>£${grand.net.toFixed(2)}</b></div></div><table><thead><tr><th>Customer</th><th>Staffing entries</th><th>Staff hours</th><th>Amount to invoice</th></tr></thead><tbody>${[...totals.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([name,t])=>`<tr><td><b>${e(name)}</b></td><td>${t.count}</td><td>${t.hours.toFixed(2)}</td><td><b>£${t.net.toFixed(2)}</b></td></tr>`).join('')||'<tr><td colspan=4 class=muted>No staffing charges for this selection.</td></tr>'}</tbody><tfoot><tr><th>Total</th><th>${grand.count}</th><th>${grand.hours.toFixed(2)}</th><th>£${grand.net.toFixed(2)}</th></tr></tfoot></table>`;
  }

  const style=document.createElement('style');style.textContent='.ff-staff-summary{margin-top:14px;border:1px solid #dbe3ea;border-radius:12px;padding:14px;background:#fff}.ff-staff-summary-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:12px}.ff-staff-summary-head h3{margin:0 0 3px}.ff-staff-grand{text-align:right;min-width:150px}.ff-staff-grand span{display:block;font-size:12px;color:#64748b}.ff-staff-grand b{display:block;font-size:22px;margin-top:2px}.ff-staff-summary table{width:100%;border-collapse:collapse}.ff-staff-summary th,.ff-staff-summary td{padding:9px;border-top:1px solid #e5eaf0;text-align:left}.ff-staff-summary th:last-child,.ff-staff-summary td:last-child{text-align:right}';document.head.appendChild(style);
})();