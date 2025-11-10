
import { SUPPLIERS, BRANCHES, HEB_DAYS, suppliersToOrderToday, deliveriesTodayByBranch, defaultDeliveryDay } from './data.js';

// State
const state = {
  supplierId: null,
  branch: null,
  deliveryDay: null,
  units: {}, // {itemKey: {qty:0, mode:'unit'|'carton', unitsPerCarton:0}}
};

const $ = (s)=>document.querySelector(s);
const $$ = (s)=>document.querySelectorAll(s);

function todayName(){
  const d=new Date().getDay(); // 0=Sun
  return HEB_DAYS[d];
}

function mountHome(){
  $('#view-home').classList.remove('hidden');
  $('#view-order').classList.add('hidden');

  const t = todayName();

  // order today grid
  const list = suppliersToOrderToday(t);
  $('#orderToday').innerHTML = list.map(s=>`<div class="sup-chip" data-open="${s.id}">${s.name}</div>`).join('') || '<div class="small">אין ספקים מוגדרים ליום זה</div>';

  // deliveries today by branch
  const per = deliveriesTodayByBranch(t);
  $('#deliverHills').innerHTML = per['הילס'].map(s=>`<div class="sup-chip" data-open="${s.id}">${s.name}</div>`).join('') || '<div class="small">—</div>';
  $('#deliverNordau').innerHTML = per['נורדאו'].map(s=>`<div class="sup-chip" data-open="${s.id}">${s.name}</div>`).join('') || '<div class="small">—</div>';

  // click to open order
  $$('#view-home [data-open]').forEach(el=>el.addEventListener('click', (e)=>{
    startOrder(el.getAttribute('data-open'));
  }));
}

function startOrder(supplierId){
  const s = SUPPLIERS.find(x=>x.id===supplierId);
  state.supplierId = supplierId;
  // branch default first allowed
  state.branch = (s.allowedBranches && s.allowedBranches[0]) || BRANCHES[0];
  // default delivery day per rule
  state.deliveryDay = defaultDeliveryDay(supplierId, todayName());
  state.units = {};
  renderOrderHeader();
  renderItems();
  $('#view-home').classList.add('hidden');
  $('#view-order').classList.remove('hidden');
}

function renderOrderHeader(){
  const s = SUPPLIERS.find(x=>x.id===state.supplierId);
  if (!s) return;
  $('#supplierBtn').textContent = s.name;
  $('#branchBtn').textContent = state.branch;
  $('#dayBtn').textContent = state.deliveryDay;
}

function renderItems(){
  const s = SUPPLIERS.find(x=>x.id===state.supplierId);
  if (!s) { $('#itemsList').innerHTML=''; return;}
  const items = (s.items||[]).map(it => typeof it === 'string' ? {name:it} : it);
  $('#itemsList').innerHTML = items.map((it,idx)=>{
    const key = `${idx}`;
    const rec = state.units[key] || {qty:0, mode:'unit', unitsPerCarton:0};
    return `
      <div class="card">
        <div class="row" style="justify-content:space-between">
          <div style="font-weight:800">${it.name}</div>
          <div class="qty-row">
            <input class="qty" inputmode="numeric" pattern="[0-9]*" type="number" min="0" value="${rec.qty||0}" data-key="${key}" />
            <div class="unit-toggle">
              <button class="${rec.mode==='carton'?'active':''}" data-umode="carton" data-key="${key}">קרטון</button>
              <button class="${rec.mode==='unit'?'active':''}" data-umode="unit" data-key="${key}">יח'</button>
            </div>
          </div>
        </div>
        <div class="row small">
          <span>יחידות בקרטון:</span>
          <input style="width:90px;margin-inline-start:6px" class="qty" type="number" min="0" value="${rec.unitsPerCarton||0}" data-key="${key}" data-upc="1" />
          ${it.cartonOnly ? '<span style="color:#e11d48;font-weight:800;margin-inline-start:8px">* הזמנה בקרטון בלבד</span>' : ''}
        </div>
      </div>
    `;
  }).join('');

  // listeners
  $$('#itemsList .qty').forEach(inp=>{
    inp.addEventListener('input', e=>{
      const key = e.target.getAttribute('data-key');
      const upc = e.target.hasAttribute('data-upc');
      state.units[key] = state.units[key] || {qty:0, mode:'unit', unitsPerCarton:0};
      if (upc) state.units[key].unitsPerCarton = Math.max(0, parseInt(e.target.value||'0',10));
      else state.units[key].qty = Math.max(0, parseInt(e.target.value||'0',10));
    });
  });
  $$('#itemsList [data-umode]').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const key = btn.getAttribute('data-key');
      const mode = btn.getAttribute('data-umode');
      state.units[key] = state.units[key] || {qty:0, mode:'unit', unitsPerCarton:0};
      state.units[key].mode = mode;
      renderItems();
    });
  });
}

// ---------- Popovers ----------
function openSuppliersPop(anchor){
  const pop = $('#pop-suppliers');
  const rect = anchor.getBoundingClientRect();
  const list = SUPPLIERS;
  // two columns
  pop.innerHTML = `<div class="grid-2">` + list.map(s=>`<div class="sup-chip" data-pick="${s.id}">${s.name}</div>`).join('') + `</div>`;
  pop.style.top = (rect.bottom + window.scrollY + 8) + 'px';
  pop.style.right = (document.body.clientWidth - rect.right) + 'px';
  pop.classList.remove('hidden');

  pop.querySelectorAll('[data-pick]').forEach(el=>el.addEventListener('click', ()=>{
    startOrder(el.getAttribute('data-pick'));
    closeAllPops();
  }));
}
function openDayPop(anchor){
  const s = SUPPLIERS.find(x=>x.id===state.supplierId);
  const allowed = s?.deliveryLockedDays?.length ? s.deliveryLockedDays : HEB_DAYS;
  const pop = $('#pop-day');
  const rect = anchor.getBoundingClientRect();
  pop.innerHTML = `<div class="row">` + allowed.map(d=>`<div class="sup-chip" data-day="${d}">${d}</div>`).join('') + `</div>`;
  pop.style.top = (rect.bottom + window.scrollY + 8) + 'px';
  pop.style.right = (document.body.clientWidth - rect.right) + 'px';
  pop.classList.remove('hidden');
  pop.querySelectorAll('[data-day]').forEach(el=>el.addEventListener('click', ()=>{
    state.deliveryDay = el.getAttribute('data-day');
    $('#dayBtn').textContent = state.deliveryDay;
    closeAllPops();
  }));
}
function openSendPop(anchor){
  const pop = $('#pop-send');
  const rect = anchor.getBoundingClientRect();
  pop.style.top = (rect.top + window.scrollY - pop.offsetHeight - 8) + 'px';
  pop.style.right = (document.body.clientWidth - rect.right) + 'px';
  pop.classList.remove('hidden');
}

function closeAllPops(){
  ['#pop-suppliers','#pop-day','#pop-send'].forEach(s=>$(s).classList.add('hidden'));
}
document.addEventListener('click', (e)=>{
  const pops = ['pop-suppliers','pop-day','pop-send'];
  if (!pops.some(id => e.target.closest('#'+id)) && !e.target.closest('#supplierBtn') && !e.target.closest('#dayBtn') && !e.target.closest('#sendBtn')){
    closeAllPops();
  }
});

// ---------- Actions ----------
$('#supplierBtn').addEventListener('click', (e)=>openSuppliersPop(e.currentTarget));
$('#dayBtn').addEventListener('click', (e)=>openDayPop(e.currentTarget));
$('#saveBtn').addEventListener('click', saveOrder);
$('#sendBtn').addEventListener('click', e=>openSendPop(e.currentTarget));

$('#pop-send').addEventListener('click', (e)=>{
  const btn = e.target.closest('[data-send]'); if (!btn) return;
  const mode = btn.getAttribute('data-send');
  const txt = buildOrderMessage();
  if (mode==='copy'){
    navigator.clipboard.writeText(txt);
    alert('ההזמנה הועתקה');
  } else if (mode==='whatsapp'){
    const s = SUPPLIERS.find(x=>x.id===state.supplierId);
    const phone = (s && s.phone) ? s.phone.replace('+','') : '';
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(txt)}`;
    window.open(url,'_blank');
  } else if (mode==='email'){
    const s = SUPPLIERS.find(x=>x.id===state.supplierId);
    const subject = encodeURIComponent(`הזמנה – ${s?.name||''}`);
    const url = `mailto:${s?.email||''}?subject=${subject}&body=${encodeURIComponent(txt)}`;
    window.location.href = url;
  }
  closeAllPops();
});

function buildOrderMessage(){
  const s = SUPPLIERS.find(x=>x.id===state.supplierId);
  const branch = state.branch;
  const arr = [];
  const items = (s.items||[]).map(it => typeof it === 'string' ? {name:it} : it);
  items.forEach((it,idx)=>{
    const rec = state.units[`${idx}`];
    if (rec && rec.qty>0){
      const line = `${it.name} – ${rec.qty} ${rec.mode==='carton'?'קרטון':'יח'}`;
      arr.push(line);
    }
  });
  const today = new Date();
  const dayName = HEB_DAYS[today.getDay()];
  return [
    `הזמנת סחורה – סושי רום – ${s?.name||''}`,
    `סניף: ${branch} | יום אספקה: ${state.deliveryDay}`,
    `יום הזמנה: ${dayName}`,
    ``,
    `פירוט הזמנה:`,
    ...(arr.length?arr:['— ללא פריטים —']),
    ``,
    `אודה לאישורכם בהודעה חוזרת`
  ].join('\n');
}

function saveOrder(){
  const s = SUPPLIERS.find(x=>x.id===state.supplierId);
  const payload = {
    supplierId: state.supplierId,
    supplier: s?.name,
    branch: state.branch,
    deliveryDay: state.deliveryDay,
    notes: $('#notes').value||'',
    units: state.units,
    ts: Date.now()
  };
  const hist = JSON.parse(localStorage.getItem('or_history')||'[]');
  hist.unshift(payload);
  localStorage.setItem('or_history', JSON.stringify(hist));
  alert('ההזמנה נשמרה');
}

// menu button -> go home
$('#menuBtn').addEventListener('click', ()=>{
  mountHome();
});

// init
mountHome();
