// Supabase bootstrap for Order Room 1.5
;(function(){
  function resolveConfig(){
    if(window.OR_CONFIG && window.OR_CONFIG.SUPABASE_URL && window.OR_CONFIG.SUPABASE_ANON){
      return window.OR_CONFIG
    }
    const url = localStorage.getItem('or_supabase_url')
    const anon = localStorage.getItem('or_supabase_anon')
    if(url && anon){ return { SUPABASE_URL:url, SUPABASE_ANON:anon } }
    return null
  }
  window.getSupabaseClient = function(){
    const conf = resolveConfig()
    if(!conf || !window.supabase){ return null }
    if(window.__sbClient) return window.__sbClient
    const c = window.supabase.createClient(conf.SUPABASE_URL, conf.SUPABASE_ANON, {
      auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true }
    })
    window.__sbClient = c
    return c
  }
})()
