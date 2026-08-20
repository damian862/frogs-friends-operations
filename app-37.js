(function(){
  window.financeMarkInvoiced=async function(id){
    const allowed=new Set(['owner_admin','operations_admin','site_manager','finance']);
    if(!allowed.has(String(P?.role||'')))return alert('Only Finance or an authorised administrator can mark a statement as invoiced.');
    const selectedBillSite=document.getElementById('billSite')?.value||'';
    const selectedBillMonth=document.getElementById('billMonth')?.value||'';
    const ref=prompt('Enter the invoice reference from the school accounts system:','');
    if(ref===null)return;
    if(!ref.trim())return alert('Enter an invoice reference.');
    const {data:before,error:readError}=await sb.from('school_invoice_batches').select('*').eq('id',id).single();
    if(readError)return alert(readError.message);
    if(before.status!=='ready')return alert('This statement is no longer Ready for Finance. Refresh the queue.');
    const now=new Date().toISOString();
    const {data,error}=await sb.from('school_invoice_batches').update({status:'invoiced',invoice_reference:ref.trim(),invoiced_at:now,updated_at:now}).eq('id',id).select().single();
    if(error)return alert(error.message);
    await sb.from('school_invoice_batch_events').insert({batch_id:id,actor_user_id:P.id,event_type:'marked_invoiced',old_status:'ready',new_status:'invoiced',old_net_amount:Number(before.net_amount||0),new_net_amount:Number(data.net_amount||0),notes:'Invoice reference: '+ref.trim()});
    const month=document.getElementById('billMonth');if(month&&selectedBillMonth)month.value=selectedBillMonth;
    const site=document.getElementById('billSite');if(site&&selectedBillSite&&[...site.options].some(o=>o.value===selectedBillSite))site.value=selectedBillSite;
    if(typeof window.renderMonthlyBilling==='function')await window.renderMonthlyBilling();
  };
})();