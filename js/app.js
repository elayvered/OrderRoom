// Order Room v6.2.3 — patch for orders screen layout & menu
// - Merge branch + delivery in a single row and hide all duplicates
// - Fixed footer with safe-area + proper bottom padding
// - Top spacing so content doesn't get cut by header
// - Title guard to avoid doubled 'הזמנה –'

const DAY=['א','ב','ג','ד','ה','ו','ש'];
const CFG_KEY='or_cfg_v620', ORD_KEY='or_orders_v620';

const $=(s,e=document)=>e.querySelector(s), $$=(s,e=document)=>[...e.querySelectorAll(s)];
function read(k,d){ try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch(e){return d} }
function write(k,v){ localStorage.setItem(k, JSON.stringify(v)) }

let CFG=null, currentSupplierId=null, currentDeliverDow=null, currentBranch=null;

function nowLabel(){ const d=new Date(); return 'יום '+DAY[d.getDay()]+' • '+d.toLocaleDateString('he-IL') }
function supplierById(id){ return (CFG.suppliers||[]).find(s=>s.id===id) }
function suppliersToOrderToday(){ const g=new Date().getDay(); return (CFG.suppliers||[]).filter(s=> s.dayPairs?.some(p=>p.order===g)) }
function suppliersArrivingToday(){ const g=new Date().getDay(); return (CFG.suppliers||[]).filter(s=> s.dayPairs?.some(p=>p.deliver===g)) }
function setView(v){ $$('.view').forEach(x=>x.classList.remove('active')); const el=$('#view-'+v); if(el) el.classList.add('active'); $$('.tab').forEach(t=>t.classList.toggle('active', t.dataset.view===v)); if(v==='home') renderHome(); if(v==='orders') initOrderForm(); if(v==='history') renderHistory(); if(v==='settings') renderSettingsList?.(); }

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
    /* header top spacing so first card won't be cut */
    main{padding-top:14px; padding-bottom:120px}
    /* fixed footer with safe-area */
    #view-orders .order-footer{position:fixed; left:0; right:0; bottom:0; background:#fff; padding:12px 16px calc(12px + env(safe-area-inset-bottom)); border-top:1px solid #eceff6; box-shadow:0 -8px 26px rgba(15,20,35,.08); z-index:1000}
    /* no zoom on inputs */
    #items-list input[type=number]{font-size:16px}
    /* merged row layout */
    #view-orders .merged-row{display:grid; grid-template-columns:1fr; gap:10px; align-items:center; margin-bottom:6px}
    #view-orders .merge-box{display:grid; grid-template-columns:1fr 1fr; gap:12px; align-items:center}
    #view-orders .merge-right{display:flex; justify-content:flex-start; align-items:center; gap:10px; flex-wrap:wrap}
    #view-orders .merge-left{display:flex; justify-content:flex-end; align-items:center; gap:10px; flex-wrap:wrap}
    @media (max-width:560px){
      #view-orders .merge-box{grid-template-columns:1fr; gap:8px}
      #view-orders .merge-left{justify-content:flex-start}
    }
    /* hamburger menu */
    .or-menu-btn{position:absolute; left:12px; top:10px; z-index:1200; border:none; border-radius:12px; padding:10px 12px; background:#101a46; color:#fff; font-weight:800; box-shadow:0 10px 30px rgba(0,0,0,.18); cursor:pointer}
    .or-menu-panel{position:absolute; left:12px; top:54px; background:#fff; border:1px solid #e6ecf5; border-radius:14px; box-shadow:0 16px 40px rgba(15,20,35,.14); display:none; overflow:hidden; min-width:200px; z-index:1200}
    .or-menu-panel .row{padding:12px 14px; border-bottom:1px solid #eef3fb; cursor:pointer}
    .or-menu-panel .row:last-child{border:none}
    .or-menu-panel .row:hover{background:#f7f9ff}
    /* hide legacy bottom tabbar if exists */
    .tabbar{display:none !important}
  `;
  const tag = document.createElement('style'); tag.textContent = css; document.head.appendChild(tag);
}

function mountHamburger(){
  const header = document.querySelector('.or-header') || document.querySelector('header');
  if(!header || $('#or-menu-btn')) return;
  const btn = document.createElement('button');
  btn.id='or-menu-btn'; btn.className='or-menu-btn';
  btn.innerHTML = `<span style="display:inline-block; width:18px; height:2px; background:#fff; box-shadow:0 6px 0 #fff, 0 -6px 0 #fff; vertical-align:-2px"></span> <span style="margin-inline-start:8px">תפריט</span>`;
  header.appendChild(btn);

  const panel = document.createElement('div');
  panel.className='or-menu-panel'; panel.id='or-menu-panel';
  const mk = (view, label)=>{
    const r=document.createElement('div'); r.className='row';
    r.textContent = label;
    r.onclick=()=>{ panel.style.display='none'; setView(view) };
    panel.appendChild(r);
  };
  mk('home','בית'); mk('orders','הזמנות'); mk('history','היסטוריה'); mk('settings','הגדרות');
  header.appendChild(panel);

  btn.addEventListener('click', (e)=>{
    e.stopPropagation();
    panel.style.display = (panel.style.display==='block') ? 'none' : 'block';
  });
  document.addEventListener('click', (e)=>{
    if(!e.target.closest('#or-menu-panel') && !e.target.closest('#or-menu-btn')) panel.style.display='none';
  });
}

function removeEmptyNote(){
  [...document.body.querySelectorAll('*')].forEach(n=>{
    if(n.childElementCount===0 && typeof n.textContent==='string' && n.textContent.trim().startsWith('שדות ריקים')) n.remove();
  });
}

function renderHome(){
  $('#home-date') && ($('#home-date').textContent = nowLabel());
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
  if(!currentSupplierId && (CFG.suppliers||[])[0]) currentSupplierId=CFG.suppliers[0].id;
  openOrderFor(currentSupplierId);
  const btnChange=$('#btn-change-supplier'); if(btnChange){ btnChange.onclick=openSupplierPicker; }
  const btnOpenDel=$('#btn-open-delivery'); if(btnOpenDel) btnOpenDel.onclick=()=> $('#deliver-modal').style.display='flex';
  $('#deliver-close') && ($('#deliver-close').onclick=()=> $('#deliver-modal').style.display='none');
  removeEmptyNote();
}

function openSupplierPicker(){
  const box=$('#supplier-modal'); if(!box) return;
  box.style.display='flex';
  const g=$('#supplier-grid'); g.innerHTML='';
  (CFG.suppliers||[]).forEach(s=>{
    const card=document.createElement('button'); card.className='btn'; card.style.width='100%'; card.style.justifyContent='space-between';
    card.textContent = s.name;
    card.onclick=()=>{ box.style.display='none'; currentSupplierId=s.id; openOrderFor(s.id); };
    g.appendChild(card);
  });
  $('#supplier-close').onclick=()=> box.style.display='none';
}

function ensureOrderHeader(s){
  // If existing text already contains 'הזמנה', avoid doubling
  const titleEl = $('#orders-title') || $('#orders-supplier-name');
  if(titleEl){
    const base='הזמנה – ';
    const name=s.name;
    titleEl.textContent = titleEl.textContent.includes('הזמנה') ? (base+name) : name;
  }
  const changeBtn = $('#btn-change-supplier');
  if(changeBtn){
    changeBtn.textContent = s.name;
    const card = $('#view-orders .card');
    if(card && changeBtn.parentElement!==card.firstElementChild){
      const topRow = card.firstElementChild;
      topRow && topRow.appendChild(changeBtn);
    }
  }
}

function createMergedRow(){
  const card = $('#view-orders .card');
  if(!card) return;
  let merged = card.querySelector('.merged-row');
  if(!merged){
    merged = document.createElement('div');
    merged.className='row merged-row';
    merged.innerHTML = `<div>סניף + יום אספקה</div><div class="merge-box"><div class="merge-right"></div><div class="merge-left"></div></div>`;
    const after = card.firstElementChild?.nextElementSibling || card.firstElementChild;
    card.insertBefore(merged, after);
  }
  const right = merged.querySelector('.merge-right');
  const left = merged.querySelector('.merge-left');
  const branchToggle = $('#branch-toggle');
  const deliverBtn = $('#btn-open-delivery');
  if(branchToggle && branchToggle.parentNode!==right) right.appendChild(branchToggle);
  if(deliverBtn && deliverBtn.parentNode!==left) left.appendChild(deliverBtn);

  // Hide any duplicate rows that still include these controls or their titles
  $$('#view-orders .row').forEach(r=>{
    if(r===merged) return;
    if(r.contains(branchToggle) || r.contains(deliverBtn)) r.style.display='none';
    const title = (r.firstElementChild && r.firstElementChild.textContent.trim()) || '';
    if((/סניף/.test(title) && /אספקה/.test(title)) || title==='סניף' || title.indexOf('אספקה')>=0){
      r.style.display='none';
    }
  });
}

function openOrderFor(id){
  const s=supplierById(id); if(!s) return; currentSupplierId=id;
  ensureOrderHeader(s);
  const bt=$('#branch-toggle'); if(bt){ bt.innerHTML='';
    const branches=[]; if(s.branches?.hills) branches.push({id:'hills',name:'הילס',address:'אריק איינשטיין 3, הרצליה'}); if(s.branches?.nord) branches.push({id:'nord',name:'נורדאו',address:'נורדאו 4, הרצליה'});
    currentBranch = branches[0]||null;
    const seg=document.createElement('div'); seg.className='segmented';
    branches.forEach((b,i)=>{ const btn=document.createElement('button'); btn.textContent=b.name; if(i===0) btn.classList.add('active'); btn.onclick=()=>{ currentBranch=b; $$('#branch-toggle .segmented button').forEach(x=>x.classList.remove('active')); btn.classList.add('active'); showLastQtyHints(); }; seg.appendChild(btn); });
    bt.appendChild(seg);
  }
  currentDeliverDow = defaultDeliverDayFor(id);
  const dl=$('#deliver-label'); if(dl) dl.textContent = labelDeliver(currentDeliverDow);
  const chips=$('#deliver-chips'); if(chips){ chips.innerHTML=''; DAY.forEach((d,i)=>{ const b=document.createElement('button'); b.textContent='יום '+d; if(i===currentDeliverDow) b.classList.add('active'); b.onclick=()=>{ currentDeliverDow=i; const dl2=$('#deliver-label'); if(dl2) dl2.textContent=labelDeliver(currentDeliverDow); $('#deliver-modal').style.display='none'; $$('#deliver-chips button').forEach(x=>x.classList.remove('active')); b.classList.add('active'); }; chips.appendChild(b) }); }
  createMergedRow();
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

function renderHistory(){
  const list=$('#history-list'); if(!list) return; list.innerHTML='';
  const all=read(ORD_KEY,[]);
  all.forEach((o)=>{
    const d=new Date(o.created_at);
    const r=document.createElement('div'); r.className='row';
    r.innerHTML=`<div>
        <div>${d.toLocaleDateString('he-IL')}</div>
        <div class="small">${o.supplier_name} • ${o.branch_name||''} • יום אספקה: יום ${DAY[o.deliver_dow??d.getDay()]}</div>
      </div>
      <div class="inline">
        <button class="btn ghost" data-view>צפייה</button>
        <button class="btn ghost" data-resend>שליחה שוב</button>
        <button class="btn ghost" data-copy>העתק</button>
      </div>`;
    r.querySelector('[data-view]').onclick=()=> showOrderTextModal(o);
    r.querySelector('[data-copy]').onclick=()=>{ navigator.clipboard.writeText(orderText(o)); alert('הועתק'); };
    r.querySelector('[data-resend]').onclick=()=>{
      const s=supplierById(o.supplier_id)||{phone:'',email:''};
      const text=orderText(o);
      const phone=(s.phone||'').replace(/[^+\d]/g,''); const email=(s.email||'').trim();
      $('#send-desc').textContent='בחר דרך שליחה';
      const wa=$('#send-whatsapp'), em=$('#send-email');
      wa.style.display = phone? 'inline-flex':'none';
      em.style.display = email? 'inline-flex':'none';
      $('#send-copy').onclick=()=>{ navigator.clipboard.writeText(text); alert('הועתק'); };
      if(phone) $('#send-whatsapp').onclick=()=> window.open('https://wa.me/'+encodeURIComponent(phone)+'?text='+encodeURIComponent(text),'_blank');
      if(email) $('#send-email').onclick=()=> location.href='mailto:'+encodeURIComponent('הזמנת סחורה')+'?body='+encodeURIComponent(text);
      $('#send-close').onclick=()=> $('#send-modal').style.display='none';
      $('#send-modal').style.display='flex';
    };
    list.appendChild(r);
  });
  if(!list.children.length) list.innerHTML='<div class="small">אין הזמנות</div>';
}

function showOrderTextModal(o){
  const box = $('#text-modal'); if(!box) return;
  $('#text-modal-content').textContent = orderText(o);
  $('#text-modal-close').onclick=()=>{ box.style.display='none' };
  box.style.display='flex';
}

// boot
document.addEventListener('DOMContentLoaded', async ()=>{
  injectPatchStyles();
  await loadConfig();
  setView('home');
  mountHamburger();
});
