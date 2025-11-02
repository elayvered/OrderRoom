const view = document.getElementById('view');
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
  const res = await fetch('./data/orderroom-suppliers-seed/suppliers.json',{cache:'no-store'}).catch(()=>null);
  let items = [];
  if(res && res.ok){
    const data = await res.json();
    items = (Array.isArray(data)?data:[]).map(s=>`
      <div class="row" style="justify-content:space-between;border:1px solid var(--line);border-radius:12px;padding:12px;background:#0f1730">
        <div><strong>${s.name}</strong><div class="badge">${(s.branchTargets||[]).join(' · ')||'—'}</div></div>
        <div class="badge mono">${(s.orderDays||[]).join(', ')||'—'}</div>
      </div>`);
  }
  view.innerHTML = card('ספקים (מ־seed)', `<div class="list">${items.join('')||'<div>אין נתונים</div>'}</div>`);
}

function renderOrders(){
  view.innerHTML = card('הזמנות', '<div class="list"><div>כאן יוצגו הזמנות.</div></div>');
}
function renderHistory(){
  view.innerHTML = card('היסטוריה', '<div class="list"><div>כאן תוצג היסטוריה.</div></div>');
}
function renderSettings(){
  view.innerHTML = card('הגדרות', '<div class="list"><div>כאן יגיע מסך ההגדרות.</div></div>');
}

function render(route){
  setActive(route);
  if(route==='home') return renderHome();
  if(route==='orders') return renderOrders();
  if(route==='history') return renderHistory();
  return renderSettings();
}

document.querySelectorAll('.dock-btn').forEach(btn=>{
  btn.addEventListener('click', e=>{
    const r = btn.dataset.route;
    if(!routes.includes(r)) return;
    render(r);
    window.scrollTo({top:0,behavior:'smooth'});
  }, {passive:true});
});

render('home'); // first paint
