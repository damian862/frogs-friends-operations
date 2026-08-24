(function(){
  const $=id=>document.getElementById(id);
  function canManage(){
    const role=String((typeof P!=='undefined'&&P?.role)||window.P?.role||'');
    return ['owner_admin','operations_admin','site_manager','pool_manager','lettings_manager'].includes(role);
  }
  function syncArchiveFilter(){
    const sel=$('commercialStatus');
    if(!sel||[...sel.options].some(o=>o.value==='archived'))return;
    const all=[...sel.options].find(o=>o.value==='all');
    const opt=document.createElement('option');opt.value='archived';opt.textContent='Archived';
    if(all)sel.insertBefore(opt,all);else sel.appendChild(opt);
  }
  function rowId(row){
    const edit=[...row.querySelectorAll('button')].find(b=>/editcommercialenquiry\('([^']+)'\)/i.test(b.getAttribute('onclick')||''));
    return (edit?.getAttribute('onclick')||'').match(/editcommercialenquiry\('([^']+)'\)/i)?.[1]||'';
  }
  function syncArchiveActions(){
    if(!canManage())return;
    document.querySelectorAll('#commercialEnquiryList .commercial-row').forEach(row=>{
      const status=(row.querySelector('.commercial-status')?.textContent||'').trim().toLowerCase();
      const actions=row.querySelector('.commercial-actions'),id=rowId(row);
      if(!actions||!id)return;
      if(['converted','lost','cancelled'].includes(status)&&!actions.querySelector('.commercial-archive-btn')){
        const btn=document.createElement('button');btn.type='button';btn.className='link commercial-archive-btn';btn.textContent='Archive';
        btn.onclick=async()=>{if(!confirm('Archive this enquiry? It will remain available under the Archived filter.'))return;await window.closeCommercialEnquiry(id,'archived');};
        actions.appendChild(btn);
      }
    });
  }
  function sync(){syncArchiveFilter();syncArchiveActions();}
  const observer=new MutationObserver(()=>setTimeout(sync,0));
  observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('load',()=>setTimeout(sync,300));
})();
