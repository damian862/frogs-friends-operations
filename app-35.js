(function(){
  window.deleteKeySchoolDate=async function(id){
    const item=D.find(x=>x.id===id);
    if(!item)return alert('This key date could not be found. Please refresh and try again.');
    const year=Y.find(y=>y.id===item.academic_year_id);
    const site=year?sn(year.site_id):'this school';
    const label=item.name||prettyType(item.period_type)||'key school date';
    const dates=item.starts_on===item.ends_on?shortUk(item.starts_on):`${shortUk(item.starts_on)} → ${shortUk(item.ends_on)}`;
    if(!confirm(`Delete ${label}?\n\n${site}\n${dates}\n\nThis cannot be undone.`))return;
    const {error}=await sb.from('academic_calendar_periods').delete().eq('id',id);
    if(error)return alert(error.message||String(error));
    await load();
  };

  function addDeleteButtons(){
    document.querySelectorAll('#termDates .term-actions').forEach(actions=>{
      if(actions.querySelector('.key-date-delete'))return;
      const edit=[...actions.querySelectorAll('button')].find(b=>(b.getAttribute('onclick')||'').includes("editDate('"));
      if(!edit)return;
      const match=(edit.getAttribute('onclick')||'').match(/editDate\('([^']+)'\)/);
      if(!match)return;
      const sep=document.createTextNode(' · ');
      const del=document.createElement('button');
      del.type='button';del.className='link key-date-delete';del.textContent='Delete';
      del.onclick=()=>window.deleteKeySchoolDate(match[1]);
      actions.appendChild(sep);actions.appendChild(del);
    });
  }

  const prior=window.renderTermDates;
  window.renderTermDates=function(){const out=prior();setTimeout(addDeleteButtons,0);return out};
  const priorRender=window.render;
  window.render=function(){const out=priorRender();setTimeout(addDeleteButtons,0);return out};
  window.addEventListener('load',()=>setTimeout(addDeleteButtons,150));
})();