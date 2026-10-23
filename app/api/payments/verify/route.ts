import {serviceDb} from '../../../../lib/supabase';import {respond,fail,jsonBody,text} from '../../../../lib/api';
import {razorpay,verifyCheckout} from '../../../../lib/razorpay';
export const runtime='nodejs';
export async function POST(req:Request){
 try{
  const b=await jsonBody(req);if(!b)return fail('Invalid request');
  const orderId=text(b.orderId,80),token=text(b.trackingToken,100),rzpOrder=text(b.razorpay_order_id,100),rzpPayment=text(b.razorpay_payment_id,100),signature=text(b.razorpay_signature,150);
  if(!orderId||!token||!rzpOrder||!rzpPayment||!signature)return fail('Missing verification information');
  const db=serviceDb();const {data:order}=await db.from('orders').select('id,tracking_token,razorpay_order_id,total_paise,payment_status').eq('id',orderId).eq('tracking_token',token).maybeSingle();
  if(!order||order.razorpay_order_id!==rzpOrder)return fail('Order mismatch',403);
  if(!verifyCheckout(rzpOrder,rzpPayment,signature))return fail('Payment signature invalid',403);
  const payment=await razorpay(`payments/${encodeURIComponent(rzpPayment)}`);
  if(payment.order_id!==rzpOrder||payment.amount!==order.total_paise||payment.currency!=='INR'||payment.status!=='captured')return fail('Payment capture not confirmed yet. Refresh tracking soon.',409);
  const {error}=await db.rpc('mark_order_paid',{p_order_id:orderId,p_rzp_order:rzpOrder,p_rzp_payment:rzpPayment});if(error)throw error;
  return respond({verified:true,orderId,trackingToken:token});
 }catch(e){console.error('payment verification',e);return fail('Could not verify payment yet. Check order tracking before retrying.',503)}
}
