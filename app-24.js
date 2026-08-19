(function(){
  function simplifyBookingTabs(){
    const allBtn=document.querySelector('.booking-tab[data-btab="all"]');
    const allPanel=document.getElementById('bookingTabAll');
    const calBtn=document.querySelector('.booking-tab[data-btab="calendar"]');
    if(allBtn)allBtn.style.display='none';
    if(allPanel){allPanel.classList.remove('on');allPanel.style.display='none'}
    if(calBtn)calBtn.textContent='Calendar';
  }

  const previousSet=window.setBookingTab;
  window.setBookingTab=function(tab){
    if(tab==='all')tab='calendar';
    previousSet(tab);
    simplifyBookingTabs();
  };

  const previousRender=window.render;
  window.render=function(){
    previousRender();
    simplifyBookingTabs();
  };

  const previousEnter=window.enter;
  window.enter=async function(user){
    await previousEnter(user);
    simplifyBookingTabs();
    if(document.getElementById('bookings')?.classList.contains('on'))window.setBookingTab('calendar');
  };

  document.addEventListener('click',ev=>{
    const nav=ev.target.closest('button[data-v="bookings"]');
    if(nav)setTimeout(()=>window.setBookingTab('calendar'),0);
  });

  window.addEventListener('load',()=>setTimeout(simplifyBookingTabs,100));
})();
