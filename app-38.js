(function(){
  function ensureBookingAddActions(){
    const configs=[
      {id:'bookingTabSingle',cls:'single-booking-add-action',label:'+ Add single booking',action:()=>window.editBooking&&window.editBooking()},
      {id:'bookingTabSchool',cls:'school-event-add-action',label:'+ Add school event',action:()=>window.editBooking&&window.editBooking(null,'internal')}
    ];
    configs.forEach(cfg=>{
      const panel=document.getElementById(cfg.id);if(!panel||panel.querySelector('.'+cfg.cls))return;
      const wrap=document.createElement('div');wrap.className='booking-add-action '+cfg.cls;
      const btn=document.createElement('button');btn.type='button';btn.className='p';btn.textContent=cfg.label;btn.onclick=cfg.action;wrap.appendChild(btn);
      const collapse=panel.querySelector(':scope > .section-collapse-bar');
      if(collapse)collapse.insertAdjacentElement('afterend',wrap);else panel.insertBefore(wrap,panel.firstChild);
    });
  }
  const oldTab=window.setBookingTab;window.setBookingTab=function(name){const out=oldTab(name);setTimeout(ensureBookingAddActions,0);return out};
  const oldRender=window.render;window.render=function(){const out=oldRender();setTimeout(ensureBookingAddActions,0);return out};
  const oldTables=window.renderBookingTables;window.renderBookingTables=function(){const out=oldTables();setTimeout(ensureBookingAddActions,0);return out};
  window.addEventListener('load',()=>setTimeout(ensureBookingAddActions,250));
  const style=document.createElement('style');style.textContent='.booking-add-action{display:flex;justify-content:flex-end;margin:2px 0 12px}.booking-add-action .p{white-space:nowrap}';document.head.appendChild(style);
})();