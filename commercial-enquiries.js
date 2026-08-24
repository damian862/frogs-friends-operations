(function(){
  function load(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});}
  function boot(){
    if(typeof window.render==='function'){
      try{window.render();}catch(err){console.error('Commercial enquiry boot render failed',err);}
    }
  }
  load('commercial-enquiries-core.js?v=20260824-3')
    .then(()=>load('commercial-enquiry-archive.js?v=20260824-2'))
    .then(()=>setTimeout(boot,0))
    .catch(err=>console.error('Commercial enquiry module failed to load',err));
})();
