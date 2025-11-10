
(function(){
  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

  const state = {
    supplier: null,
    branch: 'הילס',
    supplyDayIndex: 2,
    items: [],
    notes: ''
  };

  const dayLetter = i => OR.supplyDays[(i+7)%7] ?? 'א';

  const views = {
    home: $('#homeView'),
    order: $('#orderView'),
    orders: $('#ordersView'),
    settings: $('#settingsView')
  };

  const overlay = $('#overlay');
  const menu = $('#slideMenu');
  const menuBtn = $('#menuBtn');
  const brandBtn = $('#brandBtn');

  function openView(name){
    Object.values(views).forEach(v=>v.classList.remove('active'));
    views[name].classList.add('active');
    closeOverlays();
  }

  function closeOverlays(){
    overlay.classList.remove('show');
    menu.classList.remove('open');
    $('#supplierPicker').classList.remove('open');
    $('#dayPicker').classList.remove('open');
    $('#sendModal').classList.remove('open');
  }

  menuBtn.addEventListener('click', (e)=>{
    e.stopPropagation();
    const rect = menuBtn.getBoundingClientRect();
    menu.style.insetInlineStart = `${rect.left}px`;
    menu.style.top = `${rect.bottom + 8}px`;
    menu.classList.toggle('open');
    overlay.classList.toggle('show', menu.classList.contains('open'));
  });

  overlay.addEventListener('click', closeOverlays);
  brandBtn.addEventListener('click', ()=>openView('home'));
  $$('#slideMenu button').forEach(btn=>btn.addEventListener('click', ()=>openView(btn.dataset.view)));

  function populateToday(){
    const grid = $('#suppliersToday');
    grid.innerHTML = '';
    OR.suppliers.forEach(s=>{
      const b = document.createElement('button');
      b.className = 'btn chip';
      b.textContent = s.name;
      b.addEventListener('click', ()=>startOrderFor(s));
      grid.appendChild(b);
    });
    $('#incomingHLS').innerHTML = OR.suppliers.slice(0,3).map(s=>`<div class="row">${s.name}</div>`).join('');
    $('#incomingNRD').innerHTML = OR.suppliers.slice(3,6).map(s=>`<div class="row">${s.name}</div>`).join('');
  }

  function startOrderFor(supplier){
    state.supplier = supplier;
    state.branch = supplier.branches.includes(state.branch)? state.branch : supplier.branches[0] || 'הילס';
    $('#activeSupplierBtn').textContent = supplier.name;
    $$('#branchPicker button').forEach(b=>{
      const wanted = b.dataset.branch;
      const allowed = supplier.branches.includes(wanted);
      b.classList.toggle('active', wanted===state.branch);
      b.disabled = !allowed;
      b.style.opacity = allowed? '1' : '.35';
    });
    const list = $('#itemsList');
    list.innerHTML = '';
    const items = OR.items[supplier.id] || [];
    state.items = items.map(title => ({ title, qty: '', mode: 'carton' }));
    items.forEach((title, idx)=>{
      const row = document.createElement('div');
      row.className = 'item-row';
      row.innerHTML = `
        <input class="qty" inputmode="numeric" pattern="[0-9]*" placeholder="0" />
        <div class="toggle" role="tablist">
          <button class="active" data-mode="carton"><span class="svg box" style="transform:scale(1.2)"></span> קרטון</button>
          <button data-mode="unit"><span class="svg dot" style="transform:scale(1.2)"></span> יח'</button>
        </div>
        <div class="item-title">${title}</div>
      `;
      const qty = $('.qty', row);
      const btns = $$('.toggle button', row);
      qty.addEventListener('input', e=> state.items[idx].qty = e.target.value.replace(/[^0-9]/g,''));
      btns.forEach(b=> b.addEventListener('click', ()=>{
        btns.forEach(x=>x.classList.remove('active'));
        b.classList.add('active');
        state.items[idx].mode = b.dataset.mode;
      }));
      list.appendChild(row);
    });
    $('#notesInput').value = state.notes = '';
    updateDayLabel();
    openView('order');
  }

  $$('#branchPicker button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      if(btn.disabled) return;
      $$('#branchPicker button').forEach(x=>x.classList.remove('active'));
      btn.classList.add('active');
      state.branch = btn.dataset.branch;
    });
  });

  const supplierPicker = $('#supplierPicker');
  const supplierGrid = $('#supplierGrid');
  $('#activeSupplierBtn').addEventListener('click', (e)=>{
    supplierGrid.innerHTML = '';
    OR.suppliers.forEach(s=>{
      const b = document.createElement('button');
      b.className = 'btn chip';
      b.textContent = s.name;
      b.addEventListener('click', ()=>{
        startOrderFor(s);
        closeOverlays();
      });
      supplierGrid.appendChild(b);
    });
    openPopover(supplierPicker, e.currentTarget);
  });

  const dayPicker = $('#dayPicker');
  $('#supplyDayBtn').addEventListener('click', (e)=>{
    const row = $('#dayOptions'); row.innerHTML='';
    OR.supplyDays.forEach((d, i)=>{
      const b = document.createElement('button'); b.textContent = d;
      if(i===state.supplyDayIndex) b.classList.add('active');
      b.addEventListener('click', ()=>{ state.supplyDayIndex = i; updateDayLabel(); closeOverlays(); });
      row.appendChild(b);
    });
    openPopover(dayPicker, e.currentTarget, {offsetY:8});
  });

  function updateDayLabel(){ $('#supplyDayLabel').textContent = 'יום ' + dayLetter(state.supplyDayIndex); }

  function openPopover(el, anchor, opts={}){
    const rect = anchor.getBoundingClientRect();
    el.style.insetInlineEnd = (window.innerWidth - rect.right) + 'px';
    el.style.top = (rect.bottom + (opts.offsetY||4)) + 'px';
    el.classList.add('open');
    overlay.classList.add('show');
  }

  $('#saveBtn').addEventListener('click', saveOrder);
  $('#sendBtn').addEventListener('click', ()=>{
    $('#sendModal').classList.add('open');
    overlay.classList.add('show');
  });

  $$('#sendModal [data-send]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const how = btn.dataset.send;
      const text = buildMessage();
      if(how==='copy'){
        navigator.clipboard.writeText(text);
        alert('ההזמנה הועתקה');
      }else if(how==='email'){
        const mail = (state.supplier.emails && state.supplier.emails[0]) || '';
        const href = `mailto:${encodeURIComponent(mail)}?subject=${encodeURIComponent('הזמנה חדשה - ' + state.supplier.name)}&body=${encodeURIComponent(text)}`;
        window.location.href = href;
      }else if(how==='whatsapp'){
        const tel = (state.supplier.phone||'').replace(/[^\d+]/g,'');
        const href = `https://wa.me/${tel}?text=${encodeURIComponent(text)}`;
        window.open(href, '_blank');
      }
      closeOverlays();
    });
  });

  function saveOrder(){
    const order = {
      ts: Date.now(),
      supplier: state.supplier?.name || '',
      supplierId: state.supplier?.id || '',
      branch: state.branch,
      day: dayLetter(state.supplyDayIndex),
      items: state.items.filter(x=> (x.qty||'')!=='').map(x=>({title:x.title, qty:x.qty, mode:x.mode})),
      notes: $('#notesInput').value.trim()
    };
    const all = JSON.parse(localStorage.getItem('or_history')||'[]');
    all.unshift(order);
    localStorage.setItem('or_history', JSON.stringify(all));
    renderHistory();
    alert('ההזמנה נשמרה');
  }

  function buildMessage(){
    const lines = [];
    lines.push(`הזמנה חדשה — ${state.supplier?.name||''}`);
    lines.push(`סניף: ${state.branch} · יום אספקה: ${dayLetter(state.supplyDayIndex)}`);
    lines.push('');
    state.items.forEach(it=>{
      if((it.qty||'')==='') return;
      const unit = it.mode==='carton' ? 'קרטון' : 'יח׳';
      lines.push(`${it.title} — ${it.qty} ${unit}`);
    });
    const notes = $('#notesInput').value.trim();
    if(notes) { lines.push(''); lines.push('הערות:'); lines.push(notes); }
    lines.push('תודה!');
    return lines.join('\n');
  }

  function renderHistory(){
    const list = $('#historyList');
    const all = JSON.parse(localStorage.getItem('or_history')||'[]');
    list.innerHTML = all.map(o=>{
      const dt = new Date(o.ts);
      const date = dt.toLocaleDateString('he-IL');
      return `<div class="item-row">
        <div class="item-title">${o.supplier} · ${o.branch} · יום ${o.day}</div>
        <button class="btn chip" data-act="view" data-ts="${o.ts}">צפייה</button>
        <button class="btn chip" data-act="send" data-ts="${o.ts}">שליחה</button>
      </div>`;
    }).join('');

    $$('#historyList [data-act]').forEach(b=> b.addEventListener('click', ()=>{
      const ts = +b.dataset.ts;
      const all = JSON.parse(localStorage.getItem('or_history')||'[]');
      const o = all.find(x=>x.ts===ts);
      if(!o) return;
      if(b.dataset.act==='view'){
        const text = [
          `הזמנה — ${o.supplier}`,
          `סניף: ${o.branch} · יום אספקה: ${o.day}`,
          '',
          ...o.items.map(i=> `${i.title} — ${i.qty} ${i.mode==='carton'?'קרטון':'יח׳'}`),
          o.notes? '\nהערות:\n'+o.notes : ''
        ].join('\n');
        alert(text);
      }else{
        const text = [
          `הזמנה — ${o.supplier}`,
          `סניף: ${o.branch} · יום אספקה: ${o.day}`,
          '',
          ...o.items.map(i=> `${i.title} — ${i.qty} ${i.mode==='carton'?'קרטון':'יח׳'}`),
          o.notes? '\nהערות:\n'+o.notes : ''
        ].join('\n');
        navigator.clipboard.writeText(text);
        alert('הטקסט הועתק — הדבק בוואטסאפ/מייל');
      }
    }));
  }

  populateToday();
  renderHistory();
  window.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeOverlays(); });
  openView('home');
})();
