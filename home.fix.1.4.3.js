// home.fix.1.4.3.js
;(function(){
  function ensureEl(id, builder){
    let el = document.getElementById(id);
    if(!el){
      el = builder();
      el.id = id;
      (document.querySelector('main') || document.body).appendChild(el);
    }
    return el;
  }
  function isEmpty(node){
    if(!node) return true;
    const txt = (node.textContent || '').trim();
    const hasChild = node.children && node.children.length > 0;
    return !hasChild && txt.length === 0;
  }
  function ensureBottomNav(){
    let nav = document.querySelector('.bottom-nav');
    if(nav) return nav;
    nav = document.createElement('nav');
    nav.className = 'bottom-nav';
    nav.innerHTML = `
      <a class="btn" data-tab="home">בית</a>
      <a class="btn" data-tab="orders">הזמנות</a>
      <a class="btn" data-tab="settings">הגדרות</a>
      <a class="btn" data-tab="analytics">נתונים</a>
    `;
    Object.assign(nav.style, {
      position:'fixed', bottom:'14px', left:'0', right:'0', display:'flex', gap:'10px',
      padding:'0 14px', zIndex:'1000'
    });
    document.body.appendChild(nav);
    return nav;
  }
  function setActive(id){
    document.querySelectorAll('.bottom-nav .btn').forEach(b=>b.classList.remove('active'));
    document.querySelector(`.bottom-nav .btn[data-tab="${id}"]`)?.classList.add('active');
    document.querySelectorAll('.screen').forEach(s=>s.classList.add('hidden'));
    document.getElementById('screen-' + id)?.classList.remove('hidden');
  }
  function ensureHome(){
    let home = document.getElementById('screen-home');
    if(!home){
      home = document.createElement('section');
      home.id = 'screen-home';
      home.className = 'screen';
      document.body.appendChild(home);
    }
    if(isEmpty(home)){
      home.innerHTML = `
        <div style="background:#fff;border-radius:16px;box-shadow:0 8px 24px rgba(15,23,42,.06);padding:16px;margin:16px">
          <h2 style="margin:0 0 6px 0">בית</h2>
          <div style="color:#64748b">המערכת מחוברת לענן. אפשר להתחיל לעבוד מהתפריט למטה</div>
        </div>
      `;
    }
    home.classList.remove('hidden');
    document.querySelectorAll('.screen').forEach(s=>{ if(s.id !== 'screen-home') s.classList.add('hidden'); });
  }
  function init(){
    ensureHome();
    ensureBottomNav();
    if(typeof window.activateTab === 'function'){ window.activateTab('home'); }
    else { setActive('home'); }
    setTimeout(()=>{
      const h = document.getElementById('screen-home');
      if(h && h.classList.contains('hidden')){
        h.classList.remove('hidden');
        if(typeof window.activateTab === 'function'){ window.activateTab('home'); } else { setActive('home'); }
      }
    }, 600);
  }
  if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
