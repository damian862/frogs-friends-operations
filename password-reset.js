/* Password reset support for User Access and recovery links. */
(function(){
  const PRODUCTION='https://frogs-friends-operations.vercel.app';
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  window.sendOperationsPasswordReset=async function(email){
    email=String(email||'').trim();
    if(!email)return alert('This user does not have an email address.');
    if(!confirm('Send a password reset email to '+email+'?'))return;
    const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:PRODUCTION+'/?reset=1'});
    if(error)return alert('Password reset could not be sent: '+error.message);
    alert('Password reset email sent to '+email+'.');
  };

  function addResetButtons(){
    const host=document.getElementById('accessUsers');
    if(!host)return;
    host.querySelectorAll('.access-user').forEach(card=>{
      const email=card.querySelector('.access-email')?.textContent?.trim();
      const actions=card.querySelector('.access-actions');
      if(!email||!actions||actions.querySelector('.ua-password-reset'))return;
      if(actions.textContent.includes('Protected owner account'))return;
      const b=document.createElement('button');
      b.className='s ua-password-reset';
      b.textContent='Send password reset';
      b.style.marginLeft='6px';
      b.onclick=()=>sendOperationsPasswordReset(email);
      actions.appendChild(b);
    });
  }

  const accessHostObserver=new MutationObserver(addResetButtons);
  window.addEventListener('load',()=>{
    const host=document.getElementById('accessUsers');
    if(host)accessHostObserver.observe(host,{childList:true,subtree:true});
    addResetButtons();
  });
  document.addEventListener('click',ev=>{if(ev.target?.id==='userAccessNav')setTimeout(addResetButtons,100);});

  async function handleRecovery(){
    const params=new URLSearchParams(location.search);
    const hash=new URLSearchParams(location.hash.replace(/^#/,''));
    const recovery=params.get('reset')==='1'||hash.get('type')==='recovery';
    if(!recovery)return;
    const auth=document.getElementById('auth'), box=auth?.querySelector('.box');
    if(!box)return;
    auth.classList.remove('hide');
    document.getElementById('app')?.classList.add('hide');
    box.innerHTML='<h2>🐸 Frogs & Friends Operations</h2><h3>Reset your password</h3><p class="muted">Choose a new password for your account.</p><label>New password<input id="recoveryPassword" type="password" autocomplete="new-password" minlength="8"></label><label>Confirm password<input id="recoveryConfirm" type="password" autocomplete="new-password" minlength="8"></label><button id="recoverySave" class="p">Save new password</button><div id="recoveryMsg"></div>';
    const msg=(text,bad=false)=>{document.getElementById('recoveryMsg').innerHTML='<div class="'+(bad?'err':'note')+'">'+esc(text)+'</div>';};
    try{
      const access_token=hash.get('access_token'), refresh_token=hash.get('refresh_token');
      if(access_token&&refresh_token){const {error}=await sb.auth.setSession({access_token,refresh_token});if(error)throw error;}
      const {data:{session}}=await sb.auth.getSession();
      if(!session)throw new Error('This password reset link is invalid or has expired. Please request another reset email.');
      document.getElementById('recoverySave').onclick=async()=>{
        const password=document.getElementById('recoveryPassword').value, confirmPassword=document.getElementById('recoveryConfirm').value;
        if(password.length<8)return msg('Please use at least 8 characters.',true);
        if(password!==confirmPassword)return msg('The passwords do not match.',true);
        msg('Saving password…');
        const {data,error}=await sb.auth.updateUser({password});
        if(error)return msg(error.message,true);
        history.replaceState(null,'',location.pathname);
        await enter(data.user||session.user);
      };
    }catch(err){msg(err.message||String(err),true);}
  }
  handleRecovery();
})();
