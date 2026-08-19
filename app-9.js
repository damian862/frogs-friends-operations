(function(){
const baseViewBillingStatement=window.viewBillingStatement;
if(baseViewBillingStatement){
 window.viewBillingStatement=function(id){
   baseViewBillingStatement(id);
   const modalEl=document.getElementById('modal');
   if(modalEl)modalEl.classList.add('billing-statement-modal');
 };
}
const baseCloseM=window.closeM;
if(baseCloseM){
 window.closeM=function(){
   const modalEl=document.getElementById('modal');
   if(modalEl)modalEl.classList.remove('billing-statement-modal');
   return baseCloseM();
 };
}
})();
