(function(){
  const previousModal=window.modal;
  if(typeof previousModal==='function'){
    window.modal=function(title,html,save){
      const saveButton=document.getElementById('ms');
      if(saveButton){
        saveButton.style.display='';
        saveButton.textContent='Save';
        saveButton.disabled=false;
      }
      return previousModal.apply(this,arguments);
    };
  }

  const previousClose=window.closeM;
  if(typeof previousClose==='function'){
    window.closeM=function(){
      const result=previousClose.apply(this,arguments);
      const saveButton=document.getElementById('ms');
      if(saveButton){
        saveButton.style.display='';
        saveButton.textContent='Save';
        saveButton.disabled=false;
      }
      return result;
    };
  }
})();
