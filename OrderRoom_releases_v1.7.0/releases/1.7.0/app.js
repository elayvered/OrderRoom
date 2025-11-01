
(function(){
'use strict';
const VERSION = window.OR_VERSION || '1.7.0';
const nowText = document.getElementById('nowText');
nowText.textContent = new Date().toLocaleString('he-IL',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});

const items = ["אבקת וואסבי", "א. ביצים לאיון", "אטריות אורז 3 מ\"מ", "ג'ינג'ר לבן", "מגש 03", "מגש 07", "מחית צ'ילי בשמן", "מחית קארי ירוק", "מחית קארי אדום", "תמרהינדי", "מיסו לבן דאשי", "מירין גדול", "סויה ירוק גדול", "סויה ללג גדול", "סאקה גדול", "פנקו", "רוטב דגים 4 ל", "רוטב פטריות", "שומשום שחור", "שמן צ'ילי", "שמן שומשום", "קרם קוקוס גדול", "טמפורה", "יוזו גדול", "יוזו גדול ללא מלח", "סוכר דקלים", "צדפות שימורים", "בצל מטוגן", "אבקת חרדל יפני", "טוגראשי", "טום יאם", "קנפיו קילו", "מגש מסיבה L", "מגש מסיבה M", "סויה גולדן מאונטן", "חטיפי אצות", "סויה כהה", "חומץ אורז", "אנשובי בשמן גדול", "אצות נורי קוריאה", "אורז יסמין", "שיפודי קשר", "אבקת מאצה", "ליקר מאצה", "רשת לסיר אורז", "כף ווק", "ווק", "דפי רשת אורז", "אצות וואקמה", "אצות קומבו", "דאשי", "אררה", "צ'ופסטיקס חבק שחור", "שיפודי יקיטורי"];

const DEFAULT_SUPPLIERS = [
  {
    id:'eastwest', name:'מזרח מערב', phone:'+9725044320036', email:'',
    branches:['הילס','נורדאו'],
    orderDays:['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳'],
    supplyMap:{'א׳':'ב׳','ב׳':'ג׳','ג׳':'ד׳','ד׳':'ה׳','ה׳':'ו׳','ו׳':'א׳','ש׳':'א׳'},
    items: items.map(n=>({name:n,unit:"יח'"}))
  },
  {
    id:'diplomat', name:'דיפלומט', phone:'', email:'',
    branches:['הילס','נורדאו'],
    orderDays:['א׳','ג׳','ה׳'],
    supplyMap:{'א׳':'ב׳','ג׳':'ד׳','ה׳':'ו׳'},
    items:[{name:'טונה קופסא',unit:"יח'"},{name:'קוקה קולה',unit:'מגש'}]
  }
];

// storage helpers
const SKEY_SUPPLIERS='or_suppliers_v1'; const SKEY_HISTORY='or_history_v1';
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));

let suppliers = load(SKEY_SUPPLIERS,null); if(!suppliers){suppliers=DEFAULT_SUPPLIERS; save(SKEY_SUPPLIERS,suppliers);}

let state={screen:'home', supplierId:'eastwest', branch:'הילס', orderDay:dayHeb(new Date()), supplyDay:'', items:{}, freeText:''};

const screens={home:el('screen-home'), order:el('screen-order'), history:el('screen-history'), settings:el('screen-settings')};
const tabs=document.querySelectorAll('.tabbar .tab');
tabs.forEach(t=>t.onclick=()=>switchTo(t.dataset.tab));
function switchTo(name){
  Object.values(screens).forEach(e=>e.style.display='none');
  screens[name].style.display='block';
  tabs.forEach(t=>t.classList.toggle('active',t.dataset.tab===name));
  state.screen=name;
  if(name==='home')renderHome();
  if(name==='order')renderOrder();
  if(name==='history')renderHistory();
  if(name==='settings')renderSettings();
  el('actionBar').style.display=(name==='order')?'block':'none';
}
switchTo('home');

function el(id){return document.getElementById(id)}
function dayHeb(d){return d.toLocaleDateString('he-IL',{weekday:'short'}).replace('יום ','').replace('יום','')}
function nextSupply(orderDay, sup){return (sup.supplyMap||{})[orderDay]||orderDay}
function todayHeb(){return dayHeb(new Date())}

// HOME
const todayOrders=el('todayOrders'), arrivingToday=el('arrivingToday');
function renderHome(){
  const today=todayHeb(); todayOrders.innerHTML=''; arrivingToday.innerHTML='';
  suppliers.forEach(s=>{
    if((s.orderDays||[]).includes(today)){
      const d=document.createElement('div'); d.className='item';
      d.innerHTML=`<div class='name'>${s.name}</div><button class='btn primary' style='flex:0 0 auto;width:140px'>פתח הזמנה</button>`;
      d.querySelector('button').onclick=()=>{state.supplierId=s.id; switchTo('order');};
      todayOrders.appendChild(d);
    }
    const supd=nextSupply(today,s);
    if(supd===today){
      const r=document.createElement('div'); r.className='item';
      r.innerHTML=`<div class='name'>${s.name}</div><div class='badge'>אספקה: ${supd}</div>`;
      arrivingToday.appendChild(r);
    }
  });
}

// ORDER
const supplierTitle=el('supplierTitle'), branchToggle=el('branchToggle'), orderDayPill=el('orderDayPill'), supplyDayPill=el('supplyDayPill'), itemsList=el('itemsList'), searchBox=el('searchBox'), freeText=el('freeText');
el('waBtn').onclick=()=>submit('wa'); el('mailBtn').onclick=()=>submit('mail'); el('copyBtn').onclick=()=>submit('copy');
searchBox.oninput=()=>renderItems(); freeText.oninput=()=>state.freeText=freeText.value;

function renderOrder(){
  const sup=suppliers.find(x=>x.id===state.supplierId)||suppliers[0]; supplierTitle.textContent=sup.name;
  branchToggle.innerHTML=(sup.branches||[]).map(b=>`<button class='${state.branch===b?'active':''}' data-b='${b}'>${b}</button>`).join('');
  branchToggle.querySelectorAll('button').forEach(btn=>btn.onclick=()=>{state.branch=btn.dataset.b; renderOrder();});
  state.orderDay=todayHeb(); state.supplyDay=nextSupply(state.orderDay,sup); orderDayPill.textContent=state.orderDay; supplyDayPill.textContent=state.supplyDay;
  supplyDayPill.onclick=()=>openSupplyPicker(sup);
  renderItems();
}

function renderItems(){
  const sup=suppliers.find(x=>x.id===state.supplierId)||suppliers[0]; const q=(searchBox.value||'').trim();
  const arr=(sup.items||[]).filter(it=>!q||it.name.includes(q)); itemsList.innerHTML='';
  arr.forEach(it=>{ const key=it.name; const val=state.items[key]||0; const row=document.createElement('div'); row.className='item';
    row.innerHTML=`<div class='name'>${key}</div><div class='qty'><input inputmode='numeric' pattern='[0-9]*' type='number' min='0' value='${val}' data-k='${key}'/></div>`;
    row.querySelector('input').oninput=(e)=>{ const v=Math.max(0,parseInt(e.target.value||'0',10)); state.items[key]=v; };
    itemsList.appendChild(row);
  });
}

function openSupplyPicker(sup){
  openModal('בחר יום אספקה',()=>{ const days=['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳']; const grid=document.createElement('div'); grid.className='grid';
    days.forEach(d=>{ const opt=document.createElement('div'); opt.className='opt'; opt.innerHTML=`<div style='font-weight:900'>${d}</div><div class='mini'>${d===sup.supplyMap[state.orderDay]?'ברירת מחדל':''}</div>`; opt.onclick=()=>{state.supplyDay=d; supplyDayPill.textContent=d; closeModal();}; grid.appendChild(opt); });
    return grid; });
}

// SUBMIT
function submit(ch){
  const sup=suppliers.find(x=>x.id===state.supplierId)||suppliers[0];
  const lines=Object.entries(state.items).filter(([k,v])=>v>0).map(([k,v])=>`• ${k} — ${v}`);
  if(lines.length===0){ alert('לא נבחרו פריטים להזמנה'); return; }
  const msg=[`הזמנת סחורה — סושי רום — ${sup.name}`,`סניף: ${state.branch}`,`יום הזמנה: ${state.orderDay}`,`יום אספקה: ${state.supplyDay}`,'','פירוט הזמנה:',...lines, state.freeText?('\\nהערות: '+state.freeText):''].join('\\n');
  const hist=load(SKEY_HISTORY,[]); hist.unshift({ts:Date.now(), supplier:sup.name, supplierId:sup.id, branch:state.branch, orderDay:state.orderDay, supplyDay:state.supplyDay, items:Object.fromEntries(Object.entries(state.items).filter(([k,v])=>v>0)), freeText:state.freeText}); save(SKEY_HISTORY,hist); renderHistory();
  if(ch==='copy'){ navigator.clipboard.writeText(msg); alert('הועתק'); return; }
  if(ch==='mail'){ if(!sup.email){alert('אין מייל מוגדר לספק'); return;} location.href=`mailto:${sup.email}?subject=${encodeURIComponent('הזמנת סחורה — סושי רום')}&body=${encodeURIComponent(msg)}`; return; }
  if(ch==='wa'){ if(!sup.phone){alert('אין טלפון וואטסאפ מוגדר לספק'); return;} window.open(`https://wa.me/${sup.phone.replace(/[^+0-9]/g,'')}?text=${encodeURIComponent(msg)}`,'_blank'); return; }
}

// HISTORY
const historyList=el('historyList'), histFilter=el('histFilter'); histFilter.oninput=renderHistory;
function renderHistory(){ const q=(histFilter.value||'').trim(); const hist=load(SKEY_HISTORY,[]); historyList.innerHTML=''; hist.forEach(rec=>{ if(q && !(rec.supplier.includes(q)||Object.keys(rec.items).some(k=>k.includes(q)))) return; const div=document.createElement('div'); div.className='item'; const count=Object.keys(rec.items).length; div.innerHTML=`<div><div class='name'>${rec.supplier}</div><div class='helper'>סניף ${rec.branch} · הזמנה ${rec.orderDay} · אספקה ${rec.supplyDay} · ${count} פריטים</div></div><button class='btn ghost' style='flex:0 0 auto;width:120px'>הצג</button>`; div.querySelector('button').onclick=()=>alert(Object.entries(rec.items).map(([k,v])=>`${k} — ${v}`).join('\\n')); historyList.appendChild(div); }); }

// SETTINGS
const suppliersList=el('suppliersList');
function renderSettings(){ suppliersList.innerHTML=''; suppliers.forEach(s=>{ const c=document.createElement('div'); c.className='card'; c.innerHTML=`<div class='row' style='justify-content:space-between'><div><div class='name'>${s.name}</div><div class='helper'>טלפון: ${s.phone||'-'} · מייל: ${s.email||'-'}</div></div><button class='btn primary' style='flex:0 0 auto;width:140px'>ערוך</button></div>`; c.querySelector('button').onclick=()=>editSupplier(s); suppliersList.appendChild(c); }); }
function editSupplier(s){ openModal('עריכת ספק — '+s.name,()=>{ const w=document.createElement('div'); w.innerHTML=`
  <div class='label'>טלפון וואטסאפ</div><div class='search'><input id='sp_phone' value='${s.phone||''}' placeholder='+972…'/></div>
  <div class='label'>אימייל</div><div class='search'><input id='sp_mail' value='${s.email||''}' placeholder='name@example.com'/></div>
  <div class='label'>סניפי אספקה</div><div class='search'><input id='sp_br' value='${(s.branches||[]).join(', ')}' placeholder='הילס, נורדאו'/></div>
  <div class='label'>ימי הזמנה</div><div class='search'><input id='sp_od' value='${(s.orderDays||[]).join(', ')}' placeholder='א׳,ב׳,ג׳ …'/></div>
  <div class='label'>מיפוי אספקה (order→supply)</div><div class='search'><input id='sp_map' value='${Object.entries(s.supplyMap||{}).map(e=>e.join(':')).join(', ')}' placeholder='א׳:ב׳, ב׳:ג׳ …'/></div>
  <div class='label'>עריכת פריטים (שם|יחידה) — שורה לכל פריט</div><textarea id='sp_items' style='width:100%;height:180px;border:1px solid #e5e9f2;border-radius:12px;padding:10px;font-size:14px'></textarea>
  <div style='margin-top:10px' class='actions'><button class='btn ghost' id='sp_cancel'>ביטול</button><button class='btn primary' id='sp_save'>שמור</button></div>`;
  w.querySelector('#sp_items').value=(s.items||[]).map(it=>[it.name,it.unit||"יח'"].join('|')).join('\\n');
  w.querySelector('#sp_cancel').onclick=closeModal; w.querySelector('#sp_save').onclick=()=>{ s.phone=w.querySelector('#sp_phone').value.trim(); s.email=w.querySelector('#sp_mail').value.trim(); s.branches=w.querySelector('#sp_br').value.split(',').map(x=>x.trim()).filter(Boolean); s.orderDays=w.querySelector('#sp_od').value.split(',').map(x=>x.trim()).filter(Boolean); s.supplyMap=Object.fromEntries(w.querySelector('#sp_map').value.split(',').map(x=>x.trim()).filter(Boolean).map(p=>p.split(':').map(z=>z.trim()))); s.items=w.querySelector('#sp_items').value.split('\\n').map(line=>{const [n,u]=line.split('|'); return n?{name:n.trim(), unit:(u||"יח'").trim()}:null}).filter(Boolean); save(SKEY_SUPPLIERS,suppliers); closeModal(); renderSettings(); }; return w; }); }

// Modal helpers
const modalBack=el('modalBack'), modal=el('modal'), modalTitle=el('modalTitle'), modalContent=el('modalContent');
function openModal(title,builder){modalTitle.textContent=title; modalContent.innerHTML=''; modalContent.appendChild(builder()); modalBack.style.display='block'; modal.style.display='block';}
function closeModal(){modalBack.style.display='none'; modal.style.display='none';}
modalBack.onclick=closeModal;

})();
