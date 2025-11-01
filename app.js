// Order Room 1.5 — Single-File App
;(function(){
  const el = (s, r=document)=> r.querySelector(s)
  const els = (s, r=document)=> Array.from(r.querySelectorAll(s))

  const state = { sb:null, session:null, user:null, authorized:false, suppliers:[], branches:[], items:[], currentSupplier:null, currentBranch:null }

  const H = (strings, ...vals)=> strings.map((s,i)=> s+(vals[i]??'')).join('')

  function viewLogin(){
    return H`
      <div class="container">
        <div class="card">
          <h2>התחברות</h2>
          <p class="notice">כניסה באמצעות מייל וסיסמה. רק משתמשים שמופיעים ברשימת המורשים יקבלו גישה.</p>
          <div class="row">
            <div class="field">
              <label>אימייל</label>
              <input type="email" id="login-email" placeholder="you@example.com" />
            </div>
            <div class="field">
              <label>סיסמה</label>
              <input type="password" id="login-password" placeholder="••••••••" />
            </div>
          </div>
          <div class="gap"></div>
          <div class="row">
            <button class="btn primary" id="btn-login">כניסה</button>
            <button class="btn ghost" id="btn-magic">לינק במייל</button>
          </div>
          <p id="login-msg" class="small"></p>
        </div>
      </div>
    `
  }

  function header(){
    return H`
      <div class="topbar">
        <div class="brand"><span class="dot"></span> Order Room</div>
        <div class="flex" style="margin-inline-start:auto">
          <span class="badge">${state.user?.email || ''}</span>
          <button class="btn" id="btn-logout">התנתק</button>
        </div>
      </div>
    `
  }

  function tabs(){
    return H`
      <div class="container">
        <div class="tabs" role="tablist">
          <div class="tab active" data-tab="home">בית</div>
          <div class="tab" data-tab="orders">הזמנה</div>
          <div class="tab" data-tab="settings">הגדרות</div>
          <div class="tab" data-tab="analytics">נתונים</div>
        </div>
        <div id="screen-home" class="screen active"></div>
        <div id="screen-orders" class="screen"></div>
        <div id="screen-settings" class="screen"></div>
        <div id="screen-analytics" class="screen"></div>
      </div>
    `
  }

  function viewHome(){
    return H`
      <div class="card">
        <h2>בית</h2>
        <p class="notice">בחר ספק והזן כמויות להזמנה. כל ההזמנות נשמרות ב־Supabase ונראות מכל מכשיר.</p>
        <hr class="sep" />
        <div class="row"><div class="badge">נקודות אספקה: הילס • נורדאו</div></div>
      </div>
    `
  }

  const supplierChips = () => H`
    <div class="chips" id="supplier-chips">
      ${state.suppliers.map(s=> H`<div class="chip ${state.currentSupplier?.id===s.id?'active':''}" data-supplier="${s.id}">${s.name}</div>`).join('')}
    </div>
  `

  const branchToggle = () => H`
    <div class="chips" id="branch-toggle">
      ${state.branches.map(b=> H`<div class="chip ${state.currentBranch?.id===b.id?'active':''}" data-branch="${b.id}">${b.code}</div>`).join('')}
    </div>
  `

  function orderList(){
    const filtered = state.items.filter(it=> it.supplier_id===state.currentSupplier?.id && it.active)
    return H`
      <div class="list" id="order-list">
        ${filtered.map(it=> H`
          <div class="item-row" data-item="${it.id}">
            <input type="number" inputmode="decimal" step="0.01" placeholder="" class="qty" />
            <div>
              <div><strong>${it.name}</strong> <span class="small">(${it.unit||''})</span></div>
              ${typeof it.price==='number' ? `<div class="small">₪ ${it.price.toFixed(2)}</div>`:''}
            </div>
          </div>
        `).join('')}
      </div>
    `
  }

  function viewOrders(){
    return H`
      <div class="card">
        <h2>הזמנה</h2>
        <div class="row">
          <div class="field" style="flex:2"><label>ספק</label>${supplierChips()}</div>
          <div class="field"><label>סניף</label>${branchToggle()}</div>
        </div>
        <div class="gap"></div>
        ${state.currentSupplier ? orderList() : '<p class="notice">בחר ספק כדי לטעון פריטים</p>'}
        <div class="bottom-actions row">
          <button class="btn primary" id="btn-save-order">שמור הזמנה</button>
          <button class="btn" id="btn-copy">העתק טקסט הזמנה</button>
        </div>
        <p id="order-msg" class="small"></p>
      </div>
    `
  }

  function viewSettings(){
    return H`
      <div class="card">
        <h2>הגדרות</h2>
        <p class="notice">ניהול ספקים ופריטים. עריכה מתבצעת מול בסיס הנתונים.</p>
        <div class="gap"></div>
        <h3>ספקים</h3>
        <div class="list" id="suppliers-list">
          ${state.suppliers.map(s=> H`
            <div class="item-row">
              <div class="small">שם</div><input value="${s.name||''}" data-sup="${s.id}" data-k="name" />
              <div class="small">איש קשר</div><input value="${s.contact_name||''}" data-sup="${s.id}" data-k="contact_name" />
              <div class="small">טלפון</div><input value="${s.phone||''}" data-sup="${s.id}" data-k="phone" />
              <div class="small">אימייל</div><input value="${s.email||''}" data-sup="${s.id}" data-k="email" />
            </div>
          `).join('')}
        </div>
        <div class="row"><button class="btn" id="btn-save-suppliers">שמירה</button></div>
        <hr class="sep" />
        <h3>פריטים</h3>
        <p class="small">עריכה לפי ספק נבחר</p>
        <div class="row">${supplierChips()}</div>
        <div class="list" id="items-list">
          ${state.items.filter(x=>x.supplier_id===state.currentSupplier?.id).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)).map(it=> H`
            <div class="item-row">
              <div class="small">שם</div><input value="${it.name||''}" data-item="${it.id}" data-k="name" />
              <div class="small">יחידה</div><input value="${it.unit||''}" data-item="${it.id}" data-k="unit" />
              <div class="small">מחיר</div><input type="number" step="0.01" value="${typeof it.price==='number'?it.price:''}" data-item="${it.id}" data-k="price" />
              <div class="small">סדר</div><input type="number" value="${it.sort_order||0}" data-item="${it.id}" data-k="sort_order" />
              <div class="small">פעיל</div>
              <select data-item="${it.id}" data-k="active">
                <option value="true" ${it.active?'selected':''}>כן</option>
                <option value="false" ${!it.active?'selected':''}>לא</option>
              </select>
            </div>
          `).join('')}
        </div>
        <div class="row"><button class="btn" id="btn-save-items">שמירה</button></div>
      </div>
    `
  }

  function viewAnalytics(){
    return H`
      <div class="card">
        <h2>נתונים</h2>
        <p class="notice">סיכום חודשי לפי פריט</p>
        <div id="analytics-content" class="list"></div>
      </div>
    `
  }

  function render(){
    const app = el('#app')
    if(!state.authorized){
      app.innerHTML = viewLogin()
      bindLogin()
      return
    }
    app.innerHTML = header() + tabs()
    el('#screen-home').innerHTML = viewHome()
    el('#screen-orders').innerHTML = viewOrders()
    el('#screen-settings').innerHTML = viewSettings()
    el('#screen-analytics').innerHTML = viewAnalytics()
    bindShell(); bindOrders(); bindSettings(); loadAnalytics()
  }

  function switchTab(id){ els('.tab').forEach(t=>t.classList.remove('active')); els('.screen').forEach(s=>s.classList.remove('active')); el(`.tab[data-tab="${id}"]`)?.classList.add('active'); el(`#screen-${id}`)?.classList.add('active') }

  function bindShell(){
    el('#btn-logout')?.addEventListener('click', async ()=>{ await state.sb.auth.signOut(); state.session=null; state.user=null; state.authorized=false; render() })
    els('.tab').forEach(t=> t.addEventListener('click', ()=> switchTab(t.getAttribute('data-tab'))))
    el('#supplier-chips')?.addEventListener('click', (e)=>{ const chip=e.target.closest('.chip[data-supplier]'); if(!chip) return; state.currentSupplier=state.suppliers.find(s=>s.id===chip.getAttribute('data-supplier')); el('#screen-orders').innerHTML=viewOrders(); bindOrders(); el('#screen-settings').innerHTML=viewSettings(); bindSettings() })
    el('#branch-toggle')?.addEventListener('click', (e)=>{ const chip=e.target.closest('.chip[data-branch]'); if(!chip) return; state.currentBranch=state.branches.find(b=>b.id===chip.getAttribute('data-branch')); el('#screen-orders').innerHTML=viewOrders(); bindOrders() })
  }

  function bindLogin(){
    const msg = el('#login-msg')
    el('#btn-login')?.addEventListener('click', async ()=>{
      try{
        msg.textContent='מתחבר…'
        const email=el('#login-email').value.trim()
        const password=el('#login-password').value
        const { error } = await state.sb.auth.signInWithPassword({ email, password })
        if(error) throw error
        await postLoginAuthorize()
      }catch(err){ msg.textContent='שגיאה בכניסה: '+(err?.message||''); msg.classList.add('error') }
    })
    el('#btn-magic')?.addEventListener('click', async ()=>{
      try{
        msg.textContent='שולח לינק…'
        const email=el('#login-email').value.trim()
        const { error } = await state.sb.auth.signInWithOtp({ email })
        if(error) throw error
        msg.textContent='נשלח לינק למייל'; msg.classList.remove('error'); msg.classList.add('ok')
      }catch(err){ msg.textContent='שגיאה בשליחת לינק: '+(err?.message||''); msg.classList.add('error') }
    })
  }

  async function postLoginAuthorize(){
    const { data:{ session } } = await state.sb.auth.getSession()
    state.session=session; state.user=session?.user||null
    const { data:allowed } = await state.sb.from('allowed_users').select('email').eq('email', state.user?.email).limit(1)
    if(!allowed || !allowed.length){ await state.sb.auth.signOut(); alert('אין הרשאה למשתמש זה'); return }
    state.authorized=true; await initialLoadData(); render()
  }

  function bindOrders(){
    el('#btn-save-order')?.addEventListener('click', saveOrder)
    el('#btn-copy')?.addEventListener('click', copyOrderText)
  }

  function bindSettings(){
    el('#btn-save-suppliers')?.addEventListener('click', async ()=>{
      const rows=els('#suppliers-list .item-row'); const updates=[]
      rows.forEach(r=>{ const inputs=els('input',r); const obj={}; let id=null; inputs.forEach(i=>{ const k=i.getAttribute('data-k'); const v=i.value; id=i.getAttribute('data-sup'); obj[k]=v }); obj.id=id; updates.push(obj) })
      const { error } = await state.sb.from('suppliers').upsert(updates).select('id')
      el('#screen-settings').querySelector('.notice').textContent = error?('שגיאה: '+error.message):'נשמר בהצלחה'
    })
    el('#btn-save-items')?.addEventListener('click', async ()=>{
      const rows=els('#items-list .item-row'); const updates=[]
      rows.forEach(r=>{ const inputs=els('input,select',r); const obj={}; let id=null; inputs.forEach(i=>{ const k=i.getAttribute('data-k'); let v=i.value; id=i.getAttribute('data-item'); if(k==='price'||k==='sort_order'){ v=v===''?null:Number(v) } if(k==='active'){ v=v==='true' } obj[k]=v }); obj.id=id; updates.push(obj) })
      const { error } = await state.sb.from('items').upsert(updates).select('id')
      el('#screen-settings').querySelector('.notice').textContent = error?('שגיאה: '+error.message):'נשמר בהצלחה'
    })
  }

  async function copyOrderText(){
    const supplier=state.currentSupplier; if(!supplier){ alert('בחר ספק'); return }
    const branch=state.currentBranch; const kv=readCurrentQuantities()
    const lines=Object.values(kv).map(x=> `- ${x.name} — ${x.qty}${x.unit? ' ' + x.unit:''}`)
    const header=`הזמנת סחורה - ${supplier.name}\nסניף: ${branch?.code||''}\nתאריך: ${new Date().toLocaleDateString('he-IL')}`
    const text=header+'\n\n'+(lines.length?lines.join('\n'):'(אין פריטים)')
    try{ await navigator.clipboard.writeText(text); el('#order-msg').textContent='הטקסט הועתק' }catch{}
  }

  function readCurrentQuantities(){
    const kv={}; els('#order-list .item-row').forEach(row=>{ const id=row.getAttribute('data-item'); const qty=row.querySelector('.qty').value.trim(); if(qty && !isNaN(Number(qty))){ const it=state.items.find(x=>x.id===id); kv[id]={ id, name:it.name, unit:it.unit, price:it.price, qty:Number(qty) } } }); return kv
  }

  async function saveOrder(){
    try{
      const supplier=state.currentSupplier; if(!supplier){ alert('בחר ספק'); return }
      const branch=state.currentBranch; const kv=readCurrentQuantities(); if(Object.keys(kv).length===0){ alert('אין כמויות להזמנה'); return }
      const { data:orderRow, error:oerr } = await state.sb.from('orders').insert({ supplier_id:supplier.id, branch_id:branch?.id||null, notes:null }).select('id').single()
      if(oerr) throw oerr
      const itemsPayload=Object.values(kv).map(x=>({ order_id:orderRow.id, item_id:x.id, quantity:x.qty, unit_price:x.price??null, name_snapshot:x.name, unit_snapshot:x.unit??null }))
      const { error:ierr } = await state.sb.from('order_items').insert(itemsPayload); if(ierr) throw ierr
      el('#order-msg').textContent='ההזמנה נשמרה בענן'; els('#order-list .qty').forEach(q=> q.value='')
    }catch(err){ el('#order-msg').textContent='שגיאה בשמירת הזמנה: '+(err?.message||'') }
  }

  async function loadAnalytics(){
    const now=new Date(); const start=new Date(now.getFullYear(), now.getMonth(), 1).toISOString(); const end=new Date(now.getFullYear(), now.getMonth()+1, 1).toISOString()
    const { data, error } = await state.sb.rpc('order_items_monthly',{ p_start:start, p_end:end })
    const box=el('#analytics-content'); if(error){ box.innerHTML='<div class="notice error">'+error.message+'</div>'; return }
    if(!data||!data.length){ box.innerHTML='<div class="notice">אין נתונים לחודש הנוכחי</div>'; return }
    box.innerHTML=data.map(r=> `<div class="row"><strong>${r.item_name}</strong><span class="notice">— ${r.total_qty}</span></div>`).join('')
  }

  async function initialLoadData(){
    const { data:sup } = await state.sb.from('suppliers').select('*').order('name'); state.suppliers=sup||[]
    const { data:br } = await state.sb.from('branches').select('*').order('code'); state.branches=br||[]
    const { data:it } = await state.sb.from('items').select('*').order('sort_order'); state.items=it||[]
    state.currentSupplier=state.suppliers[0]||null; state.currentBranch=state.branches[0]||null
  }

  async function boot(){
    state.sb=window.getSupabaseClient(); const app=el('#app')
    if(!state.sb){ app.innerHTML=`<div class="container"><div class="card"><h2>הגדרת חיבור</h2><p class="notice">לא נמצאו מפתחות Supabase. צור or.config.js עם window.OR_CONFIG</p></div></div>`; return }
    const { data:{ session } } = await state.sb.auth.getSession(); state.session=session; state.user=session?.user||null
    if(!session){ state.authorized=false; render() } else {
      const { data:allowed } = await state.sb.from('allowed_users').select('email').eq('email', state.user.email).limit(1)
      if(!allowed||!allowed.length){ await state.sb.auth.signOut(); state.authorized=false } else { state.authorized=true; await initialLoadData() }
      render()
    }
    state.sb.auth.onAuthStateChange((_e, ctx)=>{
      state.session=ctx?.session||null; state.user=state.session?.user||null
      if(state.session){
        state.sb.from('allowed_users').select('email').eq('email', state.user.email).limit(1).then(async ({data})=>{
          if(!data||!data.length){ state.sb.auth.signOut(); state.authorized=false; render() } else { state.authorized=true; await initialLoadData(); render() }
        })
      } else { state.authorized=false; render() }
    })
  }

  document.addEventListener('DOMContentLoaded', boot)
})()
