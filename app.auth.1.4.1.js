// app.auth.1.4.1.js
;(function(){
  const LS = { url: 'or_supabase_url', anon: 'or_supabase_anon' };
  function createClientFromLocal(){
    const url = localStorage.getItem(LS.url);
    const anon = localStorage.getItem(LS.anon);
    if(!url || !anon || !window.supabase){ return null; }
    try { return window.supabase.createClient(url, anon, { auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true } }); }
    catch(e){ console.error('Supabase init error', e); return null; }
  }
  function $(s,r=document){ return r.querySelector(s); }
  function $all(s,r=document){ return [...r.querySelectorAll(s)]; }
  function show(el){ el?.classList.remove('hidden'); } function hide(el){ el?.classList.add('hidden'); }
  const ORAuth = {
    sb: null,
    open: ()=>{ show($('#auth-modal')); $('#auth-email')?.focus(); },
    close: ()=>hide($('#auth-modal')),
    signOut: async ()=>{ if(!ORAuth.sb) return; await ORAuth.sb.auth.signOut(); document.body.classList.remove('is-authed'); if(window.activateTab) activateTab('home'); }
  };
  window.ORAuth = ORAuth;
  window.addEventListener('click', (e)=>{ if(e.target?.matches('[data-auth-close]')) ORAuth.close(); });
  $all('.auth-tabs .tab').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      $all('.auth-tabs .tab').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
      const mode = btn.getAttribute('data-auth-tab');
      const pw2 = $('.pw-wrap[data-mode="signup"]'); const pw1 = $('.pw-wrap[data-mode="signin"]');
      if(mode==='signup'){ show(pw2); } else { hide(pw2); }
      $('#auth-submit').textContent = (mode==='signup') ? 'הרשמה' : 'כניסה';
    });
  });
  const form = $('#auth-form');
  form?.addEventListener('submit', async (e)=>{
    e.preventDefault(); $('#auth-feedback').textContent='';
    try{
      if(!ORAuth.sb) ORAuth.sb = createClientFromLocal();
      if(!ORAuth.sb) throw new Error('לא הוגדר Supabase URL / Anon Key בהגדרות');
      const email = $('#auth-email').value.trim();
      const pass = $('#auth-password').value;
      const isSignup = $('.auth-tabs .tab.active')?.getAttribute('data-auth-tab') === 'signup';
      if(isSignup){
        const pass2 = $('#auth-password2').value;
        if(pass !== pass2) throw new Error('אימות סיסמה לא תואם');
        const { error } = await ORAuth.sb.auth.signUp({ email, password: pass });
        if(error) throw error;
        $('#auth-feedback').style.color='#16a34a'; $('#auth-feedback').textContent='נרשמת בהצלחה. בדוק מייל לאימות אם נדרש.';
      } else {
        const { error } = await ORAuth.sb.auth.signInWithPassword({ email, password: pass });
        if(error) throw error; ORAuth.close();
      }
    }catch(err){ $('#auth-feedback').style.color='#ef4444'; $('#auth-feedback').textContent=err?.message||'שגיאה בהתחברות'; console.error(err); }
  });
  $('#auth-magic')?.addEventListener('click', async ()=>{
    $('#auth-feedback').textContent='';
    try{
      if(!ORAuth.sb) ORAuth.sb = createClientFromLocal();
      const email = $('#auth-email').value.trim();
      const { error } = await ORAuth.sb.auth.signInWithOtp({ email });
      if(error) throw error; $('#auth-feedback').style.color='#16a34a'; $('#auth-feedback').textContent='נשלח קישור התחברות למייל.';
    }catch(err){ $('#auth-feedback').style.color='#ef4444'; $('#auth-feedback').textContent=err?.message||'שגיאה בשליחת לינק'; }
  });
  function ensureHomeActive(){
    if(typeof window.activateTab==='function'){ activateTab('home'); }
    else {
      const activeBtn = document.querySelector('.bottom-nav .btn.active'); activeBtn?.classList.remove('active');
      document.querySelector('.bottom-nav .btn[data-tab="home"]')?.classList.add('active');
      document.querySelectorAll('.screen').forEach(s=>s.classList.add('hidden'));
      document.getElementById('screen-home')?.classList.remove('hidden');
    }
  }
  function attachAuthListener(){
    if(!ORAuth.sb) ORAuth.sb = createClientFromLocal(); if(!ORAuth.sb) return;
    ORAuth.sb.auth.onAuthStateChange((_event, session)=>{ document.body.classList.toggle('is-authed', !!session); if(session) ensureHomeActive(); });
    ORAuth.sb.auth.getSession().then(({data})=>{ if(data?.session){ document.body.classList.add('is-authed'); ensureHomeActive(); } });
  }
  document.addEventListener('DOMContentLoaded', attachAuthListener);
})();
