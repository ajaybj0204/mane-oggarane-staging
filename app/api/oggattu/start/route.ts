import {stagingTransactionsAllowed,prelaunchMessage} from '../../../../lib/launch';
import {serviceDb,userFromRequest} from '../../../../lib/supabase';
import {respond,fail,jsonBody,text} from '../../../../lib/api';
import {withinRate} from '../../../../lib/rate';
import {merchantVpa,newRef,oggattuMode,upiLink} from '../../../../lib/oggattu';
export const runtime='nodejs';export const dynamic='force-dynamic';

/** Creates the order exactly like Razorpay checkout, but the payment request is a direct UPI link (₹0 fee). */
export async function POST(req:Request){
 if(!stagingTransactionsAllowed())return fail(prelaunchMessage(),503);
 try{
  if(!await withinRate(req,'checkout',12,900))return fail('Too many checkout attempts. Please try later.',429);
  const b=await jsonBody(req);if(!b)return fail('Invalid checkout request');
  const items=Array.isArray(b.items)?b.items.map((x)=>({id:text(x?.id,80),quantity:Number(x?.quantity)})):[];
  const type=b.fulfillment==='delivery'?'delivery':b.fulfillment==='pickup'?'pickup':null;
  if(!type||items.length<1||items.length>30)return fail('Invalid fulfillment or basket');
  const user=await userFromRequest(req);if(!user)return fail('Sign in to your account before placing an order.',401);
  const customerEmail=user.email||text(b.email,150);if(!customerEmail)return fail('Missing verified account email');
  const db=serviceDb();
  const {data:order,error}=await db.rpc('create_checkout_order',{p_customer_id:user.id,p_name:text(b.name,100),p_email:customerEmail,p_phone:text(b.phone,24),p_fulfillment:type,p_address:b.address&&typeof b.address==='object'?b.address:null,p_notes:text(b.notes,500),p_items:items,p_coupon:text(b.coupon,40)});
  if(error)return fail(error.message,400);
  const ref=newRef();
  const {error:saveError}=await db.from('orders').update({razorpay_order_id:ref}).eq('id',order.id);
  if(saveError){await db.rpc('release_unpaid_order',{p_order_id:order.id});throw saveError}
  return respond({provider:'oggattu',mode:oggattuMode(),orderId:order.id,trackingToken:order.tracking_token,ref,amount:order.total_paise,currency:'INR',vpa:merchantVpa(),upiLink:upiLink(ref,order.total_paise),breakdown:{subtotal:order.subtotal_paise,discount:order.discount_paise,delivery:order.delivery_paise,tax:order.tax_paise}});
 }catch(e){console.error('oggattu start',e);return fail('Oggattu Pay is temporarily unavailable. Please try again or pay by card.',503)}
}
