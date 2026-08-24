(function(){
  function load(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});}
  function boot(){
    if(document.readyState==='complete'){
      window.dispatchEvent(new Event('load'));
      return;
    }
    window.addEventListener('load',()=>{}, {once:true});
  }
  load('commercial-enquiries-core.js?v=20260824-4')
    .then(()=>load('commercial-enquiry-archive.js?v=20260824-3'))
    .then(()=>setTimeout(boot,0))
    .catch(err=>console.error('Commercial enquiry module failed to load',err));
})();
