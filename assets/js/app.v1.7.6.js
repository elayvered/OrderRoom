const view = document.getElementById('view');
const dock = document.getElementById('dock');
const routes = ['home','orders','history','settings'];

function setActive(route){
  document.querySelectorAll('.dock-btn').forEach(btn=>{
    const on = btn.dataset.route===route;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-selected', on ? 'true':'false');
  });
}

function card(title, inner=''){
  return `<section class="card"><div class="row"><h2>${title}</h2></div>${inner}</section>`;
}

async function renderHome(){
  let body = '';
  try{
    const res = await fetch('./data/orderroom-suppliers-seed/suppliers.json',{cache:'no-store'});
    const data = await res.json();
    const list = (Array.isArray(data)?data:[]).map(s=>`
      <div class="row" style="justify-content:space-between;border:1px solid var(--line);border-radius:12px;padding:12px;background:#0f1730">
        <div><strong>${s.name}</strong><div class="badge">${(s.branchTargets||[]).join(' · ')||'—'}</div></div>
        <div class="badge mono">${(s.orderDays||[]).join(', ')||'—'}</div>
      </div>`).join('');
    body = `<div class="list">${list||'<div>אין נתונים</div>'}</div>`;
  }catch(e){
    body = '<div class="card">⚠️ לא נמצא seed בנתיב data/orderroom-suppliers-seed/suppliers.json</div>';
  }
  view.innerHTML = card('ספקים (מ־seed)', body);
}

function renderOrders(){ view.innerHTML = card('הזמנות','<div class="list"><div>כאן יוצגו הזמנות.</div></div>'); }
function renderHistory(){ view.innerHTML = card('היסטוריה','<div class="list"><div>כאן תוצג היסטוריה.</div></div>'); }
function renderSettings(){ view.innerHTML = card('הגדרות','<div class="list"><div>כאן יגיע מסך ההגדרות.</div></div>'); }

function render(route){
  if(!routes.includes(route)) route='home';
  setActive(route);
  if(route==='home') return renderHome();
  if(route==='orders') return renderOrders();
  if(route==='history') return renderHistory();
  return renderSettings();
}

// Primary nav function (also used by inline onclick fallback)
window._nav = function(route){
  render(route);
  try{ view.focus({preventScroll:true}); window.scrollTo({top:0,behavior:'smooth'}); }catch{}
};

// Event delegation as a robust fallback
dock.addEventListener('click', (e)=>{
  const btn = e.target.closest('.dock-btn');
  if(!btn) return;
  const route = btn.dataset.route;
  if(route) window._nav(route);
}, {passive:true});

// First paint
window._nav('home');
