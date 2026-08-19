(function(){
  const previousSetBookingTab=window.setBookingTab;
  if(typeof previousSetBookingTab!=='function')return;

  window.setBookingTab=function(name){
    if(name==='recurring'&&OPEN_PROG){
      const programme=G.find(x=>x.id===OPEN_PROG);
      const search=document.getElementById('rbSearch');
      const site=document.getElementById('rbSite');
      const org=document.getElementById('rbOrg');
      const status=document.getElementById('rbStatus');
      if(search)search.value='';
      if(org)org.value='';
      if(status)status.value='active';
      if(site&&programme&&[...site.options].some(o=>o.value===programme.site_id))site.value=programme.site_id;
    }
    previousSetBookingTab(name);
    if(name==='recurring'&&OPEN_PROG){
      setTimeout(()=>{
        window.renderRecurringBookings();
        const host=document.getElementById('rProg');
        if(!host)return;
        const target=[...host.querySelectorAll('.rb-item')].find(card=>[...card.querySelectorAll('button')].some(b=>(b.getAttribute('onclick')||'').includes(`manageProgramme('${OPEN_PROG}')`)));
        if(target){
          target.scrollIntoView({block:'center',behavior:'smooth'});
          target.classList.add('rb-newly-created');
          setTimeout(()=>target.classList.remove('rb-newly-created'),2200);
        }
      },80);
    }
  };
})();