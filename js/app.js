// Order Room v6.2.4 – local bundle
const DAY=['א','ב','ג','ד','ה','ו','ש'];
const CFG_KEY='or_cfg_v624', ORD_KEY='or_orders_v624';
const $=(s,e=document)=>e.querySelector(s), $$=(s,e=document)=>[...e.querySelectorAll(s)];
function read(k,d){ try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch(e){return d} }
function write(k,v){ localStorage.setItem(k, JSON.stringify(v)) }
let CFG=null, currentSupplierId=null, currentDeliverDow=null, currentBranch=null;

function nowLabel(){ const d=new Date(); return 'יום '+DAY[d.getDay()]+' • '+d.toLocaleDateString('he-IL') }
function supplierById(id){ return (CFG.suppliers||[]).find(s=>s.id===id) }
function suppliersToOrderToday(){ const g=new Date().getDay(); return (CFG.suppliers||[]).filter(s=> s.dayPairs?.some(p=>p.order===g)) }
function suppliersArrivingToday(){ const g=new Date().getDay(); return (CFG.suppliers||[]).filter(s=> s.dayPairs?.some(p=>p.deliver===g)) }

function setView(v){
  $$('.view').forEach(x=>x.classList.remove('active'));
  const el=$('#view-'+v); if(el) el.classList.add('active');
  if(v==='home') renderHome();
  if(v==='orders') initOrderForm();
  if(v==='history') renderHistory();
  if(v==='settings') renderSettings();
}
document.addEventListener('click', e=>{ const t=e.target.closest('.tab'); if(t){ setView(t.dataset.view); $('#or-menu-panel').style.display='none'; } });

async function loadConfig(){
  try{
    const res=await fetch('data/suppliers.json?v='+Date.now());
    const j=await res.json();
    // take latest from file and store
    write(CFG_KEY, j);
    CFG=read(CFG_KEY, j);
  }catch(e){ CFG=read(CFG_KEY, {suppliers:[]}); }
}

function renderHome(){
  $('#home-date').textContent = nowLabel();
  const enter=$('#home-to-enter'); enter.innerHTML='';
  suppliersToOrderToday().forEach(s=>{
    const r=document.createElement('div'); r.className='row';
    r.innerHTML = `<div><strong>${s.name}</strong><div class="small">לחץ לפתיחת הזמנה</div></div><button class="btn">פתח</button>`;
    r.querySelector('.btn').onclick=()=>{ setView('orders'); openOrderFor(s.id); };
    r.onclick=(e)=>{ if(e.target.tagName!=='BUTTON'){ setView('orders'); openOrderFor(s.id); } };
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
  const list=$('#home-recent'); list.innerHTML='';
  const recent=read(ORD_KEY,[]).slice(0,10);
  recent.forEach(o=>{
    const d=new Date(o.created_at);
    const row=document.createElement('div'); row.className='row';
    row.innerHTML=`<div>${d.toLocaleDateString('he-IL')}</div><div class="small">${o.supplier_name} • ${o.branch_name||''}</div>`;
    list.appendChild(row);
  });
  if(!list.children.length) list.innerHTML='<div class="small">אין הזמנות קודמות</div>';
}

function nextAllowed(today, arr){
  for(let i=0;i<7;i++){ let d=(today+i)%7; if(arr.includes(d)) return d; }
  return today;
}
function defaultDeliverDayFor(id){
  const s=supplierById(id); const g=new Date().getDay();
  const p=s?.dayPairs?.find(p=>p.order===g);
  if(p) return p.deliver;
  if(s?.allowedDeliverDays?.length) return nextAllowed(g, s.allowedDeliverDays);
  return g;
}
function labelDeliver(d){ return 'יום '+DAY[d] }

function initOrderForm(){
  if(!currentSupplierId && (CFG.suppliers||[])[0]) currentSupplierId=CFG.suppliers[0].id;
  openOrderFor(currentSupplierId);
  $('#btn-change-supplier').onclick=openSupplierPicker;
  $('#btn-open-delivery').onclick=()=> $('#deliver-modal').style.display='flex';
  $('#deliver-close').onclick=()=> $('#deliver-modal').style.display='none';
  $('#btn-open-send').onclick=()=> sendOrderFlow(supplierById(currentSupplierId), false);
  $('#btn-save-order').onclick=()=> sendOrderFlow(supplierById(currentSupplierId), true);
}

function openSupplierPicker(){
  const box=$('#supplier-modal'); box.style.display='flex';
  const g=$('#supplier-grid'); g.innerHTML='';
  (CFG.suppliers||[]).forEach(s=>{
    const card=document.createElement('button'); card.className='btn'; card.style.width='100%';
    card.textContent = s.name;
    card.onclick=()=>{ box.style.display='none'; currentSupplierId=s.id; openOrderFor(s.id); };
    g.appendChild(card);
  });
  $('#supplier-close').onclick=()=> box.style.display='none';
}

function ensureOrderHeader(s){
  $('#orders-title').textContent = 'הזמנה – '+s.name;
  $('#btn-change-supplier').textContent = s.name;
}

function openOrderFor(id){
  const s=supplierById(id); if(!s) return; currentSupplierId=id;
  ensureOrderHeader(s);

  // branches
  const bt=$('#branch-toggle'); bt.innerHTML='';
  const branches=[];
  if(s.branches?.hills) branches.push({id:'hills',name:'הילס',address:'אריק איינשטיין 3, הרצליה'});
  if(s.branches?.nord)  branches.push({id:'nord', name:'נורדאו',address:'נורדאו 4, הרצליה'});
  currentBranch = branches[0]||null;
  if(branches.length){
    const seg=document.createElement('div'); seg.className='segmented';
    branches.forEach((b,i)=>{
      const btn=document.createElement('button'); btn.textContent=b.name; if(i===0) btn.classList.add('active');
      btn.onclick=()=>{ currentBranch=b; $$('#branch-toggle .segmented button').forEach(x=>x.classList.remove('active')); btn.classList.add('active'); showLastQtyHints(); };
      seg.appendChild(btn);
    });
    bt.appendChild(seg);
  } else {
    bt.textContent='—';
  }

  // delivery
  currentDeliverDow = defaultDeliverDayFor(id);
  $('#deliver-label').textContent = labelDeliver(currentDeliverDow);
  const chips=$('#deliver-chips'); chips.innerHTML='';
  for(let i=0;i<7;i++){
    const b=document.createElement('button'); b.className='btn'; b.textContent='יום '+DAY[i];
    const allowed = !s.allowedDeliverDays || s.allowedDeliverDays.includes(i);
    if(!allowed) b.classList.add('disabled');
    if(i===currentDeliverDow) b.classList.add('primary');
    b.onclick=()=>{ if(!allowed) return; currentDeliverDow=i; $('#deliver-label').textContent=labelDeliver(currentDeliverDow); $$('#deliver-chips .btn').forEach(x=>x.classList.remove('primary')); b.classList.add('primary'); $('#deliver-modal').style.display='none'; };
    chips.appendChild(b);
  }

  // items
  const list=$('#items-list'); list.innerHTML='';
  (s.items||[]).forEach(it=>{
    const row=document.createElement('div'); row.className='item-row'; row.dataset.id=it.id; row.dataset.mode= (it.cartonOnly? 'carton':'unit');
    row.innerHTML = `<div><div class="item-title">${it.name}</div><div class="small" data-last="${it.name}"></div></div>
      <div class="qty">
        <div class="segmented" data-pack>
          ${it.cartonOnly? '' : '<button class="active" data-mode="unit"><img alt="" src="assets/icons/unit.svg" class="ic"> יח׳</button>'}
          <button ${it.cartonOnly? 'class="active"':''} data-mode="carton"><img alt="" src="assets/icons/box.svg" class="ic"> קרטון</button>
        </div>
        <input type="number" inputmode="numeric" min="0" step="1" placeholder="0">
      </div>`;
    list.appendChild(row);
  });
  $$('#items-list [data-pack]').forEach(pack=>{
    const row=pack.closest('.item-row');
    pack.querySelectorAll('button').forEach(btn=>{
      btn.onclick=()=>{ pack.querySelectorAll('button').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); row.dataset.mode = btn.dataset.mode; };
    });
  });
  showLastQtyHints();
}

function showLastQtyHints(){
  const s=supplierById(currentSupplierId);
  const orders=read(ORD_KEY,[]);
  const last = orders.find(o=> o.supplier_id===s.id && (currentBranch? o.branch_id===currentBranch.id : true));
  const map = new Map((last?.items||[]).map(i=>[i.name, i.qtyLabel||i.qty]));
  $$('#items-list .item-row').forEach(r=>{
    const name=r.querySelector('.item-title').textContent.trim();
    const el=r.querySelector('[data-last]');
    el.textContent = map.has(name)? ('כמות אחרונה: '+map.get(name)) : '';
  });
}

function collectPicked(){
  const out=[]; const s=supplierById(currentSupplierId);
  $$('#items-list .item-row').forEach(r=>{
    const q=Number(r.querySelector('input').value);
    if(q>0){
      const id=r.dataset.id;
      const meta=(s.items||[]).find(x=>x.id===id)||{unitsPerCarton:0, cartonOnly:false};
      const mode=r.dataset.mode||'unit';
      const upc=Number(meta.unitsPerCarton||0); // default 0
      const totalUnits=(mode==='carton' && upc>0)? q*upc : (mode==='unit'? q : null);
      let qtyLabel='';
      if(mode==='carton'){ qtyLabel = (upc>0)? `${q} קרטון (${totalUnits} יח׳)` : `${q} קרטון`; }
      else { qtyLabel = `${q} יח׳`; }
      out.push({name:r.querySelector('.item-title').textContent.trim(), qty:q, mode, unitsPerCarton:upc, totalUnits, qtyLabel});
    }
  });
  return out;
}

function buildOrder(s){
  return {
    id:String(Date.now()),
    created_at:new Date().toISOString(),
    supplier_id:s.id, supplier_name:s.name,
    branch_id:currentBranch?.id||null, branch_name:currentBranch?.name||null, branch_address:currentBranch?.address||null,
    deliver_dow: currentDeliverDow,
    items: collectPicked(),
    notes: $('#order-notes')?.value||''
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
    ...o.items.map(p=> `• ${p.name} – ${p.qtyLabel}`),
    o.notes||null,
    '', 'אודה לאישורכם בהודעה חוזרת'
  ].filter(Boolean);
  return lines.join('\\n');
}

function sendOrderFlow(s, saveOnly=false){
  const items=collectPicked(); if(!items.length){ alert('לא נבחרו פריטים'); return }
  const o=buildOrder(s);
  const all=read(ORD_KEY,[]); all.unshift(o); write(ORD_KEY,all);
  if(saveOnly){ alert('ההזמנה נשמרה'); return }
  const text=orderText(o);
  const phone=(s.phone||'').replace(/[^+\\d]/g,''); const email=(s.email||'').trim?.()||'';
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
  const list=$('#history-list'); list.innerHTML='';
  const all=read(ORD_KEY,[]);
  all.forEach((o)=>{
    const d=new Date(o.created_at);
    const r=document.createElement('div'); r.className='row';
    r.innerHTML=`<div><div>${d.toLocaleDateString('he-IL')}</div>
      <div class="small">${o.supplier_name} • ${o.branch_name||''} • יום אספקה: יום ${DAY[o.deliver_dow??d.getDay()]}</div></div>
      <div class="inline"><button class="btn ghost" data-view>צפייה</button><button class="btn ghost" data-resend>שליחה שוב</button><button class="btn ghost" data-copy>העתק</button></div>`;
    r.querySelector('[data-view]').onclick=()=> showOrderTextModal(o);
    r.querySelector('[data-copy]').onclick=()=>{ navigator.clipboard.writeText(orderText(o)); alert('הועתק'); };
    r.querySelector('[data-resend]').onclick=()=>{
      const s=supplierById(o.supplier_id)||{phone:'',email:''}; const text=orderText(o);
      const phone=(s.phone||'').replace(/[^+\\d]/g,''); const email=(s.email||'').trim?.()||'';
      $('#send-desc').textContent='בחר דרך שליחה';
      const wa=$('#send-whatsapp'), em=$('#send-email');
      wa.style.display = phone? 'inline-flex':'none'; em.style.display = email? 'inline-flex':'none';
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
  const box=$('#text-modal'); $('#text-modal-content').textContent = orderText(o);
  $('#text-modal-close').onclick=()=>{ box.style.display='none' };
  box.style.display='flex';
}
function renderSettings(){
  $('#ver').textContent='6.2.4';
  const hasCfg=!!(window.OR_CONFIG && OR_CONFIG.SUPABASE_URL && OR_CONFIG.SUPABASE_ANON);
  $('#conn').textContent = hasCfg? 'Supabase (מוגדר)' : 'לא מוגדר';
}

// MENU
document.addEventListener('DOMContentLoaded', async ()=>{
  await loadConfig(); setView('home');
  const btn=$('#or-menu-btn'), panel=$('#or-menu-panel');
  btn.addEventListener('click', (e)=>{ e.stopPropagation(); panel.style.display = (panel.style.display==='block') ? 'none' : 'block'; });
  document.addEventListener('click', (e)=>{ if(!e.target.closest('#or-menu-panel') && !e.target.closest('#or-menu-btn')) panel.style.display='none'; });
});
