(function(){
  function tidyBookingCharges(){
    ['rSingleBookings','rSchoolBookings','rBookings'].forEach(id=>{
      const body=document.getElementById(id);if(!body)return;
      body.querySelectorAll('tr').forEach(tr=>{
        const cells=[...tr.children];
        cells.forEach(td=>{
          if(!td||td.dataset.chargeTidy==='1')return;
          const text=(td.textContent||'').trim();
          if(!/£\s*\d/.test(text)||!/(\/hr|VAT|No VAT)/i.test(text))return;
          td.dataset.chargeTidy='1';td.classList.add('booking-charge-cell');
          const html=td.innerHTML;
          if(!/<br\s*\/?\s*>/i.test(html)){
            const m=html.match(/^(.*?£[\d,.]+)(.*)$/s);
            if(m&&m[2].trim())td.innerHTML=`<div class="booking-charge-total">${m[1]}</div><div class="booking-charge-detail">${m[2]}</div>`;
          }
        });
      });
    });
  }
  function tidyStaffingSummary(){
    document.querySelectorAll('.monthly-staffing-summary td:first-child').forEach(td=>{
      const note=td.querySelector('.lg-note');if(note)return;
      const text=(td.textContent||'').trim();
      const suffixes=['External customer','School expenditure'];
      for(const suffix of suffixes){if(text.endsWith(suffix)){const name=text.slice(0,-suffix.length).trim();td.innerHTML=`<b>${name}</b><div class="lg-note staffing-customer-note">${suffix}</div>`;break}}
    });
    document.querySelectorAll('td').forEach(td=>{
      if(td.querySelector('.lg-note'))return;
      const text=(td.textContent||'').trim();
      for(const suffix of ['External customer','School expenditure']){if(text.length>suffix.length&&text.endsWith(suffix)){const name=text.slice(0,-suffix.length).trim();if(name){td.innerHTML=`<b>${name}</b><div class="lg-note staffing-customer-note">${suffix}</div>`}break}}
    });
  }
  function tidy(){tidyBookingCharges();tidyStaffingSummary()}
  for(const fn of ['renderBookingTables','renderLifeguardServices']){const prior=window[fn];if(prior)window[fn]=async function(){const out=await prior.apply(this,arguments);setTimeout(tidy,0);return out}}
  window.addEventListener('load',()=>setTimeout(tidy,500));
  const style=document.createElement('style');style.textContent=`.booking-charge-cell{min-width:150px;line-height:1.25}.booking-charge-total{font-weight:700;margin-bottom:4px}.booking-charge-detail{font-size:12px;color:#667786;white-space:nowrap}.staffing-customer-note{display:block;margin-top:3px}`;document.head.appendChild(style);
})();