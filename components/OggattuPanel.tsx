'use client';
import QRCode from 'qrcode';
import {useEffect,useState} from 'react';
import {bearerFetch} from '../lib/supabase';
import {money} from '../lib/types';

export type OggattuOrder={provider:'oggattu';mode:'test'|'pilot';orderId:string;trackingToken:string;ref:string;amount:number;vpa:string;upiLink:string;breakdown:{subtotal:number;discount:number;delivery:number;tax:number}};

/** Direct-UPI payment panel: QR + "open UPI app"; in test mode, a simulated bank with PIN 1234. */
export default function OggattuPanel({order,onPaid}:{order:OggattuOrder;onPaid:(utr:string)=>void}){
 const [qr,setQr]=useState('');const [pin,setPin]=useState('');const [busy,setBusy]=useState(false);const [msg,setMsg]=useState('');
 useEffect(()=>{QRCode.toDataURL(order.upiLink,{margin:1,width:320}).then(setQr).catch(()=>{})},[order.upiLink]);

 async function testPay(decline=false){
  setBusy(true);setMsg(decline?'Declining…':'Your bank is processing the payment…');
  try{
   const r=await bearerFetch('/api/oggattu/bank',{method:'POST',body:JSON.stringify({ref:order.ref,amount:order.amount,pin,decline})});
   const confirmation=await r.json();if(!r.ok)throw new Error(confirmation.error||'Bank unavailable');
   setMsg('Verifying the bank confirmation…');
   const v=await bearerFetch('/api/oggattu/confirm',{method:'POST',body:JSON.stringify({orderId:order.orderId,trackingToken:order.trackingToken,confirmation})});
   const d=await v.json();if(!v.ok)throw new Error(d.error||'Verification failed');
   setMsg(`Paid ✓ UTR ${d.utr}`);onPaid(d.utr);
  }catch(e){setMsg(e instanceof Error?e.message:'Payment failed')}finally{setBusy(false);setPin('')}
 }

 return <div className="payment-breakdown oggattu-panel" style={{display:'grid',gap:12}}>
  <p className="eyebrow">OGGATTU PAY · DIRECT UPI · ₹0 FEE</p>
  <h3 style={{margin:0}}>Pay {money(order.amount)} to {order.vpa}</h3>
  <p className="fineprint" style={{margin:0}}>The money goes straight from your bank to the restaurant&apos;s bank over UPI. Your order is confirmed only when the bank&apos;s signed confirmation is verified, never from a screenshot.</p>
  <div style={{display:'flex',gap:16,flexWrap:'wrap',alignItems:'center'}}>
   {qr?<img src={qr} alt="UPI QR code" width={180} height={180} style={{background:'#fff',padding:8,borderRadius:12}}/>:<div style={{width:180,height:180}}/>}
   <div style={{display:'grid',gap:8,minWidth:200}}>
    <a className="button primary" href={order.upiLink}>Open UPI app</a>
    <small className="fineprint">Scan with GPay, PhonePe, Paytm or BHIM. Ref {order.ref}</small>
   </div>
  </div>
  {order.mode==='test'&&<div style={{border:'1px dashed currentColor',borderRadius:12,padding:12,display:'grid',gap:8}}>
   <strong>Test mode: pay with the simulated bank</strong>
   <small className="fineprint">No real money. Enter test UPI PIN <b>1234</b>.</small>
   <input inputMode="numeric" maxLength={4} placeholder="UPI PIN" value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,''))} aria-label="Test UPI PIN"/>
   <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
    <button type="button" className="button primary" disabled={busy||pin.length!==4} onClick={()=>void testPay()}>{busy?'Processing…':`Pay ${money(order.amount)}`}</button>
    <button type="button" className="button outline" disabled={busy} onClick={()=>void testPay(true)}>Decline</button>
   </div>
  </div>}
  {msg&&<p className="alert" role="status" style={{margin:0}}>{msg}</p>}
 </div>;
}
