
// Utilities
const $ = s=>document.querySelector(s), $$ = s=>Array.from(document.querySelectorAll(s));
const sleep = ms => new Promise(r=>setTimeout(r,ms));

const state = {
  route:'home',
  suppliers:[], itemsBySupplier:{}, branches:[],
  activeSupplier:null, activeBranch:null,
  orderDay:null, deliveryDay:null,
  draft:{},
  history:[],
  overlay:{} // local edits for admin
};

function todayKey(){return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()];}
function hebDate(d=new Date()){return d.toLocaleDateString('he-IL',{weekday:'long',day:'2-digit',month:'2-digit',year:'2-digit'});}
function toast(msg){const t=$('#toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1700);}
function el(t,a={},c=[]){const e=document.createElement(t); for(const[k,v] of Object.entries(a)){ if(k==='class') e.className=v; else if(k==='html') e.innerHTML=v; else e.setAttribute(k,v);} (c||[]).forEach(x=>e.append(x)); return e;}
function loadLS(){ try{Object.assign(state, JSON.parse(localStorage.getItem('or_state')||'{}'));}catch{} }
function saveLS(){ const copy={draft:state.draft, overlay:state.overlay, history:state.history}; localStorage.setItem('or_state', JSON.stringify(copy)); }

loadLS();

async function jget(u){const r=await fetch(u,{cache:'no-store'}); if(!r.ok) throw new Error(r.statusText); return r.json();}
async function loadData(){
  const base = OR_CONFIG.DATA_BASE;
  state.suppliers = await jget(`${base}/suppliers.json`);
  state.branches = await jget(`${base}/branches.json`);
  for(const s of state.suppliers){
    try{
      state.itemsBySupplier[s.id] = await jget(`${base}/${s.id}/items.json`);
    }catch{ state.itemsBySupplier[s.id] = []; }
  }
  if(!state.activeSupplier && state.suppliers.length) state.activeSupplier = state.suppliers[0].id;
  if(!state.activeBranch && state.branches.length) state.activeBranch = state.branches[0].id;
}

function navTo(r){ state.route=r; $$('.tab').forEach(t=>t.classList.toggle('active', t.dataset.route===r)); render(); }

function qtyOf(s,b,i){ return (((state.draft||{})[s]||{})[b]||{})[i]||0; }
function setQty(s,b,i,v){ state.draft[s]=state.draft[s]||{}; state.draft[s][b]=state.draft[s][b]||{}; state.draft[s][b][i]=v; saveLS(); }

function supplierById(id){ return state.suppliers.find(x=>x.id===id); }
function branchById(id){ return state.branches.find(x=>x.id===id); }

/* ---------- Modal helpers ---------- */
function openSheet(title, bodyNodes){
  $('#modalTitle').textContent=title;
  const body=$('#modalBody'); body.replaceChildren(...(bodyNodes||[]));
  $('#modalBack').classList.add('show');
  $('#modalBack').onclick = e=>{ if(e.target.id==='modalBack') $('#modalBack').classList.remove('show'); };
}
function closeSheet(){ $('#modalBack').classList.remove('show'); }

/* ---------- Views ---------- */
function renderHeader(){ $('#ver').textContent='v '+(OR_CONFIG.VERSION||'Standalone'); }

function renderHome(){
  const v=$('#view'); v.replaceChildren();
  const now=new Date();
  v.append(
    el('div',{class:'card vstack'},[
      el('div',{class:'section-title',html:`${hebDate(now)} · ${now.toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'})}`}),
      el('div',{class:'note',html:'אפליקציית הזמנות סחורה החכמה של סושי רום'})
    ])
  );

  // panels
  const today = todayKey();
  const toOrder = el('div',{class:'card vstack'});
  toOrder.append(el('div',{class:'section-title',html:'הזמנות להכניס היום'}));
  const listTo = el('div',{class:'vstack'});
  toOrder.append(listTo);

  const arriving = el('div',{class:'card vstack'});
  arriving.append(el('div',{class:'section-title',html:'הזמנות שמגיעות היום'}));
  const listArr = el('div',{class:'vstack'});
  arriving.append(listArr);

  for(const s of state.suppliers){
    if((s.order_days||[]).includes(today)){
      const card=el('div',{class:'select-item'},[
        el('div',{html:`<strong>${s.name}</strong> <span class="small">הזן הזמנה</span>`}),
        el('span',{class:'badge',html:'פתח'})
      ]);
      card.onclick=()=>{ state.activeSupplier=s.id; navTo('orders'); };
      listTo.append(card);
    }
    const del = (s.delivery_by_order_day||{})[today];
    if(del===today){
      listArr.append(el('div',{class:'select-item'},[el('div',{html:`<strong>${s.name}</strong> <span class="small">אספקה היום</span>`})]));
    }
  }
  v.append(el('div',{class:'home-panels'},[toOrder,arriving]));
}

function renderOrders(){
  const v=$('#view'); v.replaceChildren();
  const sId = state.activeSupplier || (state.suppliers[0]&&state.suppliers[0].id);
  if(!sId){ v.textContent='אין ספקים'; return; }
  const s = supplierById(sId);
  const items = state.itemsBySupplier[sId]||[];

  // header card
  const head = el('div',{class:'card vstack'});
  head.append(el('div',{class:'section-title',html:`הזמנה — <strong>${s.name}</strong>`}));

  // branches chips
  let allowed = (s.branches && s.branches.length) ? s.branches : state.branches.map(b=>b.id);
  if(!allowed.includes(state.activeBranch)) state.activeBranch=allowed[0];
  const chips = el('div',{class:'chips'});
  for(const bid of allowed){
    const br = branchById(bid)||{id:bid,name:bid};
    const chip=el('div',{class:'chip'+(state.activeBranch===bid?' active':''),html:br.name});
    chip.onclick=()=>{state.activeBranch=bid; render();};
    chips.append(chip);
  }
  head.append(el('div',{class:'vstack'},[el('div',{class:'small',html:'סניף'}), chips]));

  // order/delivery
  const today = todayKey();
  state.orderDay = today;
  state.deliveryDay = (s.delivery_by_order_day||{})[today] || null;
  const dayRow = el('div',{class:'chips'});
  const orderChip = el('div',{class:'chip active',html:`יום הזמנה: ${hebDate(new Date())}`});
  const delChip = el('div',{class:'chip',html:`יום אספקה: ${state.deliveryDay || '—'}`});
  dayRow.append(orderChip, delChip);
  head.append(dayRow);

  // open delivery day picker when press
  delChip.onclick=()=>{
    const list = (['Sun','Mon','Tue','Wed','Thu','Fri','Sat']).map(d=>{
      const it=el('div',{class:'select-item'},[el('div',{html:`<strong>${d}</strong>`}), el('img',{src:'./assets/icons/chev.svg',height:'16'})]);
      it.onclick=()=>{ state.deliveryDay=d; delChip.innerHTML=`יום אספקה: ${d}`; closeSheet(); };
      return it;
    });
    openSheet('בחר יום אספקה', list);
  };

  v.append(head);

  // items list
  const list = el('div',{class:'vstack'});
  items.forEach((it,idx)=>{
    if(it.active===false) return;
    const row=el('div',{class:'card item-row'});
    row.append(el('div',{class:'item-name',html: it.name + (it.unit?` <span class="small">(${it.unit})</span>`:'')}));
    const qty=el('div',{class:'qty'});
    const input=el('input',{type:'number',inputmode:'numeric',value: qtyOf(sId, state.activeBranch, it.id)});
    input.oninput = ()=> setQty(sId, state.activeBranch, it.id, Number(input.value)||0);
    qty.append(input);
    row.append(qty);
    list.append(row);
  });
  v.append(list, el('div',{class:'note',html:'שדות ריקים לא יופיעו בהודעה. ההזמנה נשמרת בהיסטוריה לפני שליחה.'}));

  // actions
  const bar = $('#actionsBar'); bar.style.display='flex';
  $('#btnCopy').onclick=()=>sendOrder('copy', s);
  $('#btnMail').onclick=()=>sendOrder('mail', s);
  $('#btnWa').onclick=()=>sendOrder('wa', s);
}

function renderHistory(){
  const v=$('#view'); v.replaceChildren();
  if(!(state.history||[]).length){ v.textContent='אין היסטוריה עדיין'; $('#actionsBar').style.display='none'; return; }
  const wrap=el('div',{class:'vstack'});
  [...state.history].reverse().forEach(rec=>{
    wrap.append(el('div',{class:'card vstack'},[
      el('div',{class:'section-title',html:`${rec.supplierName} · ${rec.branchName}`}),
      el('div',{class:'small',html:new Date(rec.createdAt).toLocaleString('he-IL')}),
      el('div',{html:`<pre style="white-space:pre-wrap;direction:rtl">${rec.message}</pre>`})
    ]));
  });
  v.append(wrap);
}

function renderAdmin(){
  const v=$('#view'); v.replaceChildren();

  const header = el('div',{class:'card vstack'},[
    el('div',{class:'section-title',html:'ניהול ספקים ופריטים'}),
    el('div',{class:'small',html:'בחר ספק לעריכה, שלוט בשם, אמצעי קשר, סניפים, ימי הזמנה וימי אספקה, ועריכת פריטים כולל סדר והפעלה.'})
  ]);

  const list = el('div',{class:'card vstack'});
  state.suppliers.forEach(s=>{
    const item = el('div',{class:'select-item'},[
      el('div',{html:`<strong>${s.name}</strong> <span class="small">${s.email||''} ${s.phone?('· '+s.phone):''}</span>`}),
      el('span',{class:'badge',html:'עריכה'})
    ]);
    item.onclick = ()=> openSupplierEditor(s.id);
    list.append(item);
  });

  const tools = el('div',{class:'card vstack'},[
    el('div',{class:'section-title',html:'כלים'}),
    el('div',{class:'vstack'},[
      el('button',{class:'btn',id:'btnExport',html:'ייצוא נתונים (JSON)'})
    ])
  ]);

  v.append(header, list, tools);
  $('#actionsBar').style.display='none';

  $('#btnExport').onclick=()=>{
    const payload = {
      suppliers: state.suppliers,
      branches: state.branches,
      itemsBySupplier: state.itemsBySupplier
    };
    const blob = new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='orderroom-data-export.json'; a.click();
    toast('נוצר קובץ JSON');
  };
}

function openSupplierEditor(id){
  const s = supplierById(id);
  const body=[];

  // Name
  const rowName = el('div',{class:'row'},[el('label',{html:'שם ספק'}), el('input',{type:'text',value:s.name,id:'s_name'})]);
  // Phone & email
  const rowPhone = el('div',{class:'row'},[el('label',{html:'טלפון'}), el('input',{type:'tel',value:s.phone||'',id:'s_phone'})]);
  const rowMail  = el('div',{class:'row'},[el('label',{html:'מייל'}), el('input',{type:'email',value:s.email||'',id:'s_mail'})]);

  // Branches
  const brWrap = el('div');
  state.branches.forEach(b=>{
    const idc=`br_${b.id}`;
    const chk=el('input',{type:'checkbox',id:idc, checked:(s.branches||[]).includes(b.id)});
    const lab=el('label',{for:idc, html:` ${b.name}`});
    const line=el('div'); line.append(chk, lab); brWrap.append(line);
  });
  const rowBranches = el('div',{class:'row'},[el('label',{html:'סניפים'}), brWrap]);

  // Order days (multi toggle)
  const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const odWrap = el('div',{class:'chips'});
  days.forEach(d=>{
    const c=el('div',{class:'chip'+((s.order_days||[]).includes(d)?' active':''),html:d});
    c.onclick=()=>{ const arr=s.order_days||[]; const i=arr.indexOf(d); if(i>-1) arr.splice(i,1); else arr.push(d); s.order_days=arr; c.classList.toggle('active'); };
    odWrap.append(c);
  });
  const rowOrderDays = el('div',{class:'row'},[el('label',{html:'ימי הזמנה'}), odWrap]);

  // Delivery by order day
  const delMapWrap = el('div',{class:'chips'});
  days.forEach(d=>{
    const current = (s.delivery_by_order_day||{})[d] || '—';
    const chip=el('div',{class:'chip',html:`${d} → ${current}`});
    chip.onclick=()=>{
      const opts = days.map(dd=>{
        const it=el('div',{class:'select-item'},[el('div',{html:`<strong>${dd}</strong>`})]);
        it.onclick=()=>{ s.delivery_by_order_day = Object.assign({},s.delivery_by_order_day||{}, {[d]:dd}); chip.innerHTML = `${d} → ${dd}`; closeSheet(); };
        return it;
      });
      openSheet(`אספקה ל־${d}`, opts);
    };
    delMapWrap.append(chip);
  });
  const rowDelMap = el('div',{class:'row'},[el('label',{html:'יום אספקה'}), delMapWrap]);

  // Items editor button
  const rowItemsBtn = el('div',{class:'row'},[el('label',{html:'פריטים'}), el('button',{class:'btn',html:'עריכת פריטים',id:'btnItems'})]);

  // Save
  const saveBtn = el('div',{class:'vstack'},[ el('button',{class:'btn primary',html:'שמירה',id:'btnSave'}) ]);

  body.push(rowName,rowPhone,rowMail,rowBranches,rowOrderDays,rowDelMap,rowItemsBtn,saveBtn);
  openSheet('עריכת ספק', body);

  $('#btnItems').onclick=()=> openItemsEditor(s.id);
  $('#btnSave').onclick=()=>{
    s.name = $('#s_name').value.trim()||s.name;
    s.phone = $('#s_phone').value.trim();
    s.email = $('#s_mail').value.trim();
    if(!s.branches || !s.branches.length){ s.branches = state.branches.map(b=>b.id); }
    toast('נשמר');
    saveLS();
    closeSheet();
    renderAdmin();
  };
}

function openItemsEditor(sid){
  const s = supplierById(sid);
  const items = state.itemsBySupplier[sid] || [];
  const body = [];

  const list = el('div',{class:'vstack'});
  items.sort((a,b)=>(a.position||999)-(b.position||999)).forEach(it=>{
    const row=el('div',{class:'select-item'},[
      el('div',{html:`<strong>${it.name}</strong> <span class="small">${it.unit||''}</span>`}),
      el('div',{class:'toggle'},[
        el('button',{class: 'active', html:'ON'}),
        el('button',{html:'OFF'})
      ])
    ]);
    const btns=row.lastChild.children;
    const sync=()=>{ btns[0].classList.toggle('active', it.active!==false); btns[1].classList.toggle('active', it.active===false); };
    btns[0].onclick=()=>{ it.active=true; sync(); };
    btns[1].onclick=()=>{ it.active=false; sync(); };
    sync();
    row.onclick= (e)=>{
      if(e.target.tagName==='BUTTON') return;
      // open inline editor
      const editor = el('div',{class:'vstack'},[
        el('div',{class:'row'},[el('label',{html:'שם'}), el('input',{type:'text',value:it.name, id:`n_${it.id}`})]),
        el('div',{class:'row'},[el('label',{html:'יח׳ מידה'}), el('input',{type:'text',value:it.unit||'', id:`u_${it.id}`})]),
        el('div',{class:'row'},[el('label',{html:'מחיר'}), el('input',{type:'number',value:it.price||0, id:`p_${it.id}`})]),
        el('div',{class:'vstack'},[el('button',{class:'btn',html:'שמירת פריט',id:`s_${it.id}`})])
      ]);
      row.after(editor);
      editor.querySelector(`#s_${it.id}`).onclick=()=>{
        it.name = editor.querySelector(`#n_${it.id}`).value.trim()||it.name;
        it.unit = editor.querySelector(`#u_${it.id}`).value.trim();
        it.price = Number(editor.querySelector(`#p_${it.id}`).value||0);
        toast('פריט עודכן');
        editor.remove();
        openItemsEditor(sid); // rerender
      };
    };
    list.append(row);
  });

  const add = el('button',{class:'btn',html:'הוספת פריט'});
  add.onclick=()=>{
    const nid = `item_${(items.length+1+'').padStart(3,'0')}`;
    items.push({id:nid,name:'פריט חדש',unit:'',price:0,position:items.length+1,active:true});
    openItemsEditor(sid);
  };

  body.push(list, el('div',{class:'vstack'},[add]));
  openSheet(`פריטים · ${s.name}`, body);
}

/* ---------- Send Order ---------- */
function sendOrder(kind, s){
  const sId=s.id, bId=state.activeBranch;
  const items=state.itemsBySupplier[sId]||[];
  const list = items.map(it=>{
    const q = qtyOf(sId,bId,it.id);
    return q>0 ? `• ${it.name} — ${q}` : null;
  }).filter(Boolean);

  const br = branchById(bId)||{name:bId, address:''};
  const dateStr = new Date().toLocaleDateString('he-IL');

  const msg = `הזמנת סחורה - סושי רום
סניף: ${br.name} (${br.address||''})
ספק: ${s.name}
יום הזמנה: ${dateStr}
יום אספקה: ${state.deliveryDay||'—'}

פירוט הזמנה:
${list.join('\n')||'(ריק)'}

אודה לאישורכם בהודעה חוזרת.`;

  // save history
  state.history = state.history||[];
  state.history.push({supplierId:sId,supplierName:s.name,branchId:bId,branchName:br.name,message:msg,createdAt:Date.now()});
  saveLS();

  if(kind==='copy'){
    navigator.clipboard.writeText(msg); toast('הטקסט הועתק');
  }else if(kind==='mail' && s.email){
    const mailto = `mailto:${encodeURIComponent(s.email)}?subject=${encodeURIComponent('הזמנת סחורה - סושי רום')}&body=${encodeURIComponent(msg)}`;
    location.href = mailto;
  }else if(kind==='wa' && s.phone){
    const phone = s.phone.replace(/[^+\d]/g,'');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,'_blank');
  }else{
    toast('לא הוגדרה שיטת שליחה מתאימה לספק');
  }
}

/* ---------- Render ---------- */
function render(){
  renderHeader();
  if(state.route==='home') renderHome();
  else if(state.route==='orders') renderOrders();
  else if(state.route==='history') renderHistory();
  else if(state.route==='admin') renderAdmin();
}

// nav
$$('.tab').forEach(t=>t.onclick=()=>navTo(t.dataset.route));
window.addEventListener('hashchange',()=>{ navTo((location.hash||'#home').slice(1)); });

(async function init(){
  try { await loadData(); } catch(e){ console.error(e); }
  navTo((location.hash||'#home').slice(1));
})();
