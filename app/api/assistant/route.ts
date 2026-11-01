import {serviceDb,userFromRequest} from '../../../lib/supabase';
import {respond,fail,jsonBody,text} from '../../../lib/api';
import {withinRate} from '../../../lib/rate';
import {getBusiness,getDeliveryPins,isOpenNow} from '../../../lib/business';
import {answer,type AssistantDish,type AssistantOrder} from '../../../lib/assistant';
export const runtime='nodejs';export const dynamic='force-dynamic';

// Short in-memory cache of PUBLIC data only (menu/settings/zones). Never caches customer data.
let cache:{at:number;menu:AssistantDish[];pins:string[];business:Awaited<ReturnType<typeof getBusiness>>}|null=null;
async function publicData(){
  if(cache&&Date.now()-cache.at<60_000)return cache;
  const [menuRes,pins,business]=await Promise.all([
    serviceDb().from('products').select('id,name,price,veg,category,description,stock_qty').eq('active',true).order('sort_order'),
    getDeliveryPins(),getBusiness()]);
  const menu=(menuRes.data||[]).filter(d=>d.stock_qty===null||d.stock_qty>0).map(({stock_qty:_s,...d})=>d as AssistantDish);
  cache={at:Date.now(),menu,pins,business};return cache;
}

/** Public kitchen assistant. Transcripts are not stored. Personal answers require a valid session. */
export async function POST(req:Request){
  try{
    if(!await withinRate(req,'assistant',40,600))return fail('You are sending messages too quickly. Please wait a minute and try again.',429);
    const body=await jsonBody(req);const message=text(body?.message,500);
    if(!message)return fail('Please type a question.');
    const data=await publicData();
    const user=await userFromRequest(req);
    let latestOrder:AssistantOrder|null=null;
    if(user&&/\b(my order|order status|where is my|track|tracking|status of)\b/i.test(message)){
      // Ownership enforced: only this signed-in customer's own orders.
      const {data:o}=await serviceDb().from('orders').select('id,tracking_token,status,payment_status,fulfillment_type,total_paise,created_at').eq('customer_id',user.id).order('created_at',{ascending:false}).limit(1).maybeSingle();
      latestOrder=(o as AssistantOrder)||null;
    }
    return respond(answer(message,{menu:data.menu,business:data.business,pins:data.pins,openNow:isOpenNow(data.business),signedIn:!!user,latestOrder}));
  }catch(e){console.error('assistant error',e);return fail('The kitchen assistant is unavailable right now. Please try again shortly.',503)}
}
