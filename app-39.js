(function(){
  function showStaffingSave(){
    const modal=document.getElementById('modal'),title=document.getElementById('mt'),save=document.getElementById('ms');
    if(!modal||!save||!title)return;
    const isStaffing=/staffing/i.test(title.textContent||'');
    if(!isStaffing)return;
    save.style.display='inline-block';
    save.style.visibility='visible';
    save.disabled=false;
    save.textContent=/edit/i.test(title.textContent||'')?'Save changes':'Save staffing';
  }
  const prior=window.editBookingStaffing;
  if(prior){window.editBookingStaffing=async function(){const out=await prior.apply(this,arguments);showStaffingSave();setTimeout(showStaffingSave,30);return out}}
  const observer=new MutationObserver(()=>{if(document.getElementById('modal')?.classList.contains('on'))showStaffingSave()});
  window.addEventListener('load',()=>{const modal=document.getElementById('modal');if(modal)observer.observe(modal,{attributes:true,childList:true,subtree:true})});
})();