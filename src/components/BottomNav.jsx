
import React from "react"

export default function BottomNav(){
  return (
    <nav className="bottom-nav" role="navigation" aria-label="bottom">
      <a href="#home" aria-label="בית">
        <svg viewBox="0 0 24 24"><path d="M3 10.5L12 3l9 7.5V21H3z"/></svg>
        <span>בית</span>
      </a>
      <a href="#orders" aria-label="הזמנות">
        <svg viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h10v2H4z"/></svg>
        <span>הזמנות</span>
      </a>
      <a href="#history" aria-label="היסטוריה">
        <svg viewBox="0 0 24 24"><path d="M13 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7v4l5-5-5-5z"/></svg>
        <span>היסטוריה</span>
      </a>
      <a href="#settings" aria-label="הגדרות">
        <svg viewBox="0 0 24 24"><path d="M19.4 13a7.9 7.9 0 0 0 0-2l2.1-1.6-2-3.5-2.5.6a7.9 7.9 0 0 0-1.7-1L14 1h-4l-.3 2.5a7.9 7.9 0 0 0-1.7 1l-2.5-.6-2 3.5L5.6 11a7.9 7.9 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-.6a7.9 7.9 0 0 0 1.7 1L10 23h4l.3-2.5a7.9 7.9 0 0 0 1.7-1l2.5.6 2-3.5zM12 15a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg>
        <span>הגדרות</span>
      </a>
    </nav>
  )
}
