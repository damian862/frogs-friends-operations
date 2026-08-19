(function(){
  const EDIT_ROLES=new Set(['owner_admin','operations_admin','site_manager','pool_manager','lettings_manager']);

  function canEditRecurring(){
    const role=String(window.P?.role||P?.role||'');
    if(EDIT_ROLES.has(role))return true;
    return false;
  }

  function ensureRecurringCreateButton(){
    const panel=document.getElementById('bookingTabRecurring');
    if(!panel)return;
    const head=panel.querySelector('.term-top.compact');
    if(!head)return;
    let btn=head.querySelector('.rb-create-recurring');
    const allowed=canEditRecurring();
    if(!btn){
      btn=document.createElement('button');
      btn.type='button';
      btn.className='p rb-create-recurring';
      btn.textContent='+ Add recurring booking';
      btn.onclick=()=>{
        if(typeof window.newRecurringWizard!=='function'&&typeof newRecurringWizard!=='function')return alert('Recurring booking wizard is not available. Please refresh the page.');
        (window.newRecurringWizard||newRecurringWizard)();
      };
      head.appendChild(btn);
    }
    btn.style.display=allowed?'':'none';

    // Hide any duplicate legacy launcher while keeping one reliable control.
    [...head.querySelectorAll('button')].forEach(b=>{
      if(b!==btn&&(b.getAttribute('onclick')||'').includes('newRecurringWizard'))b.style.display='none';
    });
  }

  const priorRender=window.render;
  window.render=function(){
    priorRender();
    setTimeout(ensureRecurringCreateButton,0);
  };

  const priorEnter=window.enter;
  window.enter=async function(user){
    await priorEnter(user);
    setTimeout(ensureRecurringCreateButton,0);
  };

  const priorRecurring=window.renderRecurringBookings;
  window.renderRecurringBookings=function(){
    priorRecurring();
    setTimeout(ensureRecurringCreateButton,0);
  };

  document.addEventListener('click',ev=>{
    if(ev.target.closest('.booking-tab[data-btab="recurring"]'))setTimeout(ensureRecurringCreateButton,0);
  });

  window.addEventListener('load',()=>setTimeout(ensureRecurringCreateButton,100));
})();
