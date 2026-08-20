(function(){
  function tidyKeyDateLabels(){
    document.querySelectorAll('#termDates .term-row .term-label').forEach(label=>{
      const muted=label.querySelector('.muted');
      if(!muted)return;
      const primary=[...label.childNodes].filter(n=>n!==muted).map(n=>n.textContent||'').join('').trim().toLowerCase();
      const secondary=(muted.textContent||'').trim().toLowerCase();
      if(primary&&secondary&&primary===secondary)muted.style.display='none';
      else muted.style.display='';
    });
  }
  const prior=window.renderTermDates;
  window.renderTermDates=function(){const out=prior();setTimeout(tidyKeyDateLabels,0);return out};
  const priorRender=window.render;
  window.render=function(){const out=priorRender();setTimeout(tidyKeyDateLabels,0);return out};
  window.addEventListener('load',()=>setTimeout(tidyKeyDateLabels,200));
})();