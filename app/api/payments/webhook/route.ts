import {serviceDb} from '../../../../lib/supabase';import {verifyWebhook,razorpay} from '../../../../lib/razorpay';import {respond,fail} from '../../../../lib/api';
export const runtime='nodejs';
export async function POST(req:Request){
 const raw=await req.text();const signature=req.headers.get('x-razorpay-signature')||'';
 if(!verifyWebhook(raw,signature))return fail('Invalid webhook signature',403);
 try{
  const evt=JSON.parse(raw);const id=req.headers.get('x-razorpay-event-id')||'';const type=String(evt.event||'');
  if(!id||id.length>120||!/^[a-zA-Z0-9_-]+$/.test(id))return fail('Missing or invalid Razorpay event id');const db=serviceDb();
  const {data:seen}=await db.from('payment_events').select('id').eq('id',id).maybeSingle();if(seen)return respond({ok:true,duplicate:true});
  if(type==='payment.captured'||type==='order.paid'){
   const payment=evt.payload?.payment?.entity;
   const providerOrder=payment?.order_id||evt.payload?.order?.entity?.id;
   if(payment?.id&&providerOrder){
    const {data:order}=await db.from('orders').select('id,total_paise').eq('razorpay_order_id',providerOrder).maybeSingle();
    if(order){const canonical=await razorpay(`payments/${encodeURIComponent(payment.id)}`);
     if(canonical.status==='captured'&&canonical.amount===order.total_paise&&canonical.currency==='INR'&&canonical.order_id===providerOrder){
      const {error}=await db.rpc('mark_order_paid',{p_order_id:order.id,p_rzp_order:providerOrder,p_rzp_payment:canonical.id});if(error)throw error;
     }
    }
   }
  }
  if(type==='refund.processed'){
   const refund=evt.payload?.refund?.entity;
   if(refund?.payment_id){
    const {data:order}=await db.from('orders').select('id,total_paise,razorpay_payment_id').eq('razorpay_payment_id',refund.payment_id).maybeSingle();
    if(order){
     // One refund event may represent just one PARTIAL refund. Fetch all refunds
     // from the provider, and reconcile their processed sum, not payload.amount.
     const refunds=await razorpay(`payments/${encodeURIComponent(order.razorpay_payment_id)}/refunds`);
     const completed=(Array.isArray(refunds.items)?refunds.items:[]).filter((r:{status?:string})=>r.status==='processed');
     const processedTotal=completed.reduce((total:number,r:{amount?:number})=>total+Number(r.amount||0),0);
     if(processedTotal>0){
      const latestId=String(completed[completed.length-1]?.id||refund.id||'');
      const {error}=await db.rpc('confirm_provider_refund',{p_order_id:order.id,p_refund_id:latestId,p_processed_total_paise:processedTotal});if(error)throw error;
     }
    }
   }
  }
  // payment.failed does not automatically cancel the entire Razorpay order;
  // customers can retry, and a later captured payment must not be overwritten.
  const {error}=await db.from('payment_events').insert({id,event_type:type});if(error&&error.code!=='23505')throw error;
  return respond({ok:true});
 }catch(e){console.error('Webhook processing failed',e);return fail('Webhook will be retried',500)}
}
