// Order Room v6.2.1-hotfix — drop-in replacement for js/app.js
// Fix: robust merge of Branch + Delivery into the SAME row on Orders view without breaking layout.
// Also: keep the single top-left menu and 'Save/Send' footer behavior from 6.2.1.

const DAY=['א','ב','ג','ד','ה','ו','ש'];
const CFG_KEY='or_cfg_v620', ORD_KEY='or_orders_v620';

const $=(s,e=document)=>e.querySelector(s), $$=(s,e=document)=>[...e.querySelectorAll(s)];
function read(k,d){ try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch(e){return d} }
function write(k,v){ localStorage.setItem(k, JSON.stringify(v)) }

let CFG=null, currentSupplierId=null, currentDeliverDow=null, currentBranch=null;

function nowLabel(){ const d=new Date(); return 'יום '+DAY[d.getDay()]+' • '+d.toLocaleDateString('he-IL') }
function supplierById(id){ return CFG.suppliers.find(s=>s.id===id) }
function suppliersToOrderToday(){ const g=new Date().getDay(); return CFG.suppliers.filter(s=> s.dayPairs?.some(p=>p.order===g)) }
function suppliersArrivingToday(){ const g=new Date().getDay(); return CFG.suppliers.filter(s=> s.dayPairs?.some(p=>p.deliver===g)) }
function setView(v){ $$('.view').forEach(x=>x.classList.remove('active')); const el=$('#view-'+v); if(el) el.classList.add('active'); $$('.tab').forEach(t=>t.classList.toggle('active', t.dataset.view===v)); if(v==='home') renderHome(); if(v==='orders') initOrderForm(); if(v==='history') renderHistory(); if(v==='settings') renderSettingsList(); }

document.addEventListener('click', e=>{ const t=e.target.closest('.tab'); if(t) setView(t.dataset.view); });

async function loadConfig(){
  try{
    const res = await fetch('data/suppliers.json?v='+Date.now());
    const j = await res.json();
    if(!localStorage.getItem(CFG_KEY)) write(CFG_KEY, j);
    CFG = read(CFG_KEY, j);
  }catch(e){ CFG = read(CFG_KEY, {suppliers:[]}); }
}

function injectPatchStyles(){
  const css = `
    .tabbar{display:none !important}
    .or-menu-btn{position:absolute; left:12px; top:10px; z-index:9; border:none; border-radius:12px; padding:10px 12px; background:#101a46; color:#fff; font-weight:800; box-shadow:0 10px 30px rgba(0,0,0,.18)}
    .or-menu-panel{position:absolute; left:12px; top:54px; background:#fff; border:1px solid #e6ecf5; border-radius:14px; box-shadow:0 16px 40px rgba(15,20,35,.14); display:none; overflow:hidden; min-width:180px; z-index:9}
    .or-menu-panel .row{padding:10px 12px; border-bottom:1px solid #eef3fb; cursor:pointer}
    .or-menu-panel .row:last-child{border:none}
    .or-menu-panel .row:hover{background:#f7f9ff}
    .or-menu-ico{height:18px; width:18px; background-size:contain; background-repeat:no-repeat; margin-inline-start:8px; filter:contrast(1.4)}
    .order-footer .badge{display:none !important}
    #view-orders .merged-row{display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap}
    #view-orders .merged-row .merge-box{display:flex; align-items:center; gap:10px; flex-wrap:wrap}
    @media (max-width:480px){
      #view-orders .merged-row{gap:8px}
      #view-orders .merged-row .merge-box{gap:8px}
    }
  `;
  const tag = document.createElement('style'); tag.textContent = css; document.head.appendChild(tag);
}

function mountHamburger(){
  const header = document.querySelector('.or-header');
  if(!header || $('#or-menu-btn')) return;
  const btn = document.createElement('button');
  btn.id='or-menu-btn'; btn.className='or-menu-btn';
  btn.innerHTML = `<span style="display:inline-block; width:18px; height:2px; background:#fff; box-shadow:0 6px 0 #fff, 0 -6px 0 #fff; vertical-align:middle"></span> <span style="margin-inline-start:8px">תפריט</span>`;
  header.appendChild(btn);

  const panel = document.createElement('div');
  panel.className='or-menu-panel'; panel.id='or-menu-panel';
  const mk = (view, label, icon)=>{
    const r=document.createElement('div'); r.className='row';
    r.innerHTML = `<span class="or-menu-ico" style="background-image:url('assets/icons/${icon}.svg')"></span> ${label}`;
    r.onclick=()=>{ panel.style.display='none'; setView(view) };
    panel.appendChild(r);
  };
  mk('home','בית','home'); mk('orders','הזמנות','orders'); mk('history','היסטוריה','history'); mk('settings','הגדרות','settings');
  header.appendChild(panel);

  btn.onclick = ()=>{
    panel.style.display = (panel.style.display==='block') ? 'none' : 'block';
  };
  document.addEventListener('click', (e)=>{
    if(!e.target.closest('#or-menu-panel') && e.target.id!=='or-menu-btn') panel.style.display='none';
  });
}

function renderHome(){
  $('#home-date').textContent = nowLabel();
  const enter=$('#home-to-enter'); if(enter){ enter.innerHTML='';
    suppliersToOrderToday().forEach(s=>{
      const r=document.createElement('div'); r.className='row';
      r.innerHTML = `<div><strong>${s.name}</strong><div class="small">לחץ לפתיחת הזמנה</div></div><button class="btn">פתח</button>`;
      r.querySelector('.btn').onclick=()=>{ setView('orders'); openOrderFor(s.id); };
      r.onclick = (e)=>{ if(e.target.tagName!=='BUTTON'){ setView('orders'); openOrderFor(s.id);} };
      enter.appendChild(r);
    });
    if(!enter.children.length) enter.innerHTML='<div class="small">אין ספקים להגשה היום</div>';
  }

  const arr=$('#home-arrivals'); if(arr){ arr.innerHTML='';
    suppliersArrivingToday().forEach(s=>{
      const r=document.createElement('div'); r.className='row';
      r.innerHTML=`<div><strong>${s.name}</strong><div class="small">אספקה צפויה היום</div></div>`;
      arr.appendChild(r);
    });
    if(!arr.children.length) arr.innerHTML='<div class="small">אין אספקות</div>';
  }

  const list=$('#home-recent'); if(list){ list.innerHTML='';
    const recent=read(ORD_KEY,[]).slice(0,10);
    recent.forEach(o=>{ const d=new Date(o.created_at); const row=document.createElement('div'); row.className='row'; row.innerHTML=`<div>${d.toLocaleDateString('he-IL')}</div><div class="small">${o.supplier_name} • ${o.branch_name||''}</div>`; list.appendChild(row); });
    if(!list.children.length) list.innerHTML='<div class="small">אין הזמנות קודמות</div>';
  }
}

function defaultDeliverDayFor(id){ const g=new Date().getDay(); const s=supplierById(id); const p=s?.dayPairs?.find(p=>p.order===g); return p? p.deliver: g }
function labelDeliver(dow){ return 'יום '+DAY[dow] }

function initOrderForm(){
  if(!currentSupplierId && CFG.suppliers[0]) currentSupplierId=CFG.suppliers[0].id;
  openOrderFor(currentSupplierId);
  const btnChange=$('#btn-change-supplier'); if(btnChange) btnChange.onclick=openSupplierPicker;
  const btnOpenDel=$('#btn-open-delivery'); if(btnOpenDel) btnOpenDel.onclick=()=> $('#deliver-modal').style.display='flex';
  const btnDelClose=$('#deliver-close'); if(btnDelClose) btnDelClose.onclick=()=> $('#deliver-modal').style.display='none';
}

function openSupplierPicker(){
  const box=$('#supplier-modal'); if(!box) return;
  box.style.display='flex';
  const g=$('#supplier-grid'); g.innerHTML='';
  CFG.suppliers.forEach(s=>{
    const card=document.createElement('div'); card.className='supplier-card';
    card.innerHTML=`<div><strong>${s.name}</strong><div class="small">${s.phone||s.email||''}</div></div><span>›</span>`;
    card.onclick=()=>{ box.style.display='none'; currentSupplierId=s.id; openOrderFor(s.id); };
    g.appendChild(card);
  });
  $('#supplier-close').onclick=()=> box.style.display='none';
}

function createMergedRow(){
  const card = $('#view-orders .card');
  if(!card) return;
  let merged = card.querySelector('.merged-row');
  if(!merged){
    merged = document.createElement('div');
    merged.className='row merged-row';
    const title=document.createElement('div');
    title.textContent='סניף + יום אספקה';
    const content=document.createElement('div');
    content.className='merge-box';
    merged.appendChild(title); merged.appendChild(content);
    card.insertBefore(merged, card.firstElementChild);
  }
  const content = merged.querySelector('.merge-box');
  const branchToggle = $('#branch-toggle');
  const deliverBtn = $('#btn-open-delivery');
  if(branchToggle && branchToggle.parentNode!==content) content.appendChild(branchToggle);
  if(deliverBtn && deliverBtn.parentNode!==content) content.appendChild(deliverBtn);
  const branchRow = branchToggle ? branchToggle.closest('.row') : null;
  const deliverRow = deliverBtn ? deliverBtn.closest('.row') : null;
  if(branchRow && branchRow!==merged) branchRow.style.display='none';
  if(deliverRow && deliverRow!==merged) deliverRow.style.display='none';
}

function openOrderFor(id){
  const s=supplierById(id); if(!s) return; currentSupplierId=id;
  const nameSpan=$('#orders-supplier-name'); if(nameSpan) nameSpan.textContent=s.name;

  // branches
  const bt=$('#branch-toggle'); if(bt){ bt.innerHTML='';
    const branches=[]; if(s.branches?.hills) branches.push({id:'hills',name:'הילס',address:'אריק איינשטיין 3, הרצליה'}); if(s.branches?.nord) branches.push({id:'nord',name:'נורדאו',address:'נורדאו 4, הרצליה'});
    currentBranch = branches[0]||null;
    const seg=document.createElement('div'); seg.className='segmented';
    branches.forEach((b,i)=>{ const btn=document.createElement('button'); btn.textContent=b.name; if(i===0) btn.classList.add('active'); btn.onclick=()=>{ currentBranch=b; $$('#branch-toggle .segmented button').forEach(x=>x.classList.remove('active')); btn.classList.add('active'); showLastQtyHints(); }; seg.appendChild(btn); });
    bt.appendChild(seg);
  }

  // delivery default & chips
  currentDeliverDow = defaultDeliverDayFor(id);
  const dl=$('#deliver-label'); if(dl) dl.textContent = labelDeliver(currentDeliverDow);
  const chips=$('#deliver-chips'); if(chips){ chips.innerHTML=''; DAY.forEach((d,i)=>{ const b=document.createElement('button'); b.textContent='יום '+d; if(i===currentDeliverDow) b.classList.add('active'); b.onclick=()=>{ currentDeliverDow=i; const dl2=$('#deliver-label'); if(dl2) dl2.textContent=labelDeliver(currentDeliverDow); $('#deliver-modal').style.display='none'; $$('#deliver-chips button').forEach(x=>x.classList.remove('active')); b.classList.add('active'); }; chips.appendChild(b) }); }

  createMergedRow();

  // items list with unit/carton segmented
  const list=$('#items-list'); if(list){ list.innerHTML='';
    (s.items||[]).forEach(it=>{
      if(it.unitsPerCarton==null) it.unitsPerCarton=1;
      const row=document.createElement('div'); row.className='item-row'; row.dataset.id=it.id; row.dataset.mode='unit';
      row.innerHTML = `<div><div class="item-title">${it.name}</div><div class="small" data-last="${it.name}"></div></div>
        <div class="qty">
          <div class="segmented seg-mini" data-pack>
            <button class="active" data-mode="unit"><img alt="" src="assets/icons/unit.svg" style="height:14px;vertical-align:-2px"> יח'</button>
            <button data-mode="carton"><img alt="" src="assets/icons/box.svg" style="height:14px;vertical-align:-2px"> קרטון</button>
          </div>
          <input type="number" inputmode="numeric" min="0" step="1" placeholder="0">
        </div>`;
      list.appendChild(row);
    });

    $$('#items-list [data-pack]').forEach(pack=>{
      const row=pack.closest('.item-row');
      pack.querySelectorAll('button').forEach(btn=>{
        btn.onclick=()=>{
          pack.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
          btn.classList.add('active');
          row.dataset.mode = btn.dataset.mode;
        };
      });
    });
  }

  function showLastQtyHints(){
    const orders=read(ORD_KEY,[]);
    const last = orders.find(o=> o.supplier_id===s.id && (currentBranch? o.branch_id===currentBranch.id : true));
    const map = new Map((last?.items||[]).map(i=>[i.name, i.qtyLabel||i.qty]));
    $$('#items-list .item-row').forEach(r=>{
      const name=r.querySelector('.item-title').textContent.trim();
      const el=r.querySelector('[data-last]');
      el.textContent = map.has(name)? ('כמות אחרונה: '+map.get(name)) : '';
    });
  }
  showLastQtyHints();

  const saveBtn=$('#btn-save'); if(saveBtn) saveBtn.onclick=()=> saveOrder(s);
  const sendBtn=$('#btn-send'); if(sendBtn) sendBtn.onclick=()=> sendOrderFlow(s);
}

function collectPicked(){
  const out=[];
  const s = supplierById(currentSupplierId);
  $$('#items-list .item-row').forEach(r=>{
    const q = Number(r.querySelector('input').value);
    if(q>0){
      const id=r.dataset.id;
      const meta=(s.items||[]).find(x=>x.id===id) || {unitsPerCarton:1};
      const mode=r.dataset.mode||'unit';
      const unitsPerCarton = Number(meta.unitsPerCarton||1);
      const totalUnits = (mode==='carton')? q*unitsPerCarton : q;
      const qtyLabel = (mode==='carton')? (q+' קרטון ('+totalUnits+' יח׳)') : (q+' יח׳');
      out.push({name:r.querySelector('.item-title').textContent.trim(), qty:q, mode, unitsPerCarton, totalUnits, qtyLabel});
    }
  });
  return out;
}

function buildOrder(s){
  return { id:String(Date.now()), created_at:new Date().toISOString(),
    supplier_id:s.id, supplier_name:s.name,
    branch_id:currentBranch?.id||null, branch_name:currentBranch?.name||null, branch_address:currentBranch?.address||null,
    deliver_dow: currentDeliverDow, items: collectPicked(), notes: $('#order-notes')?.value||'' };
}

function orderText(o){
  const d=new Date(o.created_at);
  const lines=[
    `הזמנת סחורה - סושי רום - ${o.supplier_name}`,
    `תאריך הזמנה: יום ${DAY[d.getDay()]} ${d.toLocaleDateString('he-IL')}`,
    `יום אספקה: יום ${DAY[o.deliver_dow??d.getDay()]}`,
    o.branch_name? `סניף: ${o.branch_name}${o.branch_address? ' – '+o.branch_address: ''}`: null,
    'פירוט הזמנה -',
    ...o.items.map(p=> `• ${p.name} – ${p.qtyLabel}`),
    o.notes||null,
    '', 'אודה לאישורכם בהודעה חוזרת'
  ].filter(Boolean);
  return lines.join('\n');
}

function saveOrder(s){
  const items=collectPicked(); if(!items.length){ alert('לא נבחרו פריטים'); return }
  const o=buildOrder(s);
  const all=read(ORD_KEY,[]); all.unshift(o); write(ORD_KEY,all);
  setView('history');
}

function sendOrderFlow(s){
  const items=collectPicked(); if(!items.length){ alert('לא נבחרו פריטים'); return }
  const o=buildOrder(s);
  const all=read(ORD_KEY,[]); all.unshift(o); write(ORD_KEY,all);
  const text = orderText(o);
  const phone=(s.phone||'').replace(/[^+\d]/g,''); const email=(s.email||'').trim();
  $('#send-desc').textContent='בחר דרך שליחה';
  const wa=$('#send-whatsapp'), em=$('#send-email');
  wa.style.display = phone? 'inline-flex':'none';
  em.style.display = email? 'inline-flex':'none';
  $('#send-copy').onclick=()=>{ navigator.clipboard.writeText(text); alert('הועתק'); };
  if(phone) $('#send-whatsapp').onclick=()=> window.open('https://wa.me/'+encodeURIComponent(phone)+'?text='+encodeURIComponent(text),'_blank');
  if(email) $('#send-email').onclick=()=> location.href='mailto:'+encodeURIComponent(email)+'?subject='+encodeURIComponent('הזמנת סחורה')+'&body='+encodeURIComponent(text);
  $('#send-close').onclick=()=> $('#send-modal').style.display='none';
  $('#send-modal').style.display='flex';
}

// Settings
function renderSettingsList(){
  const title=$('#settings-title'); if(title) title.innerHTML='ניהול ספקים <span class="version-badge">v6.2.1-hotfix</span>';
  const body=$('#settings-body'); if(!body) return; body.innerHTML='';
  (CFG.suppliers||[]).forEach(s=>{
    const row=document.createElement('div'); row.className='row';
    row.innerHTML=`<div><strong>${s.name}</strong><div class="small">${s.phone||s.email||''}</div></div>
      <div class="inline">
        <button class="btn ghost" data-edit>עריכת ספק</button>
        <button class="btn ghost" data-items>ניהול פריטים</button>
      </div>`;
    row.querySelector('[data-edit]').onclick=()=> renderSupplierEditor(s.id);
    row.querySelector('[data-items]').onclick=()=> renderSupplierEditor(s.id, true);
    row.onclick=(e)=>{ if(!e.target.closest('button')) renderSupplierEditor(s.id) };
    body.appendChild(row);
  });
}

function daySelect(val, typ){
  const opts = DAY.map((d,i)=>`<option value="${i}" ${i===val?'selected':''}>יום ${d}</option>`).join('');
  return `<select data-type="${typ}">${opts}</select>`;
}

function renderSupplierEditor(sid, openItems=false){
  const s = supplierById(sid);
  const title=$('#settings-title'); if(title) title.innerHTML='עריכת ספק – '+s.name+' <span class="version-badge">v6.2.1-hotfix</span>';
  const body=$('#settings-body'); if(!body) return; body.innerHTML='';

  const back=document.createElement('div'); back.className='row';
  back.innerHTML=`<button class="btn ghost" id="btn-back-settings">חזרה לרשימה</button>`;
  back.querySelector('#btn-back-settings').onclick=()=>{ renderSettingsList() };
  body.appendChild(back);

  const card=document.createElement('div'); card.className='card';
  card.innerHTML=`
    <div class="row"><div>שם ספק</div><input class="btn" data-field="name" value="${s.name}"></div>
    <div class="row"><div>טלפון וואטסאפ (אופציונלי)</div><input class="btn" data-field="phone" value="${s.phone||''}"></div>
    <div class="row"><div>אימייל (אופציונלי)</div><input class="btn" data-field="email" value="${s.email||''}"></div>
    <div class="row"><div>סניפים פעילים</div>
      <div class="inline">
        <label><input type="checkbox" data-branch="hills" ${s.branches?.hills?'checked':''}> הילס</label>
        <label><input type="checkbox" data-branch="nord" ${s.branches?.nord?'checked':''}> נורדאו</label>
      </div>
    </div>
    <div class="card">
      <div class="h-lg">ימי הזמנה / אספקה</div>
      <div data-daypairs></div>
      <button class="btn" data-add-pair>הוסף שורה</button>
    </div>
    <div class="card">
      <div class="inline" style="justify-content:space-between;width:100%">
        <div class="h-lg">ניהול פריטים</div>
        <button class="btn" data-add-item>הוסף פריט</button>
      </div>
      <div data-items></div>
    </div>
  `;
  body.appendChild(card);

  card.querySelectorAll('input[data-field]').forEach(inp=>{ inp.oninput=()=>{ s[inp.dataset.field]=inp.value; write(CFG_KEY, CFG) } });
  card.querySelectorAll('input[data-branch]').forEach(ch=>{ ch.onchange=()=>{ s.branches[ch.dataset.branch]=ch.checked; write(CFG_KEY, CFG) } });

  const dpWrap=card.querySelector('[data-daypairs]');
  function renderPairs(){
    dpWrap.innerHTML='';
    (s.dayPairs||[]).forEach((p,i)=>{
      const row=document.createElement('div'); row.className='row';
      row.innerHTML=`<div>שורה ${i+1}</div>
        <div class="inline">
          ${daySelect(p.order,'order')}
          ${daySelect(p.deliver,'deliver')}
          <button class="btn ghost" data-rm>מחק</button>
        </div>`;
      row.querySelector('[data-rm]').onclick=()=>{ s.dayPairs.splice(i,1); write(CFG_KEY, CFG); renderPairs() };
      row.querySelector('select[data-type=order]').onchange=(e)=>{ p.order=+e.target.value; write(CFG_KEY, CFG) };
      row.querySelector('select[data-type=deliver]').onchange=(e)=>{ p.deliver=+e.target.value; write(CFG_KEY, CFG) };
      dpWrap.appendChild(row);
    });
  }
  renderPairs();
  card.querySelector('[data-add-pair]').onclick=()=>{ (s.dayPairs||(s.dayPairs=[])).push({order:0,deliver:1}); write(CFG_KEY, CFG); renderPairs() };

  const itWrap=card.querySelector('[data-items]');
  function renderItems(){
    itWrap.innerHTML='';
    (s.items||[]).forEach((it,i)=>{
      if(it.unitsPerCarton==null) it.unitsPerCarton=1;
      const row=document.createElement('div'); row.className='row';
      row.innerHTML=`
        <div style="flex:1;display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:8px;align-items:center">
          <input value="${it.name||''}" data-k="name" class="btn">
          <input value="${it.unit||''}" data-k="unit" class="btn" placeholder="יחידת מידה">
          <input value="${it.price||''}" data-k="price" class="btn" inputmode="decimal" placeholder="מחיר">
          <input value="${it.unitsPerCarton||1}" data-k="unitsPerCarton" class="btn" inputmode="numeric" placeholder="יח׳ בקרטון">
        </div>
        <div class="inline">
          <button class="btn ghost" data-up>מעלה</button>
          <button class="btn ghost" data-down>מוריד</button>
          <button class="btn" data-del>מחק</button>
        </div>`;
      row.querySelectorAll('input').forEach(inp=>{ inp.oninput=()=>{ let v=inp.value; if(inp.dataset.k==='unitsPerCarton') v = Number(v||1); it[inp.dataset.k]=v; write(CFG_KEY, CFG) } });
      row.querySelector('[data-del]').onclick=()=>{ s.items.splice(i,1); write(CFG_KEY, CFG); renderItems() };
      row.querySelector('[data-up]').onclick=()=>{ if(i>0){ const t=s.items[i-1]; s.items[i-1]=s.items[i]; s.items[i]=t; write(CFG_KEY, CFG); renderItems() } };
      row.querySelector('[data-down]').onclick=()=>{ if(i<s.items.length-1){ const t=s.items[i+1]; s.items[i+1]=s.items[i]; s.items[i]=t; write(CFG_KEY, CFG); renderItems() } };
      itWrap.appendChild(row);
    });
  }
  renderItems();
  if(openItems) itWrap.scrollIntoView({behavior:'smooth'});
}

function renderHistory(){
  const list=$('#history-list'); if(!list) return; list.innerHTML='';
  read(ORD_KEY,[]).forEach(o=>{ const d=new Date(o.created_at); const r=document.createElement('div'); r.className='row'; r.innerHTML=`<div>${d.toLocaleDateString('he-IL')}</div><div class="small">${o.supplier_name} • ${o.branch_name||''} • יום אספקה: יום ${DAY[o.deliver_dow??d.getDay()]}</div>`; list.appendChild(r); });
  if(!list.children.length) list.innerHTML='<div class="small">אין הזמנות</div>';
}

// boot
document.addEventListener('DOMContentLoaded', async ()=>{
  injectPatchStyles();
  await loadConfig();
  setView('home');
  mountHamburger();
});
