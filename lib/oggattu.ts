// Oggattu Pay: zero-fee direct UPI for Mane & Oggarane (server only).
// The customer pays by UPI straight into the restaurant's own UPI ID; this code only creates
// the payment request and verifies the bank's signed confirmation. No money passes through us.
//
// Orders reuse the existing columns, so no database change is needed:
//   orders.razorpay_order_id   = "ogt_<code>"      (Oggattu payment reference, unique)
//   orders.razorpay_payment_id = "ogt_utr_<UTR>"   (unique, so a UTR can never pay two orders)
import {createHmac,randomBytes,timingSafeEqual} from 'crypto';

export const OGT_PREFIX='ogt_';
export const OGT_UTR_PREFIX='ogt_utr_';
export const isOggattuRef=(id:unknown)=>typeof id==='string'&&id.startsWith(OGT_PREFIX)&&!id.startsWith(OGT_UTR_PREFIX);
export const isOggattuPayment=(id:unknown)=>typeof id==='string'&&id.startsWith(OGT_UTR_PREFIX);

/** "test" = simulated bank (default). Anything else disables the simulated bank. */
export const oggattuMode=()=>process.env.OGGATTU_MODE==='pilot'?'pilot':'test';
export const merchantVpa=()=>process.env.OGGATTU_UPI_ID||'maneoggarane@testbank';
const secret=()=>process.env.OGGATTU_BANK_SECRET||'oggattu-test-mode-secret-change-me';

export function newRef(){
  const a='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return OGT_PREFIX+Array.from(randomBytes(8),b=>a[b%a.length]).join('');
}

/** Standard NPCI UPI deep link: any UPI app opens it with amount and reference filled in. */
export function upiLink(ref:string,amountPaise:number){
  const p=new URLSearchParams({pa:merchantVpa(),pn:'Mane & Oggarane',am:(amountPaise/100).toFixed(2),cu:'INR',tn:`Mane & Oggarane order ${ref}`,tr:ref});
  return `upi://pay?${p.toString().replace(/\+/g,'%20')}`;
}

export type BankConfirmation={ref:string;amount:number;utr:string;status:'SUCCESS'|'FAILURE';payerVpa:string;ts:number;sig:string};
const canonical=(c:Omit<BankConfirmation,'sig'>)=>[c.ref,c.amount,c.utr,c.status,c.payerVpa,c.ts].join('|');
const hmac=(s:string)=>createHmac('sha256',secret()).update(s).digest('hex');

/** TEST MODE: what a bank would send after the customer approves in their UPI app. */
export function simulatedBankConfirmation(ref:string,amount:number,status:'SUCCESS'|'FAILURE',payerVpa:string):BankConfirmation{
  const utr=String(Date.now()).slice(-8)+String(1000+Math.floor(Math.random()*9000));
  const c={ref,amount,utr,status,payerVpa,ts:Date.now()};
  return {...c,sig:hmac(canonical(c))};
}

/** Every check that protects the restaurant before an order is marked paid. */
export function checkConfirmation(c:Partial<BankConfirmation>|null|undefined,expectedRef:string,expectedAmount:number):string|null{
  if(!c||typeof c!=='object')return 'No bank confirmation';
  const {ref,amount,utr,status,payerVpa,ts,sig}=c;
  if(typeof ref!=='string'||typeof utr!=='string'||typeof payerVpa!=='string'||typeof sig!=='string'||!Number.isFinite(amount)||!Number.isFinite(ts))return 'Malformed bank confirmation';
  const expected=Buffer.from(hmac(canonical({ref,amount:amount!,utr,status:status as 'SUCCESS',payerVpa,ts:ts!})),'hex');
  const given=Buffer.from(sig,'hex');
  if(expected.length!==given.length||!timingSafeEqual(expected,given))return 'Invalid bank signature: confirmation was forged or edited';
  if(Date.now()-ts!>5*60*1000)return 'Confirmation is too old (possible replay)';
  if(ref!==expectedRef)return 'Payment reference does not match this order';
  if(!/^\d{12}$/.test(utr))return 'Invalid UTR';
  if(amount!==expectedAmount)return `Amount mismatch: paid ₹${(amount!/100).toFixed(2)}, order total ₹${(expectedAmount/100).toFixed(2)}`;
  if(status!=='SUCCESS')return 'The bank reported this payment as failed';
  return null;
}
