import {stagingTransactionsAllowed,prelaunchMessage} from '../../../../lib/launch';
import {serviceDb,userFromRequest} from '../../../../lib/supabase';
import {respond,fail,jsonBody,text} from '../../../../lib/api';
import {withinRate} from '../../../../lib/rate';
export const dynamic='force-dynamic';

export async function POST(req:Request){
 if(!stagingTransactionsAllowed())return fail(prelaunchMessage(),503);
 try {
  if(!await withinRate(req,'checkout',12,900))return fail('Too many pricing requests. Please try later.',429);
  const body=await jsonBody(req);if(!body)return fail('Invalid checkout request');
  const items=Array.isArray(body.items)?body.items:[];
  if(items.length<1||items.length>30)return fail('Invalid basket');
  const type=body.fulfillment;
  if(type!=='pickup'&&type!=='delivery')return fail('Choose pickup or delivery');
  const name=text(body.name,100),phone=text(body.phone,24);
  const user=await userFromRequest(req),email=user?.email||text(body.email,150);
  if(name.length<2||!(/^[^@ ]+@[^@ ]+\.[^@ ]+$/.test(email))||!(/^[+0-9 -]{8,18}$/.test(phone)))return fail('Invalid customer details');
  const entries:{id:string;quantity:number}[]=[];const seen=new Set<string>();
  for(const raw of items){
   if(!raw||typeof raw!=='object')return fail('Invalid cart item');
   const id=text(raw.id,80),quantity=Number(raw.quantity);
   if(!id||seen.has(id)||!Number.isInteger(quantity)||quantity<1||quantity>20)return fail('Invalid or duplicate cart item');
   seen.add(id);entries.push({id,quantity});
  }
  const db=serviceDb();
  const {data:settings,error:settingsError}=await db.from('settings').select('value').eq('key','store').single();
  if(settingsError)throw settingsError;
  const store=(settings?.value||{}) as Record<string,unknown>;
  if(store.open!==true)return fail('Store is closed');
  if(type==='pickup'&&store.pickup_enabled!==true)return fail('Pickup unavailable');
  if(type==='delivery'&&store.delivery_enabled!==true)return fail('Delivery unavailable');
  const {data:products,error:productError}=await db.from('products').select('id,name,active,price,stock_qty').in('id',entries.map(x=>x.id));
  if(productError)throw productError;
  const dishMap=new Map((products||[]).map(d=>[d.id,d]));
  let subtotal=0;
  for(const item of entries){
   const product=dishMap.get(item.id);
   if(!product||product.active!==true)return fail('Dish unavailable');
   if(product.stock_qty!==null&&product.stock_qty<item.quantity)return fail('Insufficient stock: '+product.name);
   if(!Number.isInteger(product.price)||product.price<=0)return fail('Invalid menu price',503);
   subtotal+=item.quantity*product.price*100;
  }
  if(subtotal<=0)return fail('Empty basket');
  let delivery=0;
  if(type==='delivery'){
   const addr=body.address as Record<string,unknown>|null;
   const line1=text(addr?.line1,240),pin=text(addr?.pin_code,6);
   if(line1.length<5||!/^[0-9]{6}$/.test(pin))return fail('Full delivery address required');
   const {data:zone,error}=await db.from('delivery_zones').select('minimum_paise,fee_paise').eq('pin_code',pin).eq('active',true).maybeSingle();
   if(error)throw error;
   if(!zone)return fail('This PIN code is outside our current delivery zones');
   if(subtotal<zone.minimum_paise)return fail('Delivery minimum not reached');
   delivery=zone.fee_paise;
  }
  let discount=0;
  const code=text(body.coupon,40);
  if(code){
   const {data:coupon,error}=await db.from('coupons').select('id,code,active,expires_at,uses,reserved,max_uses,minimum_paise,customer_id,discount_type,value,max_discount_paise').ilike('code',code.trim()).maybeSingle();
   if(error)throw error;
   if(!coupon||!coupon.active||(coupon.expires_at&&new Date(coupon.expires_at).getTime()<=Date.now())||(coupon.max_uses!==null&&coupon.uses+coupon.reserved>=coupon.max_uses)||subtotal<coupon.minimum_paise||(coupon.customer_id&&coupon.customer_id!==user?.id))return fail('Coupon is invalid, expired, or not eligible');
   const {data:eligible,error:eligibilityError}=await db.rpc('coupon_is_eligible',{p_coupon_id:coupon.id,p_customer_id:user?.id||null});
   if(eligibilityError)throw eligibilityError;
   if(!eligible)return fail('Coupon not eligible for this account');
   if(coupon.discount_type==='fixed')discount=Math.min(subtotal,coupon.value);
   else {discount=Math.floor(subtotal*coupon.value/100);if(coupon.max_discount_paise!==null)discount=Math.min(discount,coupon.max_discount_paise);}
  }
  const tax=Math.round(Math.max(0,subtotal-discount)*Number(store.tax_rate_percent||0)/100);
  const amount=subtotal-discount+delivery+tax;
  if(!Number.isSafeInteger(amount)||amount<=0)return fail('Invalid total');
  return respond({amount,currency:'INR',breakdown:{subtotal,discount,delivery,tax},quoteOnly:true});
 }catch(e){console.error('quote error',e);return fail('Unable to calculate checkout total. Please retry.',503)}
}
