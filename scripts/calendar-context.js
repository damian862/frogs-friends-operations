/* Build-time calendar enhancement appended to dist/calendar.js. Keeps the browser runtime at seven modules. */
(function () {
  const DAY = 86400000;
  const OFFICIAL_EW = {
    2024: [['2024-01-01','New Year’s Day'],['2024-03-29','Good Friday'],['2024-04-01','Easter Monday'],['2024-05-06','Early May bank holiday'],['2024-05-27','Spring bank holiday'],['2024-08-26','Summer bank holiday'],['2024-12-25','Christmas Day'],['2024-12-26','Boxing Day']],
    2025: [['2025-01-01','New Year’s Day'],['2025-04-18','Good Friday'],['2025-04-21','Easter Monday'],['2025-05-05','Early May bank holiday'],['2025-05-26','Spring bank holiday'],['2025-08-25','Summer bank holiday'],['2025-12-25','Christmas Day'],['2025-12-26','Boxing Day']],
    2026: [['2026-01-01','New Year’s Day'],['2026-04-03','Good Friday'],['2026-04-06','Easter Monday'],['2026-05-04','Early May bank holiday'],['2026-05-25','Spring bank holiday'],['2026-08-31','Summer bank holiday'],['2026-12-25','Christmas Day'],['2026-12-28','Boxing Day (substitute day)']],
    2027: [['2027-01-01','New Year’s Day'],['2027-03-26','Good Friday'],['2027-03-29','Easter Monday'],['2027-05-03','Early May bank holiday'],['2027-05-31','Spring bank holiday'],['2027-08-30','Summer bank holiday'],['2027-12-27','Christmas Day (substitute day)'],['2027-12-28','Boxing Day (substitute day)']],
    2028: [['2028-01-03','New Year’s Day (substitute day)'],['2028-04-14','Good Friday'],['2028-04-17','Easter Monday'],['2028-05-01','Early May bank holiday'],['2028-05-29','Spring bank holiday'],['2028-08-28','Summer bank holiday'],['2028-12-25','Christmas Day'],['2028-12-26','Boxing Day']]
  };
  function iso(d) {
    const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  }
  function local(v){ return new Date(v+'T12:00:00'); }
  function add(d,n){ return new Date(d.getTime()+n*DAY); }
  function monday(d){ const x=new Date(d),shift=(x.getDay()+6)%7; return add(x,-shift); }
  function firstMonday(year,month){ const d=new Date(year,month,1,12); return add(d,(8-d.getDay())%7); }
  function lastMonday(year,month){ const d=new Date(year,month+1,0,12); return add(d,-((d.getDay()+6)%7)); }
  function easterSunday(year){
    const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31)-1,day=((h+l-7*m+114)%31)+1;
    return new Date(year,month,day,12);
  }
  function fallbackBankHolidays(year){
    const out=[];
    let ny=new Date(year,0,1,12); if(ny.getDay()===6)ny=add(ny,2); else if(ny.getDay()===0)ny=add(ny,1);
    out.push([iso(ny),'New Year’s Day'+(ny.getDate()!==1?' (substitute day)':'')]);
    const easter=easterSunday(year); out.push([iso(add(easter,-2)),'Good Friday'],[iso(add(easter,1)),'Easter Monday']);
    out.push([iso(firstMonday(year,4)),'Early May bank holiday'],[iso(lastMonday(year,4)),'Spring bank holiday'],[iso(lastMonday(year,7)),'Summer bank holiday']);
    const christmas=new Date(year,11,25,12),boxing=new Date(year,11,26,12);
    let c=christmas,bx=boxing;
    if(christmas.getDay()===6)c=add(christmas,2); else if(christmas.getDay()===0)c=add(christmas,2);
    if(boxing.getDay()===6)bx=add(boxing,2); else if(boxing.getDay()===0)bx=add(boxing,2);
    out.push([iso(c),'Christmas Day'+(iso(c)!==iso(christmas)?' (substitute day)':'')],[iso(bx),'Boxing Day'+(iso(bx)!==iso(boxing)?' (substitute day)':'')]);
    return out;
  }
  function bankHoliday(date){
    const year=Number(date.slice(0,4)), rows=OFFICIAL_EW[year]||fallbackBankHolidays(year);
    const found=rows.find(x=>x[0]===date); return found?found[1]:'';
  }
  function termKind(p){
    const n=String(p?.name||'').toLowerCase();
    if(n.includes('autumn'))return 'autumn'; if(n.includes('spring'))return 'spring'; if(n.includes('summer'))return 'summer';
    return '';
  }
  function periodLabel(p){
    const t=String(p?.period_type||'').toLowerCase(),name=String(p?.name||'').trim();
    if(t==='half_term') return name||'Half term';
    if(t==='christmas_holiday') return 'Christmas Break';
    if(t==='easter_holiday') return 'Easter Break';
    if(t==='summer_holiday') return 'Summer Break';
    if(t==='inset_day') return name||'INSET day';
    if(t==='exeat') return name||'Exeat';
    if(t==='term') {
      const kind=termKind(p); return kind ? kind[0].toUpperCase()+kind.slice(1)+' Term' : (name||'School term');
    }
    if(t && t!=='bank_holiday' && t!=='other') return name||t.replaceAll('_',' ');
    return '';
  }
  function contextForSite(siteId,date){
    const year=(Y||[]).find(y=>y.site_id===siteId&&y.starts_on<=date&&y.ends_on>=date);
    if(!year)return '';
    const periods=(D||[]).filter(p=>p.academic_year_id===year.id&&p.starts_on&&p.ends_on);
    const explicit=periods.filter(p=>p.starts_on<=date&&p.ends_on>=date&&String(p.period_type||'')!=='bank_holiday').sort((a,b)=>{
      const rank=x=>String(x.period_type||'')==='half_term'?0:String(x.period_type||'')==='term'?5:2;
      return rank(a)-rank(b);
    })[0];
    if(explicit){ const label=periodLabel(explicit); if(label)return label; }
    const terms=periods.filter(p=>String(p.period_type||'')==='term').sort((a,b)=>a.starts_on.localeCompare(b.starts_on));
    const prev=[...terms].reverse().find(t=>t.ends_on<date),next=terms.find(t=>t.starts_on>date);
    if(prev&&next){
      const k=termKind(prev); if(k==='autumn')return 'Christmas Break'; if(k==='spring')return 'Easter Break'; if(k==='summer')return 'Summer Break';
    }
    if(prev&&termKind(prev)==='summer')return 'Summer Break';
    if(!prev&&next&&termKind(next)==='autumn')return 'Summer Break';
    return '';
  }
  function visibleSites(){
    const selected=document.getElementById('calSite')?.value||'';
    return selected ? (S||[]).filter(s=>s.id===selected) : (S||[]).filter(s=>s.active!==false);
  }
  function contextHtml(date){
    const sites=visibleSites(), groups=new Map();
    sites.forEach(site=>{ const label=contextForSite(site.id,date); if(!label)return; const arr=groups.get(label)||[]; arr.push(site.name); groups.set(label,arr); });
    let html='';
    groups.forEach((names,label)=>{
      const all=sites.length>0&&names.length===sites.length;
      const text=all?label:(sites.length===1?label:`${names.join(', ')}: ${label}`);
      const cls=/half term/i.test(label)?'half':/break/i.test(label)?'break':'term';
      html+=`<span class="cal-school-context ${cls}" title="${e(names.join(', '))}">${e(text)}</span>`;
    });
    const bh=bankHoliday(date); if(bh)html+=`<span class="cal-school-context bank" title="England & Wales bank holiday">${e(bh)}</span>`;
    return html?`<div class="cal-school-contexts">${html}</div>`:'';
  }
  function addContextToRenderedCalendar(){
    if(document.querySelector('.cal-mode.active')?.dataset.mode==='availability')return;
    document.querySelectorAll('.cal-school-contexts').forEach(x=>x.remove());
    const mode=document.querySelector('.cal-mode.active')?.dataset.mode||'week';
    const anchor=document.getElementById('calAnchor')?.value;
    if(mode==='week'&&anchor){
      const start=monday(local(anchor));
      [...document.querySelectorAll('#calendarBody .cal-day')].forEach((cell,i)=>{
        const target=cell.querySelector('.cal-day-head'); if(target)target.insertAdjacentHTML('afterend',contextHtml(iso(add(start,i))));
      });
    } else if(mode==='month'&&anchor){
      const a=local(anchor),first=new Date(a.getFullYear(),a.getMonth(),1,12),start=monday(first);
      [...document.querySelectorAll('#calendarBody .cal-cell')].forEach((cell,i)=>{
        const target=cell.querySelector('.num'); if(target)target.insertAdjacentHTML('afterend',contextHtml(iso(add(start,i))));
      });
    }
  }
  OpsLifecycle.use('renderBookingCalendar',function(next){ const result=next(); setTimeout(addContextToRenderedCalendar,0); return result; });
  const style=document.createElement('style');
  style.textContent=`.cal-school-contexts{display:flex;flex-direction:column;gap:3px;margin:5px 0 7px}.cal-school-context{display:block;border-radius:5px;padding:3px 5px;font-size:10px;line-height:1.2;font-weight:700;background:#eef4f8;color:#29485e}.cal-school-context.half{background:#fff5d9;color:#76560b}.cal-school-context.break{background:#f4efff;color:#60459a}.cal-school-context.bank{background:#e8f6ea;color:#276139}.cal-month .cal-school-contexts{margin:3px 0 5px}.cal-month .cal-school-context{font-size:9px;padding:2px 4px}@media(max-width:850px){.cal-school-context{font-size:9px}}`;
  document.head.appendChild(style);
})();
