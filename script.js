(function(){
  const K = {
    orders: "or_v11_orders",
    draft: "or_v11_draft",
    suppliers: "or_v11_suppliers",
    activeSupplier: "or_v11_active_supplier",
    items: "or_v11_items",
    notes: "or_v11_notes"
  };

  const DEFAULT_SUPPLIERS = [
    { name: "מזרח מערב", phone: "9725044320036", day: "all" },
    { name: "דיפלומט", phone: "972500000000", day: "all" }
  ];

  const MM_ITEMS = [
    "אבקת וואסבי","א.ביצים לאיון","אטריות אורז 3 מ","ג'ינג'ר לבן","מגש 03","מגש 07","מחית צ'ילי בשמן",
    "מחית קארי ירוק","מחית קארי אדום","תמרהינדי","מיסו לבן דאשי","מירין גדול","סויה ירוק גדול","סויה ללג גדול",
    "סאקה גדול","פנקו","רוטב דגים 4 ל","רוטב פטריות","שומשום שחור","שמן צ'ילי","שמן שומשום","קרם קוקוס גדול",
    "טמפורה","יוזו גדול","יוזו גדול ללא מלח","סוכר דקלים","צדפות שימורים","בצל מטוגן","אבקת חרדל יפני",
    "טוגראשי","טום יאם","קנפיו קילו","מגש מסיבה L","מגש מסיבה M","סויה גולדן מאונטן","חטיפי אצות","סויה כהה",
    "חומץ אורז","אנשובי בשמן גדול","אצות נורי קוריאה","אורז יסמין","שיפודי קשר","אבקת מאצה","ליקר מאצה",
    "רשת לסיר אורז","כף ווק","ווק","דפי רשת אורז","אצות וואקמה","אצות קומבו","דאשי","אררה","צ'ופסטיקס חבק שחור","שיפודי יקיטורי"
  ];

  let orders = load(K.orders, []);
  let draft = load(K.draft, {});
  let suppliers = load(K.suppliers, DEFAULT_SUPPLIERS);
  let activeSupplier = load(K.activeSupplier, suppliers[0]?.phone || "");
  let items = load(K.items, {
    [suppliers[0]?.phone || "9725044320036"]: MM_ITEMS.map(n => ({ name:n, unit:"", price:0 })),
    [suppliers[1]?.phone || "972500000000"]: []
  });
  let notes = load(K.notes, "");

  const headerDate = document.getElementById("headerDate");
  const homeCards = document.getElementById("homeCards");
  const ordersGrid = document.getElementById("ordersGrid");
  const activeSupplierSwitch = document.getElementById("activeSupplierSwitch");
  const orderNotes = document.getElementById("orderNotes");
  const preview = document.getElementById("preview");
  const summaryCount = document.getElementById("summaryCount");
  const historyList = document.getElementById("historyList");
  const fromDate = document.getElementById("fromDate");
  const toDate = document.getElementById("toDate");
  const analyticsBox = document.getElementById("analyticsBox");

  function save(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
  function load(k,def){ try{return JSON.parse(localStorage.getItem(k)) ?? def}catch{return def} }

  function show(tabId){
    document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
    document.getElementById(tabId).classList.add("active");
    document.querySelectorAll(".nav .tab").forEach(t=>t.classList.remove("active"));
    document.querySelector(`.nav .tab[data-target='${tabId}']`).classList.add("active");
  }

  // Nav
  document.querySelectorAll(".nav .tab").forEach(btn=>btn.addEventListener("click",()=>{
    show(btn.getAttribute("data-target"));
    if(btn.getAttribute("data-target")==="view-orders") buildOrders();
    if(btn.getAttribute("data-target")==="view-history") renderHistory();
    if(btn.getAttribute("data-target")==="view-analytics") renderAnalyticsThisMonth();
    if(btn.getAttribute("data-target")==="view-settings") renderSettings();
  }));

  // Header date
  function hebDate(){
    const now = new Date();
    const days = ["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"];
    const months = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
    return `יום ${days[now.getDay()]} · ${now.getDate()} ב${months[now.getMonth()]} ${now.getFullYear()}`;
  }
  headerDate.textContent = hebDate();

  // HOME
  function suppliersForToday(){
    const d = new Date().getDay().toString();
    return suppliers.filter(s => s.day==="all" || s.day===d);
  }
  function renderHome(){
    const list = suppliersForToday();
    homeCards.innerHTML = "";
    if(!list.length){ homeCards.innerHTML = `<div class="item">אין הזמנות מתוכננות להיום</div>`; return; }
    list.forEach(s=>{
      const card = document.createElement("div");
      card.className = "home-card";
      card.innerHTML = `<div class="dot"></div><div class="name">${s.name}</div>`;
      card.addEventListener("click", ()=>{
        activeSupplier = s.phone;
        save(K.activeSupplier, activeSupplier);
        show("view-orders");
        buildOrders();
      });
      homeCards.appendChild(card);
    });
  }

  // ORDERS
  function renderSupplierSwitch(){
    activeSupplierSwitch.innerHTML = "";
    suppliers.forEach(s=>{
      const o = document.createElement("option");
      o.value = s.phone;
      o.textContent = `${s.name} — ${s.phone}`;
      if(s.phone===activeSupplier) o.selected = true;
      activeSupplierSwitch.appendChild(o);
    });
    activeSupplierSwitch.addEventListener("change", ()=>{
      activeSupplier = activeSupplierSwitch.value;
      save(K.activeSupplier, activeSupplier);
      buildOrders();
    });
  }
  function lastOrderMap(phone){
    const o = orders.find(x=>x.supplier===phone);
    return o ? o.map : {};
  }
  function buildOrders(){
    renderSupplierSwitch();
    const list = items[activeSupplier] || [];
    const prev = lastOrderMap(activeSupplier);
    ordersGrid.innerHTML = "";
    list.forEach(it=>{
      const row = document.createElement("div");
      row.className = "card";
      row.innerHTML = `
        <input class="qty" inputmode="numeric" pattern="[0-9]*" placeholder="" data-name="${it.name}">
        <div class="name">${it.name}<span class="meta">${it.unit?` (${it.unit})`:''}${it.price?` • ₪${it.price}`:''}</span></div>
        <div class="prev">${prev[it.name]||""}</div>
      `;
      const input = row.querySelector(".qty");
      input.value = draft[it.name] || "";
      input.addEventListener("keydown",(e)=>{ if(e.key==="Enter"){ e.preventDefault(); focusNextQuantity(e.target);} });
      input.addEventListener("input", (e)=>{
        const v=e.target.value.trim();
        if(v){ draft[it.name]=v } else { delete draft[it.name] }
        save(K.draft, draft); updatePreview();
      });
      ordersGrid.appendChild(row);
    });
    orderNotes.value = notes || "";
    updatePreview();
  }
  function focusNextQuantity(el){
    const inputs=[...document.querySelectorAll(".qty")];
    const i=inputs.indexOf(el);
    const next=inputs[i+1]||inputs[0];
    next.focus(); next.select&&next.select();
  }
  function collectMap(){
    const map={};
    document.querySelectorAll(".qty").forEach(inp=>{
      const v=inp.value.trim(); const n=inp.getAttribute("data-name");
      if(v) map[n]=v;
    });
    return map;
  }
  function buildWhatsAppText(map){
    const s=suppliers.find(x=>x.phone===activeSupplier);
    const date=new Date().toLocaleString('he-IL');
    const header=`הזמנת סחורה - סושי רום${s?` - ${s.name}`:""}\nתאריך - ${date}\nפירוט הזמנה -`;
    const body=Object.entries(map).map(([k,v])=>`${k} - ${v}`).join("\n");
    const foot = notes && notes.trim().length ? `\n\nהערות:\n${notes.trim()}` : "";
    const end = `\n\nאודה לאישורכם בהודעה חוזרת`;
    return `${header}\n${body}${foot}${end}`;
  }
  function updatePreview(){
    const map=collectMap();
    const count=Object.keys(map).length;
    summaryCount.textContent=`סה״כ פריטים: ${count}`;
    preview.textContent = count ? buildWhatsAppText(map) : (notes ? `הערות:\n${notes}` : "");
  }
  document.getElementById("btnSave").addEventListener("click", ()=>{
    const map=collectMap();
    orders.unshift({ ts: Date.now(), supplier: activeSupplier, map, notes });
    save(K.orders, orders);
    draft={}; save(K.draft,draft); buildOrders();
    toast("ההזמנה נשמרה");
  });
  document.getElementById("btnCopy").addEventListener("click", ()=>{
    const txt=buildWhatsAppText(collectMap());
    navigator.clipboard&&navigator.clipboard.writeText(txt);
    toast("הטקסט הועתק");
  });
  document.getElementById("btnWhatsApp").addEventListener("click", ()=>{
    const s=suppliers.find(x=>x.phone===activeSupplier);
    if(!s){ toast("בחר ספק"); return; }
    const url="https://wa.me/"+s.phone+"?text="+encodeURIComponent(buildWhatsAppText(collectMap()));
    window.open(url,"_blank");
  });
  orderNotes.addEventListener("input", ()=>{ notes=orderNotes.value; save(K.notes, notes); updatePreview(); });

  // HISTORY
  function renderHistory(){
    historyList.innerHTML="";
    if(!orders.length){ historyList.innerHTML='<div class="item">אין היסטוריה עדיין</div>'; return; }
    orders.forEach((o,i)=>{
      const s=suppliers.find(x=>x.phone===o.supplier);
      const ts=new Date(o.ts).toLocaleString('he-IL');
      const body=Object.entries(o.map).map(([k,v])=>`${k} - ${v}`).join("\n");
      const notesBloc=o.notes? `\n\nהערות:\n${o.notes}`:"";
      const div=document.createElement("div"); div.className="item";
      div.innerHTML=`<div><b>#${orders.length-i}</b> • ${ts} • ${s? s.name : o.supplier}</div><pre>${body}${notesBloc}</pre>`;
      historyList.appendChild(div);
    });
  }

  // ANALYTICS (simple)
  let chart;
  function renderAnalyticsRange(startMs,endMs){
    const dataMap = new Map();
    orders.filter(o=>o.ts>=startMs && o.ts<=endMs).forEach(o=>{
      Object.entries(o.map).forEach(([name,qty])=>{
        const n=parseFloat(String(qty).match(/\d+(?:\.\d+)?/));
        if(!isNaN(n)) dataMap.set(name,(dataMap.get(name)||0)+n);
      });
    });
    const rows=[...dataMap.entries()].sort((a,b)=>b[1]-a[1]).slice(0,10);
    const ctx=document.getElementById("chartBar").getContext("2d");
    if(chart) chart.destroy();
    chart=new Chart(ctx,{type:"bar",data:{labels:rows.map(r=>r[0]),datasets:[{label:"כמות",data:rows.map(r=>r[1])}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}}}});
    analyticsBox.innerHTML = "";
    const host=document.createElement("div"); host.className="item";
    host.innerHTML = rows.length ? rows.map(r=>`${r[0]} — ${r[1]}`).join("<br>") : "אין נתונים בתאריכים שנבחרו";
    analyticsBox.appendChild(host);
  }
  function renderAnalyticsThisMonth(){
    const now=new Date(); const start=new Date(now.getFullYear(), now.getMonth(), 1).getTime(); const end=new Date(now.getFullYear(), now.getMonth()+1, 0, 23,59,59,999).getTime();
    renderAnalyticsRange(start,end);
  }
  document.getElementById("btnThisMonth").addEventListener("click", renderAnalyticsThisMonth);
  document.getElementById("btnRange").addEventListener("click", ()=>{
    const s=fromDate.value? new Date(fromDate.value).getTime():0;
    const e=toDate.value? new Date(toDate.value).getTime()+86400000-1:Date.now();
    renderAnalyticsRange(s,e);
  });

  // SETTINGS
  const suppliersList = document.getElementById("suppliersList");
  const supName = document.getElementById("supName");
  const supPhone = document.getElementById("supPhone");
  const supDay = document.getElementById("supDay");
  const btnAddSupplier = document.getElementById("btnAddSupplier");
  const itmName = document.getElementById("itmName");
  const itmUnit = document.getElementById("itmUnit");
  const itmPrice = document.getElementById("itmPrice");
  const itmSupplier = document.getElementById("itmSupplier");
  const btnAddItem = document.getElementById("btnAddItem");
  const itemsTable = document.getElementById("itemsTable");

  function renderSettings(){
    suppliersList.innerHTML="";
    suppliers.forEach((s,idx)=>{
      const row=document.createElement("div"); row.className="item";
      const dayTxt = s.day==="all" ? "כל הימים" : ["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"][parseInt(s.day)];
      row.innerHTML = `<b>${s.name}</b> — ${s.phone} • יום: ${dayTxt}`;
      row.addEventListener("click", ()=>{ supName.value=s.name; supPhone.value=s.phone; supDay.value=s.day; });
      suppliersList.appendChild(row);
    });

    itmSupplier.innerHTML="";
    suppliers.forEach(s=>{
      const o=document.createElement("option");
      o.value=s.phone; o.textContent=`${s.name} — ${s.phone}`;
      itmSupplier.appendChild(o);
    });

    renderItemsTable(itmSupplier.value || suppliers[0]?.phone);
    itmSupplier.addEventListener("change", ()=>renderItemsTable(itmSupplier.value));
  }

  btnAddSupplier.addEventListener("click", ()=>{
    const name=supName.value.trim(); const phone=supPhone.value.trim(); const day=supDay.value;
    if(!name || !phone){ toast("שם ומספר ספק חובה"); return; }
    const i=suppliers.findIndex(x=>x.phone===phone);
    const rec={ name, phone, day };
    if(i>=0) suppliers[i]=rec; else suppliers.push(rec);
    save(K.suppliers, suppliers);
    if(!items[phone]){ items[phone]=[]; save(K.items, items); }
    renderSettings(); renderHome();
    toast(i>=0? "ספק עודכן":"ספק נוסף");
  });

  function renderItemsTable(phone){
    itemsTable.innerHTML="";
    const list=items[phone]||[];
    if(!list.length){ itemsTable.innerHTML='<div class="item">אין פריטים לספק זה</div>'; return; }
    const host=document.createElement("div"); host.className="table";
    const t=document.createElement("table");
    t.innerHTML="<thead><tr><th>פריט</th><th>יח׳</th><th>מחיר</th></tr></thead>";
    const tb=document.createElement("tbody");
    list.forEach(it=>{
      const tr=document.createElement("tr"); tr.innerHTML=`<td>${it.name}</td><td>${it.unit||""}</td><td>${it.price||0}</td>`;
      tr.addEventListener("click", ()=>{ itmName.value=it.name; itmUnit.value=it.unit||""; itmPrice.value=it.price||0; });
      tb.appendChild(tr);
    });
    t.appendChild(tb); host.appendChild(t); itemsTable.appendChild(host);
  }

  btnAddItem.addEventListener("click", ()=>{
    const name=itmName.value.trim(); if(!name){ toast("שם פריט חובה"); return; }
    const unit=itmUnit.value.trim(); const price=parseFloat(itmPrice.value)||0; const phone=itmSupplier.value;
    const list = items[phone] || [];
    const ix = list.findIndex(i=>i.name===name);
    const rec = { name, unit, price };
    if(ix>=0) list[ix]=rec; else list.push(rec);
    items[phone]=list; save(K.items, items);
    renderItemsTable(phone);
    toast(ix>=0? "פריט עודכן":"פריט נוסף");
  });

  function toast(msg){
    const t=document.getElementById("toast"), m=document.getElementById("toastMsg");
    m.textContent=msg; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),1500);
  }

  function renderAnalyticsThisMonth(){
    const now=new Date(); const start=new Date(now.getFullYear(), now.getMonth(), 1).getTime(); const end=new Date(now.getFullYear(), now.getMonth()+1, 0, 23,59,59,999).getTime();
    renderAnalyticsRange(start,end);
  }

  let chart;
  function renderAnalyticsRange(startMs,endMs){
    const dataMap = new Map();
    orders.filter(o=>o.ts>=startMs && o.ts<=endMs).forEach(o=>{
      Object.entries(o.map).forEach(([name,qty])=>{
        const n=parseFloat(String(qty).match(/\d+(?:\.\d+)?/));
        if(!isNaN(n)) dataMap.set(name,(dataMap.get(name)||0)+n);
      });
    });
    const rows=[...dataMap.entries()].sort((a,b)=>b[1]-a[1]).slice(0,10);
    const ctx=document.getElementById("chartBar").getContext("2d");
    if(chart) chart.destroy();
    chart=new Chart(ctx,{type:"bar",data:{labels:rows.map(r=>r[0]),datasets:[{label:"כמות",data:rows.map(r=>r[1])}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}}}});
    analyticsBox.innerHTML = "";
    const host=document.createElement("div"); host.className="item";
    host.innerHTML = rows.length ? rows.map(r=>`${r[0]} — ${r[1]}`).join("<br>") : "אין נתונים בתאריכים שנבחרו";
    analyticsBox.appendChild(host);
  }

  renderHome();
  buildOrders();

})();