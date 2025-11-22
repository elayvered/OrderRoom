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

// helper for items
function items(arr){
  return arr.map(n=>({name:n}));
}

// חדפ - רשימת מוצרים מסניף הילס (הרשימה הקיימת)
const HADA_P_ITEMS_HILLS = items([
  'כובע טבח מנייר',
  'מגבון לח אישי קראפט',
  'גליל דיווה',
  'נייר תעשייתי',
  'נוזל כלים מיקס 7',
  'נוזל רצפות 10 ל מיקס 2',
  'מסיר שומנים 108',
  'אקונומיקה',
  'תבליות מלח 25',
  'שקיות אשפה שחור',
  'נילון הפרדה',
  'שקית גופיה שחור',
  'נייר קופות',
  'כלורוסופט DL3',
  'כפפות ויניל ללא אבקה M',
  'כפפות וניל ללא אבקה L',
  'כפפות ניטריל שחור L',
  'סקוץ\' יפני 36',
  'מטליות X70',
  'מילוי מטליות דלי',
  'סקוץ ברזלית 12',
  'ניילון נצמד 30 קטן',
  'ניילון נצמד 45 ארוך',
  'קיסם שחור עטוף',
  'קש שחור',
  'רדיד אלומניום',
  'שקיות שקילה 18/25',
  'שקיות שקילה 20/30',
  'שקיות שקילה 30/40',
  'שקית אוכל פשוט',
  'צץ רץ - רדיד אלומניום',
  'שק זילוף ירוק',
  'שקיות אפור 50\\70',
  'ניר קופה טרמי מדבקה',
  'מיקרופייבר שייני דקו',
  'סינר חד פעמי שטיפה',
  'נייר אפייה 30/50',
  'קערה מלבני קרפט 500',
  'קערה מלבני קרפט 750',
  'קערה מלבני קרפט 1000',
  'מכסה חם מלבני 500',
  'גביע קראפט 500',
  'מכסה לגביע קראפ 500',
  'קערה מרובע 1320',
  'מכסה מרובע חם 1320',
  'גביע רוטב מחובר 10 CC',
  'גביע רוטב מחובר 30 CC',
  'גביע רוטב מחובר 50 CC',
  'גביע רוטב מחובר 100 CC',
  'בל 500 מ"ל',
  'בל 750 מ"ל',
  'מפיות 40/40 לבן ספר',
  'מזלג קשיח שחור',
  'סכין קשיח שחור',
  'כף קשיח שחור',
  'מפיות קוקטייל שחור',
  'מפיות קוקטייל 893',
  'קופסא 1 ל',
  'קופסא 2 ל',
  'קופסא 4.5 ל',
  'מכסה 2 ל',
  'מכסה 4.5 ל',
  'צץ רץ מניפה slim',
  'צץ רץ 3 קימברלי',
  'סחבות רצפה',
  'כוס קראפט חום',
  'ספריי נירוסטה',
  'מטאטא בית',
  'מגב קטן',
  'מגב גדול',
  'יאה + מקל',
  'מקל עץ',
  'פרו 101'
]);

// חדפ - רשימת מוצרים מסניף נורדאו (הרשימה החדשה)
const HADA_P_ITEMS_NORDAU = items([
  'כובע טבח מנייר',
  'מגבון לח אישי קראפט',
  'גליל דיווה רחב גדול',
  'נייר תעשייתי',
  'נוזל כלים מיקס 7',
  'נוזל רצפות 10 ל מיקס 2',
  'מסיר שומנים 108',
  'תבליות מלח 25',
  'אקונומיקה',
  'שקיות אשפה שחור',
  'נילון הפרדה',
  'שקית גופיה שחור',
  'נייר קופה',
  'כלורוסופט DL3',
  'כפפות ויניל ללא אבקה M',
  'כפפות וניל ללא אבקה L',
  'כפפות ניטריל שחור L',
  'סקוץ\' יפני 36',
  'מטליות X70',
  'מילוי מטליות דלי',
  'סקוץ ברזלית 12',
  'צמודית 30 קטן נילון',
  'צמודית 45 פירות נילון',
  'רדיד אלומניום',
  'שקיות שקילה 18/25',
  'שקיות שקילה 20/30',
  'שקיות שקילה 30/40',
  'שקית אוכל פשוט',
  'צץ רץ - רדיד אלומניום',
  'שק זילוף ירוק',
  'ניר קופה טרמי מדבקה',
  'סינר חד פעמי שטיפה',
  'קערה מלבני קרפט 500',
  'קערה מלבני קרפט 750',
  'קערה מלבני קרפט 1000',
  'מכסה חם מלבני קערה 500',
  'גביע קראפט 500',
  'מכסה לגביע קראפ 500',
  'קערה מרובע 1320',
  'מכסה מרובע חם 1320',
  'גביע רוטב מחובר 10 CC',
  'גביע רוטב מחובר 30 CC',
  'גביע רוטב מחובר 50 CC',
  'גביע רוטב מחובר 100 CC',
  'בל 500 מ"ל',
  'בל 750 מ"ל',
  'מפיות 40/40 לבן ספר',
  'מזלג קשיח שחור',
  'סכין קשיח שחור',
  'כף קשיח שחור',
  'קופסא 1 ל',
  'קופסא 2 ל',
  'קופסא 4.5 ל',
  'מכסה 2 ל',
  'מכסה 4.5 ל',
  'צץ רץ 3 - 01890-40',
  'סחבות רצפה 60',
  'כוס קראפט חום',
  'סבון למתקן נורדאו',
  'ספריי נירוסטה',
  'מטאטא בית',
  'מגב קטן',
  'מגב גדול',
  'יאה + מקל',
  'מקל עץ',
  'שקיות זבל מקדונלס'
]);

// החזרת רשימת מוצרים מתאימה לספק ולסניף
function getItemsForSupplierAndBranch(supplier, branch){
  if(supplier.name === 'חדפ'){
    if(branch === 'נורדאו') return HADA_P_ITEMS_NORDAU;
    return HADA_P_ITEMS_HILLS;
  }
  return supplier.items || [];
}

const nav = {
  go(id){
    $$('.view').forEach(v=>v.classList.remove('active'));
    const view = document.getElementById('view-'+id);
    if(view) view.classList.add('active');
    if(id==='home') renderHome();
    if(id==='order') renderOrder();
    if(id==='history') renderHistory();
  }
};

// brand click -> home
document.getElementById('brandHome').addEventListener('click', ()=>nav.go('home'));

// time now
function updateNow(){
  const now = new Date();
  const days = ['א','ב','ג','ד','ה','ו','ש'];
  const el = document.getElementById('nowLine');
  if(!el) return;
  el.textContent = `יום ${days[(now.getDay()+6)%7]} • ${now.toLocaleDateString('he-IL')} • ${now.toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'})}`;
}
setInterval(updateNow, 30000);
updateNow();

// sheets
const backdrop = document.getElementById('backdrop');
const menuSheet = document.getElementById('menuSheet');
const supplierPicker = document.getElementById('supplierPicker');
const deliveryPicker = document.getElementById('deliveryPicker');
const sendPicker = document.getElementById('sendPicker');

function openSheet(sheet, anchor){
  const r = anchor.getBoundingClientRect();
  sheet.style.top = (r.bottom + window.scrollY + 8) + 'px';
  sheet.style.right = (document.documentElement.clientWidth - r.right) + 'px';
  sheet.hidden = false;
  backdrop.hidden = false;
}
function closeSheets(){
  [menuSheet,supplierPicker,deliveryPicker,sendPicker].forEach(s=>s.hidden=true);
  backdrop.hidden = true;
}
backdrop.addEventListener('click', closeSheets);

document.getElementById('menuBtn').addEventListener('click', (e)=> openSheet(menuSheet, e.currentTarget));
menuSheet.addEventListener('click', e=>{
  const btn = e.target.closest('[data-nav]');
  if(!btn) return;
  closeSheets();
  nav.go(btn.dataset.nav);
});

// autosave draft - שמירה לייב על העבודה
function saveDraft(){
  if(!state.activeSupplier){
    localStorage.removeItem('or_draft');
    return;
  }
  const notesEl = document.getElementById('notes');
  const draft = {
    supplierName: state.activeSupplier.name,
    branch: state.activeBranch,
    deliveryDay: state.deliveryDay,
    items: state.items.map(i=>({name:i.name, qty:i.qty || 0, mode:i.mode})),
    notes: notesEl ? (notesEl.value || '') : ''
  };
  localStorage.setItem('or_draft', JSON.stringify(draft));
}

function clearDraft(){
  localStorage.removeItem('or_draft');
}

function loadDraft(){
  const raw = localStorage.getItem('or_draft');
  if(!raw) return;
  try{
    const d = JSON.parse(raw);
    if(!d.supplierName) return;
    const s = state.suppliers.find(sup=>sup.name === d.supplierName);
    if(!s) return;
    state.activeSupplier = s;
    state.activeBranch = d.branch || s.allowedBranches[0] || 'הילס';
    state.deliveryDay = d.deliveryDay || suggestDeliveryDay(s, isoDay(new Date()));
    const baseItems = getItemsForSupplierAndBranch(s, state.activeBranch);
    state.items = baseItems.map(it=>{
      const m = (d.items || []).find(di=>di.name === it.name);
      return {...it, qty:m ? m.qty : 0, mode:m ? m.mode : 'unit'};
    });
    const notesEl = document.getElementById('notes');
    if(notesEl){
      notesEl.value = d.notes || '';
    }
  }catch(e){}
}

// notes autosave
const notesEl = document.getElementById('notes');
if(notesEl){
  notesEl.addEventListener('input', saveDraft);
}

// home
function renderHome(){
  const wrap = document.getElementById('todaySuppliers');
  if(!wrap) return;
  wrap.innerHTML = '';
  state.suppliers.forEach(s=>{
    const el = document.createElement('button');
    el.className = 'supplier';
    el.textContent = s.name;
    el.onclick = ()=> startOrderFor(s);
    wrap.appendChild(el);
  });
}

function startOrderFor(supplier){
  state.activeSupplier = supplier;
  state.activeBranch = supplier.allowedBranches[0] || 'הילס';
  const today = isoDay(new Date());
  state.deliveryDay = suggestDeliveryDay(supplier, today);
  const baseItems = getItemsForSupplierAndBranch(supplier, state.activeBranch);
  state.items = baseItems.map(it=>({ ...it, qty:0, mode:'unit' }));
  const notes = document.getElementById('notes');
  if(notes) notes.value = '';
  saveDraft();
  nav.go('order');
}

// order
function renderOrder(){
  const s = state.activeSupplier;
  if(!s){
    renderHome();
    return;
  }
  const activeSupplierBtn = document.getElementById('activeSupplierBtn');
  if(activeSupplierBtn) activeSupplierBtn.textContent = s.name;

  const bt = document.getElementById('branchToggle');
  if(bt){
    bt.innerHTML = '';
    s.allowedBranches.forEach(br=>{
      const chip = document.createElement('button');
      chip.className = 'chip' + (state.activeBranch===br ? ' active' : '');
      chip.textContent = br;
      chip.onclick = ()=>{
        state.activeBranch = br;
        const baseItems = getItemsForSupplierAndBranch(s, state.activeBranch);
        state.items = baseItems.map(it=>({ ...it, qty:0, mode:'unit' }));
        saveDraft();
        renderOrder();
      };
      bt.appendChild(chip);
    });
  }

  const deliveryLabel = document.getElementById('deliveryLabel');
  if(deliveryLabel) deliveryLabel.textContent = dayLabel(state.deliveryDay);
  const deliveryBtn = document.getElementById('deliveryBtn');
  if(deliveryBtn){
    deliveryBtn.onclick = (e)=>{
      const cont = document.getElementById('deliveryOpts');
      if(!cont) return;
      cont.innerHTML = '';
      allowedDeliveryDays(s).forEach(d=>{
        const c = document.createElement('button');
        c.className = 'chip' + (d===state.deliveryDay ? ' active' : '');
        c.textContent = dayLabel(d);
        c.onclick = ()=>{
          state.deliveryDay = d;
          saveDraft();
          closeSheets();
          renderOrder();
        };
        cont.appendChild(c);
      });
      openSheet(deliveryPicker, e.currentTarget);
    };
  }

  const list = document.getElementById('itemsList');
  if(!list) return;
  list.innerHTML = '';
  state.items.forEach((it, idx)=>{
    const row = document.createElement('div');
    row.className = 'items-row';
    row.innerHTML = `
      <div class="item-name">${it.name}</div>
      <div class="qty">
        <input inputmode="numeric" pattern="[0-9]*" value="${it.qty || ''}" aria-label="כמות" data-idx="${idx}" class="qty-input"/>
        <div class="mode">
          <button class="toggle ${it.mode==='carton'?'active':''}" data-mode="carton" data-idx="${idx}"><img src="assets/box.svg" alt=""> קרטון</button>
          <button class="toggle ${it.mode==='unit'?'active':''}" data-mode="unit" data-idx="${idx}"><img src="assets/unit.svg" alt=""> יח'</button>
        </div>
      </div>`;
    list.appendChild(row);
  });

  $$('.qty-input').forEach(inp=>{
    inp.addEventListener('focus', ()=>{
      inp.scrollIntoView({block:'center',behavior:'smooth'});
    });
    inp.addEventListener('input', ()=>{
      const i = +inp.dataset.idx;
      const val = inp.value.trim();
      state.items[i].qty = val === '' ? 0 : Math.max(0, parseInt(val || '0', 10));
      saveDraft();
    });
  });

  $$('.mode .toggle').forEach(btn=>{
    btn.onclick = ()=>{
      const i = +btn.dataset.idx;
      state.items[i].mode = btn.dataset.mode;
      saveDraft();
      renderOrder();
    };
  });

  const saveBtn = document.getElementById('saveBtn');
  if(saveBtn) saveBtn.onclick = onSaveOrder;
  const sendBtn = document.getElementById('sendBtn');
  if(sendBtn) sendBtn.onclick = onSendOrder;
}

// save helpers
function saveOrderToHistory(opts={}){
  const silent = !!opts.silent;
  const o = buildOrderObject();
  if(!o.items.length && !o.notes) return null;
  state.orders.unshift(o);
  localStorage.setItem('or_orders', JSON.stringify(state.orders));
  if(!silent) alert('ההזמנה נשמרה מקומית');
  return o;
}

function onSaveOrder(){
  const o = saveOrderToHistory({silent:false});
  if(o){
    clearDraft();
    renderHistory();
  }
}

function onSendOrder(e){
  const anchor = e && e.currentTarget ? e.currentTarget : document.getElementById('sendBtn');
  saveOrderToHistory({silent:true});
  clearDraft();
  if(anchor) openSheet(sendPicker, anchor);

  const sendWA = document.getElementById('sendWA');
  if(sendWA){
    sendWA.onclick = ()=>{
      const url = 'https://wa.me/'+normalizePhone(state.activeSupplier.phone)+'?text='+encodeURIComponent(buildOrderMessage());
      window.open(url,'_blank');
      closeSheets();
    };
  }
  const sendMail = document.getElementById('sendMail');
  if(sendMail){
    sendMail.onclick = ()=>{
      const subj = 'הזמנת סחורה - '+state.activeSupplier.name;
      const url = 'mailto:'+(state.activeSupplier.email||'')+'?subject='+encodeURIComponent(subj)+'&body='+encodeURIComponent(buildOrderMessage());
      window.location.href = url;
      closeSheets();
    };
  }
  const sendCopy = document.getElementById('sendCopy');
  if(sendCopy){
    sendCopy.onclick = async ()=>{
      try{
        await navigator.clipboard.writeText(buildOrderMessage());
        alert('הועתק');
      }catch(e){}
      closeSheets();
    };
  }
}

function buildOrderObject(){
  const itemsClean = state.items
    .filter(i=>i.qty>0)
    .map(i=>({name:i.name,qty:i.qty,mode:i.mode}));
  const notesNode = document.getElementById('notes');
  return {
    ts: Date.now(),
    supplier: state.activeSupplier ? state.activeSupplier.name : '',
    branch: state.activeBranch,
    deliveryDay: state.deliveryDay,
    items: itemsClean,
    notes: notesNode ? (notesNode.value || '') : ''
  };
}

function branchLabelForMessage(branch){
  if(branch==='הילס') return 'הילס - אריק איינשטיין 3 הרצליה';
  if(branch==='נורדאו') return 'נורדאו 4 הרצליה';
  return branch;
}

function buildOrderMessage(){
  const o = buildOrderObject();
  const lines = [];
  lines.push('הזמנת סחורה - סושי רום - '+o.supplier);
  lines.push('סניף: '+branchLabelForMessage(o.branch));
  lines.push('יום אספקה: '+dayLabel(o.deliveryDay));
  lines.push('פריטים:');
  o.items.forEach(i=>
    lines.push('• '+i.name+' - '+i.qty+' '+(i.mode==='carton'?'קרטון':'יח'))
  );
  if(o.notes) lines.push('הערות: '+o.notes);
  lines.push('תודה');
  return lines.join('\n');
}

// history
function renderHistory(){
  const list = document.getElementById('historyList');
  if(!list) return;
  list.innerHTML = '';
  if(!state.orders.length){
    list.innerHTML = '<div class="h-item">אין הזמנות שמורות</div>';
    return;
  }
  state.orders.forEach((o, idx)=>{
    const d = new Date(o.ts);
    const el = document.createElement('div');
    el.className = 'h-item';
    el.innerHTML = `
      <div class="row"><b>${o.supplier}</b><span>${d.toLocaleString('he-IL')}</span></div>
      <div class="row"><span>סניף: ${o.branch}</span><span>אספקה: ${dayLabel(o.deliveryDay)}</span></div>
      <div>${o.items.map(i=>`${i.name} (${i.qty} ${i.mode==='carton'?'קרטון':'יח'})`).join(', ')}</div>
      <div class="row">
        <button class="btn" data-act="again">שלח שוב</button>
        <button class="btn ghost" data-act="delete">מחק</button>
      </div>`;
    el.querySelector('[data-act="again"]').onclick = ()=>{
      const s = state.suppliers.find(sup=>sup.name===o.supplier);
      if(s){
        state.activeSupplier = s;
        state.activeBranch = o.branch;
        state.deliveryDay = o.deliveryDay;
        const baseItems = getItemsForSupplierAndBranch(s, o.branch);
        state.items = baseItems.map(it=>{
          const m = o.items.find(oi=>oi.name===it.name);
          return {...it, qty:m?m.qty:0, mode:m?m.mode:'unit'};
        });
        const notesNode = document.getElementById('notes');
        if(notesNode){
          notesNode.value = o.notes || '';
        }
        saveDraft();
        nav.go('order');
        onSendOrder();
      }
    };
    el.querySelector('[data-act="delete"]').onclick = ()=>{
      state.orders.splice(idx,1);
      localStorage.setItem('or_orders', JSON.stringify(state.orders));
      renderHistory();
    };
    list.appendChild(el);
  });
}

// helpers & data
function dayLabel(d){
  return ({1:'יום ב',2:'יום ג',3:'יום ד',4:'יום ה',5:'יום ו',6:'שבת',7:'יום א'})[d]||'';
}
function isoDay(dt){
  const g = dt.getDay();
  return g===0 ? 7 : g;
}
function normalizePhone(p){
  return (p||'').replace(/\D+/g,'');
}
function canOrderToday(s,day){
  if(s.orderToDelivery) return !!s.orderToDelivery[day];
  return true;
}
function suggestDeliveryDay(s,orderDay){
  if(s.orderToDelivery && s.orderToDelivery[orderDay]) return s.orderToDelivery[orderDay];
  const allowed = allowedDeliveryDays(s);
  if(!allowed.length) return orderDay;
  let d = orderDay;
  for(let i=0;i<7;i++){
    if(allowed.includes(d)) return d;
    d = d===7 ? 1 : d+1;
  }
  return orderDay;
}
function allowedDeliveryDays(s){
  if(s.allowedDeliveryDays) return s.allowedDeliveryDays;
  return [1,2,3,4,5,7];
}

function getSuppliers(){
  const both = ['הילס','נורדאו'], H = ['הילס'], N = ['נורדאו'];
  const thuMon = {4:1,1:4};
  const dimsum = {1:4,4:2};
  const hendels = {1:3,4:1};

  return [
    {name:'מזרח מערב',phone:'+972504320036',allowedBranches:both,orderToDelivery:thuMon,items:items(['אבקת וואסבי','א. ביצים לאיון','אטריות אורז 3 מ"מ','ג\'ינג\'ר לבן','מגש 03','מגש 07','מחית צ\'ילי בשמן','מחית קארי ירוק','מחית קארי אדום','תמרהינדי','מיסו לבן דאשי','מירין גדול','סויה ירוק גדול','סויה ללג גדול','סאקה גדול','פנקו','רוטב דגים 4 ל','רוטב פטריות','שומשום שחור','שמן צ\'ילי','שמן שומשום','קרם קוקוס גדול','טמפורה','יוזו גדול','יוזו גדול ללא מלח','סוכר דקלים','צדפות שימורים','בצל מטוגן','אבקת חרדל יפני','טוגראשי','טום יאם','קנפיו קילו','מגש מסיבה L','מגש מסיבה M','סויה גולדן מאונטן','חטיפי אצות','סויה כהה','חומץ אורז','אנשובי בשמן גדול','אצות נורי קוריאה','אורז יסמין','שיפודי קשר','אבקת מאצה','ליקר מאצה','רשת לסיר אורז','כף ווק','ווק','דפי רשת אורז','אצות וואקמה','אצות קומבו','דאשי','אררה','צ’ופסטיקס חבק שחור','שיפודי יקיטורי'])},
    {name:'דיפלומט',phone:'+972545650080',allowedBranches:both,orderToDelivery:thuMon,items:items(['אורז סושי בוטאן','אטריות שעועית','מיונז היינץ SOM','טופו קשה כחול','דיספנסר אדום','דיספנסר ירוק דל מלח','קטשופ לחיצה היינץ','סקיפי גדול','צילי מתוק הלתי בוי','צילי חריף הלתי בוי','שיטאקי','מחית פלפל קוראני','סויה גדול 15.1','סויה מנות TA','סויה מנות ירוק  TA','מחית כמהין קטן'])},
    {name:'מדג סי פרוט',phone:'+972544335959',allowedBranches:both,orderToDelivery:thuMon,items:items(['צלופח','שרימפס וונמי','טוביקו ירוק','טוביקו שחור','איקורא','קאט פיש'])},
    {name:'קרים צ\'יז',phone:'+972546766364',allowedBranches:H,allowedDeliveryDays:[1,3],items:items(['קרים צ\'יז','בלוק חמאה צהובה','פרמזן גוש'])},
    {name:'הנדלס',phone:'+972526010182',allowedBranches:both,orderToDelivery:hendels,items:items(['מעדן אווז'])},
    {name:'מר קייק',phone:'+972544748466',allowedBranches:H,items:items(['מחית וניל','שוקולד לבן','מחית פטל קפוא','סוכר אינוורטי','נייר אפייה','קסנטן','אבץ','פקטין NH'])},
    {name:'מדיח חגי',phone:'+97239071742',allowedBranches:both,items:items(['מבריק','סבון'])},
    {name:'דים סאם',phone:'+972585533322',allowedBranches:both,orderToDelivery:dimsum,items:items(['באן כפפה'])},
    {name:'דיפ שיווק',phone:'+972508873018',allowedBranches:both,orderToDelivery:thuMon,items:items(['אבקת בצל','אבקת שום','פפריקה מתוקה','אבקת סוכר','קשיו מסוכר','בוטן מטוגן שיקרצקי','סילאן גאלון','חרדל חלק דלי','חומץ סינטטי לבן שקוף','מונוסודיום','מיונז הלמנס גדול','שמן סויה פלסטיק','מלח גס שרוול','מלח דק שרוול','מקלות קינמון','מלח לימון ק','סוכר לבן סוגת שרוול','סוכר חום כהה','אבקת אפיה','פסיטוק מקולף שלם','קמח תפוח אדמה','קמח לבן שרוול','קוקוס טחון לבן','קורנפלור','שומשום לבן','ציר בקר משחה קנור','רוטב נפאלי קנור','דמי גלאס','דבש','כוכב אניס','הל שלם','זרעי כוסברה','צלפים במלח','בלסמי','פירורי לחם 1 קג'])},
    {
      name:'חדפ',
      phone:'+972543450109',
      allowedBranches:both,
      orderToDelivery:thuMon,
      items: HADA_P_ITEMS_HILLS,
      itemsH: HADA_P_ITEMS_HILLS,
      itemsN: HADA_P_ITEMS_NORDAU
    },
    {name:'מטעמי ישראל',phone:'+972547499403',allowedBranches:N,orderToDelivery:thuMon,items:items(['גיוזה פרגית','גיוזה בקר','גיוזה פטריות','אטריות ראמן'])},
    {name:'אייס דרים',phone:'+972542408000',allowedBranches:both,orderToDelivery:thuMon,items:items(['מחית מנדרינה בוארון','מחית פסיפלורה בוארון','מחית תפוז דם בוארון','בלוברי קפוא (קרטון בלבד)','פטל אדום קפוא (קרטון בלבד)','אננס 2 קג','מנגו 2 קג'])}
  ];
}

// טעינת דרפט אם קיים - ואז כניסה למסך המתאים
loadDraft();
if(state.activeSupplier){
  nav.go('order');
}else{
  nav.go('home');
}

})();
