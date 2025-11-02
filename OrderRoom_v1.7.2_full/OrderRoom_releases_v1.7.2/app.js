
const $ = s=>document.querySelector(s), $$ = s=>Array.from(document.querySelectorAll(s));
const DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const state={route:'home',suppliers:[],itemsBySupplier:{},branches:[],activeSupplier:null,activeBranch:null,orderDay:null,deliveryDay:null,draft:{}};

function todayKey(){return DAYS[new Date().getDay()];}
function hebDate(d=new Date()){return d.toLocaleDateString('he-IL',{weekday:'long',day:'2-digit',month:'2-digit',year:'2-digit'});}
function el(t,a={},c=[]){const e=document.createElement(t);for(const[k,v]of Object.entries(a)){if(k==='class')e.className=v;else if(k==='html')e.innerHTML=v;else e.setAttribute(k,v)};(c||[]).forEach(x=>e.append(x));return e;}
function saveLocal(){localStorage.setItem('or_draft',JSON.stringify({draft:state.draft}));}
function loadLocal(){try{const j=JSON.parse(localStorage.getItem('or_draft')||'{}');state.draft=j.draft||{};}catch{}}
loadLocal();
async function jget(u){const r=await fetch(u,{cache:'no-store'});if(!r.ok)throw new Error(r.status);return r.json();}
async function loadSeed(){
  const base=(window.OR_CONFIG&&OR_CONFIG.SEED_BASE_URL)||'../orderroom-suppliers-seed';
  state.suppliers=(await jget(base+'/suppliers.json')).filter(s=>s.active!==false);
  try{state.branches=await jget(base+'/branches.json')}catch(e){state.branches=[{id:'hills',name:'הילס',address:''},{id:'nordau',name:'נורדאו',address:''}];}
  for(const s of state.suppliers){
    try{state.itemsBySupplier[s.id]=(await jget(`${base}/${s.id}/items.json`)).filter(i=>i.active!==false).sort((a,b)=>(a.position||999)-(b.position||999));}
    catch(e){state.itemsBySupplier[s.id]=[];}
  }
  if(!state.activeSupplier&&state.suppliers.length)state.activeSupplier=state.suppliers[0].id;
  if(!state.activeBranch&&state.branches.length)state.activeBranch=state.branches[0].id;
}
function navTo(r){state.route=r; $$('.tab').forEach(t=>t.classList.toggle('active',t.dataset.route===r)); render();}
function supplierById(id){return state.suppliers.find(s=>s.id===id);}
function branchById(id){return state.branches.find(b=>b.id===id)||{name:id,address:''};}
function qtyOf(s,b,i){return (((state.draft||{})[s]||{})[b]||{})[i]||0;}
function setQty(s,b,i,v){state.draft[s]=state.draft[s]||{};state.draft[s][b]=state.draft[s][b]||{};state.draft[s][b][i]=v;saveLocal();}

function openSheet(title, nodes){
  $('#modalTitle').textContent=title; const body=$('#modalBody'); body.replaceChildren(...(nodes||[]));
  const back=$('#modalBack'); back.classList.add('show'); back.onclick=e=>{if(e.target.id==='modalBack') back.classList.remove('show');};
}
function closeSheet(){ $('#modalBack').classList.remove('show'); }

function renderHome(){
  const v=$('#view'), now=new Date();
  const header=el('div',{class:'card vstack'},[el('div',{class:'section-title',html:`${hebDate(now)} · ${now.toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'})}`}),el('div',{class:'note',html:'אפליקציית הזמנות סחורה החכמה של סושי רום'})]);
  const today=todayKey();
  const toOrder=el('div',{class:'card vstack'}); toOrder.append(el('div',{class:'section-title',html:'הזמנות להכניס היום'}));
  const arriving=el('div',{class:'card vstack'}); arriving.append(el('div',{class:'section-title',html:'הזמנות שמגיעות היום'}));
  const listTo=el('div',{class:'vstack'}), listArr=el('div',{class:'vstack'});
  for(const s of state.suppliers){
    if((s.order_days||[]).includes(today)){
      const it=el('div',{class:'select-item'},[el('div',{html:`<strong>${s.name}</strong> <span class="small">הזן הזמנה</span>`}),el('span',{class:'badge',html:'פתח'})]);
      it.onclick=()=>{state.activeSupplier=s.id; navTo('orders');}; listTo.append(it);
    }
    const del=(s.delivery_by_order_day||{})[today]; if(del===today){listArr.append(el('div',{class:'select-item'},[el('div',{html:`<strong>${s.name}</strong> <span class="small">אספקה היום</span>`})]));}
  }
  v.replaceChildren(header, el('div',{class:'home-panels'},[toOrder.appendChild(listTo)||toOrder, arriving.appendChild(listArr)||arriving]));
  $('#actionsBar').style.display='none';
}

function renderOrders(){
  const v=$('#view'); const sId=state.activeSupplier||(state.suppliers[0]?.id); if(!sId){v.textContent='אין ספקים'; return;}
  const s=supplierById(sId); const items=state.itemsBySupplier[sId]||[];
  const head=el('div',{class:'card vstack'}); head.append(el('div',{class:'section-title',html:`הזמנה — <strong>${s.name}</strong>`}));
  // branches
  let allowed=(s.branches&&s.branches.length)?s.branches:state.branches.map(b=>b.id); if(!allowed.includes(state.activeBranch)) state.activeBranch=allowed[0];
  const chips=el('div',{class:'chips'}); for(const bid of allowed){const br=branchById(bid); const chip=el('div',{class:'chip'+(state.activeBranch===bid?' active':''),html:br.name}); chip.onclick=()=>{state.activeBranch=bid; render();}; chips.append(chip);} head.append(el('div',{class:'vstack'},[el('div',{class:'small',html:'סניף'}),chips]));
  // days
  const today=todayKey(); state.orderDay=today; state.deliveryDay=(s.delivery_by_order_day||{})[today]||null;
  const dayRow=el('div',{class:'chips'}); const orderChip=el('div',{class:'chip active',html:`יום הזמנה: ${hebDate(new Date())}`}); const delChip=el('div',{class:'chip',html:`יום אספקה: ${state.deliveryDay||'—'}`}); dayRow.append(orderChip,delChip); head.append(dayRow);
  delChip.onclick=()=>{
    const opts=DAYS.map(d=>{const it=el('div',{class:'select-item'},[el('div',{html:`<strong>${d}</strong>`})]); it.onclick=()=>{state.deliveryDay=d; delChip.innerHTML=`יום אספקה: ${d}`; closeSheet();}; return it;});
    openSheet('בחר יום אספקה', opts);
  };
  v.append(head);
  // items
  const list=el('div',{class:'vstack'});
  items.forEach(it=>{
    if(it.active===false)return;
    const row=el('div',{class:'card item-row'});
    row.append(el('div',{class:'item-name',html:it.name+(it.unit?` <span class="small">(${it.unit})</span>`:'')}));
    const qty=el('div',{class:'qty'}); const input=el('input',{type:'number',inputmode:'numeric',value:qtyOf(sId,state.activeBranch,it.id)});
    input.oninput=()=>setQty(sId,state.activeBranch,it.id,Number(input.value)||0);
    qty.append(input); row.append(qty); list.append(row);
  });
  v.append(list, el('div',{class:'note',html:'שדות ריקים לא יופיעו בהודעה. ההזמנה נשמרת בהיסטוריה לפני שליחה.'}));
  // actions
  const bar=$('#actionsBar'); bar.style.display='flex'; $('#btnCopy').onclick=()=>sendOrder('copy',s); $('#btnMail').onclick=()=>sendOrder('mail',s); $('#btnWa').onclick=()=>sendOrder('wa',s);
}

function renderHistory(){
  const v=$('#view'); const all=JSON.parse(localStorage.getItem('or_history')||'[]'); if(!all.length){v.textContent='אין היסטוריה עדיין'; $('#actionsBar').style.display='none'; return;}
  const wrap=el('div',{class:'vstack'});
  all.slice().reverse().forEach(rec=>{wrap.append(el('div',{class:'card vstack'},[el('div',{class:'section-title',html:`${rec.supplierName} · ${rec.branchName}`}),el('div',{class:'note',html:new Date(rec.createdAt).toLocaleString('he-IL')}),el('div',{html:`<pre style="white-space:pre-wrap;direction:rtl">${rec.message}</pre>`})]));});
  v.replaceChildren(wrap); $('#actionsBar').style.display='none';
}

function renderSettings(){
  const v=$('#view'); const wrap=el('div',{class:'vstack'});
  const sup=el('div',{class:'card vstack'}); sup.append(el('div',{class:'section-title',html:'ספקים'}));
  state.suppliers.forEach(s=>{
    const it=el('div',{class:'select-item'},[el('div',{html:`<strong>${s.name}</strong> <span class="small">${s.email||''} ${s.phone?('· '+s.phone):''}</span>`}),el('span',{class:'badge',html:'פתח הזמנה'})]);
    it.onclick=()=>{state.activeSupplier=s.id; navTo('orders');};
    sup.append(it);
  });
  wrap.append(sup); v.replaceChildren(wrap); $('#actionsBar').style.display='none';
}

function sendOrder(kind,s){
  const sId=s.id, bId=state.activeBranch; const items=state.itemsBySupplier[sId]||[];
  const lines=items.map(it=>{const q=qtyOf(sId,bId,it.id); return q>0?`• ${it.name} — ${q}`:null;}).filter(Boolean);
  const br=branchById(bId); const dateStr=new Date().toLocaleDateString('he-IL');
  const msg=`הזמנת סחורה - סושי רום
סניף: ${br.name} (${br.address})
ספק: ${s.name}
יום הזמנה: ${dateStr}
יום אספקה: ${state.deliveryDay||'—'}

פירוט הזמנה:
${lines.join('\\n')||'(ריק)'}

אודה לאישורכם בהודעה חוזרת.`;
  const hist=JSON.parse(localStorage.getItem('or_history')||'[]'); hist.push({supplierId:sId,supplierName:s.name,branchId:bId,branchName:br.name,message:msg,createdAt:Date.now()}); localStorage.setItem('or_history',JSON.stringify(hist));
  if(kind==='copy'){navigator.clipboard.writeText(msg); alert('הועתק');}
  else if(kind==='mail' && s.email){location.href=`mailto:${encodeURIComponent(s.email)}?subject=${encodeURIComponent('הזמנת סחורה - סושי רום')}&body=${encodeURIComponent(msg)}`;}
  else if(kind==='wa' && s.phone){const phone=s.phone.replace(/[^+\\d]/g,''); window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,'_blank');}
  else{alert('לא הוגדרה שיטת שליחה מתאימה לספק');}
}

function render(){if(state.route==='home')renderHome(); else if(state.route==='orders')renderOrders(); else if(state.route==='history')renderHistory(); else if(state.route==='settings')renderSettings();}
$$('.tab').forEach(t=>t.onclick=()=>navTo(t.dataset.route)); window.addEventListener('hashchange',()=>navTo((location.hash||'#home').slice(1)));

(async function init(){ try{ await loadSeed(); }catch(e){ console.error(e); } navTo((location.hash||'#home').slice(1)); })();
