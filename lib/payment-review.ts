import {serviceDb} from './supabase';
import {razorpay} from './razorpay';

/** True when mark_order_paid refused because the order was already released/cancelled. */
export const isLateCaptureError=(message:string)=>/not payable|reservation expired/i.test(message||'');

/** Record a captured payment that can no longer be attached to its order, for owner refund/confirmation. */
export async function recordPaymentReview(orderId:string,paymentId:string,amount:number,reason:string){
  const {error}=await serviceDb().from('payment_reviews').upsert({order_id:orderId,razorpay_payment_id:paymentId,amount_paise:amount,reason},{onConflict:'razorpay_payment_id',ignoreDuplicates:true});
  if(error)throw error;
}

type ProviderPayment={id:string;status:string;amount:number;currency:string;order_id:string};
/** Captured payments on a Razorpay order that match our expected amount (canonical provider data). */
export async function capturedPayments(rzpOrderId:string,amount:number):Promise<ProviderPayment[]>{
  const result=await razorpay(`orders/${encodeURIComponent(rzpOrderId)}/payments`);
  const items:ProviderPayment[]=Array.isArray(result.items)?result.items:[];
  return items.filter(p=>p.status==='captured'&&p.order_id===rzpOrderId&&p.currency==='INR'&&p.amount===amount);
}
