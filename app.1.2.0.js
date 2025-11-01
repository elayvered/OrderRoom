(function(){
  const K = {
    suppliers: "or_v120_suppliers",
    items: "or_v120_items",
    active: "or_v120_active",
    orders: "or_v120_orders",
    draft: "or_v120_draft",
    notes: "or_v120_notes",
    meta: "or_v120_meta" // per supplier meta like branch
  };

  const q = new URLSearchParams(location.search);
  if (q.get("reset")==="1"){ Object.values(K).forEach(k=>localStorage.removeItem(k)); }

  const BRANCHES = [
    { id:"hills",  name:"הילס",  address:"אריק איינשטיין 3, הרצליה" },
    { id:"nordau", name:"נורדאו", address:"נורדאו 4, הרצליה" }
  ];

  const days = ["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"];
  const months = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];

  const DEFAULT_SUPPLIERS = [
    { name: "מזרח מערב", phone: "9725044320036", days:["all"], delivery:{}, branches:["hills","nordau"] },
    { name: "דיפלומט", phone: "972500000000",   days:["all"], delivery:{}, branches:["hills","nordau"] }
  ];

  const MM_ITEMS = ["אבקת וואסבי","א.ביצים לאיון","אטריות אורז 3 מ","ג'ינג'ר לבן","מגש 03","מגש 07","מחית צ'ילי בשמן","מחית קארי ירוק","מחית קארי אדום","תמרהינדי","מיסו לבן דאשי","מירין גדול","סויה ירוק גדול","סויה ללג גדול","סאקה גדול","פנקו","רוטב דגים 4 ל","רוטב פטריות","שומשום שחור","שמן צ'ילי","שמן שומשום","קרם קוקוס גדול","טמפורה","יוזו גדול","יוזו גדול ללא מלח","סוכר דקלים","צדפות שימורים","בצל מטוגן","אבקת חרדל יפני","טוגראשי","טום יאם","קנפיו קילו","מגש מסיבה L","מגש מסיבה M","סויה גולדן מאונטן","חטיפי אצות","סויה כהה","חומץ אורז","אנשובי בשמן גדול","אצות נורי קוריאה","אורז יסמין","שיפודי קשר","אבקת מאצה","ליקר מאצה","רשת לסיר אורז","כף ווק","ווק","דפי רשת אורז","אצות וואקמה","אצות קומבו","דאשי","אררה","צ'ופסטיקס חבק שחור","שיפודי יקיטורי"];

  const save = (k,v)=>localStorage.setItem(k, JSON.stringify(v));
  const load = (k,d)=>{ try{ const v = JSON.parse(localStorage.getItem(k)); return v ?? d } catch(_){ return d } };

  let suppliers = load(K.suppliers, DEFAULT_SUPPLIERS);
  // Ensure data shape
  suppliers = suppliers.map(s=>({ ...s, days: s.days||["all"], delivery: s.delivery||{}, branches: s.branches||["hills"] }));
  save(K.suppliers, suppliers);

  let items = load(K.items, {});
  if (!Array.isArray(items[suppliers[0].phone])) items[suppliers[0].phone] = MM_ITEMS.map(n=>({name:n,unit:"",price:0}));
  suppliers.forEach(s=>{ if(!Array.isArray(items[s.phone])) items[s.phone]=items[s.phone]||[]; });
  save(K.items, items);

  let active = load(K.active, suppliers[0]?.phone);
  if(!suppliers.find(s=>s.phone===active)){ active = suppliers[0]?.phone; save(K.active, active); }
  let orders = load(K.orders, []);
  let draft = load(K.draft, {});
  let notes = load(K.notes, "");
  let meta = load(K.meta, {}); // { [supplierPhone]: { branchId:"hills" } }

  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  // Header date
  (function(){ const d=new Date(); $("#headerDate").textContent=`יום ${days[d.getDay()]} · ${d.getDate()} ב${months[d.getMonth()]} ${d.getFullYear()}`; $("#todayDate").textContent=d.toLocaleDateString('he-IL'); })();

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

  // Home helpers
  const today = ()=> String(new Date().getDay());
  const suppliersForOrdersToday = ()=> suppliers.filter(s => s.days.includes("all") || s.days.includes(today()));
  const suppliersForDeliveriesToday = ()=> suppliers.filter(s => Object.values(s.delivery||{}).includes(today()) );

  function homeCard(s){
    const bnames = (s.branches||[]).map(bid=>BRANCHES.find(x=>x.id===bid)?.name).filter(Boolean);
    const card = document.createElement("div");
    card.className = "home-card";
    card.innerHTML = `<div class="left"><div class="dot"></div><div class="name">${s.name}</div></div><div class="addr">${bnames.join(" · ")}</div>`;
    card.onclick = ()=>{ active = s.phone; save(K.active, active); showOrders(); };
    return card;
  }

  function renderHome(){
    const hostO = $("#homeOrders"); hostO.innerHTML="";
    suppliersForOrdersToday().forEach(s=>hostO.appendChild(homeCard(s)));
    const hostD = $("#homeDeliveries"); hostD.innerHTML="";
    suppliersForDeliveriesToday().forEach(s=>hostD.appendChild(homeCard(s)));
  }

  const showOrders=()=>{ $$(".screen").forEach(s=>s.classList.remove("active")); $("#view-orders").classList.add("active"); $$(".nav .tab").forEach(t=>t.classList.remove("active")); document.querySelector('[data-view="view-orders"]').classList.add("active"); buildOrders(); };

  // Orders
  function buildOrders(){
    // Supplier switch (name only)
    const sw=$("#supplierSwitch"); sw.innerHTML="";
    suppliers.forEach(s=>{ const o=document.createElement("option"); o.value=s.phone; o.textContent=s.name; if(s.phone===active) o.selected=true; sw.appendChild(o); });
    sw.onchange=()=>{ active=sw.value; save(K.active, active); buildOrders(); };

    // Branch selection
    const s = suppliers.find(x=>x.phone===active);
    const bw = $("#branchWrap"); bw.innerHTML="";
    const allowed = (s?.branches||[]);
    if(allowed.length<=1){
      const only = BRANCHES.find(b=>b.id === (allowed[0]||"hills"));
      bw.innerHTML = `<span class="branch-pill">נק׳ אספקה: ${only?.name||"הילס"}</span>`;
      meta[active] = { ...(meta[active]||{}), branchId: only?.id || "hills" };
      save(K.meta, meta);
    } else {
      const sel = document.createElement("select");
      sel.className = "text";
      allowed.forEach(bid=>{
        const b = BRANCHES.find(x=>x.id===bid);
        const o = document.createElement("option");
        o.value = b.id; o.textContent = `${b.name} — ${b.address}`;
        if((meta[active]?.branchId||allowed[0])===b.id) o.selected=true;
        sel.appendChild(o);
      });
      sel.onchange = ()=>{ meta[active] = { ...(meta[active]||{}), branchId: sel.value }; save(K.meta, meta); updatePreview(); };
      bw.appendChild(sel);
    }

    // Items list
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

  function buildText(m){
    const s=suppliers.find(x=>x.phone===active);
    const dt=new Date().toLocaleString('he-IL');
    const bId = meta[active]?.branchId;
    const b = BRANCHES.find(x=>x.id===bId) || BRANCHES[0];
    const head=`הזמנת סחורה - סושי רום${s?` - ${s.name}`:''}\nנקודת אספקה - ${b.name} (${b.address})\nתאריך - ${dt}\nפירוט הזמנה -`;
    const body=Object.entries(m).map(([k,v])=>`${k} - ${v}`).join("\n");
    const foot=notes?`\n\nהערות:\n${notes.trim()}`:'';
    return `${head}\n${body}${foot}\n\nאודה לאישורכם בהודעה חוזרת`;
  }

  function updatePreview(){ const m=mapFromInputs(); $("#count").textContent=`סה״כ פריטים: ${Object.keys(m).length}`; $("#preview").textContent=Object.keys(m).length?buildText(m):(notes?`הערות:\n${notes}`:''); }

  $("#btnSave").onclick=()=>{ const m=mapFromInputs(); orders.unshift({ts:Date.now(), supplier:active, map:m, notes, branch: meta[active]?.branchId}); save(K.orders,orders); draft={}; save(K.draft,draft); buildOrders(); toast("ההזמנה נשמרה"); };
  $("#btnCopy").onclick=()=>{ const m=mapFromInputs(); navigator.clipboard&&navigator.clipboard.writeText(buildText(m)); toast("הטקסט הועתק"); };
  $("#btnWA").onclick=()=>{ const s=suppliers.find(x=>x.phone===active); if(!s) return toast("בחר ספק"); const url=`https://wa.me/${s.phone}?text=${encodeURIComponent(buildText(mapFromInputs()))}`; window.open(url,"_blank"); };
  $("#notes").oninput=(e)=>{ notes=e.target.value; save(K.notes,notes); updatePreview(); };

  // History with item filter
  function renderHistory(){
    const host=$("#historyList"); host.innerHTML="";
    const tokens = $("#historyFilter").value.split(",").map(x=>x.trim()).filter(Boolean);
    const visible = !tokens.length ? orders : orders.filter(o=>{
      const keys = Object.keys(o.map||{});
      return tokens.some(t => keys.some(k => k.includes(t)));
    });
    if(!visible.length){ host.innerHTML='<div class="item">אין היסטוריה לתצוגה</div>'; return; }
    visible.forEach((o,idx)=>{
      const s=suppliers.find(x=>x.phone===o.supplier); const ts=new Date(o.ts).toLocaleString('he-IL');
      const body=Object.entries(o.map).map(([k,v])=>`${k} - ${v}`).join("\\n");
      const notesBlock=o.notes?`\\n\\nהערות:\\n${o.notes}`:'';
      const b = BRANCHES.find(x=>x.id===o.branch);
      const div=document.createElement("div"); div.className='item';
      div.innerHTML=`<div><b>#${orders.length-idx}</b> • ${ts} • ${s?s.name:o.supplier}${b?` • ${b.name}`:''}</div><pre>${body}${notesBlock}</pre>`;
      host.appendChild(div);
    });
  }
  $("#historyFilter").oninput=renderHistory;
  $("#btnClearFilter").onclick=()=>{ $("#historyFilter").value=""; renderHistory(); };

  // Settings
  function renderSettings(){
    // List
    const host=$("#suppliersList"); host.innerHTML="";
    suppliers.forEach(s=>{
      const r=document.createElement("div"); r.className="item";
      // days preview
      const daysTxt = s.days.includes("all") ? "כל הימים" : s.days.map(d=>days[+d]).join(" · ");
      const bnames = (s.branches||[]).map(bid=>BRANCHES.find(x=>x.id===bid)?.name).filter(Boolean).join(" · ");
      const delTxt = Object.keys(s.delivery||{}).length ? Object.entries(s.delivery).map(([od,dd])=>`${days[+od]}→${days[+dd]}`).join(" | ") : "ללא מפה";
      r.innerHTML = `<div><b>${s.name}</b></div><div class="muted">ימים: ${daysTxt} • אספקה: ${delTxt} • סניפים: ${bnames}</div>`;
      r.onclick=()=>loadSupplierToForm(s);
      host.appendChild(r);
    });

    // Chips days
    buildDaysChips(currentForm.days||["all"]);
    buildDeliveryMap(currentForm.delivery||{});
    // Branches checkboxes
    $("#brHills").checked = (currentForm.branches||[]).includes("hills");
    $("#brNordau").checked = (currentForm.branches||[]).includes("nordau");
  }

  // Form state in settings
  let currentForm = { name:"", phone:"", days:["all"], delivery:{}, branches:["hills"] };
  function loadSupplierToForm(s){
    currentForm = JSON.parse(JSON.stringify(s));
    $("#supName").value = s.name;
    $("#supPhone").value = s.phone;
    buildDaysChips(s.days||["all"]);
    buildDeliveryMap(s.delivery||{});
    $("#brHills").checked = (s.branches||[]).includes("hills");
    $("#brNordau").checked = (s.branches||[]).includes("nordau");
  }
  $("#btnNew").onclick=()=>{ currentForm = { name:"", phone:"", days:["all"], delivery:{}, branches:["hills"] };
    $("#supName").value=""; $("#supPhone").value=""; buildDaysChips(currentForm.days); buildDeliveryMap(currentForm.delivery); $("#brHills").checked=true; $("#brNordau").checked=false; };

  function buildDaysChips(sel){
    const wrap=$("#daysChips"); wrap.innerHTML="";
    const useAll = sel.includes("all");
    days.forEach((dname,idx)=>{
      const chip=document.createElement("button"); chip.type="button"; chip.className="chip"; chip.textContent=dname;
      if(useAll || sel.includes(String(idx))) chip.classList.add("active");
      chip.onclick=()=>{
        let set = new Set(currentForm.days||[]);
        if(set.has("all")) set = new Set(); // disable all state when choosing specific
        const key=String(idx);
        if(set.has(key)) set.delete(key); else set.add(key);
        if(set.size===0){ set.add("all"); currentForm.delivery = {}; } // back to all
        currentForm.days = Array.from(set);
        buildDaysChips(currentForm.days);
        buildDeliveryMap(currentForm.delivery);
      };
      wrap.appendChild(chip);
    });
    // If 'all', visually indicate
    if(useAll){
      const hint=document.createElement("div"); hint.className="hint"; hint.textContent="כל הימים פעילים. מיפוי אספקה לא נדרש.";
      $("#deliveryMapWrap").innerHTML=""; $("#deliveryMapWrap").appendChild(hint);
    }
  }

  function buildDeliveryMap(map){
    const wrap=$("#deliveryMapWrap"); wrap.innerHTML="";
    const sel = currentForm.days||[];
    if(sel.includes("all")) return; // no map when all days
    sel.forEach(d=>{
      const pill=document.createElement("div"); pill.className="map-pill";
      const lab=document.createElement("div"); lab.textContent = `הזמנה ביום ${days[+d]} → אספקה:`;
      const select=document.createElement("select");
      days.forEach((nm,idx)=>{
        const o=document.createElement("option"); o.value=String(idx); o.textContent=nm;
        if(String(map[d]??"")===String(idx)) o.selected=true;
        select.appendChild(o);
      });
      select.onchange=()=>{ currentForm.delivery = {...(currentForm.delivery||{}), [d]: select.value }; };
      pill.appendChild(lab); pill.appendChild(select); wrap.appendChild(pill);
    });
  }

  $("#btnAddSup").onclick=()=>{
    const name=$("#supName").value.trim();
    const phone=$("#supPhone").value.trim();
    const branches = [ $("#brHills").checked ? "hills": null, $("#brNordau").checked ? "nordau": null ].filter(Boolean);
    if(!name||!phone) return toast("שם ומספר חובה");
    const rec = { name, phone, days: currentForm.days, delivery: currentForm.delivery, branches };
    const idx = suppliers.findIndex(x=>x.phone===phone);
    if(idx>=0) suppliers[idx]=rec; else suppliers.push(rec);
    save(K.suppliers, suppliers);
    toast(idx>=0?"עודכן":"נוסף");
    renderSettings(); renderHome();
  };

  function toast(msg){ const t=$("#toast"); $("#toastMsg").textContent=msg; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),1200); }

  // Init
  renderHome(); buildOrders(); renderHistory(); // settings renders on demand
})();