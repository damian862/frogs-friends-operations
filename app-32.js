(function(){
  const friendly={
    'Pool Manager checked':'Pool Manager approved',
    'Lettings Manager approved':'Lettings Manager approved',
    'Ready for invoice':'Ready for Finance'
  };
  function tidyBillingCards(){
    document.querySelectorAll('#monthlyBilling .bill-row').forEach(row=>{
      const status=row.querySelector('.bill-status');if(!status)return;
      const original=status.textContent.trim();if(friendly[original])status.textContent=friendly[original];
      const statusCol=status.parentElement;
      let help=statusCol.querySelector('.bill-stage-help');
      if(!help){help=document.createElement('div');help.className='bill-stage-help';status.insertAdjacentElement('afterend',help)}
      if(original==='Pool Manager checked'||status.textContent.trim()==='Pool Manager approved')help.textContent='Reviewed and approved for Lettings Manager review';
      else if(original==='Lettings Manager approved')help.textContent='Approved for Finance to invoice';
      else if(original==='Ready for invoice'||status.textContent.trim()==='Ready for Finance')help.textContent='Final pool-hire total approved for Finance';
      else help.remove();
      const adjustment=statusCol.querySelector('.bill-adjust');
      if(adjustment&&['Pool Manager checked','Pool Manager approved','Lettings Manager approved','Ready for invoice','Ready for Finance'].includes(original))adjustment.style.display='none';
    });
  }
  const prior=window.renderMonthlyBilling;window.renderMonthlyBilling=function(){const out=prior();setTimeout(tidyBillingCards,0);return out};
  const priorStatement=window.viewBillingStatement;window.viewBillingStatement=function(id){priorStatement(id);setTimeout(()=>{document.querySelectorAll('.billing-statement-modal .bill-status,#modal .bill-status').forEach(s=>{const t=s.textContent.trim();if(friendly[t])s.textContent=friendly[t]})},0)};
  const style=document.createElement('style');style.textContent='.bill-stage-help{margin-top:7px;font-size:12px;line-height:1.4;color:#64748b;max-width:245px}';document.head.appendChild(style);
})();