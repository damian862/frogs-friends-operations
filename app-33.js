(function(){
  function hideStaffRegister(){
    document.querySelectorAll('nav a, aside a, .sidebar a, button').forEach(el=>{
      if((el.textContent||'').trim()==='Staff Register')el.style.display='none';
    });
    const staffSection=document.getElementById('staff')||document.getElementById('staffPage')||document.querySelector('[data-page="staff"]');
    if(staffSection)staffSection.style.display='none';
  }
  hideStaffRegister();
  window.addEventListener('load',()=>setTimeout(hideStaffRegister,100));
  const observer=new MutationObserver(()=>hideStaffRegister());
  observer.observe(document.body,{childList:true,subtree:true});
})();