import {serviceDb} from '../../../lib/supabase';import {respond,fail,isUuid} from '../../../lib/api';
export const dynamic='force-dynamic';
export async function GET(req:Request){try{const q=new URL(req.url).searchParams;const id=q.get('id')||'',token=q.get('token')||'';
 if(!isUuid(id)||!token||token.length>100)return fail('Tracking link is incomplete',400);
 const {data,error}=await serviceDb().from('orders').select('id,status,payment_status,fulfillment_type,total_paise,created_at,updated_at,order_items(name,quantity,line_total_paise)').eq('id',id).eq('tracking_token',token).maybeSingle();
 if(error||!data)return fail('Order not found',404);return respond({order:data});
 }catch{return fail('Tracking unavailable',503)}}
