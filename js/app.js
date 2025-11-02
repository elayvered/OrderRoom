// Order Room v6.3
const DAY=['א','ב','ג','ד','ה','ו','ש'];
const CFG_KEY='or_cfg_v630', ORD_KEY='or_orders_v630';

const $=(s,e=document)=>e.querySelector(s), $$=(s,e=document)=>[...e.querySelectorAll(s)];
function read(k,d){ try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch(e){return d} }
function write(k,v){ localStorage.setItem(k, JSON.stringify(v)) }

let CFG=null, currentSupplierId=null, currentDeliverDow=null, currentBranch=null;

function nowLabel(){ const d=new Date(); return 'יום '+DAY[d.getDay()]+' • '+d.toLocaleDateString('he-IL') }
function supplierById(id){ return CFG.suppliers.find(s=>s.id===id) }
function suppliersToOrderToday(){ const g=new Date().getDay(); return CFG.suppliers.filter(s=> s.dayPairs.some(p=>p.order===g)) }
function suppliersArrivingToday(){ const g=new Date().getDay(); return CFG.suppliers.filter(s=> s.dayPairs.some(p=>p.deliver===g)) }
function setView(v){ $$('.view').forEach(x=>x.classList.remove('active')); $('#view-'+v).classList.add('active'); $$('.tab').forEach(t=>t.classList.toggle('active', t.dataset.view===v)); if(v==='home') renderHome(); if(v==='orders') initOrderForm(); if(v==='history') renderHistory(); if(v==='settings') renderSettingsList(); }

document.addEventListener('click', e=>{ const t=e.target.closest('.tab'); if(t) setView(t.dataset.view); });

async function loadConfig(){
  try{
    const res = await fetch('data/suppliers.json?v='+Date.now());
    const j = await res.json();
    if(!localStorage.getItem(CFG_KEY)) write(CFG_KEY, j);
    CFG = read(CFG_KEY, j);
  }catch(e){ CFG = read(CFG_KEY, {suppliers:[]}); }
}

function renderHome(){
  $('#home-date').textContent = nowLabel();
  const enter=$('#home-to-enter'); enter.innerHTML='';
  suppliersToOrderToday().forEach(s=>{
    const r=document.createElement('div'); r.className='row';
    r.innerHTML = `<div><strong>${s.name}</strong><div class="small">לחץ לפתיחת הזמנה</div></div><button class="btn">פתח</button>`;
    r.querySelector('.btn').onclick=()=>{ setView('orders'); openOrderFor(s.id); };
    r.onclick = (e)=>{ if(e.target.tagName!=='BUTTON'){ setView('orders'); openOrderFor(s.id);} };
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

  const recent=read(ORD_KEY,[]).slice(0,10); const list=$('#home-recent'); list.innerHTML='';
  recent.forEach(o=>{ const d=new Date(o.created_at); const row=document.createElement('div'); row.className='row'; row.innerHTML=`<div>${d.toLocaleDateString('he-IL')}</div><div class="small">${o.supplier_name} • ${o.branch_name||''}</div>`; list.appendChild(row); });
  if(!list.children.length) list.innerHTML='<div class="small">אין הזמנות קודמות</div>';
}

function defaultDeliverDayFor(id){ const g=new Date().getDay(); const s=supplierById(id); const p=s?.dayPairs?.find(p=>p.order===g); return p? p.deliver: g }
function labelDeliver(dow){ return 'יום '+DAY[dow] }

function initOrderForm(){
  if(!currentSupplierId && CFG.suppliers[0]) currentSupplierId=CFG.suppliers[0].id;
  openOrderFor(currentSupplierId);
  $('#btn-change-supplier').onclick=openSupplierPicker;
  $('#btn-open-delivery').onclick=()=> $('#deliver-modal').style.display='flex';
  $('#deliver-close').onclick=()=> $('#deliver-modal').style.display='none';
  // FAB toggle
  const fab=$('#fab'); const fm=$('#fab-main');
  if(fm){ fm.onclick=()=> fab.classList.toggle('open'); }
}

function openSupplierPicker(){
  const box=$('#supplier-modal'); box.style.display='flex';
  const g=$('#supplier-grid'); g.innerHTML='';
  CFG.suppliers.forEach(s=>{
    const card=document.createElement('div'); card.className='supplier-card';
    card.innerHTML=`<div><strong>${s.name}</strong><div class="small">${s.phone||s.email||''}</div></div><span>›</span>`;
    card.onclick=()=>{ box.style.display='none'; currentSupplierId=s.id; openOrderFor(s.id); };
    g.appendChild(card);
  });
  $('#supplier-close').onclick=()=> box.style.display='none';
}

function openOrderFor(id){
  const s=supplierById(id); if(!s) return; currentSupplierId=id;
  $('#orders-supplier-name').textContent=s.name;

  // branches
  const bt=$('#branch-toggle'); bt.innerHTML='';
  const branches=[]; if(s.branches.hills) branches.push({id:'hills',name:'הילס',address:'אריק איינשטיין 3, הרצליה'}); if(s.branches.nord) branches.push({id:'nord',name:'נורדאו',address:'נורדאו 4, הרצליה'});
  currentBranch = branches[0]||null;
  const seg=document.createElement('div'); seg.className='segmented';
  branches.forEach((b,i)=>{ const btn=document.createElement('button'); btn.textContent=b.name; if(i===0) btn.classList.add('active'); btn.onclick=()=>{ currentBranch=b; $$('#branch-toggle .segmented button').forEach(x=>x.classList.remove('active')); btn.classList.add('active'); showLastQtyHints(); }; seg.appendChild(btn); });
  bt.appendChild(seg);

  // delivery default & chips
  currentDeliverDow = defaultDeliverDayFor(id);
  $('#deliver-label').textContent = labelDeliver(currentDeliverDow);
  const chips=$('#deliver-chips'); chips.innerHTML='';
  DAY.forEach((d,i)=>{ const b=document.createElement('button'); b.textContent='יום '+d; if(i===currentDeliverDow) b.classList.add('active'); b.onclick=()=>{ currentDeliverDow=i; $('#deliver-label').textContent=labelDeliver(currentDeliverDow); $('#deliver-modal').style.display='none'; $$('#deliver-chips button').forEach(x=>x.classList.remove('active')); b.classList.add('active'); }; chips.appendChild(b) });

  // items list
  const list=$('#items-list'); list.innerHTML='';
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

  // toggle pack mode
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

  $('#btn-save').onclick=()=> saveOrder(s);
  $('#btn-send').onclick=()=> sendOrderFlow(s);

  // FAB actions
  $('#fab-wa').onclick=()=> smartSend('wa', s);
  $('#fab-mail').onclick=()=> smartSend('mail', s);
  $('#fab-copy').onclick=()=> smartSend('copy', s);
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
    deliver_dow: currentDeliverDow, items: collectPicked(), notes: $('#order-notes').value||'' };
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

function smartSend(kind, s){
  const items=collectPicked();
  if(!items.length){ alert('לא נבחרו פריטים'); return }
  const o=buildOrder(s);
  const all=read(ORD_KEY,[]); all.unshift(o); write(ORD_KEY,all);
  const text = orderText(o);
  const phone=(s.phone||'').replace(/[^+\d]/g,''); const email=(s.email||'').trim();

  if(kind==='copy'){ navigator.clipboard.writeText(text); alert('הועתק'); return }
  if(kind==='wa'){
    if(!phone){ alert('לספק אין טלפון וואטסאפ בהגדרות'); return }
    window.open('https://wa.me/'+encodeURIComponent(phone)+'?text='+encodeURIComponent(text),'_blank'); return
  }
  if(kind==='mail'){
    if(!email){ alert('לספק אין אימייל בהגדרות'); return }
    location.href='mailto:'+encodeURIComponent(email)+'?subject='+encodeURIComponent('הזמנת סחורה')+'&body='+encodeURIComponent(text); return
  }
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
  $('#settings-title').innerHTML='ניהול ספקים <span class="version-badge">v6.3</span>';
  const body=$('#settings-body'); body.innerHTML='';
  CFG.suppliers.forEach(s=>{
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
  $('#settings-title').innerHTML='עריכת ספק – '+s.name+' <span class="version-badge">v6.3</span>';
  const body=$('#settings-body'); body.innerHTML='';

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
        <div class="it-grid" style="flex:1">
          <input value="${it.name||''}" data-k="name" class="btn" placeholder="שם פריט">
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
  const list=$('#history-list'); list.innerHTML='';
  read(ORD_KEY,[]).forEach(o=>{ const d=new Date(o.created_at); const r=document.createElement('div'); r.className='row'; r.innerHTML=`<div>${d.toLocaleDateString('he-IL')}</div><div class="small">${o.supplier_name} • ${o.branch_name||''} • יום אספקה: יום ${DAY[o.deliver_dow??d.getDay()]}</div>`; list.appendChild(r); });
  if(!list.children.length) list.innerHTML='<div class="small">אין הזמנות</div>';
}

// boot
document.addEventListener('DOMContentLoaded', async ()=>{ await loadConfig(); setView('home'); });
