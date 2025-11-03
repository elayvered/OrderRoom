(function(){
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  const state = {
    suppliers: getSuppliers(),
    activeSupplier: null,
    activeBranch: 'הילס',
    deliveryDay: null,
    items: [],
    orders: JSON.parse(localStorage.getItem('or_orders')||'[]')
  };

  // Menu
  const menuBtn = $('#menuBtn'), menu = $('#mainMenu');
  function anchorMenu(){
    const rect = menuBtn.getBoundingClientRect();
    menu.style.right = (window.innerWidth - rect.right) + 'px';
    menu.style.top = (rect.bottom + 8) + 'px';
  }
  menuBtn.addEventListener('click', ()=>{ anchorMenu(); menu.style.display = (menu.style.display==='block'?'none':'block'); });
  document.addEventListener('click', (e)=>{ if (!menu.contains(e.target) && e.target!==menuBtn) menu.style.display='none'; });

  $('#homeLogo').addEventListener('click', ()=>navigate('home'));
  $$('#mainMenu a').forEach(a=>a.addEventListener('click', (e)=>{ e.preventDefault(); navigate(a.dataset.nav); }));

  function navigate(view){
    $$('.view').forEach(v=>v.classList.add('hidden'));
    if (view==='home') $('#homeView').classList.remove('hidden');
    if (view==='orders') $('#orderView').classList.remove('hidden');
    if (view==='history') { renderHistory(); $('#historyView').classList.remove('hidden'); }
    if (view==='settings') { renderSettings(); $('#settingsView').classList.remove('hidden'); }
    menu.style.display='none';
  }
  navigate('home');

  // Home render
  function computeToday(){
    const today = new Date();
    const dayName = ['א','ב','ג','ד','ה','ו','ש'][today.getDay()];
    const toPlace = state.suppliers.filter(s=>s.orderDays?.includes(dayName));
    const arrivingH = state.orders.filter(o=>o.branch==='הילס' && sameDate(o.deliveryDate,today));
    const arrivingN = state.orders.filter(o=>o.branch==='נורדאו' && sameDate(o.deliveryDate,today));
    return {toPlace, arrivingH, arrivingN};
  }
  function sameDate(a,b){ const d=new Date(a); return d.getFullYear()===b.getFullYear() && d.getMonth()===b.getMonth() && d.getDate()===b.getDate(); }
  function fmtDate(d){ const dd=new Date(d); return dd.toLocaleDateString('he-IL',{weekday:'short',day:'2-digit',month:'2-digit'}); }
  function renderHome(){
    const {toPlace, arrivingH, arrivingN} = computeToday();
    const chips = $('#todayToPlace'); chips.innerHTML='';
    toPlace.forEach(s=>{ const b=document.createElement('button'); b.className='chip'; b.textContent=s.name; b.onclick=()=>openOrderFor(s); chips.appendChild(b); });
    const H = $('#arrivingHills'); H.innerHTML='';
    arrivingH.forEach(o=>{ const r=document.createElement('div'); r.className='row'; r.innerHTML=`<span>${o.supplier} • ${fmtDate(o.deliveryDate)}</span><div class="actions"><button data-id="${o.id}" class="view">צפייה</button></div>`; H.appendChild(r); });
    const N = $('#arrivingNordau'); N.innerHTML='';
    arrivingN.forEach(o=>{ const r=document.createElement('div'); r.className='row'; r.innerHTML=`<span>${o.supplier} • ${fmtDate(o.deliveryDate)}</span><div class="actions"><button data-id="${o.id}" class="view">צפייה</button></div>`; N.appendChild(r); });
    $$('.list-simple .row .view').forEach(b=>b.onclick=()=>viewOrder(b.dataset.id));
  }
  renderHome();

  // Order screen
  const supplierBtn = $('#supplierBtn');
  supplierBtn.addEventListener('click', openSupplierPicker);
  $$('.branch-switch .chip').forEach(c=>c.addEventListener('click',()=>{ $$('.branch-switch .chip').forEach(x=>x.classList.remove('active')); c.classList.add('active'); state.activeBranch=c.dataset.branch; }));
  $$('.branch-switch .chip')[0].classList.add('active');

  const deliveryBtn = $('#deliveryDayBtn'), deliveryText = $('#deliveryDayText'), deliveryDrop = $('#deliveryDayDropdown');
  deliveryBtn.addEventListener('click', ()=>{
    if (!state.activeSupplier) return;
    const opts = getDeliveryOptions(state.activeSupplier);
    deliveryDrop.innerHTML='';
    opts.forEach(o=>{ const b=document.createElement('button'); b.textContent=o; b.onclick=()=>{ deliveryText.textContent=o; state.deliveryDay=o; deliveryDrop.classList.add('hidden'); }; deliveryDrop.appendChild(b); });
    deliveryDrop.classList.toggle('hidden');
  });

  function openOrderFor(s){
    state.activeSupplier=s;
    supplierBtn.textContent=s.name;
    state.items = s.items.map(n=>({name:n, qty:0, unit:'יח'}));
    renderItems();
    const opts = getDeliveryOptions(s);
    deliveryText.textContent=opts[0]||'—'; state.deliveryDay=opts[0]||null;
    navigate('orders');
  }

  function renderItems(){
    const wrap = $('#itemsList'); wrap.innerHTML='';
    state.items.forEach((it, i)=>{
      const row=document.createElement('div'); row.className='item';
      row.innerHTML = `
        <div class="item-name">${it.name}</div>
        <div class="item-controls">
          <input type="number" inputmode="numeric" class="qty" min="0" value="${it.qty}" />
          <div class="unit-switch">
            <button class="${it.unit==='קרטון'?'active':''}" data-u="קרטון">${iconBox()} קרטון</button>
            <button class="${it.unit==='יח'?'active':''}" data-u="יח">${iconUnit()} יח'</button>
          </div>
        </div>`;
      row.querySelector('.qty').addEventListener('input', e=> it.qty=Number(e.target.value||0));
      row.querySelectorAll('.unit-switch button').forEach(b=>b.addEventListener('click',()=>{
        it.unit=b.dataset.u; row.querySelectorAll('.unit-switch button').forEach(x=>x.classList.remove('active')); b.classList.add('active');
      }));
      wrap.appendChild(row);
    });
  }
  function iconBox(){ return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0b1a36" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73L13 2.27a2 2 0 0 0-2 0L4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><path d="M3.27 6.96L12 12l8.73-5.04"></path><path d="M12 22V12"></path></svg>`}
  function iconUnit(){ return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0b1a36" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="7"></circle><path d="M12 9v6"></path><path d="M9 12h6"></path></svg>`}

  // Supplier picker modal (2 columns)
  const supplierModal = $('#supplierModal'), supplierGrid = $('#supplierGrid');
  function openSupplierPicker(){
    supplierGrid.innerHTML='';
    state.suppliers.forEach(s=>{
      const card=document.createElement('div'); card.className='supplier-card'; card.textContent=s.name;
      card.onclick=()=>{ closeModal(supplierModal); openOrderFor(s); };
      supplierGrid.appendChild(card);
    });
    openModal(supplierModal);
  }

  // Save & Send
  $('#saveOrder').addEventListener('click', saveOrder);
  $('#sendOrder').addEventListener('click', ()=> openModal($('#sendModal')));
  $('#sendWhatsApp').addEventListener('click', ()=> send('wa'));
  $('#sendEmail').addEventListener('click', ()=> send('mail'));
  $('#copyOrder').addEventListener('click', ()=> send('copy'));

  function saveOrder(){
    if (!state.activeSupplier) return;
    const id='o_'+Date.now();
    const order={
      id, supplier:state.activeSupplier.name, branch:state.activeBranch,
      deliveryDate: guessDeliveryDate(state.deliveryDay),
      items: state.items.filter(i=>i.qty>0).map(i=>({name:i.name, qty:i.qty, unit:i.unit})),
      notes: $('#orderNotes').value||''
    };
    state.orders.unshift(order);
    localStorage.setItem('or_orders', JSON.stringify(state.orders));
    renderHome();
    alert('הזמנה נשמרה');
  }
  function orderText(o){
    const branchAddr = (o.branch==='הילס'?'אריק איינשטיין 3, הרצליה':'נורדאו 4, הרצליה');
    const rows=[];
    rows.push('הזמנת סחורה - סושי רום');
    rows.push(`סניף: ${o.branch} (${branchAddr})`);
    rows.push(`יום אספקה: ${fmtDate(o.deliveryDate)}`);
    rows.push('—');
    o.items.forEach(i=> rows.push(`${i.name} — ${i.qty} ${i.unit}`));
    if (o.notes){ rows.push('—'); rows.push('הערות: '+o.notes); }
    rows.push('אודה לאישורכם בהודעה חוזרת');
    return rows.join('\n');
  }
  function send(kind){
    closeModal($('#sendModal'));
    saveOrder();
    const o = state.orders[0];
    const text = encodeURIComponent(orderText(o));
    if (kind==='copy'){ navigator.clipboard.writeText(orderText(o)); alert('ההזמנה הועתקה'); return; }
    const phone = (state.activeSupplier?.phone||'');
    if (kind==='wa'){ window.open(`https://wa.me/${phone.replace(/[^0-9]/g,'')}?text=${text}`,'_blank'); }
    if (kind==='mail'){ window.location.href = `mailto:?subject=${encodeURIComponent('הזמנת סחורה - סושי רום')}&body=${text}`; }
  }

  function renderHistory(){
    const box=$('#historyList'); box.innerHTML='';
    state.orders.forEach(o=>{
      const row=document.createElement('div'); row.className='list-simple row';
      row.innerHTML = `<div class="row"><span>${o.supplier} • ${fmtDate(o.deliveryDate)} • ${o.branch}</span>
        <div class="actions"><button data-id="${o.id}" class="again">שליחה שוב</button><button data-id="${o.id}" class="copy">העתקה</button></div></div>`;
      box.appendChild(row);
    });
    $$('#historyList .again').forEach(b=>b.onclick=()=>{ const o=state.orders.find(x=>x.id===b.dataset.id); if (!o) return; const t=encodeURIComponent(orderText(o)); window.open('https://wa.me/?text='+t,'_blank'); });
    $$('#historyList .copy').forEach(b=>b.onclick=()=>{ const o=state.orders.find(x=>x.id===b.dataset.id); if (!o) return; navigator.clipboard.writeText(orderText(o)); alert('הועתק'); });
  }

  function renderSettings(){
    const box=$('#settingsSuppliers'); box.innerHTML='';
    state.suppliers.forEach(s=>{
      const el=document.createElement('div');
      el.className='list-simple row';
      el.innerHTML = `<div class="row"><span>${s.name}</span><div class="actions"><button class="edit">עריכה</button></div></div>`;
      box.appendChild(el);
    });
  }

  // Modals behavior
  function openModal(m){ m.classList.add('show'); m.classList.remove('hidden'); }
  function closeModal(m){ m.classList.remove('show'); m.classList.add('hidden'); }
  $$('.modal .modal-backdrop').forEach(bg=>bg.addEventListener('click', ()=> closeModal(bg.parentElement)));

  function getDeliveryOptions(s){
    if (s.deliveryDays && s.deliveryDays.length) return s.deliveryDays;
    const days=[]; const base=new Date();
    for (let i=0;i<7;i++){ const d=new Date(base); d.setDate(base.getDate()+i); days.push(d.toLocaleDateString('he-IL',{weekday:'short', day:'2-digit', month:'2-digit'})); }
    return days;
  }
  function guessDeliveryDate(label){
    const base=new Date();
    for (let i=0;i<7;i++){ const d=new Date(base); d.setDate(base.getDate()+i); const l=d.toLocaleDateString('he-IL',{weekday:'short',day:'2-digit',month:'2-digit'}); if (l===label) return d; }
    const d=new Date(); d.setDate(d.getDate()+2); return d;
  }

  function getSuppliers(){
    return [
      { name:'מזרח מערב', phone:'+972504320036', orderDays:['ב','ה'], items:['אבקת וואסבי','א. ביצים לאיון','אטריות אורז 3 מ"מ','ג'ינג'ר לבן'] },
      { name:'דיפלומט', phone:'+972545650080', orderDays:['ב','ה'], items:['אורז סושי בוטאן','אטריות שעועית','מיונז היינץ SOM','טופו קשה כחול'] },
      { name:'מדג סי פרוט', phone:'+972544335959', orderDays:['ב','ה'], items:['צלופח','שרימפס וונמי','טוביקו ירוק','טוביקו שחור','איקורא','קאט פיש'] }
    ];
  }

  // Prevent double-tap zoom
  let lastTouch=0;
  document.addEventListener('touchend', function (e) {
    const now = (new Date()).getTime();
    if (now - lastTouch <= 300) e.preventDefault();
    lastTouch = now;
  }, { passive:false });

  window._or_state=state;
})();