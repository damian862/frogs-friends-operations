(function(){
  const style=document.createElement('style');
  style.textContent=`
    .statement-modal .statement-head,
    #modal .statement-head{padding-bottom:14px!important;margin-bottom:10px!important;border-bottom:1px solid #dfe6ed!important;align-items:flex-start!important}
    .statement-modal .statement-head h3,
    #modal .statement-head h3{margin:0 0 5px!important;line-height:1.25!important}
    .statement-modal .statement-head .muted,
    #modal .statement-head .muted{display:block!important;line-height:1.4!important;margin-top:2px!important}
    .statement-modal .statement-status,
    #modal .statement-status{margin-top:2px!important;align-self:flex-start!important}
    .statement-modal table,
    #modal .statement-table{margin-top:8px!important}
  `;
  document.head.appendChild(style);
})();