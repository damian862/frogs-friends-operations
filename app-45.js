(function(){
  window.deleteStaffingCharge=async function(id){
    if(!id)return;
    if(!confirm('Delete this staffing charge? This will remove it from staffing hours and monthly reporting.'))return;
    const r=await sb.from('lifeguard_service_entries').delete().eq('id',id);
    if(r.error)return alert(r.error.message);
    if(typeof window.renderLifeguardServices==='function')await window.renderLifeguardServices();
    if(typeof window.renderBookingTables==='function')window.renderBookingTables();
  };
  function addDeleteActions(){
    const rows=document.querySelectorAll('#lgRows tr');
    rows.forEach(tr=>{
      const action=tr.lastElementChild;if(!action||action.querySelector('.staff-delete'))return;
      const edit=action.querySelector('button[onclick*="editBookingStaffing"]');if(!edit)return;
      const m=(edit.getAttribute('onclick')||'').match(/editBookingStaffing\(null,'([^']+)'\)/);if(!m)return;
      edit.insertAdjacentHTML('afterend',` <button type="button" class="link danger-link staff-delete" onclick="deleteStaffingCharge('${m[1]}')">Delete</button>`);
    });
  }
  const prior=window.renderLifeguardServices;
  if(prior)window.renderLifeguardServices=async function(){const out=await prior.apply(this,arguments);setTimeout(addDeleteActions,0);return out};
  window.addEventListener('load',()=>setTimeout(addDeleteActions,500));
  const style=document.createElement('style');style.textContent='.danger-link{color:#b42318!important;margin-left:8px}';document.head.appendChild(style);
})();