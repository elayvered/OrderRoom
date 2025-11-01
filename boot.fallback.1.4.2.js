// boot.fallback.1.4.2.js
;(function(){
  const candidates = [
    'app.1.4.0.js',
    'app.1.3.1.js',
    'app.js',
    'script.js'
  ];

  function loadCandidate(i){
    if(i>=candidates.length){ ensureUI(); return; }
    const s = document.createElement('script');
    s.src = './' + candidates[i] + '?v=1.4.2';
    s.defer = true;
    s.onload = () => { console.log('Loaded app script:', candidates[i]); setTimeout(()=> ensureUI(), 400); };
    s.onerror = () => loadCandidate(i+1);
    document.body.appendChild(s);
  }

  function ensureUI(){
    // אם אין UI, נבנה מסך בסיס כדי למנוע דף לבן
    if(document.querySelector('.screen')) return;

    const style = document.createElement('style');
    style.textContent = `
      :root{ --bg:#f8fafc; --card:#ffffff; --ink:#0f172a; --muted:#64748b; --accent:#111827 }
      body{ margin:0; background:var(--bg); color:var(--ink); font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial }
      .topbar{ display:flex; align-items:center; justify-content:space-between; padding:14px 16px }
      .brand{ display:flex; align-items:center; gap:10px; font-weight:800; }
      .brand .dot{ width:10px; height:10px; border-radius:50%; background:var(--accent) }
      .screen{ padding:16px }
      .card{ background:var(--card); border-radius:16px; box-shadow:0 8px 24px rgba(15,23,42,.06); padding:16px; }
      .bottom-nav{ position:fixed; inset-inline:0; bottom:14px; display:flex; gap:10px; padding:0 14px; z-index:1000 }
      .bottom-nav .btn{ flex:1; padding:12px 14px; background:var(--card); border:1px solid #e5e7eb; border-radius:16px; text-align:center; font-weight:700; cursor:pointer; box-shadow:0 4px 18px rgba(2,6,23,.06) }
      .bottom-nav .btn.active{ background:var(--accent); color:#fff; border-color:var(--accent) }
      .hidden{ display:none !important }
    `;
    document.head.appendChild(style);

    const root = document.getElementById('app-root');
    root.innerHTML = `
      <header class="topbar">
        <div class="brand"><span class="dot"></span> Order Room</div>
        <div><button onclick="window.ORAuth?.open?.()" class="btn-login" style="border:0;background:#0f172a;color:#fff;padding:10px 14px;border-radius:12px">התחבר</button></div>
      </header>
      <main>
        <section id="screen-home" class="screen card">ברוך הבא ל־Order Room. המסך נטען בהצלחה.</section>
        <section id="screen-orders" class="screen card hidden">הזמנות</section>
        <section id="screen-settings" class="screen card hidden">הגדרות</section>
        <section id="screen-analytics" class="screen card hidden">נתונים</section>
      </main>
      <nav class="bottom-nav">
        <a class="btn active" data-tab="home">בית</a>
        <a class="btn" data-tab="orders">הזמנות</a>
        <a class="btn" data-tab="settings">הגדרות</a>
        <a class="btn" data-tab="analytics">נתונים</a>
      </nav>
    `;
    if(typeof window.activateTab==='function'){ window.activateTab('home'); }
  }

  document.addEventListener('DOMContentLoaded', ()=> loadCandidate(0));
})();
