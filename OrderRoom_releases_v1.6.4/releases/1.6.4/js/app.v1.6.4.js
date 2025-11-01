
const $=(s,e=document)=>e.querySelector(s), $$=(s,e=document)=>[...e.querySelectorAll(s)];
const DAY=['א','ב','ג','ד','ה','ו','ש'];
const CFG_KEY='or_cfg_v164', ORD_KEY='or_orders_v164', UI_KEY='or_ui_v164';

function read(k,d){ try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch(e){return d} }
function write(k,v){ localStorage.setItem(k, JSON.stringify(v)) }

let CFG=null, currentSupplierId=null, currentDeliverDow=null, currentBranch=null, freeLines=[];

function nowLabel(){ const d=new Date(); return 'יום '+DAY[d.getDay()]+' • '+d.toLocaleDateString('he-IL') }
function supplierById(id){ return (CFG.suppliers||[]).find(s=>s.id===id) }
function suppliersToOrderToday(){ const g=new Date().getDay(); return (CFG.suppliers||[]).filter(s=> s.dayPairs?.some(p=>p.order===g)) }
function suppliersArrivingToday(){ const g=new Date().getDay(); return (CFG.suppliers||[]).filter(s=> s.dayPairs?.some(p=>p.deliver===g)) }

function setView(v){
  $$('.view').forEach(x=>x.classList.remove('active'));
  const view = $('#view-'+v); if(view) view.classList.add('active');
  $$('.tab').forEach(t=>t.classList.toggle('active', t.dataset.view===v));
  if(v==='home') renderHome();
  if(v==='orders') initOrderForm();
  if(v==='history') renderHistory();
  if(v==='settings') renderSettingsList();
}
document.addEventListener('click', e=>{
  const t=e.target.closest('.tab'); if(t) setView(t.dataset.view);
});

async function loadConfig(){
  try{
    const r=await fetch('./data/suppliers.json?v='+Date.now()); const j=await r.json();
    const merged=read(CFG_KEY,j); if(!localStorage.getItem(CFG_KEY)) write(CFG_KEY, merged);
    CFG=read(CFG_KEY,j);
  }catch(e){ CFG=read(CFG_KEY,{suppliers:[]}); }
  const ui=read(UI_KEY,{});
  if(ui.supplier) currentSupplierId=ui.supplier;
  if(ui.branch) currentBranch=ui.branch;
}
function persistUI(){ write(UI_KEY, {supplier:currentSupplierId, branch:currentBranch}) }

function renderHome(){
  $('#home-date').textContent = nowLabel();
  const enter=$('#home-to-enter'); enter.innerHTML='';
  suppliersToOrderToday().forEach(s=>{
    const r=document.createElement('div'); r.className='row';
    r.innerHTML=`<div><strong>${s.name}</strong><div class="small">לחיצה תפתח הזמנה</div></div><button class="btn">פתח</button>`;
    r.querySelector('.btn').onclick=()=>openOrderFor(s.id);
    r.onclick=e=>{ if(e.target.tagName!=='BUTTON') openOrderFor(s.id) };
    enter.appendChild(r);
  });
  if(!enter.children.length) enter.innerHTML='<div class="small">אין ספקים להגשה היום</div>';

  const arr=$('#home-arrivals'); arr.innerHTML='';
  suppliersArrivingToday().forEach(s=>{
    const r=document.createElement('div'); r.className='row';
    r.innerHTML=`<div><strong>${s.name}</strong><div class="small">אספקה צפויה היום</div></div>`;
    arr.appendChild(r);
  });
  if(!arr.children.length) arr.innerHTML='<div class="small">אין אספקות</div>';

  const recent=read(ORD_KEY,[]).slice(0,10);
  const list=$('#home-recent'); list.innerHTML='';
  recent.forEach(o=>{
    const d=new Date(o.created_at);
    const row=document.createElement('div'); row.className='row';
    row.innerHTML=`<div>${d.toLocaleDateString('he-IL')}</div><div class="small">${o.supplier_name} • ${o.branch_name||''}</div>`;
    list.appendChild(row);
  });
  if(!list.children.length) list.innerHTML='<div class="small">אין הזמנות קודמות</div>';
}

function defaultDeliverDayFor(id){
  const g=new Date().getDay(); const s=supplierById(id);
  const p=s?.dayPairs?.find(p=>p.order===g); return p? p.deliver : g;
}
function labelDeliver(dow){ return 'יום '+DAY[dow] }

function initOrderForm(){
  if(!currentSupplierId && (CFG.suppliers||[])[0]) currentSupplierId=CFG.suppliers[0].id;
  openOrderFor(currentSupplierId);
  $('#btn-change-supplier').onclick=openSupplierPicker;
  $('#btn-open-delivery').onclick=()=> openModal('#deliver-modal', true);
  $('#deliver-close').onclick=()=> closeModal('#deliver-modal');
  $('#free-add').onclick=()=> addFreeLine();
  $('#item-search').oninput=(e)=> filterItems(e.target.value);
  $('#btn-save').onclick=()=>{ const s=supplierById(currentSupplierId); saveOrder(s) };
  $('#btn-send').onclick=()=>{ const s=supplierById(currentSupplierId); sendOrderFlow(s) };
}

function openModal(sel, lock=false){
  const m=$(sel); if(!m) return;
  m.style.display='flex';
  if(lock) document.body.style.overflow='hidden';
}
function closeModal(sel){
  const m=$(sel); if(!m) return;
  m.style.display='none';
  document.body.style.overflow='auto';
}

function openSupplierPicker(){
  openModal('#supplier-modal', true);
  const g=$('#supplier-grid'); g.innerHTML='';
  (CFG.suppliers||[]).forEach(s=>{
    const card=document.createElement('div'); card.className='supplier-card';
    card.innerHTML=`<div><strong>${s.name}</strong><div class="small">${s.phone||s.email||''}</div></div><span>›</span>`;
    card.onclick=()=>{ closeModal('#supplier-modal'); currentSupplierId=s.id; persistUI(); openOrderFor(s.id) };
    g.appendChild(card);
  });
  $('#supplier-close').onclick=()=> closeModal('#supplier-modal');
}

function openOrderFor(id){
  freeLines=[];
  const s=supplierById(id); if(!s) return;
  currentSupplierId=id; persistUI();
  $('#orders-supplier-name').textContent=s.name;

  // Branch segmented
  const bt=$('#branch-toggle'); bt.innerHTML='';
  const branches=[];
  if(s.branches?.hills) branches.push({id:'hills',name:'הילס',address:'אריק איינשטיין 3, הרצליה'});
  if(s.branches?.nord)  branches.push({id:'nord', name:'נורדאו', address:'נורדאו 4, הרצליה'});
  if(!currentBranch) currentBranch = branches[0]||null;
  const seg=document.createElement('div'); seg.className='segmented';
  branches.forEach((b)=>{
    const btn=document.createElement('button'); btn.textContent=b.name;
    if(currentBranch && b.id===currentBranch.id) btn.classList.add('active');
    btn.onclick=()=>{ currentBranch=b; persistUI(); $$('#branch-toggle .segmented button').forEach(x=>x.classList.remove('active')); btn.classList.add('active'); showLastQtyHints(); };
    seg.appendChild(btn);
  });
  bt.appendChild(seg);

  // Delivery default and chips
  currentDeliverDow = defaultDeliverDayFor(id);
  $('#deliver-label').textContent=labelDeliver(currentDeliverDow);
  const chips=$('#deliver-chips'); chips.innerHTML='';
  DAY.forEach((d,i)=>{
    const b=document.createElement('button'); b.textContent='יום '+d;
    if(i===currentDeliverDow) b.classList.add('active');
    b.onclick=()=>{ currentDeliverDow=i; $('#deliver-label').textContent=labelDeliver(currentDeliverDow); closeModal('#deliver-modal'); $$('#deliver-chips button').forEach(x=>x.classList.remove('active')); b.classList.add('active') };
    chips.appendChild(b);
  });

  // Items render
  const list=$('#items-list'); list.innerHTML=''; list.dataset.count = (s.items||[]).length;
  (s.items||[]).forEach(it=>{
    const row=document.createElement('div'); row.className='item-row'; row.dataset.id=it.id; row.dataset.name=it.name;
    row.innerHTML=`<div><div class="item-title">${it.name}</div><div class="small" data-last="${it.name}"></div></div>
      <div class="qty"><input type="number" inputmode="numeric" min="0" step="1" placeholder="0"><span class="small">${it.unit||''}</span></div>`;
    list.appendChild(row);
  });
  showLastQtyHints();
  $('#item-search').value='';
}

function showLastQtyHints(){
  const s=supplierById(currentSupplierId); if(!s) return;
  const orders=read(ORD_KEY,[]);
  const last=orders.find(o=> o.supplier_id===s.id && (currentBranch? o.branch_id===currentBranch.id : true));
  const map=new Map((last?.items||[]).map(i=>[i.name,i.qty]));
  $$('#items-list .item-row').forEach(r=>{
    const name=r.dataset.name;
    const el=r.querySelector('[data-last]');
    el.textContent = map.has(name)? 'כמות אחרונה: '+map.get(name) : '';
  });
}

function filterItems(q){
  q=(q||'').trim();
  $$('#items-list .item-row').forEach(r=>{
    const show = !q || r.dataset.name.includes(q);
    r.style.display = show? '' : 'none';
  });
}

function addFreeLine(){
  const name=$('#free-name').value.trim();
  const qty = Number($('#free-qty').value);
  if(!name || !(qty>0)) { alert('השלם שם וכמות'); return }
  freeLines.push({name, qty});
  $('#free-name').value=''; $('#free-qty').value='';
  alert('נוסף');
}

function collectPicked(){
  const out=[];
  $$('#items-list .item-row').forEach(r=>{
    const q=Number(r.querySelector('input').value);
    if(q>0) out.push({name:r.dataset.name, qty:q});
  });
  return out.concat(freeLines);
}
function buildOrder(s){
  return {
    id:String(Date.now()), created_at:new Date().toISOString(),
    supplier_id:s.id, supplier_name:s.name,
    branch_id:currentBranch?.id||null, branch_name:currentBranch?.name||null, branch_address:currentBranch?.address||null,
    deliver_dow: currentDeliverDow, items: collectPicked(), notes: $('#order-notes').value||''
  };
}
function orderText(o){
  const d=new Date(o.created_at);
  const lines=[
    `הזמנת סחורה - סושי רום - ${o.supplier_name}`,
    `תאריך הזמנה: יום ${DAY[d.getDay()]} ${d.toLocaleDateString('he-IL')}`,
    `יום אספקה: יום ${DAY[o.deliver_dow??d.getDay()]}`,
    o.branch_name? `סניף: ${o.branch_name}${o.branch_address? ' – '+o.branch_address: ''}`: null,
    'פירוט הזמנה -',
    ...o.items.map(p=> `• ${p.name} – ${p.qty}`),
    o.notes||null, '', 'אודה לאישורכם בהודעה חוזרת'
  ].filter(Boolean);
  return lines.join('\n');
}
function saveOrder(s){
  const items=collectPicked(); if(!items.length){ alert('לא נבחרו פריטים'); return }
  const o=buildOrder(s); const all=read(ORD_KEY,[]); all.unshift(o); write(ORD_KEY,all); setView('history');
}
function sendOrderFlow(s){
  const items=collectPicked(); if(!items.length){ alert('לא נבחרו פריטים'); return }
  const o=buildOrder(s); const all=read(ORD_KEY,[]); all.unshift(o); write(ORD_KEY,all);
  const text=orderText(o);
  const phone=(s.phone||'').replace(/[^+\d]/g,''); const email=(s.email||'').trim();
  $('#send-desc').textContent='בחר דרך שליחה';
  const wa=$('#send-whatsapp'), em=$('#send-email');
  wa.style.display= phone? 'inline-flex':'none';
  em.style.display= email? 'inline-flex':'none';
  $('#send-copy').onclick=()=>{ navigator.clipboard.writeText(text); alert('הועתק') };
  if(phone) $('#send-whatsapp').onclick=()=> window.open('https://wa.me/'+encodeURIComponent(phone)+'?text='+encodeURIComponent(text),'_blank');
  if(email) $('#send-email').onclick=()=> location.href='mailto:'+encodeURIComponent(email)+'?subject='+encodeURIComponent('הזמנת סחורה')+'&body='+encodeURIComponent(text);
  $('#send-close').onclick=()=> closeModal('#send-modal');
  openModal('#send-modal', true);
}

// History filter
function renderHistory(){
  const list=$('#history-list'); list.innerHTML='';
  const data=read(ORD_KEY,[]);
  const fs=($('#hist-filter-supplier')?.value||'').trim();
  const fi=($('#hist-filter-item')?.value||'').trim();
  data.filter(o=>{
    const okS = !fs || (o.supplier_name||'').includes(fs);
    const okI = !fi || (o.items||[]).some(it=>(it.name||'').includes(fi));
    return okS && okI;
  }).forEach(o=>{
    const d=new Date(o.created_at);
    const r=document.createElement('div'); r.className='row';
    r.innerHTML=`<div>${d.toLocaleDateString('he-IL')}</div><div class="small">${o.supplier_name} • ${o.branch_name||''} • יום אספקה: יום ${DAY[o.deliver_dow??d.getDay()]}</div>`;
    list.appendChild(r);
  });
  if(!list.children.length) list.innerHTML='<div class="small">אין הזמנות</div>';
}

// SETTINGS UI
function renderSettingsList(){
  const wrap = $('#settings-supplier-list');
  wrap.innerHTML='';
  (CFG.suppliers||[]).forEach(s=>{
    const row=document.createElement('div'); row.className='row';
    row.innerHTML=`<div><div><strong>${s.name}</strong></div><div class="small">${[s.phone,s.email].filter(Boolean).join(' · ')}</div></div>
      <div style="display:flex;gap:8px">
        <button class="btn" data-act="items">ניהול פריטים</button>
        <button class="btn primary" data-act="edit">ערוך ספק</button>
      </div>`;
    row.querySelector('[data-act="edit"]').onclick=()=> openEditSupplier(s.id);
    row.querySelector('[data-act="items"]').onclick=()=> openItemsEditor(s.id);
    wrap.appendChild(row);
  });
  $('#btn-export').onclick=()=>{
    const a=document.createElement('a');
    const blob = new Blob([JSON.stringify(CFG,null,2)], {type:'application/json'});
    a.href=URL.createObjectURL(blob); a.download='order-room-config.json'; a.click();
  };
  $('#import-file').onchange=(e)=>{
    const f = e.target.files[0]; if(!f) return;
    const r=new FileReader();
    r.onload=()=>{ try{ CFG=JSON.parse(r.result); write(CFG_KEY, CFG); alert('נטען בהצלחה'); }catch(err){ alert('כשל בקריאה') } };
    r.readAsText(f,'utf-8');
  };
}

function openEditSupplier(id){
  const s = supplierById(id); if(!s) return;
  openModal('#settings-supplier-modal', true);
  const box = $('#settings-supplier-form');
  box.innerHTML = '';
  const f = document.createElement('div');
  f.innerHTML = `
    <div class="row"><div>שם ספק</div><input id="sup-name" class="btn" value="${s.name||''}"></div>
    <div class="row"><div>טלפון (וואטסאפ)</div><input id="sup-phone" class="btn" value="${s.phone||''}"></div>
    <div class="row"><div>אימייל</div><input id="sup-email" class="btn" value="${s.email||''}"></div>
    <div class="row"><div>סניפים</div>
      <div class="segmented">
        <button id="b-hills" class="${s.branches?.hills?'active':''}">הילס</button>
        <button id="b-nord" class="${s.branches?.nord?'active':''}">נורדאו</button>
      </div>
    </div>
    <div class="row"><div>ימי הזמנה → ימי אספקה</div><div id="daypairs"></div></div>
  `;
  box.appendChild(f);

  // Build dayPairs editor (simple checkboxes rows)
  const dp = $('#daypairs'); dp.innerHTML='';
  const map = new Map((s.dayPairs||[]).map(p=>[p.order, p.deliver]));
  for(let i=0;i<7;i++){
    const deliver = map.has(i)? map.get(i): '';
    const row=document.createElement('div'); row.className='row';
    const sel = document.createElement('select');
    sel.innerHTML = '<option value="">—</option>' + DAY.map((d,idx)=> `<option value="${idx}" ${deliver===idx?'selected':''}>יום ${d}</option>`).join('');
    row.innerHTML = `<div>יום הזמנה: יום ${DAY[i]}</div>`;
    row.appendChild(sel);
    dp.appendChild(row);
  }

  $('#btn-supplier-save').onclick=()=>{
    s.name = $('#sup-name').value.trim();
    s.phone= $('#sup-phone').value.trim();
    s.email= $('#sup-email').value.trim();
    s.branches = {hills: $('#b-hills').classList.contains('active'), nord: $('#b-nord').classList.contains('active')};
    // collect dayPairs
    const rows = [...dp.querySelectorAll('select')];
    s.dayPairs = rows.map((sel,idx)=> ({order:idx, deliver: sel.value===''? null : Number(sel.value)})).filter(p=>p.deliver!==null);
    write(CFG_KEY, CFG);
    closeModal('#settings-supplier-modal'); renderSettingsList();
  };
  $('#btn-supplier-cancel').onclick=()=> closeModal('#settings-supplier-modal');

  $('#b-hills').onclick = (e)=> e.target.classList.toggle('active');
  $('#b-nord').onclick  = (e)=> e.target.classList.toggle('active');
}

function openItemsEditor(id){
  const s=supplierById(id); if(!s) return;
  openModal('#items-editor-modal', true);
  const body = $('#items-editor-body'); body.innerHTML='';
  (s.items||[]).forEach((it,idx)=>{
    const row = document.createElement('div'); row.className='edit-grid';
    row.innerHTML = `
      <input class="btn" data-k="name" value="${it.name||''}">
      <input class="btn" data-k="unit" value="${it.unit||''}" placeholder="יחידה">
      <input class="btn" data-k="price" value="${it.price||''}" placeholder="מחיר">
      <div style="display:flex;gap:6px">
        <button class="icon-btn" data-act="up">↑</button>
        <button class="icon-btn" data-act="down">↓</button>
      </div>`;
    row.dataset.idx = idx;
    body.appendChild(row);
  });
  $('#btn-items-save').onclick=()=>{
    const rows = [...body.querySelectorAll('.edit-grid')];
    s.items = rows.map(r=>{
      const vals = {};
      r.querySelectorAll('input').forEach(inp=> vals[inp.dataset.k]=inp.value);
      return {id:String(Math.random()).slice(2), name:vals.name||'', unit:vals.unit||'', price:vals.price||''};
    });
    write(CFG_KEY, CFG);
    closeModal('#items-editor-modal');
  };
  $('#btn-items-cancel').onclick=()=> closeModal('#items-editor-modal');

  body.addEventListener('click', (e)=>{
    const btn = e.target.closest('button'); if(!btn) return;
    const row = e.target.closest('.edit-grid'); if(!row) return;
    const idx = [...body.children].indexOf(row);
    if(btn.dataset.act==='up' && idx>0){
      body.insertBefore(row, body.children[idx-1]);
    }else if(btn.dataset.act==='down' && idx < body.children.length-1){
      body.insertBefore(body.children[idx+1], row);
    }
  });
}

// Filters in history
document.addEventListener('input', (e)=>{
  if(e.target.id==='hist-filter-supplier' || e.target.id==='hist-filter-item') renderHistory();
});

// Boot
document.addEventListener('DOMContentLoaded', async ()=>{
  await loadConfig();
  setView('home');
  const verEl = document.getElementById('ver'); if(verEl) verEl.textContent = 'v'+(window.APP_VER||'1');
});
