(function(){
  let revealing=false;

  function revealNewRecurringIfFilteredOut(){
    if(revealing||!OPEN_PROG)return;
    const programme=G.find(x=>x.id===OPEN_PROG);
    const host=document.getElementById('rProg');
    if(!programme||!host)return;

    const visible=[...host.querySelectorAll('.rb-item')].some(card=>{
      const btn=[...card.querySelectorAll('button')].find(b=>(b.getAttribute('onclick')||'').includes(`manageProgramme('${OPEN_PROG}')`));
      return !!btn;
    });
    if(visible)return;

    const search=document.getElementById('rbSearch');
    const site=document.getElementById('rbSite');
    const org=document.getElementById('rbOrg');
    const status=document.getElementById('rbStatus');
    if(!search||!site||!org||!status)return;

    revealing=true;
    search.value='';
    if([...site.options].some(o=>o.value===programme.site_id))site.value=programme.site_id||'';
    const orgValue=programme.hirer_id||'internal';
    if([...org.options].some(o=>o.value===orgValue))org.value=orgValue;else org.value='';
    status.value='active';
    window.renderRecurringBookings();
    setTimeout(()=>{
      const target=[...host.querySelectorAll('.rb-item')].find(card=>[...card.querySelectorAll('button')].some(b=>(b.getAttribute('onclick')||'').includes(`manageProgramme('${OPEN_PROG}')`)));
      if(target){
        target.scrollIntoView({block:'center',behavior:'smooth'});
        target.classList.add('rb-newly-created');
        setTimeout(()=>target.classList.remove('rb-newly-created'),2200);
      }
      revealing=false;
    },60);
  }

  const previous=window.renderRecurringBookings;
  window.renderRecurringBookings=function(){
    previous();
    setTimeout(revealNewRecurringIfFilteredOut,30);
  };

  const style=document.createElement('style');
  style.textContent='.rb-newly-created{outline:3px solid rgba(22,163,74,.24);box-shadow:0 0 0 4px rgba(22,163,74,.08)}';
  document.head.appendChild(style);
})();
