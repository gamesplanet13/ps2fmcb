(function(){
  'use strict';
  const POLICY='No return, replacement or refund. Please inspect the product before purchase. Confirm warranty before purchase. Classic and Chinese items generally carry no warranty.';
  const $=id=>document.getElementById(id);
  function gstOn(){const v=($('gstMode')?.value||$('type')?.value||'').toLowerCase();return v==='yes'||v==='gst'}
  function qr(){return gstOn()?'GSTcurrentQR.png':'Qr (1).jpg'}
  function customerNumber(){return (($('mobile')?.value||'').replace(/\D/g,'').slice(-10))}
  function enhance(){
    const root=$('invoiceContent')||$('preview'); if(!root)return;
    root.querySelectorAll('*').forEach(el=>{if(el.children.length===0){el.textContent=el.textContent.replace(/GST\s*EXCLUDED/gi,'ESTIMATED BILL').replace(/GST invoice not requested\.?/gi,'Estimated Bill — not a tax invoice.').replace(/^CASH BILL$/i,'ESTIMATED BILL').replace(/^INVOICE$/i,'ESTIMATED BILL')}});
    let box=root.querySelector('.gpz-payment-policy');
    if(!box){box=document.createElement('section');box.className='gpz-payment-policy';root.appendChild(box)}
    box.innerHTML='<div><b>'+(gstOn()?'GST Included':'Estimated Bill')+'</b><br><span>'+POLICY+'</span></div><img src="'+qr()+'" alt="Payment QR">';
  }
  const originalOpen=window.open.bind(window);
  window.open=function(url,target,features){
    try{const s=String(url||'');if(/^https:\/\/wa\.me\/\?text=/i.test(s)){const n=customerNumber();if(n)url=s.replace('https://wa.me/?text=','https://wa.me/91'+n+'?text=')}}catch(e){}
    return originalOpen(url,target,features);
  };
  const css=document.createElement('style');css.textContent='.gpz-payment-policy{margin-top:12px;padding-top:10px;border-top:1px dashed #789;display:flex;gap:12px;align-items:center;justify-content:space-between;font-size:10px;line-height:1.35}.gpz-payment-policy img{width:82px;height:82px;object-fit:contain;background:#fff;border:1px solid #ccd;border-radius:6px}@media print{.gpz-payment-policy{break-inside:avoid}.gpz-payment-policy img{width:70px;height:70px}}';document.head.appendChild(css);
  new MutationObserver(enhance).observe(document.documentElement,{subtree:true,childList:true});
  document.addEventListener('change',enhance);setTimeout(enhance,300);
})();
