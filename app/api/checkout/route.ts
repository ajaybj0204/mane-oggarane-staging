import {stagingTransactionsAllowed,prelaunchMessage} from '../../../lib/launch';
import {serviceDb,userFromRequest} from '../../../lib/supabase';
import {respond,fail,jsonBody,text} from '../../../lib/api';
import {razorpay} from '../../../lib/razorpay';
import {withinRate} from '../../../lib/rate';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function POST(req:Request){
 if(!stagingTransactionsAllowed())return fail(prelaunchMessage(),503);
 try{
  if(!await withinRate(req,'checkout',12,900))return fail('Too many checkout attempts. Please try later.',429);
  const b=await jsonBody(req);if(!b)return fail('Invalid checkout request');
  const items=Array.isArray(b.items)?b.items.map((x)=>({id:text(x?.id,80),quantity:Number(x?.quantity)})):[];
  const type=b.fulfillment==='delivery'?'delivery':b.fulfillment==='pickup'?'pickup':null;
  if(!type||items.length<1||items.length>30)return fail('Invalid fulfillment or basket');
  const user=await userFromRequest(req);const db=serviceDb();
  let customerEmail=text(b.email,150);
  if(user){customerEmail=user.email||customerEmail;if(!customerEmail)return fail('Missing verified account email')}
  const details={p_customer_id:user?.id||null,p_name:text(b.name,100),p_email:customerEmail,p_phone:text(b.phone,24),p_fulfillment:type,p_address:b.address&&typeof b.address==='object'?b.address:null,p_notes:text(b.notes,500),p_items:items,p_coupon:text(b.coupon,40)};
  const {data:order,error}=await db.rpc('create_checkout_order',details);
  if(error)return fail(error.message,400);
  let provider;
  try{
   provider=await razorpay('orders','POST',{amount:order.total_paise,currency:'INR',receipt:order.id,notes:{restaurant:'Mane & Oggarane',internal_order:order.id}});
  }catch(e){await db.rpc('release_unpaid_order',{p_order_id:order.id});throw e}
  const {error:saveError}=await db.from('orders').update({razorpay_order_id:provider.id}).eq('id',order.id);
  if(saveError){await db.rpc('release_unpaid_order',{p_order_id:order.id});throw saveError;}
  return respond({orderId:order.id,trackingToken:order.tracking_token,razorpayOrderId:provider.id,amount:order.total_paise,currency:'INR',key:process.env.RAZORPAY_KEY_ID,customer:{name:order.customer_name,email:order.customer_email,contact:order.customer_phone},breakdown:{subtotal:order.subtotal_paise,discount:order.discount_paise,delivery:order.delivery_paise,tax:order.tax_paise}});
 }catch(e){console.error('checkout error',e);return fail('Checkout temporarily unavailable. Please try again.',503)}
}
