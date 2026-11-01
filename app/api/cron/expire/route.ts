import {serviceDb} from '../../../../lib/supabase';import {respond,fail} from '../../../../lib/api';
import {capturedPayments,isLateCaptureError,recordPaymentReview} from '../../../../lib/payment-review';
export const runtime='nodejs';export const dynamic='force-dynamic';

/**
 * Abandoned-order cleanup, reconciled with Razorpay BEFORE anything is released.
 * - captured payment found  -> mark the order paid (reservations are still held)
 * - no captured payment     -> release stock/coupon and cancel (release_unpaid_order)
 * - Razorpay unreachable    -> leave the order untouched; the next run retries
 * Idempotent: every branch is safe to repeat. Called by Vercel Cron (Bearer CRON_SECRET).
 */
export async function GET(req:Request){
 if(!process.env.CRON_SECRET||req.headers.get('authorization')!==`Bearer ${process.env.CRON_SECRET}`)return fail('Forbidden',403);
 const db=serviceDb();const result={checked:0,paid:0,released:0,review:0,skipped:0};
 try{
  const {data:orders,error}=await db.from('orders').select('id,razorpay_order_id,total_paise').eq('status','awaiting_payment').eq('payment_status','pending').lt('reservation_expires_at',new Date().toISOString()).order('created_at').limit(100);
  if(error)throw error;
  for(const o of orders||[]){
   result.checked++;
   try{
    const captured=o.razorpay_order_id?await capturedPayments(o.razorpay_order_id,o.total_paise):[];
    if(captured.length===1){
     const {error:payError}=await db.rpc('mark_order_paid',{p_order_id:o.id,p_rzp_order:o.razorpay_order_id,p_rzp_payment:captured[0].id});
     if(!payError){result.paid++;continue}
     if(!isLateCaptureError(payError.message))throw payError;
     await recordPaymentReview(o.id,captured[0].id,captured[0].amount,'Captured payment found during cleanup but order not payable');result.review++;continue;
    }
    if(captured.length>1){for(const p of captured)await recordPaymentReview(o.id,p.id,p.amount,'Multiple captured payments on one order');result.review++;continue}
    const {data:released,error:relError}=await db.rpc('release_unpaid_order',{p_order_id:o.id});
    if(relError)throw relError;if(released)result.released++;
   }catch(e){console.error('cleanup skipped order',o.id,e);result.skipped++}
  }
  return respond({ok:true,...result});
 }catch(e){console.error('cleanup failed',e);return fail('Cleanup failed',500)}
}
