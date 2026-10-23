import {serviceDb} from '../../../../lib/supabase';import {respond,fail} from '../../../../lib/api';
export const runtime='nodejs';
export async function GET(req:Request){
 if(!process.env.CRON_SECRET||req.headers.get('authorization')!==`Bearer ${process.env.CRON_SECRET}`)return fail('Forbidden',403);
 try{const {data,error}=await serviceDb().rpc('expire_abandoned_orders');if(error)throw error;return respond({ok:true,expiredOrders:data})}catch{return fail('Cleanup failed',500)}
}
