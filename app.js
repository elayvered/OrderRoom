
// Order Room v1.4.0 - localStorage only (no DB, no login)
(function(){
  const $ = (s,el=document)=> el.querySelector(s);
  const $$ = (s,el=document)=> [...el.querySelectorAll(s)];

  const SUPPLIERS = [
    { id:'mw', name:'מזרח מערב', phone:'+9725044320036', branches:[{id:'hills',name:'הילס',address:'אריק איינשטיין 3, הרצליה'},{id:'nord',name:'נורדאו',address:'נורדאו 4, הרצליה'}] },
    { id:'diplomat', name:'דיפלומט', phone:'', branches:[{id:'hills',name:'הילס'},{id:'nord',name:'נורדאו'}] }
  ];

  const ITEMS = {
    mw: [\'אבקת וואסבי\', \'א. ביצים לאיון\', \'אטריות אורז 3 מ"מ\', "ג\'ינג\'ר לבן", \'מגש 03\', \'מגש 07\', "מחית צ\'ילי בשמן", \'מחית קארי ירוק\', \'מחית קארי אדום\', \'תמרהינדי\', \'מיסו לבן דאשי\', \'מירין גדול\', \'סויה ירוק גדול\', \'סויה ללג גדול\', \'סאקה גדול\', \'פנקו\', \'רוטב דגים 4 ל\', \'רוטב פטריות\', \'שומשום שחור\', "שמן צ\'ילי", \'שמן שומשום\', \'קרם קוקוס גדול\', \'טמפורה\', \'יוזו גדול\', \'יוזו גדול ללא מלח\', \'סוכר דקלים\', \'צדפות שימורים\', \'בצל מטוגן\', \'אבקת חרדל יפני\', \'טוגראשי\', \'טום יאם\', \'קנפיו קילו\', \'מגש מסיבה L\', \'מגש מסיבה M\', \'סויה גולדן מאונטן\', \'חטיפי אצות\', \'סויה כהה\', \'חומץ אורז\', \'אנשובי בשמן גדול\', \'אצות נורי קוריאה\', \'אורז יסמין\', \'שיפודי קשר\', \'אבקת מאצה\', \'ליקר מאצה\', \'רשת לסיר אורז\', \'כף ווק\', \'ווק\', \'דפי רשת אורז\', \'אצות וואקמה\', \'אצות קומבו\', \'דאשי\', \'אררה\', \'צ’ופסטיקס חבק שחור\', \'שיפודי יקיטורי\'],
    diplomat: []
  };

  const STATE = {
    currentSupplier: null,
    selectedBranch: null,
    items: [],
  };

  function setView(name){
    $$(".view").forEach(v=>v.classList.remove('active'));
    $("#view-"+name).classList.add('active');
    $$(".tab").forEach(t=> t.classList.toggle('active', t.dataset.view===name));
    if(name==='home') renderHome();
    if(name==='history') renderHistory();
  }

  function todayStr(){
    return new Date().toLocaleString('he-IL', { dateStyle:'full', timeStyle:'short' });
  }

  function renderHome(){
    $("#home-date").textContent = todayStr();
    const wrap = $("#home-suppliers"); wrap.innerHTML = "";
    SUPPLIERS.forEach(s=>{
      const card = document.createElement('div');
      card.className = 'supplier-card';
      card.innerHTML = `<div class="supplier-name">${s.name}</div>
                        <div class="supplier-meta">לחץ לפתיחת הזמנה</div>`;
      card.onclick = ()=> openSupplier(s.id);
      wrap.appendChild(card);
    });

    const recent = getOrders().slice(0,10);
    const list = $("#home-recent"); list.innerHTML="";
    recent.forEach(o=>{
      const d = new Date(o.created_at);
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = `<div>${d.toLocaleString('he-IL')}</div><div class="muted">${o.supplier_name} • ${o.branch_name||''}</div>`;
      list.appendChild(row);
    });
  }

  function openSupplier(sid){
    const sup = SUPPLIERS.find(x=>x.id===sid);
    STATE.currentSupplier = sup;
    $("#orders-title").textContent = "הזמנה – " + sup.name;

    // branches
    const bt = $("#branch-toggle"); bt.innerHTML = "";
    if(sup.branches?.length){
      STATE.selectedBranch = sup.branches[0];
      const seg = document.createElement('div');
      seg.className='segmented';
      sup.branches.forEach((b,i)=>{
        const btn = document.createElement('button');
        btn.textContent = b.name;
        if(i===0) btn.classList.add('active');
        btn.onclick = ()=>{
          STATE.selectedBranch = b;
          $$(".segmented button", seg).forEach(x=>x.classList.remove('active'));
          btn.classList.add('active');
        };
        seg.appendChild(btn);
      });
      bt.appendChild(seg);
    }else{
      STATE.selectedBranch = null;
    }

    // items
    const names = ITEMS[sup.id] || [];
    STATE.items = names.map((name, idx)=> ({ id:String(idx+1), name, unit:"", qty:0 }));
    renderItems();
    setView('orders');

    // placeholders from last order
    const last = getOrders().find(o=> o.supplier_id===sup.id);
    if(last){
      const map = new Map(last.items.map(i=> [i.name, i.qty]));
      $$("#items-list .item-row").forEach(row=>{
        const n = $(".item-title", row).textContent.trim();
        if(map.has(n)){
          const el = $(".qty input", row);
          el.placeholder = map.get(n);
          el.classList.add("muted");
        }
      });
    }
  }

  function renderItems(){
    const cont = $("#items-list"); cont.innerHTML="";
    if(!STATE.items.length){
      cont.innerHTML = `<div class="muted">אין פריטים לספק זה</div>`; return;
    }
    STATE.items.forEach(it=>{
      const row = document.createElement("div");
      row.className="item-row"; row.dataset.id = it.id;
      row.innerHTML = `<div class="item-title">${it.name}</div>
        <div class="qty">
          <input type="number" min="0" step="1" inputmode="numeric" placeholder="">
          <span class="unit">${it.unit||""}</span>
        </div>`;
      cont.appendChild(row);
    });
  }

  function orderText(order){
    const d = new Date(order.created_at);
    const lines = [
      `הזמנת סחורה - סושי רום - ${order.supplier_name}`,
      `תאריך: ${d.toLocaleString('he-IL')}`,
      order.branch_name ? `סניף: ${order.branch_name}${order.branch_address?(' – '+order.branch_address):''}` : null,
      "פירוט הזמנה -",
      ...order.items.map(p=> `• ${p.name} – ${p.qty}`),
      order.notes ? "" : null,
      order.notes || null,
      "",
      "אודה לאישורכם בהודעה חוזרת"
    ].filter(Boolean);
    return lines.join("\n");
  }

  function getOrders(){
    try { return JSON.parse(localStorage.getItem('or_orders')||'[]'); }
    catch(_){ return []; }
  }
  function setOrders(arr){
    localStorage.setItem('or_orders', JSON.stringify(arr));
  }

  function saveOrder(){
    const sup = STATE.currentSupplier;
    if(!sup) return alert("בחר ספק");
    const picked = [];
    $$("#items-list .item-row").forEach(row=>{
      const input = $(".qty input", row);
      const q = Number(input.value);
      if(q>0){
        const name = $(".item-title", row).textContent.trim();
        picked.append({ name, qty:q });
      }
    });
    if(!picked.length) return alert("לא נבחרו פריטים");

    const order = {
      id: String(Date.now()),
      created_at: new Date().toISOString(),
      supplier_id: sup.id,
      supplier_name: sup.name,
      branch_id: STATE.selectedBranch?.id || null,
      branch_name: STATE.selectedBranch?.name || null,
      branch_address: STATE.selectedBranch?.address || null,
      items: picked,
      notes: $("#order-notes").value || ""
    };
    const all = getOrders();
    all.unshift(order);
    setOrders(all);

    const text = orderText(order);
    $("#btn-copy").onclick = ()=> { navigator.clipboard.writeText(text); alert("הועתק"); };
    $("#btn-whatsapp").onclick = ()=> {
      const phone = (sup.phone||"").replace(/[^+\d]/g,"");
      const link = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
      window.open(link,"_blank");
    };
    alert("נשמר בהצלחה");
  }

  function renderHistory(){
    const list = $("#history-list"); list.innerHTML="";
    const arr = getOrders();
    if(!arr.length){ list.innerHTML = `<div class="muted">אין הזמנות עדיין</div>`; return; }
    arr.forEach(o=>{
      const d = new Date(o.created_at);
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = `<div>${d.toLocaleString('he-IL')}</div><div class="muted">${o.supplier_name} • ${o.branch_name||''}</div>`;
      list.appendChild(row);
    });
  }

  // events
  document.addEventListener("DOMContentLoaded", ()=>{
    document.body.addEventListener('click', (e)=>{
      const t = e.target.closest('.tab');
      if(t) setView(t.dataset.view);
    });
    $("#btn-back-home").onclick = ()=> setView('home');
    $("#btn-save").onclick = saveOrder;

    // initial home
    setView('home');
  });
})();
