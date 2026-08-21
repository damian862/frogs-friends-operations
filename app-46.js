(function(){
  const prior=window.financeMarkInvoiced;
  if(!prior)return;
  window.financeMarkInvoiced=async function(id){
    await prior.apply(this,arguments);
    // The finance queue update can complete before the monthly billing card refresh.
    // Reload the current billing data, then render both views from the same source.
    try{
      if(typeof window.load==='function')await window.load();
      if(typeof window.renderIncomeSummary==='function')window.renderIncomeSummary();
      if(typeof window.renderMonthlyBilling==='function')window.renderMonthlyBilling();
    }catch(err){console.warn('Post-invoice billing refresh failed',err)}
  };
})();