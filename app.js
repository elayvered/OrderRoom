
(function(){
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const DAYS = ['א','ב','ג','ד','ה','ו']; // Sun..Fri

  const state = {
    activeSupplier:null,
    activeBranch:'הילס',
    deliveryDay:null,
    orders: JSON.parse(localStorage.getItem('or_orders')||'[]')
  };

  function renderHome(){
    const today = new Date();
    $('#todayLine').textContent = new Intl.DateTimeFormat('he-IL',{weekday:'long',day:'2-digit',month:'2-digit'}).format(today);
    const cont=$('#todaySuppliers'); cont.innerHTML='';
    OR_SUPPLIERS.forEach(sp=>{
      const tile=document.createElement('button'); tile.className='supplier-tile'; tile.textContent=sp.name;
      tile.onclick=()=>openOrder(sp);
      cont.appendChild(tile);
    });
    const r=$('#recentOrders'); r.innerHTML='';
    state.orders.slice(-4).reverse().forEach(ord=>{
      const c=document.createElement('div'); c.className='recent-card';
      c.innerHTML=`<div><div style="font-weight:800">${ord.supplier} • ${ord.branch}</div><small style="color:#667085">${ord.deliveryDay?('אספקה: יום '+ord.deliveryDay):''}</small></div>
      <div style="display:flex;gap:8px"><button class="menu-item" data-view="${ord.id}">צפייה</button><button class="menu-item" data-resend="${ord.id}">שליחה</button></div>`;
      c.querySelector('[data-view]').onclick=()=>viewOrder(ord);
      c.querySelector('[data-resend]').onclick=()=>openSendDialog(ord);
      r.appendChild(c);
    });
  }
  $('#btnNewOrder').onclick = ()=>{ openOrder(null); };

  function openOrder(sp){
    state.activeSupplier = sp || null;
    $('#btnSupplierName').textContent = sp? sp.name : 'בחר ספק';
    buildBranchSwitch(sp);
    state.deliveryDay = suggestDelivery(sp);
    setDayChip(state.deliveryDay);
    buildItems(sp);
    switchScreen('screenOrder');
    if(!sp) openSupplierPicker();
  }

  function buildBranchSwitch(sp){
    const el=$('#branchSwitch'); el.innerHTML='';
    const arr = sp?.branches || ['הילס','נורדאו'];
    arr.forEach(b=>{
      const btn=document.createElement('button');
      btn.className='chip'+(state.activeBranch===b?' active':'');
      btn.textContent=b;
      btn.onclick=()=>{state.activeBranch=b; buildBranchSwitch(sp);};
      el.appendChild(btn);
    });
  }

  function suggestDelivery(sp){
    if(!sp) return null;
    const today = new Date();
    const todayHeb = DAYS[(today.getDay()+6)%7];
    if(sp.allowedDeliveryDays){
      return sp.allowedDeliveryDays[0];
    }
    if(sp.orderToDelivery && sp.orderToDelivery[todayHeb]) return sp.orderToDelivery[todayHeb];
    return 'ב';
  }
  function setDayChip(d){ $('#btnDeliveryDay').textContent = d? ('יום '+d) : 'בחר יום אספקה'; }

  function buildItems(sp){
    const cont=$('#itemsList'); cont.innerHTML='';
    const list = sp? sp.items : [];
    list.forEach(name=>{
      const row=document.createElement('div'); row.className='item-card';
      row.innerHTML=`<div class="item-name">${name}</div>
      <div class="qty-row">
        <input type="number" inputmode="numeric" pattern="[0-9]*" class="qty-input" min="0" value="0">
        <div class="mode-switch">
          <button class="active"><img src="assets/box.svg" alt=""> קרטון</button>
          <button><img src="assets/unit.svg" alt=""> יח'</button>
        </div>
      </div>`;
      const buttons=row.querySelectorAll('.mode-switch button');
      buttons.forEach(b=>b.onclick=()=>{buttons.forEach(x=>x.classList.remove('active')); b.classList.add('active');});
      cont.appendChild(row);
    });
  }

  const backdrop=$('#backdrop');
  $('#btnMenu').onclick=()=>{ $('#slideMenu').classList.add('open'); backdrop.classList.add('show'); };
  backdrop.onclick=()=>{ $('#slideMenu').classList.remove('open'); closeSheets(); closeDialog(); };

  function openSheet(el){ el.classList.add('show'); backdrop.classList.add('show'); }
  function closeSheets(){ $$('.sheet').forEach(s=>s.classList.remove('show')); }

  function openSupplierPicker(){
    const grid=$('#supplierGrid'); grid.innerHTML='';
    OR_SUPPLIERS.forEach(sp=>{
      const b=document.createElement('button'); b.className='supplier-tile'; b.textContent=sp.name;
      b.onclick=()=>{ closeSheets(); openOrder(sp); };
      grid.appendChild(b);
    });
    openSheet($('#supplierSheet'));
  }
  $('#btnSupplierName').onclick=openSupplierPicker;

  $('#btnDeliveryDay').onclick=()=>{
    const row=$('#daysRow'); row.innerHTML='';
    const sp = state.activeSupplier;
    const avail = d => !sp?.allowedDeliveryDays || sp.allowedDeliveryDays.includes(d);
    DAYS.forEach(d=>{
      const allowed = avail(d);
      const b=document.createElement('button'); b.className='day-btn'+(state.deliveryDay===d?' active':'')+(allowed?'':' disabled');
      b.textContent='יום '+d;
      if(allowed){
        b.onclick=()=>{ state.deliveryDay=d; setDayChip(d); closeSheets(); };
      }
      row.appendChild(b);
    });
    openSheet($('#daySheet'));
  };

  function collectItems(){
    const list=[];
    $$('#itemsList .item-card').forEach(row=>{
      const qty = Number(row.querySelector('.qty-input')?.value||0);
      if(qty>0){
        const mode = row.querySelector('.mode-switch .active')?.textContent.includes('יח') ? 'יח' : 'קרטון';
        list.push({name: row.querySelector('.item-name').textContent.trim(), qty, mode});
      }
    });
    return list;
  }

  function buildOrder(){
    return {
      id: Date.now(),
      supplier: state.activeSupplier?.name || '',
      branch: state.activeBranch,
      deliveryDay: state.deliveryDay,
      notes: $('#orderNotes').value || '',
      items: collectItems()
    };
  }

  function buildText(o){
    const L=[];
    L.push('הזמנת סחורה – סושי רום');
    if(o.supplier) L.push('ספק: '+o.supplier);
    L.push('סניף: '+o.branch);
    if(o.deliveryDay) L.push('יום אספקה: יום '+o.deliveryDay);
    if(o.items.length){
      L.push('פריטים:');
      o.items.forEach(i=>L.push('• '+i.name+' — '+i.qty+' '+i.mode));
    } else {
      L.push('אין פריטים');
    }
    if(o.notes) L.push('הערות: '+o.notes);
    L.push('אודה לאישורכם בהודעה חוזרת');
    return L.join('\\n');
  }

  $('#btnSave').onclick = ()=>{
    const o = buildOrder();
    if(!o.items.length){ alert('לא ניתן לשמור הזמנה ריקה'); return; }
    state.orders.push(o);
    localStorage.setItem('or_orders', JSON.stringify(state.orders));
    alert('ההזמנה נשמרה');
  };

  $('#btnSend').onclick = ()=>{
    const o = buildOrder();
    if(!o.items.length){ alert('הוסף לפחות פריט אחד לפני שליחה'); return; }
    openSendDialog(o);
  };

  function openSendDialog(order){
    $('#orderSummary').textContent = buildText(order);
    $('#sendDialog').classList.add('show'); backdrop.classList.add('show');
    $('#sendWhatsApp').onclick = ()=>{
      window.open('https://wa.me/?text='+encodeURIComponent(buildText(order)),'_blank'); closeDialog();
    };
    $('#sendMail').onclick = ()=>{
      window.location.href = 'mailto:?subject='+encodeURIComponent('הזמנת סחורה – '+(order.supplier||''))+'&body='+encodeURIComponent(buildText(order)); closeDialog();
    };
    $('#sendCopy').onclick = ()=>{
      navigator.clipboard.writeText(buildText(order)).then(()=>alert('ההזמנה הועתקה')); closeDialog();
    };
  }
  function closeDialog(){ $('#sendDialog').classList.remove('show'); }

  function viewOrder(o){
    $('#orderSummary').textContent = buildText(o);
    $('#sendDialog').classList.add('show'); backdrop.classList.add('show');
  }

  function switchScreen(id){
    $$('.screen').forEach(s=>s.classList.remove('active'));
    $('#'+id).classList.add('active');
    window.scrollTo({top:0,behavior:'instant'});
  }

  (function init(){
    // iOS zoom prevention: inputs >= 16px already
    renderHome();
    switchScreen('screenHome');
  })();
})();