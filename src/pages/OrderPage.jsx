
import React from "react"

export default function OrderPage(){
  return (
    <div className="app-content" dir="rtl">
      <section className="order-head">
        <div style={{display:'grid', gap:8}}>
          <h2 style={{margin:0, fontWeight:800}}>הזמנה – מזח מערב</h2>
          <div style={{display:'grid', gridAutoFlow:'column', gap:8, alignItems:'center'}}>
            <button className="secondary" aria-label="בחירת סניף">סניף</button>
          </div>
        </div>
        <button className="delivery-button" aria-label="יום אספקה">
          <svg viewBox="0 0 24 24" width="18" height="18"><path d="M7 2v3M17 2v3M3 9h18M6 12h4M6 16h4M14 12h4M14 16h4" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
          יום אספקה
        </button>
      </section>

      <div style={{height:12}} />

      <div className="order-actions">
        <button className="secondary">שמור הזמנה</button>
        <button className="primary">שלח הזמנה</button>
      </div>

      <div style={{height:24}} />

      <section style={{display:'grid', gap:12}}>
        {[...Array(8)].map((_,i)=>(
          <div key={i} style={{background:'#fff', border:'1px solid #e8ecf2', borderRadius:16, padding:16}}>
            <strong>פריט לדוגמה {i+1}</strong>
            <div style={{marginTop:6, color:'#555'}}>תיאור ביניים נעים לעין</div>
          </div>
        ))}
      </section>
    </div>
  )
}
