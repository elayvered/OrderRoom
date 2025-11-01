\
// app.1.3.1.js — drop‑in patch (auth bridge + UI bootstrap)
// This file is safe to replace the existing app.1.3.1.js without editing index.html.
;(function(){
  const $ = (s, r=document)=> r.querySelector(s);
  const $$ = (s, r=document)=> Array.from(r.querySelectorAll(s));
  const onReady = (fn)=> (document.readyState==='loading'?document.addEventListener('DOMContentLoaded', fn, {once:true}):fn());

  // --- styles fallback ---
  function injectBaseStyles(){
    if($('#or-base-styles')) return;
    const st = document.createElement('style');
    st.id = 'or-base-styles';
    st.textContent = `
      :root{ --or-ink:#0f172a; --or-muted:#64748b; --or-bg:#f8fafc; --or-card:#ffffff; --or-accent:#111827 }
      body{ background:var(--or-bg); color:var(--or-ink); font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial }
      .hidden{ display:none !important }
      .or-card{ background:var(--or-card); border-radius:16px; box-shadow:0 8px 24px rgba(15,23,42,.06); padding:16px; margin:16px }
      .bottom-nav{ position:fixed; inset-inline:0; bottom:14px; display:flex; gap:10px; padding:0 14px; z-index:1000 }
      .bottom-nav .btn{ flex:1; padding:12px 14px; background:#fff; border:1px solid #e5e7eb; border-radius:16px; text-align:center; font-weight:700; cursor:pointer; box-shadow:0 4px 18px rgba(2,6,23,.06) }
      .bottom-nav .btn.active{ background:var(--or-accent); color:#fff; border-color:var(--or-accent) }
    `;
    document.head.appendChild(st);
  }

  // --- screens + nav bootstrap ---
  function ensureScreen(id, contentHTML){
    let sec = $('#screen-'+id);
    if(!sec){
      sec = document.createElement('section');
      sec.id = 'screen-'+id;
      sec.className = 'screen' + (id==='home' ? '' : ' hidden');
      if(contentHTML) sec.innerHTML = contentHTML;
      (document.querySelector('main') || document.body).appendChild(sec);
    }
    return sec;
  }

  function ensureBottomNav(){
    let nav = $('.bottom-nav');
    if(nav) return nav;
    nav = document.createElement('nav');
    nav.className = 'bottom-nav';
    nav.innerHTML = `
      <a class="btn" data-tab="home">בית</a>
      <a class="btn" data-tab="orders">הזמנות</a>
      <a class="btn" data-tab="settings">הגדרות</a>
      <a class="btn" data-tab="analytics">נתונים</a>
    `;
    document.body.appendChild(nav);
    return nav;
  }

  function activateTab(id){
    $$('.bottom-nav .btn').forEach(b=>b.classList.remove('active'));
    $(`.bottom-nav .btn[data-tab="${id}"]`)?.classList.add('active');
    $$('.screen').forEach(s=>s.classList.add('hidden'));
    $('#screen-'+id)?.classList.remove('hidden');
  }
  window.activateTab = activateTab; // חשוף ליתר הקוד אם הוא קיים

  // --- Supabase auth bridge ---
  const LS = { url: 'or_supabase_url', anon: 'or_supabase_anon' };
  function getSb(){
    if(window.supabaseClient) return window.supabaseClient;
    try{
      const url = localStorage.getItem(LS.url);
      const anon = localStorage.getItem(LS.anon);
      if(!url || !anon || !window.supabase) return null;
      const c = window.supabase.createClient(url, anon, {
        auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true }
      });
      window.supabaseClient = c;
      return c;
    }catch(e){ console.warn('Supabase init failed', e); return null; }
  }

  function callAppInit(session){
    const tries = [
      () => window.OR?.init?.(session),
      () => window.OrderRoom?.init?.(session),
      () => window.initApp?.(session),
      () => window.bootstrapApp?.(session),
    ];
    for(const t of tries){
      try{ const fn = t; if(typeof fn === 'function'){ const r = fn(); if(r !== undefined) break; } }catch(e){}
    }
    try{ document.dispatchEvent(new CustomEvent('orderroom:authed', { detail:{ session } })); }catch(e){}
  }

  function onAuthed(session){
    document.body.classList.add('is-authed');
    ensureBottomNav();
    ensureScreen('home', `<div class="or-card"><h2 style="margin:0 0 6px 0">בית</h2><div style="color:var(--or-muted)">ברוך הבא ל־Order Room</div></div>`);
    activateTab('home');
    callAppInit(session);
  }

  function wireAuth(){
    const sb = getSb();
    if(!sb) return;
    sb.auth.onAuthStateChange((_e, ctx)=>{
      const ses = ctx?.session || null;
      if(ses) onAuthed(ses);
    });
    sb.auth.getSession().then(({data})=>{
      if(data?.session) onAuthed(data.session); else {
        ensureBottomNav();
        ensureScreen('home', `<div class="or-card"><h2 style="margin:0 0 6px 0">בית</h2><div style="color:var(--or-muted)">יש להתחבר כדי להציג נתונים</div></div>`);
        activateTab('home');
      }
    });
  }

  // --- nav clicks ---
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('.bottom-nav .btn[data-tab]');
    if(!btn) return;
    e.preventDefault();
    activateTab(btn.getAttribute('data-tab'));
  });

  // --- boot ---
  onReady(function(){
    injectBaseStyles();
    ensureScreen('home', `<div class="or-card"><h2 style="margin:0 0 6px 0">בית</h2><div style="color:var(--or-muted)">טוען…</div></div>`);
    ensureScreen('orders');
    ensureScreen('settings');
    ensureScreen('analytics');
    ensureBottomNav();
    activateTab('home');
    wireAuth();
  });
})();
