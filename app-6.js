(function(){
const previousRenderRecurringBookings=renderRecurringBookings;
const openSchedules=new Set();
function programmeIdFromCard(card){
  let btn=[...card.querySelectorAll('button')].find(b=>(b.getAttribute('onclick')||'').includes('manageProgramme('));
  let m=(btn?.getAttribute('onclick')||'').match(/manageProgramme\('([^']+)'\)/);
  return m?m[1]:null;
}
window.toggleRecurringSchedule=function(id){
  if(openSchedules.has(id))openSchedules.delete(id);else openSchedules.add(id);
  renderRecurringBookings();
};
renderRecurringBookings=function(){
  previousRenderRecurringBookings();
  let host=$('rProg');if(!host)return;
  [...host.querySelectorAll('.rb-item')].forEach(card=>{
    let id=programmeIdFromCard(card);if(!id)return;
    let overview=card.querySelector('.rb-overview');
    if(overview)overview.style.display=openSchedules.has(id)?'block':'none';
    let actions=card.querySelector('.rb-actions');
    if(actions&&!actions.querySelector('.rb-view-schedule')){
      let btn=document.createElement('button');
      btn.type='button';
      btn.className='s rb-view-schedule';
      btn.textContent=openSchedules.has(id)?'Hide schedule':'View schedule';
      btn.onclick=()=>toggleRecurringSchedule(id);
      actions.insertBefore(btn,actions.firstChild);
    }
  });
};
const st=document.createElement('style');
st.textContent=`.rb-view-schedule{white-space:nowrap}.rb-item .rb-overview{transition:none}.rb-summary{cursor:default}`;
document.head.appendChild(st);
})();
