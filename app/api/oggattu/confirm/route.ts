import {serviceDb} from '../../../../lib/supabase';
import {respond,fail,jsonBody,text} from '../../../../lib/api';
import {isLateCaptureError,recordPaymentReview} from '../../../../lib/payment-review';
import {OGT_UTR_PREFIX,checkConfirmation,isOggattuRef,type BankConfirmation} from '../../../../lib/oggattu';
export const runtime='nodejs';export const dynamic='force-dynamic';

/**
 * Marks an Oggattu Pay order paid ONLY after the bank's signed confirmation passes every check:
 * signature, freshness, reference, exact amount, success status. The existing mark_order_paid
 * function then pays the order exactly once, and the unique payment-id column blocks a UTR
 * from ever paying a second order.
 */
export async function POST(req:Request){
 try{
  const b=await jsonBody(req);if(!b)return fail('Invalid request');
  const orderId=text(b.orderId,80),token=text(b.trackingToken,100);const c=b.confirmation as Partial<BankConfirmation>|undefined;
  if(!orderId||!token)return fail('Missing order details');
  const db=serviceDb();
  const {data:order}=await db.from('orders').select('id,tracking_token,razorpay_order_id,total_paise,payment_status').eq('id',orderId).eq('tracking_token',token).maybeSingle();
  if(!order||!isOggattuRef(order.razorpay_order_id))return fail('Order not found',404);
  const problem=checkConfirmation(c,order.razorpay_order_id,order.total_paise);
  if(problem)return fail(problem,problem.includes('failed')?402:409);
  const paymentId=OGT_UTR_PREFIX+c!.utr;
  const {error}=await db.rpc('mark_order_paid',{p_order_id:orderId,p_rzp_order:order.razorpay_order_id,p_rzp_payment:paymentId});
  if(error){
   if(error.code==='23505'||/duplicate key/i.test(error.message))return fail('This UTR was already used for another payment. Duplicate blocked.',409);
   if(/Different payment already recorded/i.test(error.message))return fail('This order is already paid with a different UTR.',409);
   if(!isLateCaptureError(error.message))throw error;
   await recordPaymentReview(orderId,paymentId,c!.amount!,'Oggattu UPI payment arrived after the order was released');
   return fail('Your payment arrived after this order expired. The restaurant has been alerted and will refund it by UPI.',409);
  }
  return respond({verified:true,orderId,trackingToken:token,utr:c!.utr});
 }catch(e){console.error('oggattu confirm',e);return fail('Could not confirm the payment yet. Check order tracking before paying again.',503)}
}
