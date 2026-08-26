/* Reconcile dashboard staffing and invoice figures with operational reports. */
(function(){
  const DAY=86400000;
  const el=id=>document.getElementById(id);
  const money=v=>'£'+Number(v||0).toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2});
  const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const hrs=(a,b)=>{const x=String(a||'00:00').split(':').map(Number),y=String(b||'00:00').split(':').map(Number);return Math.max(0,((y[0]||0)*60+(y[1]||0)-((x[0]||0)*60+(x[1]||0)))/60);};
  function bounds(month){const [y,m]=String(month||'').split('-').map(Number);return {from:`${y}-${String(m).padStart(2,'0')}-01`,to:iso(new Date(y,m,0,12))};}
  function recurringNet(rows,from,to){
    let total=0;
    const programmes=(typeof G!=='undefined'&&Array.isArray(G))?G:[],sessions=(typeof RS!=='undefined'&&Array.isArray(RS))?RS:[],breaks=(typeof BR!=='undefined'&&Array.isArray(BR))?BR:[],exceptions=(typeof EX!=='undefined'&&Array.isArray(EX))?EX:[];
    for(const r of rows||[]){
      const p=programmes.find(x=>x.id===r.programme_id),s=sessions.find(x=>x.id===r.session_id);
      if(!p||p.active===false||!s||s.active===false)continue;
      const start=new Date((r.starts_on>from?r.starts_on:from)+'T12:00:00'),end=new Date((r.ends_on<to?r.ends_on:to)+'T12:00:00');
      if(start>end)continue;
      const amount=hrs(r.start_time||s.start_time,r.end_time||s.end_time)*Number(r.staff_count||1)*Number(r.hourly_rate||0);
      for(let d=new Date(start);d<=end;d=new Date(d.getTime()+DAY)){
        const date=iso(d);
        if(d.getDay()!==Number(s.day_of_week))continue;
        if(breaks.some(b=>b.programme_id===p.id&&b.starts_on<=date&&b.ends_on>=date))continue;
        if(exceptions.some(x=>x.programme_id===p.id&&x.exception_type==='cancelled'&&x.exception_date===date&&(!x.session_id||x.session_id===s.id)))continue;
        total+=amount;
      }
    }
    return total;
  }
  async function reconcile(){
    const month=el('dashReportMonth')?.value,siteId=el('dashReportSite')?.value||'';
    if(!month||!el('dashStaffIncome')||!el('dashInvoicePosition'))return;
    const {from,to}=bounds(month);
    let direct=sb.from('lifeguard_service_entries').select('net_amount').gte('service_date',from).lte('service_date',to).neq('status','cancelled');
    let recurring=sb.from('recurring_staffing_services').select('programme_id,session_id,staff_count,start_time,end_time,hourly_rate,starts_on,ends_on,site_id').lte('starts_on',to).gte('ends_on',from).eq('active',true);
    let invoices=sb.from('school_invoice_batches').select('status,total_amount').eq('usage_month',from);
    if(siteId){direct=direct.eq('site_id',siteId);recurring=recurring.eq('site_id',siteId);invoices=invoices.eq('site_id',siteId);}
    const [d,r,i]=await Promise.all([direct,recurring,invoices]);
    if(!d.error&&!r.error)el('dashStaffIncome').textContent=money((d.data||[]).reduce((a,x)=>a+Number(x.net_amount||0),0)+recurringNet(r.data||[],from,to));
    if(!i.error){
      const inv=(i.data||[]).filter(x=>x.status!=='voided'),count=s=>inv.filter(x=>x.status===s).length;
      const awaiting=inv.filter(x=>['draft','pool_manager_checked','lettings_manager_approved','adjustment_required'].includes(x.status));
      el('dashInvoicePosition').innerHTML=`<div class="dash-invoice-grid"><div><span>Awaiting completion</span><b>${awaiting.length}</b><small>${money(awaiting.reduce((a,x)=>a+Number(x.total_amount||0),0))}</small></div><div><span>Ready for Finance</span><b>${count('ready')}</b></div><div><span>Invoiced</span><b>${count('invoiced')}</b></div><div><span>Paid</span><b>${count('paid')}</b></div></div>`;
    }
  }
  function later(){setTimeout(()=>reconcile().catch(console.error),350);}
  document.addEventListener('click',e=>{if(e.target.closest('button[data-v="dash"]')||e.target.closest('#refresh'))later();});
  document.addEventListener('change',e=>{if(e.target?.id==='dashReportMonth'||e.target?.id==='dashReportSite')later();});
  window.addEventListener('load',later);
  [700,1400].forEach(ms=>setTimeout(later,ms));
})();
