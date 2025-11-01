
// Order Room App UI (1.5.3)
(function(){
  const $ = (sel, el=document)=> el.querySelector(sel);
  const $$ = (sel, el=document)=> [...el.querySelectorAll(sel)];

  function setView(name){
    $$(".view").forEach(v=>v.classList.remove('active'));
    $("#view-"+name).classList.add('active');
    $$(".tab").forEach(t=> t.classList.toggle('active', t.dataset.view===name));
    if(name==='home') loadHome();
    if(name==='history') loadHistory();
    if(name==='settings') renderSettings();
  }

  function openAuth(){ $("#auth-modal").classList.remove("hidden"); }
  function closeAuth(){ $("#auth-modal").classList.add("hidden"); }

  async function ensureAuth(){
    const s = await OR.getSession?.();
    if(!s){ openAuth(); return false; }
    closeAuth(); return true;
  }

  function toast(msg){ alert(msg); }

  async function loadHome(){
    if(!await ensureAuth()) return;
    const supRes = await OR.db.suppliers();
    const cont = $("#home-suppliers"); cont.innerHTML="";
    const suppliers = supRes.data||[];
    suppliers.forEach(s=>{
      const div = document.createElement("div");
      div.className="supplier-card";
      div.innerHTML = `<div class="supplier-name">${s.name}</div>
                       <div class="supplier-meta">${s.contact_name?("איש קשר: "+s.contact_name):""}</div>`;
      div.onclick = ()=> openSupplier(s);
      cont.appendChild(div);
    });

    const r = await OR.db.ordersRecent();
    const list = $("#home-recent"); list.innerHTML="";
    (r.data||[]).forEach(o=>{
      const d = new Date(o.created_at);
      const row = document.createElement("div");
      row.className="row";
      row.innerHTML = `<div>${d.toLocaleString('he-IL')}</div><div class="muted">#${o.id.slice(0,6)}</div>`;
      list.appendChild(row);
    });
  }

  let currentSupplier=null, branches=[], selectedBranch=null, items=[];

  async function openSupplier(supplier){
    currentSupplier = supplier;
    setView('orders');
    $("#orders-title").textContent = "הזמנה – " + supplier.name;

    const br = await OR.db.branches();
    branches = br.data||[];
    renderBranchToggle();

    const its = await OR.db.itemsBySupplier(supplier.id);
    items = its.data||[];
    renderItems();

    const last = await OR.db.lastOrderForSupplier(supplier.id);
    if(last && last.items){
      const byItem = new Map(last.items.map(i=> [i.item_id, i.quantity]));
      $$(".item-row").forEach(row=>{
        const id = row.dataset.id;
        if(byItem.has(id)){
          const el = $(".qty input", row);
          el.placeholder = byItem.get(id);
          el.classList.add("muted");
        }
      });
    }
  }

  function renderBranchToggle(){
    const wrap = $("#branch-toggle"); wrap.innerHTML="";
    if(!branches.length){ selectedBranch=null; return; }
    if(branches.length===1){
      selectedBranch = branches[0];
      wrap.innerHTML = `<div class="segmented"><button class="active">${selectedBranch.name}</button></div>`;
      return;
    }
    selectedBranch = branches[0];
    const seg = document.createElement("div"); seg.className="segmented";
    branches.forEach((b,i)=>{
      const btn = document.createElement("button");
      btn.textContent = b.name;
      btn.className = i===0 ? "active" : "";
      btn.onclick = ()=>{
        selectedBranch=b;
        $$(".segmented button", seg).forEach(x=>x.classList.remove("active"));
        btn.classList.add("active");
      };
      seg.appendChild(btn);
    });
    wrap.appendChild(seg);
  }

  function renderItems(){
    const cont = $("#items-list"); cont.innerHTML="";
    if(!items.length){
      cont.innerHTML = `<div class="muted">אין פריטים לספק זה</div>`; return;
    }
    items.forEach(it=>{
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

  function orderText(payload, picked){
    const d = new Date(payload.created_at||Date.now());
    const branchTxt = selectedBranch ? `${selectedBranch.name} – ${selectedBranch.address||""}` : "";
    const lines = [
      `הזמנת סחורה - סושי רום - ${currentSupplier.name}`,
      `תאריך: ${d.toLocaleString('he-IL')}`,
      branchTxt ? `סניף: ${branchTxt}` : null,
      "פירוט הזמנה -",
      ...picked.map(p=> `• ${p.name_snapshot||p.name} – ${p.quantity} ${p.unit_snapshot||p.unit||""}`),
      payload.notes ? "",
      payload.notes || ""
    ].filter(Boolean);
    lines.push("");
    lines.push("אודה לאישורכם בהודעה חוזרת");
    return lines.join("\n");
  }

  async function saveOrder(){
    if(!currentSupplier){ toast("בחר ספק"); return; }
    const quantities = [];
    $$("#items-list .item-row").forEach(row=>{
      const input = $(".qty input", row);
      const q = Number(input.value);
      if(q>0){
        const it = items.find(x=> x.id === row.dataset.id);
        quantities.push({
          item_id: it.id, quantity:q, name_snapshot: it.name, unit_snapshot: it.unit
        });
      }
    });
    if(!quantities.length){ toast("לא נבחרו פריטים"); return; }

    const payload = {
      supplier_id: currentSupplier.id,
      branch_id: selectedBranch ? selectedBranch.id : null,
      notes: $("#order-notes").value || null
    };
    try{
      const o = await OR.db.createOrder(payload, quantities);
      const text = orderText(o, quantities.map(q=> ({...q, name:q.name_snapshot, unit:q.unit_snapshot})));
      $("#btn-copy").onclick = ()=> { navigator.clipboard.writeText(text); toast("הועתק"); };
      $("#btn-whatsapp").onclick = ()=> {
        const phone = (currentSupplier.phone||"").replace(/[^+\d]/g,"");
        const link = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
        window.open(link,"_blank");
      };
      toast("נשמר בהצלחה");
    }catch(e){
      console.error(e);
      toast("שגיאה בשמירה");
    }
  }

  async function loadHistory(){
    if(!await ensureAuth()) return;
    const r = await OR.db.ordersRecent();
    const list = $("#history-list"); list.innerHTML="";
    (r.data||[]).forEach(o=>{
      const d = new Date(o.created_at);
      const row = document.createElement("div");
      row.className = "row";
      row.innerHTML = `<div>${d.toLocaleString('he-IL')}</div><div class="muted">#${o.id.slice(0,6)}</div>`;
      list.appendChild(row);
    });
  }

  function renderSettings(){
    OR.getSession().then(s=> {
      $("#settings-email").textContent = s?.user?.email || "";
      $("#conn-status").textContent = OR.configOk ? "מחובר ל-Supabase" : "אין חיבור";
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    $$(".tab").forEach(t=> t.onclick = ()=> setView(t.dataset.view));
    $("#btn-back-home").onclick = ()=> setView('home');
    $("#btn-save").onclick = saveOrder;
    $("#btn-signout").onclick = async ()=> { await OR.signOut(); openAuth(); setView('home'); };
    $("#btn-auth-submit").onclick = async ()=>{
      const email = $("#auth-email").value.trim();
      const pass = $("#auth-pass").value;
      const mode = $(".segmented .seg.active")?.dataset.auth || "login";
      try{
        if(mode==="signup"){ await OR.signUp(email, pass); $("#auth-msg").textContent = "נרשמת. בדוק מייל לאימות אם נדרש."; }
        else { await OR.signIn(email, pass); closeAuth(); setView('home'); }
      }catch(e){ $("#auth-msg").textContent = e.message || "שגיאה"; }
    };
    $("#btn-magic").onclick = async ()=>{
      const email = $("#auth-email").value.trim();
      if(!email) return $("#auth-msg").textContent="כתוב אימייל";
      await OR.magic(email);
      $("#auth-msg").textContent = "נשלח לינק במייל";
    };
    $$(".segmented .seg").forEach(btn=> btn.onclick = ()=>{
      $$(".segmented .seg").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      $("#btn-auth-submit").textContent = btn.dataset.auth==="login" ? "כניסה" : "הרשמה";
    });

    OR.onAuth?.((evt, session)=>{
      if(session){ closeAuth(); setView('home'); }
      else { openAuth(); }
    });

    const ok = await ensureAuth();
    if(ok) setView('home');
  });
})();
