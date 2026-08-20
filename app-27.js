(function(){
  // Keep the recurring-booking list aligned with the active site context.
  // Site-context wrappers may replace the dropdown options after render; always
  // repopulate from the current in-memory data before applying filters.
  function refreshRecurringFilterOptions(){
    const site=document.getElementById('rbSite'),org=document.getElementById('rbOrg');
    if(site){
      const current=site.value;
      site.innerHTML='<option value="">All sites</option>'+S.map(x=>`<option value="${x.id}">${e(x.name)}</option>`).join('');
      const context=(typeof window.getActiveSiteId==='function'?window.getActiveSiteId():'')||'';
      const wanted=context||current;
      if([...site.options].some(o=>o.value===wanted))site.value=wanted;
    }
    if(org){
      const current=org.value;
      org.innerHTML='<option value="">All organisations</option><option value="internal">School/Internal</option>'+H.map(x=>`<option value="${x.id}">${e(x.name)}</option>`).join('');
      if([...org.options].some(o=>o.value===current))org.value=current;else org.value='';
    }
  }

  const previous=window.renderRecurringBookings;
  window.renderRecurringBookings=function(){
    refreshRecurringFilterOptions();
    previous();
  };

  const previousTab=window.setBookingTab;
  window.setBookingTab=function(tab){
    if(tab==='recurring')refreshRecurringFilterOptions();
    previousTab(tab);
    if(tab==='recurring')setTimeout(()=>{refreshRecurringFilterOptions();previous()},20);
  };
})();