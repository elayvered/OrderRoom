(function(){
  const K = {
    suppliers: "or_v113_suppliers",
    items: "or_v113_items",
    active: "or_v113_active",
    orders: "or_v113_orders",
    draft: "or_v113_draft",
    notes: "or_v113_notes"
  };

  const q = new URLSearchParams(location.search);
  if (q.get("reset")==="1"){ Object.values(K).forEach(k=>localStorage.removeItem(k)); }

  const DEFAULT_SUPPLIERS = [
    { name: "מזרח מערב", phone: "9725044320036", day: "all" },
    { name: "דיפלומט", phone: "972500000000", day: "all" }
  ];
  const MM_ITEMS = ["אבקת וואסבי","א.ביצים לאיון","אטריות אורז 3 מ","ג'ינג'ר לבן","מגש 03","מגש 07","מחית צ'ילי בשמן","מחית קארי ירוק","מחית קארי אדום","תמרהינדי","מיסו לבן דאשי","מירין גדול","סויה ירוק גדול","סויה ללג גדול","סאקה גדול","פנקו","רוטב דגים 4 ל","רוטב פטריות","שומשום שחור","שמן צ'ילי","שמן שומשום","קרם קוקוס גדול","טמפורה","יוזו גדול","יוזו גדול ללא מלח","סוכר דקלים","צדפות שימורים","בצל מטוגן","אבקת חרדל יפני","טוגראשי","טום יאם","קנפיו קילו","מגש מסיבה L","מגש מסיבה M","סויה גולדן מאונטן","חטיפי אצות","סויה כהה","חומץ אורז","אנשובי בשמן גדול","אצות נורי קוריאה","אורז יסמין","שיפודי קשר","אבקת מאצה","ליקר מאצה","רשת לסיר אורז","כף ווק","ווק","דפי רשת אורז","אצות וואקמה","אצות קומבו","דאשי","אררה","צ'ופסטיקס חבק שחור","שיפודי יקיטורי"];

  const save = (k,v)=>localStorage.setItem(k, JSON.stringify(v));
  const load = (k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v??d}catch(_){return d}};

  let suppliers = load(K.suppliers, DEFAULT_SUPPLIERS);
  let items = load(K.items, {});
  if (!Array.isArray(items[suppliers[0].phone])) items[suppliers[0].phone] = MM_ITEMS.map(n=>({name:n,unit:"",price:0}));
  suppliers.forEach(s=>{ if(!Array.isArray(items[s.phone])) items[s.phone]=items[s.phone]||[]; });
  save(K.items, items);

  let active = load(K.active, suppliers[0].phone);
  if(!suppliers.find(s=>s.phone===active)){ active=suppliers[0].phone; save(K.active, active); }
  let orders = load(K.orders, []);
  let draft = load(K.draft, {});
  let notes = load(K.notes, "");

  const $ = (sel)=>document.querySelector(sel);
  const $$ = (sel)=>Array.from(document.querySelectorAll(sel));

  // Date in header
  const days = ["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"];
  const months = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
  const now = new Date();
  $("#headerDate").textContent = `יום ${days[now.getDay()]} · ${now.getDate()} ב${months[now.getMonth()]} ${now.getFullYear()}`;

  // Nav
  $$(".nav .tab").forEach(b=>b.addEventListener("click", ()=>{
    const id=b.dataset.view;
    $$(".screen").forEach(s=>s.classList.remove("active"));
    $("#"+id).classList.add("active");
    $$(".nav .tab").forEach(t=>t.classList.remove("active"));
    b.classList.add("active");
    if(id==="view-home") renderHome();
    if(id==="view-orders") buildOrders();
    if(id==="view-history") renderHistory();
    if(id==="view-settings") renderSettings();
  }));

  // Home
  const suppliersForToday = ()=>suppliers.filter(s=>s.day==="all" || s.day===String(new Date().getDay()));
  function renderHome(){
    const host=$("#homeCards"); host.innerHTML="";
    suppliersForToday().forEach(s=>{
      const c=document.createElement("div"); c.className="home-card";
      c.innerHTML=`<div class="dot"></div><div class="name">${s.name}</div>`;
      c.onclick=()=>{ active=s.phone; save(K.active,active); showOrders(); };
      host.appendChild(c);
    });
  }
  const showOrders=()=>{ $$(".screen").forEach(s=>s.classList.remove("active")); $("#view-orders").classList.add("active"); $$(".nav .tab").forEach(t=>t.classList.remove("active")); $(`[data-view="view-orders"]`).classList.add("active"); buildOrders(); };

  // Orders
  function buildOrders(){
    const sw=$("#supplierSwitch"); sw.innerHTML="";
    suppliers.forEach(s=>{ const o=document.createElement("option"); o.value=s.phone; o.textContent=`${s.name} — ${s.phone}`; if(s.phone===active) o.selected=true; sw.appendChild(o); });
    sw.onchange=()=>{ active=sw.value; save(K.active, active); buildOrders(); };
    const list=items[active]||[]; const wrap=$("#ordersGrid"); wrap.innerHTML="";
    list.forEach(it=>{
      const row=document.createElement("div"); row.className="card";
      row.innerHTML=`<input class="qty" data-name="${it.name}" inputmode="numeric" pattern="[0-9]*"><div class="name">${it.name}<span class="meta">${it.unit?` (${it.unit})`:''}${it.price?` • ₪${it.price}`:''}</span></div><div class="prev"></div>`;
      const inp=row.querySelector(".qty"); inp.value=draft[it.name]||"";
      inp.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();focusNext(inp);}});
      inp.addEventListener("input",e=>{const v=e.target.value.trim(); if(v){draft[it.name]=v}else{delete draft[it.name]} save(K.draft,draft); updatePreview();});
      wrap.appendChild(row);
    });
    $("#notes").value=notes||"";
    updatePreview();
  }
  function focusNext(el){ const inputs=$$(".qty"); const i=inputs.indexOf(el); const n=inputs[i+1]||inputs[0]; n.focus(); n.select&&n.select(); }
  const mapFromInputs=()=>Object.fromEntries($$(".qty").map(i=>[i.dataset.name, i.value.trim()]).filter(([k,v])=>v));
  const buildText=(m)=>{ const s=suppliers.find(x=>x.phone===active); const dt=new Date().toLocaleString('he-IL'); const head=`הזמנת סחורה - סושי רום${s?` - ${s.name}`:''}\nתאריך - ${dt}\nפירוט הזמנה -`; const body=Object.entries(m).map(([k,v])=>`${k} - ${v}`).join("\n"); const foot=notes?`\n\nהערות:\n${notes.trim()}`:''; return `${head}\n${body}${foot}\n\nאודה לאישורכם בהודעה חוזרת`; };

  function updatePreview(){ const m=mapFromInputs(); $("#count").textContent=`סה״כ פריטים: ${Object.keys(m).length}`; $("#preview").textContent=Object.keys(m).length?buildText(m):(notes?`הערות:\n${notes}`:''); }

  $("#btnSave").onclick=()=>{ const m=mapFromInputs(); orders.unshift({ts:Date.now(), supplier:active, map:m, notes}); save(K.orders,orders); draft={}; save(K.draft,draft); buildOrders(); toast("ההזמנה נשמרה"); };
  $("#btnCopy").onclick=()=>{ const m=mapFromInputs(); navigator.clipboard&&navigator.clipboard.writeText(buildText(m)); toast("הטקסט הועתק"); };
  $("#btnWA").onclick=()=>{ const s=suppliers.find(x=>x.phone===active); if(!s) return toast("בחר ספק"); const url=`https://wa.me/${s.phone}?text=${encodeURIComponent(buildText(mapFromInputs()))}`; window.open(url,"_blank"); };
  $("#notes").oninput=(e)=>{ notes=e.target.value; save(K.notes,notes); updatePreview(); };

  // History
  function renderHistory(){
    const host=$("#historyList"); host.innerHTML="";
    if(!orders.length){ host.innerHTML='<div class="item">אין היסטוריה עדיין</div>'; return; }
    orders.forEach((o,idx)=>{
      const s=suppliers.find(x=>x.phone===o.supplier); const ts=new Date(o.ts).toLocaleString('he-IL');
      const body=Object.entries(o.map).map(([k,v])=>`${k} - ${v}`).join("\\n");
      const notesBlock=o.notes?`\\n\\nהערות:\\n${o.notes}`:'';
      const div=document.createElement("div"); div.className='item';
      div.innerHTML=`<div><b>#${orders.length-idx}</b> • ${ts} • ${s?s.name:o.supplier}</div><pre>${body}${notesBlock}</pre>`;
      host.appendChild(div);
    });
  }

  // Settings
  function renderSettings(){
    const host=$("#suppliersList"); host.innerHTML="";
    suppliers.forEach(s=>{ const r=document.createElement("div"); r.className="item"; const dayTxt=s.day==="all"?"כל הימים":days[parseInt(s.day)]; r.textContent=`${s.name} — ${s.phone} • יום: ${dayTxt}`; r.onclick=()=>{ $("#supName").value=s.name; $("#supPhone").value=s.phone; $("#supDay").value=s.day; }; host.appendChild(r); });
  }
  $("#btnAddSup").onclick=()=>{ const name=$("#supName").value.trim(); const phone=$("#supPhone").value.trim(); const day=$("#supDay").value; if(!name||!phone) return toast("שם ומספר חובה"); const i=suppliers.findIndex(x=>x.phone===phone); const rec={name,phone,day}; if(i>=0) suppliers[i]=rec; else suppliers.push(rec); save(K.suppliers,suppliers); renderSettings(); renderHome(); toast(i>=0?"עודכן":"נוסף"); };

  function toast(msg){ const t=$("#toast"); $("#toastMsg").textContent=msg; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),1200); }

  // init
  renderHome(); buildOrders();
})();