import {stagingTransactionsAllowed,prelaunchMessage} from '../../../../../../lib/launch';
import {staffFromRequest,serviceDb} from '../../../../../../lib/supabase';
import {razorpay} from '../../../../../../lib/razorpay';
import {respond,fail} from '../../../../../../lib/api';
export const runtime='nodejs';
type Ctx={params:Promise<{id:string}>};
export async function POST(req:Request,{params}:Ctx){
 if(!stagingTransactionsAllowed())return fail(prelaunchMessage(),503);
 const actor=await staffFromRequest(req,['owner','manager']);if(!actor)return fail('Manager access required',403);
 const {id}=await params;const db=serviceDb();
 if(!process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_'))return fail('This protected staging release permits Test Mode refunds only.',403);
 try{
  const {data:order,error:oError}=await db.from('orders').select('id,razorpay_payment_id,payment_status,total_paise').eq('id',id).maybeSingle();
  if(oError||!order||!order.razorpay_payment_id||order.payment_status!=='paid')return fail('Only captured, currently-paid orders are eligible for this full-refund workflow',409);
  // DB primary key provides a transactional one-request-per-order guard across devices.
  const {error:claimError}=await db.from('refund_requests').insert({order_id:id,requested_by:actor.id,requested_amount_paise:order.total_paise,status:'initiated'});
  if(claimError){if(claimError.code==='23505')return fail('Refund already requested. Check Razorpay and your refund records; do not issue a second request.',409);throw claimError}
  try{
   const refund=await razorpay(`payments/${encodeURIComponent(order.razorpay_payment_id)}/refund`,'POST',{amount:order.total_paise,notes:{reason:'Merchant-initiated full refund',internal_order:id}});
   const {error:requestUpdateError}=await db.from('refund_requests').update({provider_refund_id:refund.id,status:'requested',updated_at:new Date().toISOString()}).eq('order_id',id).in('status',['initiated','requested']);if(requestUpdateError)throw requestUpdateError;
   const {error:orderUpdateError}=await db.from('orders').update({refund_id:refund.id,updated_at:new Date().toISOString()}).eq('id',id);if(orderUpdateError)throw orderUpdateError;
   await db.from('audit_log').insert({actor_id:actor.id,action:'order.refund.requested',object_id:id});
   return respond({refundId:refund.id,status:refund.status,message:'Refund requested; await and verify signed provider confirmation.'});
  }catch(error){await db.from('refund_requests').update({status:'needs_review',updated_at:new Date().toISOString()}).eq('order_id',id);console.error('Razorpay refund request uncertain',error);return fail('Refund status uncertain. Inspect Razorpay Test Dashboard before taking any further action.',503)}
 }catch(e){console.error('refund request',e);return fail('Refund process unavailable. Ensure migration 007_refund_safety.sql has been applied.',503)}
}
