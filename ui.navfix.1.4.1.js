// ui.navfix.1.4.1.js
;(function(){
  function activateTab(id){
    document.querySelectorAll('.bottom-nav .btn').forEach(b=>b.classList.remove('active'));
    document.querySelector(`.bottom-nav .btn[data-tab="${id}"]`)?.classList.add('active');
    document.querySelectorAll('.screen').forEach(s=>s.classList.add('hidden'));
    document.getElementById(`screen-${id}`)?.classList.remove('hidden');
  }
  window.activateTab = activateTab;
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('.bottom-nav .btn[data-tab]');
    if(!btn) return;
    e.preventDefault();
    const id = btn.getAttribute('data-tab');
    activateTab(id);
  });
  window.addEventListener('DOMContentLoaded', ()=> activateTab('home'));
})();
