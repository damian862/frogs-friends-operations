(function(){
let SITE_CONTEXT='';
const ownerRole=()=>['owner_admin','operations_admin'].includes(String(P?.role||''));
const siteName=id=>S.find(s=>s.id===id)?.name||'';
function currentSite(){if(!ownerRole())return P?.home_site_id||S[0]?.id||'';return SITE_CONTEXT||''}
function addContextUi(){let top=document.querySelector('.top');if(!top||document.getElementById('siteContext'))return;let wrap=document.createElement('div');wrap.id='siteContext';wrap.className='site-context';if(ownerRole()){wrap.innerHTML=`<span class=site-context-label>Viewing</span><select id=globalSiteContext><option value="">All Sites</option>${S.map(s=>`<option value="${s.id}">${e(s.name)}</option>`).join('')}</select>`;top.insertBefore(wrap,document.querySelector('.top .sp'));let saved=localStorage.getItem('ff_site_context')||'';if(saved&&S.some(s=>s.id===saved))SITE_CONTEXT=saved;$('globalSiteContext').value=SITE_CONTEXT;$('globalSiteContext').onchange=()=>{SITE_CONTEXT=$('globalSiteContext').value;localStorage.setItem('ff_site_context',SITE_CONTEXT);applyContextFilters();render()}}else{document.body.classList.add('site-restricted');let sid=currentSite(),name=siteName(sid)||'School';wrap.innerHTML=`<span class=site-context-badge>🏫 ${e(name)}</span>`;top.insertBefore(wrap,document.querySelector('.top .sp'));hideOrganisationAdmin()}}
function hideOrganisationAdmin(){document.querySelectorAll('.nav button').forEach(b=>{let v=b.dataset.v;if(['sites'].includes(v))b.style.display='none'});document.querySelectorAll('#sites .p,#sites .link,#hirers>.p,#staff>.p').forEach(x=>x.style.display='none')}
function setSelect(id){let el=$(id),sid=currentSite();if(!el||!sid)return;if([...el.options].some(o=>o.value===sid)){el.value=sid;el.disabled=!ownerRole();}}
function applyContextFilters(){let sid=currentSite();if(!sid)return;['rbSite','calSite','repSite','billSite','lgSite'].forEach(setSelect)}
function renderDashboardContext(){let sid=currentSite();if($('k1'))$('k1').textContent=sid?1:S.length;if($('k4'))$('k4').textContent=sid?B.filter(x=>x.site_id===sid).length:B.length}
function schoolBanner(){if(ownerRole()||document.getElementById('siteSchoolBanner'))return;let sid=currentSite(),name=siteName(sid);if(!name)return;let main=document.querySelector('.main'),top=document.querySelector('.top');if(!main||!top)return;let b=document.createElement('div');b.id='siteSchoolBanner';b.className='site-school-banner';b.innerHTML=`<b>${e(name)}</b><span>Your account is restricted to this school's pool operations.</span>`;top.insertAdjacentElement('afterend',b)}
const oldRender=window.render;window.render=function(){oldRender();addContextUi();schoolBanner();applyContextFilters();renderDashboardContext();hideOrganisationAdmin()};
const oldRecurring=window.renderRecurringBookings;window.renderRecurringBookings=function(){oldRecurring();setTimeout(applyContextFilters,0)};
const oldIncome=window.renderIncomeSummary;window.renderIncomeSummary=function(){oldIncome();setTimeout(applyContextFilters,0)};
const oldCal=window.renderBookingCalendar;if(oldCal)window.renderBookingCalendar=function(){oldCal();setTimeout(applyContextFilters,0)};
const oldEnter=window.enter;window.enter=async function(u){await oldEnter(u);addContextUi();schoolBanner();applyContextFilters();renderDashboardContext()};
})();
