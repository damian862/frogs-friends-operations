(function(){
  const style=document.createElement('style');
  style.textContent=`
    #monthlyBilling{margin-top:28px}
    #monthlyBilling .term-top.compact{margin:0 0 14px!important}
    #monthlyBilling .term-top h2{margin:0 0 4px;font-size:22px}
    #monthlyBilling .term-top p{margin:0;line-height:1.45}
    #monthlyBilling .bill-toolbar{padding:16px 18px;margin-bottom:16px;gap:14px}
    #monthlyBilling .bill-toolbar label{min-width:180px}
    #monthlyBilling #billList{display:flex;flex-direction:column;gap:10px}
    #monthlyBilling .bill-row{
      display:grid!important;
      grid-template-columns:minmax(220px,1.25fr) minmax(190px,.9fr) minmax(260px,1fr) minmax(310px,1.35fr)!important;
      gap:20px!important;
      align-items:center!important;
      background:#fff!important;
      border:1px solid #dfe6eb!important;
      border-radius:12px!important;
      padding:17px 18px!important;
      margin:0!important;
      min-height:82px;
    }
    #monthlyBilling .bill-row>div:first-child{min-width:0}
    #monthlyBilling .bill-row>div:first-child>b{display:block;font-size:15px;line-height:1.35;margin-bottom:4px}
    #monthlyBilling .bill-row>div:first-child>.muted{display:block;line-height:1.35;margin:0;color:#647684}
    #monthlyBilling .bill-status{margin:0 0 5px;white-space:nowrap}
    #monthlyBilling .bill-adjust{margin-top:5px;line-height:1.35;max-width:210px}
    #monthlyBilling .bill-values{display:grid!important;grid-template-columns:repeat(3,minmax(72px,1fr));gap:14px!important;align-items:end}
    #monthlyBilling .bill-values span{display:flex!important;flex-direction:column;gap:3px;font-size:11px;color:#657585;line-height:1.2;white-space:nowrap}
    #monthlyBilling .bill-values b{display:block;font-size:15px;color:#0e1b26;line-height:1.25}
    #monthlyBilling .bill-actions{display:flex!important;justify-content:flex-end;align-items:center;gap:8px!important;flex-wrap:wrap}
    #monthlyBilling .bill-actions button{white-space:nowrap}
    @media(max-width:1180px){
      #monthlyBilling .bill-row{grid-template-columns:minmax(210px,1fr) minmax(180px,.8fr) minmax(250px,1fr)!important}
      #monthlyBilling .bill-actions{grid-column:1/-1;justify-content:flex-end;border-top:1px solid #edf1f4;padding-top:12px}
    }
    @media(max-width:820px){
      #monthlyBilling .bill-row{grid-template-columns:1fr!important;gap:12px!important;padding:15px!important}
      #monthlyBilling .bill-values{grid-template-columns:repeat(3,1fr)}
      #monthlyBilling .bill-actions{grid-column:auto;justify-content:flex-start}
    }
  `;
  document.head.appendChild(style);
})();