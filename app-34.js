(function(){
  const FINANCE_ACTION_ROLES=new Set(['owner_admin','operations_admin','site_manager','finance']);
  const FINANCE_VIEW_ROLES=new Set(['owner_admin','operations_admin','site_manager','finance','lettings_manager','bursar']);
  function money(v){return '£'+Number(v||0).toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2})}
  function monthLabel(v){const d=new Date(String(v).slice(0,7)+'-01T12:00:00');return isNaN(d)?String(v||''):d.toLocaleDateString('en-GB',{month:'long',year:'numeric'})}
  function canView(){return FINANCE_VIEW_ROLES.has(String(P?.role||''))}
  function canAction(){return FINANCE_ACTION_ROLES.has(String(P?.role||''))}
  function ensureQueue(){
    const panel=document.getElementById('bookingTabIncome');if(!panel||!canView())return null;
    let wrap=document.getElementById('financeQueue');
    if(!wrap){
      wrap=document.createElement('div');wrap.id='financeQueue';wrap.className='finance-queue';
      wrap.innerHTML=`<div class="finance-queue-head"><div><h2>Finance Queue</h2><p>Approved monthly pool-hire statements waiting to be invoiced in the school accounts system.</p></div><div class="finance-queue-summary"><span>Waiting</span><b id="financeQueueCount">0</b><span id="financeQueueTotal">£0.00</span></div></div><div id="financeQueueBody" class="card"><div class="muted">Loading approved statements…</div></div>`;
      const monthly=document.getElementById('monthlyBilling');if(monthly)monthly.insertAdjacentElement('afterend',wrap);else panel.appendChild(wrap);
    }
    return wrap;
  }
  async function loadQueue(){
    const wrap=ensureQueue();if(!wrap)return;
    const body=document.getElementById('financeQueueBody');
    const {data,error}=await sb.from('school_invoice_batches').select('*').eq('status','ready').order('usage_month',{ascending:true});
    if(error){body.innerHTML=`<div class="err">${e(error.message)}</div>`;return}
    const rows=data||[];document.getElementById('financeQueueCount').textContent=rows.length;document.getElementById('financeQueueTotal').textContent=money(rows.reduce((a,r)=>a+Number(r.total_amount||0),0));
    body.innerHTML=rows.length?`<div class="finance-table-wrap"><table class="finance-table"><thead><tr><th>Organisation</th><th>Site</th><th>Month</th><th>Net</th><th>VAT</th><th>Total</th><th></th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${e(hn(r.hirer_id)||'Unknown organisation')}</b></td><td>${e(sn(r.site_id)||'')}</td><td>${e(monthLabel(r.usage_month))}</td><td>${money(r.net_amount)}</td><td>${money(r.vat_amount)}</td><td><b>${money(r.total_amount)}</b></td><td><div class="finance-actions"><button class="s" onclick="financeViewStatement('${r.id}')">View statement</button>${canAction()?`<button class="p" onclick="financeMarkInvoiced('${r.id}')">Mark invoiced</button>`:''}</div></td></tr>`).join('')}</tbody></table></div>`:'<div class="finance-empty"><b>No statements waiting for Finance.</b><span>Statements will appear here after the Lettings Manager has approved them and they have been marked Ready for Finance.</span></div>';
  }
  window.financeViewStatement=function(id){
    if(typeof window.viewBillingStatement==='function')window.viewBillingStatement(id);
  };
  window.financeMarkInvoiced=async function(id){
    if(!canAction())return alert('Only Finance or an authorised administrator can mark a statement as invoiced.');
    const ref=prompt('Enter the invoice reference from the school accounts system:','');if(ref===null)return;if(!ref.trim())return alert('Enter an invoice reference.');
    const {data:before,error:readError}=await sb.from('school_invoice_batches').select('*').eq('id',id).single();if(readError)return alert(readError.message);if(before.status!=='ready')return alert('This statement is no longer Ready for Finance. Refresh the queue.');
    const now=new Date().toISOString();const {data,error}=await sb.from('school_invoice_batches').update({status:'invoiced',invoice_reference:ref.trim(),invoiced_at:now,updated_at:now}).eq('id',id).select().single();if(error)return alert(error.message);
    await sb.from('school_invoice_batch_events').insert({batch_id:id,actor_user_id:P.id,event_type:'marked_invoiced',old_status:'ready',new_status:'invoiced',old_net_amount:Number(before.net_amount||0),new_net_amount:Number(data.net_amount||0),notes:'Invoice reference: '+ref.trim()});
    await loadQueue();if(typeof window.renderIncomeSummary==='function')setTimeout(()=>window.renderIncomeSummary(),0);
  };
  const priorIncome=window.renderIncomeSummary;window.renderIncomeSummary=function(){const out=priorIncome();setTimeout(loadQueue,120);return out};
  const priorBilling=window.renderMonthlyBilling;window.renderMonthlyBilling=function(){const out=priorBilling();setTimeout(loadQueue,120);return out};
  document.addEventListener('click',ev=>{if(ev.target.closest('.booking-tab[data-btab="income"]'))setTimeout(loadQueue,180)});
  window.addEventListener('load',()=>setTimeout(loadQueue,500));
  const style=document.createElement('style');style.textContent=`.finance-queue{margin-top:28px}.finance-queue-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:12px}.finance-queue-head h2{margin:0 0 4px;font-size:22px}.finance-queue-head p{margin:0;color:#657585;line-height:1.45}.finance-queue-summary{display:grid;grid-template-columns:auto auto;gap:2px 10px;align-items:baseline;text-align:right;min-width:145px}.finance-queue-summary span:first-child{font-size:12px;color:#657585}.finance-queue-summary b{font-size:24px}.finance-queue-summary span:last-child{grid-column:1/-1;font-size:13px;color:#405566}.finance-table-wrap{overflow-x:auto}.finance-table{width:100%;border-collapse:collapse}.finance-table th,.finance-table td{padding:11px 10px;border-bottom:1px solid #e7edf2;text-align:left;vertical-align:middle}.finance-table th{font-size:12px;color:#60717f}.finance-actions{display:flex;gap:7px;justify-content:flex-end;flex-wrap:wrap}.finance-empty{display:flex;flex-direction:column;gap:5px;padding:8px 2px}.finance-empty span{color:#657585;font-size:13px}@media(max-width:760px){.finance-queue-head{flex-direction:column}.finance-queue-summary{text-align:left}.finance-actions{justify-content:flex-start}}`;document.head.appendChild(style);
})();