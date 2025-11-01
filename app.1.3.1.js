(function(){
  const K = {
    suppliers: "or_v131_suppliers",
    items: "or_v131_items",
    active: "or_v131_active",
    orders: "or_v131_orders",
    draft: "or_v131_draft",
    notes: "or_v131_notes",
    meta: "or_v131_meta"
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
    { name: "מזרח מערב", phone: "9725044320036", email:"", days:["all"], delivery:{}, branches:["hills","nordau"], channels:["wa"] },
    { name: "דיפלומט", phone: "972500000000", email:"", days:["all"], delivery:{}, branches:["hills","nordau"], channels:["wa"] }
  ];

  const MM_ITEMS = ["אבקת וואסבי","א.ביצים לאיון","אטריות אורז 3 מ","ג'ינג'ר לבן","מגש 03","מגש 07","מחית צ'ילי בשמן","מחית קארי ירוק","מחית קארי אדום","תמרהינדי","מיסו לבן דאשי","מירין גדול","סויה ירוק גדול","סויה ללג גדול","סאקה גדול","פנקו","רוטב דגים 4 ל","רוטב פטריות","שומשום שחור","שמן צ'ילי","שמן שומשום","קרם קוקוס גדול","טמפורה","יוזו גדול","יוזו גדול ללא מלח","סוכר דקלים","צדפות שימורים","בצל מטוגן","אבקת חרדל יפני","טוגראשי","טום יאם","קנפיו קילו","מגש מסיבה L","מגש מסיבה M","סויה גולדן מאונטן","חטיפי אצות","סויה כהה","חומץ אורז","אנשובי בשמן גדול","אצות נורי קוריאה","אורז יסמין","שיפודי קשר","אבקת מאצה","ליקר מאצה","רשת לסיר אורז","כף ווק","ווק","דפי רשת אורז","אצות וואקמה","אצות קומבו","דאשי","אררה","צ'ופסטיקס חבק שחור","שיפודי יקיטורי"];

  const save = (k,v)=>localStorage.setItem(k, JSON.stringify(v));
  const load = (k,d)=>{ try{ const v = JSON.parse(localStorage.getItem(k)); return v ?? d } catch(_){ return d } };

  let suppliers = load(K.suppliers, DEFAULT_SUPPLIERS);
  let items = load(K.items, {});
  if (!Array.isArray(items[DEFAULT_SUPPLIERS[0].phone])) items[DEFAULT_SUPPLIERS[0].phone] = MM_ITEMS.map(n=>({name:n,unit:"",price:0}));
  suppliers.forEach(s=>{ if(!Array.isArray(items[s.phone])) items[s.phone]=items[s.phone]||[]; });
  save(K.items, items);

  let active = load(K.active, suppliers[0]?.phone);
  let orders = load(K.orders, []);
  let draft = load(K.draft, {});
  let notes = load(K.notes, "");
  let meta = load(K.meta, {});

  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  // Header date
  (function(){ const d=new Date(); $("#headerDate").textContent=`יום ${days[d.getDay()]} · ${d.getDate()} ב${months[d.getMonth()]} ${d.getFullYear()}`; $("#todayDate").textContent=d.toLocaleDateString('he-IL'); })();

  // Nav with motion class
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
  const today = ()=> String(new Date().getDay());
  const suppliersForOrdersToday = ()=> suppliers.filter(s => (s.days||["all"]).includes("all") || (s.days||[]).includes(today()));
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

  // Supplier modal
  const supplierModal = $("#supplierModal");
  const supplierGrid = $("#supplierGrid");
  function openSupplierModal(){
    supplierGrid.innerHTML="";
    suppliers.forEach(sp=>{
      const bnames=(sp.branches||[]).map(bid=>BRANCHES.find(x=>x.id===bid)?.name).filter(Boolean).join(" · ");
      const btn=document.createElement("button"); btn.className="send-btn";
      btn.innerHTML=`<div style="font-weight:800">${sp.name}</div><div class="muted" style="font-weight:600">${bnames}</div>`;
      btn.onclick=()=>{ active=sp.phone; save(K.active,active); supplierModal.classList.remove("show"); buildOrders(); };
      supplierGrid.appendChild(btn);
    });
    supplierModal.classList.add("show");
  }
  $("#supCancel").onclick=()=>supplierModal.classList.remove("show");

  // Orders screen
  function buildOrders(){
    // Supplier button label
    const s = suppliers.find(x=>x.phone===active);
    $("#supplierBtnLabel").textContent = s ? s.name : "בחר ספק";
    $("#supplierBtn").onclick = openSupplierModal;

    // Branch segmented toggle
    const bw = $("#branchWrap"); bw.innerHTML="";
    const allowed = (s?.branches||[]);
    if(allowed.length<=1){
      const only = BRANCHES.find(b=>b.id === (allowed[0]||"hills"));
      bw.innerHTML = `<span class="seg-wrap">נק׳ אספקה: <span class="seg-btn active">${only?.name||"הילס"}</span></span>`;
      meta[active] = { ...(meta[active]||{}), branchId: only?.id || "hills" };
      save(K.meta, meta);
    } else {
      const seg=document.createElement("div"); seg.className="segment";
      allowed.forEach(bid=>{
        const b=BRANCHES.find(x=>x.id===bid);
        const t=document.createElement("button"); t.type="button"; t.className="seg-btn"; t.textContent=b.name;
        const current = meta[active]?.branchId || allowed[0];
        if(current===bid) t.classList.add("active");
        t.onclick=()=>{ meta[active] = {...(meta[active]||{}), branchId: bid}; save(K.meta,meta); seg.querySelectorAll('.seg-btn').forEach(el=>el.classList.remove("active")); t.classList.add("active"); updatePreview(); };
        seg.appendChild(t);
      });
      bw.appendChild(seg);
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
    const head=`הזמנת סחורה - סושי רום${s?` - ${s.name}`:''}\\nסניף - ${b.name} (${b.address})\\nתאריך - ${dt}\\nפירוט הזמנה -`;
    const body=Object.entries(m).map(([k,v])=>`${k} - ${v}`).join("\\n");
    const foot=notes?`\\n\\nהערות:\\n${notes.trim()}`:'';
    return `${head}\\n${body}${foot}\\n\\nאודה לאישורכם בהודעה חוזרת`;
  }

  function updatePreview(){ const m=mapFromInputs(); $("#count").textContent=`סה״כ פריטים: ${Object.keys(m).length}`; $("#preview").textContent=Object.keys(m).length?buildText(m):(notes?`הערות:\\n${notes}`:''); }

  $("#btnSave").onclick=()=>{ const m=mapFromInputs(); orders.unshift({ts:Date.now(), supplier:active, map:m, notes, branch: meta[active]?.branchId}); save(K.orders,orders); draft={}; save(K.draft,draft); buildOrders(); toast("הטיוטה נשמרה"); };
  $("#btnCopy").onclick=()=>{ const m=mapFromInputs(); navigator.clipboard&&navigator.clipboard.writeText(buildText(m)); toast("הטקסט הועתק"); };

  // Send modal
  const modal=$("#sendModal"), sendBtns=$("#sendBtns");
  $("#btnSend").onclick=()=>{
    const s=suppliers.find(x=>x.phone===active); if(!s) return toast("בחר ספק");
    sendBtns.innerHTML="";
    // WA
    if(s.phone){
      const btn=document.createElement("button"); btn.className="send-btn"; btn.innerHTML=waIcon()+"וואטסאפ";
      btn.onclick=()=>{ const url=`https://wa.me/${s.phone}?text=${encodeURIComponent(buildText(mapFromInputs()))}`; window.open(url,"_blank"); };
      sendBtns.appendChild(btn);
    }
    // Email if exists
    if(s.email){
      const btn=document.createElement("button"); btn.className="send-btn"; btn.innerHTML=emailIcon()+"אימייל";
      btn.onclick=()=>{ const url=`mailto:${s.email}?subject=${encodeURIComponent("הזמנת סחורה - סושי רום")}&body=${encodeURIComponent(buildText(mapFromInputs()))}`; window.location.href=url; };
      sendBtns.appendChild(btn);
    }
    // always copy
    const btnCopy=document.createElement("button"); btnCopy.className="send-btn"; btnCopy.innerHTML=copyIcon()+"העתק הזמנה";
    btnCopy.onclick=()=>{ navigator.clipboard&&navigator.clipboard.writeText(buildText(mapFromInputs())); toast("הטקסט הועתק"); };
    sendBtns.appendChild(btnCopy);
    modal.classList.add("show");
  };
  $("#sendCancel").onclick=()=>modal.classList.remove("show");
  $$(".modal-backdrop").forEach(el=>el.addEventListener("click",()=>{
    modal.classList.remove("show"); supplierModal.classList.remove("show");
  }));

  const waIcon = ()=>'<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path fill="#25D366" d="M16 3C9.383 3 4 8.383 4 15c0 2.268.62 4.388 1.695 6.207L4 29l8.012-1.66C13.744 28.425 14.838 29 16 29c6.617 0 12-5.383 12-12S22.617 3 16 3z"/><path fill="#fff" d="M23.08 19.27c-.11-.18-.41-.29-.86-.5s-2.63-1.3-3.03-1.45-.7-.22-1 .22-1.14 1.45-1.4 1.75-.52.33-.95.11a10.7 10.7 0 0 1-3.15-1.94 11.9 11.9 0 0 1-2.2-2.73c-.22-.37 0-.58.2-.8.2-.2.44-.5.66-.76.22-.26.29-.44.44-.73.15-.29.07-.55-.04-.77-.11-.22-1-2.41-1.36-3.3-.36-.88-.72-.75-.99-.76h-.85c-.29 0-.76.11-1.16.55s-1.53 1.5-1.53 3.64 1.57 4.22 1.79 4.51c.22.29 3.08 4.7 7.46 6.4 1.04.45 1.85.72 2.48.93 1.04.33 1.98.28 2.73.17.83-.12 2.63-1.08 3-2.12.37-1.04.37-1.93.26-2.12z"/></svg>';
  const emailIcon = ()=>'<svg viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>';
  const copyIcon = ()=>'<svg viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><rect x="2" y="2" width="13" height="13" rx="2"/></svg>';

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
  let currentForm = { name:"", phone:"", email:"", days:["all"], delivery:{}, branches:["hills"], channels:["wa"] };

  function renderSettings(){
    const host=$("#suppliersList"); host.innerHTML="";
    suppliers.forEach(s=>{
      const r=document.createElement("div"); r.className="item";
      const daysTxt = (s.days||[]).includes("all") ? "כל הימים" : (s.days||[]).map(d=>days[+d]).join(" · ");
      const bnames = (s.branches||[]).map(bid=>BRANCHES.find(x=>x.id===bid)?.name).filter(Boolean).join(" · ");
      const delTxt = Object.keys(s.delivery||{}).length ? Object.entries(s.delivery).map(([od,dd])=>`${days[+od]}→${days[+dd]}`).join(" | ") : "ללא מפה";
      const ch = (s.channels||[]).map(c=>c=="wa"?"WA":"Email").join(" + ") || "Copy only";
      r.innerHTML = `<div><b>${s.name}</b></div><div class="muted">ימים: ${daysTxt} • אספקה: ${delTxt} • סניפים: ${bnames} • ערוצים: ${ch}</div>`;
      r.onclick=()=>loadSupplierToForm(s);
      host.appendChild(r);
    });

    buildDaysChips(currentForm.days||["all"]);
    buildDeliveryMap(currentForm.delivery||{});
    $("#brHills").checked = (currentForm.branches||[]).includes("hills");
    $("#brNordau").checked = (currentForm.branches||[]).includes("nordau");
    $("#chWA").checked = (currentForm.channels||[]).includes("wa");
    $("#chEmail").checked = (currentForm.channels||[]).includes("email");
    $("#supEmail").value = currentForm.email||"";
    renderItemsEditor();
  }

  function loadSupplierToForm(s){
    currentForm = JSON.parse(JSON.stringify(s));
    $("#supName").value = s.name;
    $("#supPhone").value = s.phone;
    $("#supEmail").value = s.email||"";
    buildDaysChips(s.days||["all"]);
    buildDeliveryMap(s.delivery||{});
    $("#brHills").checked = (s.branches||[]).includes("hills");
    $("#brNordau").checked = (s.branches||[]).includes("nordau");
    $("#chWA").checked = (s.channels||[]).includes("wa");
    $("#chEmail").checked = (s.channels||[]).includes("email");
    renderItemsEditor(s.phone);
  }
  $("#btnNew").onclick=()=>{ currentForm = { name:"", phone:"", email:"", days:["all"], delivery:{}, branches:["hills"], channels:["wa"] };
    $("#supName").value=""; $("#supPhone").value=""; $("#supEmail").value="";
    buildDaysChips(currentForm.days); buildDeliveryMap(currentForm.delivery);
    $("#brHills").checked=true; $("#brNordau").checked=false; $("#chWA").checked=true; $("#chEmail").checked=false;
    renderItemsEditor();
  };

  function buildDaysChips(sel){
    const wrap=$("#daysChips"); wrap.innerHTML="";
    const useAll = sel.includes("all");
    days.forEach((dname,idx)=>{
      const chip=document.createElement("button"); chip.type="button"; chip.className="chip"; chip.textContent=dname;
      if(useAll || sel.includes(String(idx))) chip.classList.add("active");
      chip.onclick=()=>{
        let set = new Set(currentForm.days||[]);
        if(set.has("all")) set = new Set(); // disable all state
        const key=String(idx);
        if(set.has(key)) set.delete(key); else set.add(key);
        if(set.size===0){ set.add("all"); currentForm.delivery = {}; } // back to all
        currentForm.days = Array.from(set);
        buildDaysChips(currentForm.days);
        buildDeliveryMap(currentForm.delivery);
      };
      wrap.appendChild(chip);
    });
    if(useAll){
      const hint=document.createElement("div"); hint.className="hint"; hint.textContent="כל הימים פעילים. מיפוי אספקה לא נדרש.";
      $("#deliveryMapWrap").innerHTML=""; $("#deliveryMapWrap").appendChild(hint);
    }
  }

  function buildDeliveryMap(map){
    const wrap=$("#deliveryMapWrap"); wrap.innerHTML="";
    const sel = currentForm.days||[];
    if(sel.includes("all")) return;
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
    const email=$("#supEmail").value.trim();
    const branches = [ $("#brHills").checked ? "hills": null, $("#brNordau").checked ? "nordau": null ].filter(Boolean);
    const channels = [ $("#chWA").checked? "wa": null, ($("#chEmail").checked && email)? "email": null ].filter(Boolean);
    if(!name||!phone) return toast("שם ומספר חובה");
    const rec = { name, phone, email, days: currentForm.days, delivery: currentForm.delivery, branches, channels };
    const idx = suppliers.findIndex(x=>x.phone===phone);
    if(idx>=0) suppliers[idx]=rec; else suppliers.push(rec);
    save(K.suppliers, suppliers);
    toast(idx>=0?"עודכן":"נוסף");
    renderSettings(); renderHome(); if(active===phone) buildOrders();
  };

  // Items editor – reordering works
  function renderItemsEditor(phone){
    const p = phone || active || suppliers[0]?.phone;
    const ed=$("#itemsEditor"); ed.innerHTML="";
    if(!p){ ed.innerHTML='<div class="hint">בחר ספק כדי לערוך פריטים</div>'; return; }
    const arr = items[p] || [];
    arr.forEach((it,idx)=>{
      const row=document.createElement("div"); row.className="item-row";
      row.innerHTML = `<div class="drag">⋮⋮</div>
        <input value="${it.name}" placeholder="שם פריט" class="nameIn">
        <input value="${it.unit||''}" placeholder="יחידה (למשל: ק״ג)" class="unitIn">
        <input value="${it.price||''}" placeholder="מחיר (₪)" class="priceIn" inputmode="decimal">
        <div class="actions">
          <button class="mini up">▲</button>
          <button class="mini down">▼</button>
          <button class="mini danger del">מחיקה</button>
        </div>`;
      row.querySelector(".nameIn").oninput = e=>{ it.name = e.target.value; save(K.items, items); buildOrders(); };
      row.querySelector(".unitIn").oninput = e=>{ it.unit = e.target.value; save(K.items, items); buildOrders(); };
      row.querySelector(".priceIn").oninput = e=>{ it.price = e.target.value; save(K.items, items); buildOrders(); };
      row.querySelector(".up").onclick = ()=>{
        if(idx>0){ const cut = arr.splice(idx,1)[0]; arr.splice(idx-1,0,cut); items[p]=arr; save(K.items,items); renderItemsEditor(p); buildOrders(); }
      };
      row.querySelector(".down").onclick = ()=>{
        if(idx<arr.length-1){ const cut = arr.splice(idx,1)[0]; arr.splice(idx+1,0,cut); items[p]=arr; save(K.items,items); renderItemsEditor(p); buildOrders(); }
      };
      row.querySelector(".del").onclick = ()=>{ arr.splice(idx,1); items[p]=arr; save(K.items,items); renderItemsEditor(p); buildOrders(); };
      ed.appendChild(row);
    });
    const add=document.createElement("button"); add.className="btn"; add.textContent="הוסף פריט"; add.onclick=()=>{ (items[p]=items[p]||[]).push({name:"פריט חדש"}); save(K.items,items); renderItemsEditor(p); buildOrders(); };
    ed.appendChild(add);
  }

  function toast(msg){ const t=$("#toast"); $("#toastMsg").textContent=msg; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),1200); }

  // Init
  renderHome(); buildOrders(); renderHistory();
})();