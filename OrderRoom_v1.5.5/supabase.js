
// Supabase bootstrap + helpers (1.5.4)
window.OR = window.OR || {};

(function(){
  function readConfig(){
    const c = window.OR_CONFIG || {}
    const url = c.SUPABASE_URL
    const anon = c.SUPABASE_ANON
    return { url, anon }
  }

  const cfg = readConfig();
  const diag = (m)=>{ try{ const el=document.getElementById('diag'); if(el) el.textContent += String(m)+'\n'; }catch(_e){} }
  diag('cfg.url='+(cfg.url||'null'))

  if(!cfg.url || !cfg.anon){
    console.warn('Missing Supabase config');
    window.addEventListener('DOMContentLoaded', () => {
      document.getElementById('config-warning')?.classList.remove('hidden');
      document.getElementById('auth-modal')?.classList.remove('hidden');
      document.getElementById('conn-status')?.textContent = 'אין קונפיג';
      diag('no config');
    });
    return;
  }

  const sb = supabase.createClient(cfg.url, cfg.anon);
  OR.sb = sb;
  OR.configOk = true;

  OR.getSession = async ()=> (await sb.auth.getSession()).data.session;
  OR.onAuth = (cb)=> sb.auth.onAuthStateChange((e,s)=>cb(e,s));
  OR.signIn = async (email,password)=> sb.auth.signInWithPassword({email,password});
  OR.signUp = async (email,password)=> sb.auth.signUp({email,password});
  OR.magic = async (email)=> sb.auth.signInWithOtp({email, options:{emailRedirectTo: location.href}});
  OR.signOut = async ()=> sb.auth.signOut();

  OR.db = {
    suppliers: ()=> sb.from('suppliers').select('*').order('name',{ascending:false}),
    branches: ()=> sb.from('branches').select('*').order('name'),
    itemsBySupplier: (supplier_id)=> sb.from('items').select('*').eq('supplier_id',supplier_id).order('sort_order', {ascending:true}),
    lastOrderForSupplier: async (supplier_id)=> {
      const {data:orders} = await sb.from('orders').select('id,created_at').eq('supplier_id',supplier_id).order('created_at',{ascending:false}).limit(1);
      if(!orders || !orders[0]) return null;
      const oid = orders[0].id;
      const {data:items} = await sb.from('order_items').select('*').eq('order_id',oid);
      return {order: orders[0], items};
    },
    createOrder: async (payload, items)=> {
      const {data:o, error:e} = await sb.from('orders').insert(payload).select('*').single();
      if(e) throw e;
      if(items.length){
        const rows = items.map(it=>({
          order_id:o.id, item_id:it.item_id, quantity:it.quantity, unit_price:it.unit_price||null,
          name_snapshot: it.name_snapshot||null, unit_snapshot: it.unit_snapshot||null
        }));
        const {error:e2} = await sb.from('order_items').insert(rows);
        if(e2) throw e2;
      }
      return o;
    },
    ordersRecent: ()=> sb.from('orders').select('id,created_at, supplier_id, branch_id, notes').order('created_at',{ascending:false}).limit(20)
  };

  window.addEventListener('DOMContentLoaded', async () => {
    try{
      const s = await OR.getSession();
      document.getElementById('conn-status')?.textContent = s ? 'מחובר' : 'לא מחובר';
      if(!s) document.getElementById('auth-modal')?.classList.remove('hidden');
    }catch(err){
      document.getElementById('conn-status')?.textContent = 'שגיאת חיבור';
      diag(err?.message||String(err));
    }
  });
})();
