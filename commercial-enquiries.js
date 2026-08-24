(function(){
  function load(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});}
  load('commercial-enquiries-core.js?v=20260824-2').then(()=>load('commercial-enquiry-archive.js?v=20260824-1')).catch(err=>console.error('Commercial enquiry module failed to load',err));
})();
