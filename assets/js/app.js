const el=document.getElementById('suppliers');
fetch('./data/orderroom-suppliers-seed/suppliers.json',{cache:'no-store'}).then(r=>r.json()).then(d=>{
 if(!Array.isArray(d)||!d.length){el.innerHTML='<div class="supplier">אין ספקים בקובץ seed</div>';return}
 el.innerHTML=d.map(s=>`<div class="supplier"><div><strong>${s.name}</strong><div class="badge">${(s.branchTargets||[]).join(' · ')}</div></div><div class="badge">${(s.orderDays||[]).join(', ')}</div></div>`).join('')
}).catch(()=>{el.innerHTML='<div class="supplier">⚠️ לא נמצא seed בנתיב data/orderroom-suppliers-seed/suppliers.json</div>'})
