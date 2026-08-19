(function(){
  let ACCESS_USERS=[],ACCESS_MEMBERSHIPS=[];
  const ADMIN_ROLES=['owner_admin','operations_admin'];
  const roleLabels={owner_admin:'Owner / Admin',operations_admin:'Operations Admin',site_manager:'Site Manager',pool_manager:'Pool Manager',lettings_manager:'Lettings Manager',finance:'Finance',bursar:'Bursar',operational_viewer:'Operational Viewer',school_viewer:'School Viewer',staff:'Staff'};
  const roleHelp={
    operations_admin:'Access to both schools and organisation-wide administration.',
    site_manager:'Full operational and finance access for the assigned school.',
    pool_manager:'Manage bookings, recurring sessions, events, breaks, cancellations and staffing for the assigned school.',
    lettings_manager:'Manage bookings and events, review pool-hire income and complete the Lettings Manager billing approval for the assigned school.',
    finance:'View finance and monthly billing for the assigned school; no booking editing.',
    bursar:'Read-only financial and management reporting for the assigned school.',
    operational_viewer:'Read-only bookings/calendar access for the assigned school; no finance.',
    school_viewer:'Read-only school operational access; no finance.',
    staff:'Basic restricted staff access.'
  };
  const rolePermissions={
    operations_admin:{can_view_finance:true,can_edit_bookings:true,can_manage_events:true},
    site_manager:{can_view_finance:true,can_edit_bookings:true,can_manage_events:true},
    pool_manager:{can_view_finance:false,can_edit_bookings:true,can_manage_events:true},
    lettings_manager:{can_view_finance:true,can_edit_bookings:true,can_manage_events:true},
    finance:{can_view_finance:true,can_edit_bookings:false,can_manage_events:false},
    bursar:{can_view_finance:true,can_edit_bookings:false,can_manage_events:false},
    operational_viewer:{can_view_finance:false,can_edit_bookings:false,can_manage_events:false},
    school_viewer:{can_view_finance:false,can_edit_bookings:false,can_manage_events:false},
    staff:{can_view_finance:false,can_edit_bookings:false,can_manage_events:false}
  };
  const isAdmin=()=>ADMIN_ROLES.includes(String(P?.role||''));
  const roleName=r=>roleLabels[r]||String(r||'').replaceAll('_',' ');
  const siteName=id=>S.find(s=>s.id===id)?.name||'Unknown school';

  function ensureAccessUi(){
    if(document.getElementById('userAccessNav'))return;
    const nav=document.querySelector('.nav');
    if(nav){
      const b=document.createElement('button');b.id='userAccessNav';b.textContent='User Access';b.onclick=showUserAccess;nav.appendChild(b);
    }
    const main=document.querySelector('.main');
    if(main){
      const section=document.createElement('section');section.id='userAccess';section.className='view';
      section.innerHTML=`<div class="access-head"><div><h1>User Access</h1><p class="muted">Invite users, assign roles and control which school each person can access.</p></div><button class="p" onclick="inviteOperationsUser()">+ Invite user</button></div><div class="access-note"><b>School separation is enforced in Supabase.</b> A St George's-only user cannot retrieve St Neot's data through the app. Owner/Admin and Operations Admin users can be given organisation-wide access.</div><div id="accessUsers" class="access-grid"><div class="card">Loading users…</div></div>`;
      main.appendChild(section);
    }
    if(!isAdmin()){document.getElementById('userAccessNav')?.classList.add('admin-only-hidden');}
  }

  window.showUserAccess=async function(){
    if(!isAdmin())return alert('Only Owner/Admin or Operations Admin users can manage user access.');
    ensureAccessUi();document.querySelectorAll('.view').forEach(v=>v.classList.remove('on'));$('userAccess').classList.add('on');await loadUserAccess();
  };

  async function loadUserAccess(){
    const [u,m]=await Promise.all([sb.from('profiles').select('*').order('full_name'),sb.from('site_memberships').select('*')]);
    if(u.error){$('accessUsers').innerHTML=`<div class="err">${e(u.error.message)}</div>`;return}
    ACCESS_USERS=u.data||[];ACCESS_MEMBERSHIPS=m.data||[];renderUserAccess();
  }

  function membershipPerms(uid){
    const rows=ACCESS_MEMBERSHIPS.filter(m=>m.user_id===uid),vals=[];
    if(rows.some(m=>m.can_edit_bookings))vals.push('Bookings');
    if(rows.some(m=>m.can_manage_events))vals.push('Events');
    if(rows.some(m=>m.can_view_finance))vals.push('Finance');
    if(!vals.length)vals.push('Read only');
    return vals;
  }

  function renderUserAccess(){
    const host=$('accessUsers');if(!host)return;
    host.innerHTML=ACCESS_USERS.map(u=>{
      const memberships=ACCESS_MEMBERSHIPS.filter(m=>m.user_id===u.id),owner=u.role==='owner_admin',sites=owner?S:memberships.map(m=>S.find(s=>s.id===m.site_id)).filter(Boolean),perms=owner?['All permissions']:membershipPerms(u.id);
      return `<div class="access-user ${u.active===false?'access-inactive':''}"><div class="access-user-main"><div><div class="access-name">${e(u.full_name||'Unnamed user')}</div><div class="access-email">${e(u.email||'')}</div></div><div><span class="access-role">${e(roleName(u.role))}</span><div class="access-permissions">${perms.map(p=>`<span class="access-perm">${e(p)}</span>`).join('')}</div></div><div><div class="access-sites">${sites.length?sites.map(s=>`<span class="access-site">${e(s.name)}</span>`).join(''):'<span class="access-small">No school assigned</span>'}</div>${u.home_site_id?`<div class="access-home">Home school: ${e(siteName(u.home_site_id))}</div>`:''}</div><div class="access-actions">${owner?'<span class="access-small">Protected owner account</span>':`<button class="s" onclick="editUserAccess('${u.id}')">Edit access</button>`}</div></div></div>`;
    }).join('')||'<div class="access-empty">No users have been created yet.</div>';
  }

  function roleOptions(value,allowOwner=false){
    const roles=['operations_admin','site_manager','pool_manager','lettings_manager','finance','bursar','operational_viewer','school_viewer','staff'];if(allowOwner)roles.unshift('owner_admin');
    return roles.map(r=>`<option value="${r}" ${r===value?'selected':''}>${e(roleName(r))}</option>`).join('');
  }
  function siteCheckboxes(selected=[]){return S.map(s=>`<label class="invite-site-option"><input type="checkbox" class="ua-site" value="${s.id}" ${selected.includes(s.id)?'checked':''}> ${e(s.name)}</label>`).join('')}
  window.uaRoleChanged=function(){let role=$('uaRole')?.value||'operational_viewer';$('uaRoleHelp').textContent=roleHelp[role]||'';let all=role==='operations_admin';document.querySelectorAll('.ua-site').forEach(x=>{if(all)x.checked=true});updateHomeSiteOptions()};
  window.updateHomeSiteOptions=function(){let home=$('uaHome');if(!home)return;let selected=[...document.querySelectorAll('.ua-site:checked')].map(x=>x.value),old=home.value;home.innerHTML='<option value="">No home school</option>'+selected.map(id=>`<option value="${id}">${e(siteName(id))}</option>`).join('');if(selected.includes(old))home.value=old;else if(selected.length)home.value=selected[0]};

  window.inviteOperationsUser=function(){
    if(!isAdmin())return;
    modal('Invite user',`<label>Full name<input id=uaName placeholder="e.g. Jane Smith"></label><label>Email<input id=uaEmail type=email placeholder="name@school.org"></label><label>Role<select id=uaRole onchange="uaRoleChanged()">${roleOptions('operational_viewer')}</select></label><label>Home school<select id=uaHome></select></label><div class="invite-sites"><span>School access</span>${siteCheckboxes([])}</div><div id=uaRoleHelp class="access-role-help">${e(roleHelp.operational_viewer)}</div>`,async()=>{
      const sites=[...document.querySelectorAll('.ua-site:checked')].map(x=>x.value),role=uaRole.value;
      if(!uaName.value.trim())return alert('Enter the user’s name.');if(!uaEmail.value.trim())return alert('Enter the user’s email address.');if(role!=='operations_admin'&&!sites.length)return alert('Select at least one school for this user.');
      $('ms').disabled=true;$('ms').textContent='Sending invite…';
      const {data,error}=await sb.functions.invoke('invite-operations-user',{body:{full_name:uaName.value.trim(),email:uaEmail.value.trim(),role,site_ids:sites,home_site_id:uaHome.value||sites[0]||null}});
      $('ms').disabled=false;$('ms').textContent='Save';if(error||data?.error)return alert(data?.error||error.message);closeM();await loadUserAccess();alert('Invitation sent to '+uaEmail.value.trim()+'.');
    });
    document.querySelectorAll('.ua-site').forEach(x=>x.addEventListener('change',updateHomeSiteOptions));updateHomeSiteOptions();
  };

  window.editUserAccess=function(uid){
    const u=ACCESS_USERS.find(x=>x.id===uid);if(!u||u.role==='owner_admin')return;const mem=ACCESS_MEMBERSHIPS.filter(m=>m.user_id===uid),selected=mem.map(m=>m.site_id);
    modal('Edit user access',`<label>User<input value="${e(u.full_name||u.email)}" disabled></label><label>Email<input value="${e(u.email||'')}" disabled></label><label>Role<select id=uaRole onchange="uaRoleChanged()">${roleOptions(u.role)}</select></label><label>Home school<select id=uaHome></select></label><div class="invite-sites"><span>School access</span>${siteCheckboxes(selected)}</div><label>Status<select id=uaActive><option value=true ${u.active!==false?'selected':''}>Active</option><option value=false ${u.active===false?'selected':''}>Disabled</option></select></label><div id=uaRoleHelp class="access-role-help">${e(roleHelp[u.role]||'')}</div>`,async()=>{
      const role=uaRole.value,sites=[...document.querySelectorAll('.ua-site:checked')].map(x=>x.value),home=uaHome.value||sites[0]||null;
      if(role!=='operations_admin'&&!sites.length)return alert('Select at least one school for this user.');
      const profile=await sb.from('profiles').update({role,home_site_id:home,active:uaActive.value==='true',updated_at:new Date().toISOString()}).eq('id',uid);if(profile.error)return alert(profile.error.message);
      const del=await sb.from('site_memberships').delete().eq('user_id',uid);if(del.error)return alert(del.error.message);
      if(sites.length){const p=rolePermissions[role]||rolePermissions.staff,rows=sites.map(site_id=>({user_id:uid,site_id,role,...p}));const ins=await sb.from('site_memberships').insert(rows);if(ins.error)return alert(ins.error.message)}
      closeM();await loadUserAccess();
    });
    document.querySelectorAll('.ua-site').forEach(x=>x.addEventListener('change',updateHomeSiteOptions));updateHomeSiteOptions();if(u.home_site_id&&[...$('uaHome').options].some(o=>o.value===u.home_site_id))$('uaHome').value=u.home_site_id;
  };

  const oldRender=window.render;window.render=function(){oldRender();ensureAccessUi();if($('userAccess')?.classList.contains('on')&&isAdmin())loadUserAccess()};
  const oldEnter=window.enter;window.enter=async function(u){await oldEnter(u);ensureAccessUi()};
  window.addEventListener('load',ensureAccessUi);
})();