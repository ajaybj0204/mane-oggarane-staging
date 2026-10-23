import {staffFromRequest,serviceDb} from '../../../../lib/supabase';import {respond,fail} from '../../../../lib/api';
export const dynamic='force-dynamic';
export async function GET(req:Request){
 const staff=await staffFromRequest(req,['owner','manager']);if(!staff)return fail('Manager access required',403);
 try{const db=serviceDb();const [{data:customers,error:cErr},{data:orders,error:oErr},{data:coupons}]=await Promise.all([
  db.from('profiles').select('id,display_name,phone,marketing_consent,points_balance').eq('role','customer').limit(2000),
  db.from('orders').select('customer_id,subtotal_paise,discount_paise,total_paise,created_at,paid_at,status,payment_status,coupon_code').eq('payment_status','paid').order('created_at',{ascending:false}).limit(10000),
  db.from('coupons').select('id,code,uses,campaign_id')]);
 if(cErr||oErr)throw cErr||oErr;
 const byId=new Map<string,{count:number,spent:number,last:string|null}>();for(const o of orders||[]){if(!o.customer_id)continue;const x=byId.get(o.customer_id)||{count:0,spent:0,last:null};x.count++;x.spent+=o.total_paise;if(!x.last||o.created_at>x.last)x.last=o.created_at;byId.set(o.customer_id,x)}
 const now=Date.now();let counts={new:0,first_time:0,returning:0,loyal:0,inactive:0,at_risk:0,high_value:0,consenting:0};const records=(customers||[]).map(c=>{const a=byId.get(c.id)||{count:0,spent:0,last:null};const days=a.last?Math.floor((now-Date.parse(a.last))/86400000):null;const category=a.count===0?'new':a.count===1?'first_time':a.count>=5?'loyal':'returning';counts[category]++;const inactive=days!==null&&days>=30;const at_risk=days!==null&&days>=14&&days<30&&a.count>=2;const high_value=a.spent>=100000; if(inactive)counts.inactive++;if(at_risk)counts.at_risk++;if(high_value)counts.high_value++;if(c.marketing_consent)counts.consenting++;
 return {id:c.id,name:c.display_name,phone:c.phone,consent:c.marketing_consent,points:c.points_balance,paidOrders:a.count,spentPaise:a.spent,daysSinceOrder:days,category,inactive,at_risk,high_value}});
 const codes=new Map((coupons||[]).filter(c=>c.campaign_id).map(c=>[c.code,c.campaign_id]));let attributed=0,ordersWithCampaignCode=0;for(const o of orders||[]){if(o.coupon_code&&codes.has(o.coupon_code)){ordersWithCampaignCode++;attributed+=o.total_paise}}
 return respond({counts,records:records.slice(0,2000),campaignAttribution:{paidOrdersWithCampaignCode:ordersWithCampaignCode,grossAttributedPaise:attributed,method:'Coupon-code attribution only; not incremental lift or causal effect'},scope:'At most 2,000 customer profiles and 10,000 recent paid orders; counts may be incomplete above limits.'});
 }catch(e){console.error('segments',e);return fail('Could not analyze customer segments',503)}
}
