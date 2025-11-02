
import React from "react"

export default function SupplierEdit(){
  return (
    <div className="sheet" dir="rtl" role="dialog" aria-modal="true" aria-label="עריכת ספק">
      <header className="sheet__header">
        <h2 style={{margin:0, fontWeight:800}}>עריכת ספק – מזח מערב</h2>
      </header>

      <div className="sheet__body">
        <section style={{display:'grid', gap:10}}>
          <label>שם ספק
            <input style={{width:'100%', marginTop:6}} placeholder="מזח מערב" />
          </label>
          <label>טלפון וואטסאפ
            <input style={{width:'100%', marginTop:6}} placeholder="+972..." />
          </label>
          <div style={{display:'grid', gridAutoFlow:'column', gap:10, alignItems:'center'}}>
            <label style={{display:'grid', gridTemplateColumns:'auto 1fr', gap:8, alignItems:'center'}}>
              <input type="checkbox" defaultChecked /> הילס
            </label>
            <label style={{display:'grid', gridTemplateColumns:'auto 1fr', gap:8, alignItems:'center'}}>
              <input type="checkbox" defaultChecked /> נורדאו
            </label>
          </div>
        </section>

        <section>
          <h3 style={{margin:'14px 0 10px 0'}}>ימי הזמנה / אספקה</h3>
          <div className="items-grid">
            {['יום א', 'יום ב', 'יום ג', 'יום ד', 'יום ה', 'יום ו'].map((d,idx)=>(
              <div key={idx} style={{border:'1px solid #e8ecf2', borderRadius:12, padding:12, background:'#fff'}}>
                <div style={{display:'grid', gridAutoFlow:'column', justifyContent:'space-between', alignItems:'center'}}>
                  <strong>{d}</strong>
                  <button className="secondary">מחק</button>
                </div>
                <div style={{marginTop:8, display:'grid', gap:8}}>
                  <label>חלון הזמנה <input style={{width:'100%', marginTop:6}} placeholder="9:00–16:00" /></label>
                  <label>חלון אספקה <input style={{width:'100%', marginTop:6}} placeholder="11:00–18:00" /></label>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 style={{margin:'14px 0 10px 0'}}>ניהול פריטים</h3>
          <div className="items-grid">
            {[...Array(10)].map((_,i)=>(
              <div key={i} style={{border:'1px solid #e8ecf2', borderRadius:12, padding:12, background:'#fff'}}>
                <label style={{display:'grid', gap:6}}>שם פריט
                  <input placeholder="לדוגמה: אבקת וואסבי" />
                </label>
                <label style={{display:'grid', gap:6, marginTop:8}}>ברקוד
                  <input placeholder="1234567890" />
                </label>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
