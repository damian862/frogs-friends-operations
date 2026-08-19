(function(){
  function refreshUserAccessVisibility(){
    const nav=document.getElementById('userAccessNav');
    if(!nav)return;
    const allowed=['owner_admin','operations_admin'].includes(String(window.P?.role||P?.role||''));
    nav.classList.toggle('admin-only-hidden',!allowed);
  }

  const previousEnter=window.enter;
  window.enter=async function(user){
    await previousEnter(user);
    setTimeout(refreshUserAccessVisibility,0);
  };

  const previousRender=window.render;
  window.render=function(){
    previousRender();
    setTimeout(refreshUserAccessVisibility,0);
  };

  window.addEventListener('load',()=>setTimeout(refreshUserAccessVisibility,50));
})();