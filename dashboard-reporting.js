/* Operational dashboard reporting. Permanent panel lives in index.html. */
(function () {
  const DAY = 86400000;
  let timer = null;
  let requestId = 0;
  let controlsBound = false;
  let dashboardSiteTouched = false;

  const el = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const money = v => '£' + Number(v || 0).toLocaleString('en-GB', {minimumFractionDigits:2, maximumFractionDigits:2});
  const hours = (a,b) => {
    const x=String(a||'00:00').split(':').map(Number), y=String(b||'00:00').split(':').map(Number);
    return Math.max(0, ((y[0]||0)*60+(y[1]||0)-((x[0]||0)*60+(x[1]||0)))/60);
  };
  const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const bounds = value => {
    const [y,m]=String(value||'').split('-').map(Number);
    if (!y || !m) throw new Error('Choose a valid reporting month.');
    return {from:`${y}-${String(m).padStart(2,'0')}-01`, to:iso(new Date(y,m,0,12))};
  };
  const sites = () => (typeof S !== 'undefined' && Array.isArray(S)) ? S : [];
  const hirers = () => (typeof H !== 'undefined' && Array.isArray(H)) ? H : [];
  const bookings = () => (typeof B !== 'undefined' && Array.isArray(B)) ? B : [];
  const programmes = () => (typeof G !== 'undefined' && Array.isArray(G)) ? G : [];
  const sessions = () => (typeof RS !== 'undefined' && Array.isArray(RS)) ? RS : [];
  const breaks = () => (typeof BR !== 'undefined' && Array.isArray(BR)) ? BR : [];
  const exceptions = () => (typeof EX !== 'undefined' && Array.isArray(EX)) ? EX : [];
  const dashboardFinanceRoles = new Set(['owner_admin', 'operations_admin', 'site_manager', 'lettings_manager', 'finance', 'bursar']);
  const canViewDashboardFinance = () => dashboardFinanceRoles.has(String(P?.role || '').trim().toLowerCase());

  function status(text,bad=false){
    const x=el('dashReportStatus'); if(!x)return;
    x.style.display=text?'':'none'; x.className=bad?'err':'note'; x.textContent=text||'';
  }

  function currentAppSite(){
    const topSelect=document.querySelector('.top select');
    const value=topSelect?.value || '';
    return sites().some(s=>s.id===value) ? value : '';
  }

  function fillSiteFilter(){
    const select=el('dashReportSite'); if(!select)return '';
    const previous=select.value;
    const list=sites();
    select.innerHTML='<option value="">All sites</option>'+list.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('');
    const appSite=currentAppSite();
    if(!dashboardSiteTouched && appSite) select.value=appSite;
    else if([...select.options].some(o=>o.value===previous)) select.value=previous;
    else if(list.length===1) select.value=list[0].id;
    return select.value;
  }

  function initialise(){
    const panel=el('opsDashboardReporting'); if(!panel)return false;
    if(!canViewDashboardFinance()){ panel.style.display='none'; return false; }
    panel.style.display='';
    const month=el('dashReportMonth'), site=el('dashReportSite');
    if(!month||!site)return false;
    if(!month.value){
      const now=new Date(); month.value=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    }
    if(!controlsBound){
      month.addEventListener('change',()=>schedule(0));
      site.addEventListener('change',()=>{dashboardSiteTouched=true;schedule(0);});
      controlsBound=true;
    }
    return true;
  }

  function recurringRows(from,to,siteId){
    const out=[];
    for(const p of programmes()){
      if(p.active===false || (siteId&&p.site_id!==siteId) || !p.starts_on || !p.ends_on || p.starts_on>to || p.ends_on<from) continue;
      const start=new Date((p.starts_on>from?p.starts_on:from)+'T12:00:00');
      const end=new Date((p.ends_on<to?p.ends_on:to)+'T12:00:00');
      const ss=sessions().filter(s=>s.programme_id===p.id && s.active!==false);
      const bb=breaks().filter(b=>b.programme_id===p.id);
      const xx=exceptions().filter(x=>x.programme_id===p.id && x.exception_type==='cancelled');
      for(let d=new Date(start);d<=end;d=new Date(d.getTime()+DAY)){
        const date=iso(d);
        if(bb.some(b=>b.starts_on<=date&&b.ends_on>=date))continue;
        for(const s of ss.filter(s=>Number(s.day_of_week)===d.getDay())){
          if(xx.some(x=>x.exception_date===date&&(!x.session_id||x.session_id===s.id)))continue;
          out.push({date,site_id:p.site_id,hirer_id:p.hirer_id,hours:hours(s.start_time,s.end_time),charge_type:s.charge_type||'chargeable',rate:s.rate});
        }
      }
    }
    return out;
  }

  function oneOffRows(from,to,siteId){
    return bookings().filter(b=>b.status!=='cancelled'&&b.booking_date>=from&&b.booking_date<=to&&(!siteId||b.site_id===siteId)&&!b.recurring_programme_id)
      .map(b=>({date:b.booking_date,site_id:b.site_id,hirer_id:b.hirer_id,hours:hours(b.start_time,b.end_time),charge_type:b.charge_type||'chargeable',rate:b.rate}));
  }
  const sourceRows=(from,to,siteId)=>[...recurringRows(from,to,siteId),...oneOffRows(from,to,siteId)];
  const orgName=id=>!id?'School/Internal':(hirers().find(h=>h.id===id)?.name||'Organisation');

  async function refresh(){
    if(!initialise())return;
    try{
      const month=el('dashReportMonth').value;
      const siteId=fillSiteFilter();
      const {from,to}=bounds(month);
      const rows=sourceRows(from,to,siteId);
      const chargeable=rows.filter(r=>r.charge_type==='chargeable');
      const bookedHours=rows.reduce((a,r)=>a+r.hours,0);
      const chargeHours=chargeable.reduce((a,r)=>a+r.hours,0);
      const poolNet=chargeable.reduce((a,r)=>a+(r.rate==null?0:Number(r.rate)*r.hours),0);

      el('dashReportKpis').innerHTML=`<div class="dash-kpi"><span>Booked pool hours</span><b>${bookedHours.toFixed(1)}</b><small>${month}</small></div><div class="dash-kpi"><span>Chargeable hours</span><b>${chargeHours.toFixed(1)}</b><small>Excludes school/internal & FOC</small></div><div class="dash-kpi"><span>School pool-hire income</span><b>${money(poolNet)}</b><small>Net forecast for selected month</small></div><div class="dash-kpi"><span>F&F staffing income</span><b id="dashStaffIncome">…</b><small>Confirmed staffing services</small></div>`;

      const byOrg=new Map();
      for(const r of chargeable){const key=r.hirer_id||'internal',v=byOrg.get(key)||{hours:0,net:0};v.hours+=r.hours;v.net+=r.rate==null?0:Number(r.rate)*r.hours;byOrg.set(key,v);}
      const orgRows=[...byOrg.entries()].sort((a,b)=>b[1].net-a[1].net);
      el('dashOrgBreakdown').innerHTML=orgRows.length?`<table class="dash-mini-table"><thead><tr><th>Organisation</th><th>Hours</th><th>Net</th></tr></thead><tbody>${orgRows.map(([id,v])=>`<tr><td>${esc(orgName(id==='internal'?null:id))}</td><td>${v.hours.toFixed(1)}</td><td><b>${money(v.net)}</b></td></tr>`).join('')}</tbody></table>`:'<div class="muted">No chargeable pool-hire activity in this month.</div>';

      const today=new Date(), nextFrom=iso(today), nextTo=iso(new Date(today.getFullYear(),today.getMonth(),today.getDate()+29,12));
      const upcoming=sourceRows(nextFrom,nextTo,siteId).sort((a,b)=>a.date.localeCompare(b.date));
      const upcomingHours=upcoming.reduce((a,r)=>a+r.hours,0), activeDays=new Set(upcoming.map(r=>r.date)).size, nextDate=upcoming[0]?.date;
      el('dashUpcoming').innerHTML=`<div class="dash-upcoming-grid"><div><span>Booked hours</span><b>${upcomingHours.toFixed(1)}</b></div><div><span>Days with pool activity</span><b>${activeDays}</b></div><div><span>Next booked date</span><b>${nextDate?new Date(nextDate+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'}):'None'}</b></div></div>`;
      status('Refreshing staffing and invoice figures…');

      const id=++requestId;
      let staffQ=sb.from('lifeguard_service_entries').select('net_amount,status,site_id').gte('service_date',from).lte('service_date',to).neq('status','cancelled');
      let invQ=sb.from('school_invoice_batches').select('status,total_amount,site_id').eq('usage_month',from);
      if(siteId){staffQ=staffQ.eq('site_id',siteId);invQ=invQ.eq('site_id',siteId);}
      const [staffRes,invRes]=await Promise.all([staffQ,invQ]);
      if(id!==requestId)return;
      el('dashStaffIncome').textContent=staffRes.error?'—':money((staffRes.data||[]).reduce((a,x)=>a+Number(x.net_amount||0),0));
      if(invRes.error) el('dashInvoicePosition').innerHTML='<div class="muted">Invoice status is not available for this role.</div>';
      else {
        const inv=invRes.data||[], count=s=>inv.filter(x=>x.status===s).length;
        const awaiting=inv.filter(x=>['draft','pool_manager_checked','lettings_manager_approved','ready','adjustment_required'].includes(x.status));
        el('dashInvoicePosition').innerHTML=`<div class="dash-invoice-grid"><div><span>Awaiting completion</span><b>${awaiting.length}</b><small>${money(awaiting.reduce((a,x)=>a+Number(x.total_amount||0),0))}</small></div><div><span>Ready for Finance</span><b>${count('ready')}</b></div><div><span>Invoiced</span><b>${count('invoiced')}</b></div><div><span>Paid</span><b>${count('paid')}</b></div></div>`;
      }
      status('');
    } catch(err){
      console.error('Operational dashboard failed',err);
      status(`Operational overview error: ${err?.message||String(err)}`,true);
    }
  }

  function schedule(ms=50){clearTimeout(timer);timer=setTimeout(()=>{refresh().catch(err=>status(`Operational overview error: ${err?.message||String(err)}`,true));},ms);}

  const style=document.createElement('style');
  style.textContent='#opsDashboardReporting{margin-top:22px}.dash-report-head{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:12px}.dash-report-head h2{margin:0 0 4px}.dash-report-head p{margin:0;color:#667788}.dash-report-filters{display:flex;gap:10px;flex-wrap:wrap}.dash-report-filters label{font-size:12px;color:#5d6d7a}.dash-report-filters input,.dash-report-filters select{display:block;margin-top:4px;min-width:150px}.dash-report-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:12px 0}.dash-kpi{background:#fff;border:1px solid #dfe6eb;border-radius:11px;padding:15px}.dash-kpi span,.dash-upcoming-grid span,.dash-invoice-grid span{display:block;font-size:12px;color:#607282}.dash-kpi b{display:block;font-size:24px;margin:5px 0}.dash-kpi small,.dash-invoice-grid small{color:#7b8995}.dash-report-two{display:grid;grid-template-columns:1.15fr .85fr;gap:12px;margin-bottom:12px}.dash-card-title{font-weight:800;margin-bottom:10px}.dash-mini-table{width:100%;border-collapse:collapse}.dash-mini-table th,.dash-mini-table td{text-align:left;padding:8px 6px;border-top:1px solid #edf1f4}.dash-mini-table th{font-size:11px;text-transform:uppercase;color:#71808d}.dash-invoice-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.dash-invoice-grid>div,.dash-upcoming-grid>div{background:#f7f9fb;border-radius:8px;padding:11px}.dash-invoice-grid b,.dash-upcoming-grid b{display:block;font-size:19px;margin-top:3px}.dash-upcoming-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}@media(max-width:950px){.dash-report-kpis{grid-template-columns:1fr 1fr}.dash-report-two{grid-template-columns:1fr}}@media(max-width:650px){.dash-report-head{align-items:flex-start;flex-direction:column}.dash-report-kpis,.dash-upcoming-grid{grid-template-columns:1fr}.dash-invoice-grid{grid-template-columns:1fr 1fr}}';
  document.head.appendChild(style);

  window.refreshDashboardReporting=refresh;
  initialise();
  const app=el('app'); if(app)new MutationObserver(()=>{if(!app.classList.contains('hide'))schedule(20);}).observe(app,{attributes:true,attributeFilter:['class']});
  ['k1','k4'].forEach(id=>{const x=el(id);if(x)new MutationObserver(()=>schedule(20)).observe(x,{childList:true,subtree:true,characterData:true});});
  document.addEventListener('click',ev=>{if(ev.target.closest('button[data-v="dash"]')||ev.target.closest('#refresh'))schedule(20);});
  document.addEventListener('change',ev=>{if(ev.target?.closest('.top')&&ev.target.tagName==='SELECT'){dashboardSiteTouched=false;schedule(20);}});
  window.addEventListener('load',()=>schedule(20));
  [100,400,1000].forEach(ms=>setTimeout(()=>schedule(0),ms));
})();
