import {serviceDb,staffFromRequest} from '../../../../lib/supabase';
import {respond,fail,jsonBody,clampInt,text,isUuid} from '../../../../lib/api';
export const dynamic='force-dynamic';
type Ctx={params:Promise<{resource:string}>};
const resources:Record<string,string>={products:'products',orders:'orders',coupons:'coupons',campaigns:'campaigns',zones:'delivery_zones',rewards:'rewards',bookings:'bookings',customers:'profiles',settings:'settings',staff:'profiles'};
const allowedCategory=['veg','nonveg','combos','cafe'];
const allowedCampaignStatus=['draft','active','paused','completed'];
const allowedSegments=['all','new','first_time','returning','loyal','inactive','at_risk','high_value'];
const allowedOrderStatus=['accepted','preparing','ready','out_for_delivery','delivered','cancelled'];
const allow=(b:Record<string,unknown>,keys:string[])=>Object.fromEntries(keys.filter(k=>Object.hasOwn(b,k)).map(k=>[k,b[k]]));
async function actor(req:Request,resource:string,write=false){
 const roles=(resource==='orders'||resource==='bookings')?['owner','manager','kitchen','rider']:resource==='products'&&write?['owner','manager']:['owner','manager'];
 return staffFromRequest(req,roles);
}
export async function GET(req:Request,{params}:Ctx){
 const {resource}=await params;if(!resources[resource]&&resource!=='stats')return fail('Unknown resource',404);
 const user=await actor(req,resource);if(!user)return fail('Staff access required',403);
 const db=serviceDb();
 try{
  if(resource==='stats'){
   const [{data:orders},{data:customers},{data:products},{data:coupons},{data:campaigns}]=await Promise.all([
    db.from('orders').select('id,total_paise,created_at,status,payment_status,customer_id,coupon_code').order('created_at',{ascending:false}).limit(2000),
    db.from('profiles').select('id,role,points_balance,marketing_consent'),db.from('products').select('id,active'),db.from('coupons').select('id,code,uses'),db.from('campaigns').select('id,status,name')]);
   const paid=(orders||[]).filter(o=>o.payment_status==='paid');const repeat=new Set<string>();const once=new Set<string>();for(const o of [...paid].reverse()){if(o.customer_id){if(once.has(o.customer_id))repeat.add(o.customer_id);once.add(o.customer_id)}}
   return respond({stats:{paidOrders:paid.length,revenuePaise:paid.reduce((s,o)=>s+o.total_paise,0),pending:(orders||[]).filter(o=>o.status==='placed'||o.status==='accepted'||o.status==='preparing').length,customers:(customers||[]).filter(x=>x.role==='customer').length,repeatCustomers:repeat.size,liveProducts:(products||[]).filter(p=>p.active).length,consentingCustomers:(customers||[]).filter(p=>p.marketing_consent).length,activeCampaigns:(campaigns||[]).filter(c=>c.status==='active').length,couponRedemptions:(coupons||[]).reduce((s,c)=>s+c.uses,0),reportScope:'Most recent 2,000 orders; excludes refunds from gross paid revenue.'}});
  }
  let q=db.from(resources[resource]).select(resource==='orders'?'*,order_items(*)':'*');
  if(resource==='staff')q=q.neq('role','customer');
  if(resource==='customers')q=q.eq('role','customer');
  if(resource==='orders'&&user.role==='rider')q=q.eq('rider_id',user.id);
  if(resource==='bookings'&&user.role==='rider')return fail('Not authorized',403);
  if(resource==='orders'||resource==='campaigns'||resource==='bookings')q=q.order('created_at',{ascending:false});
  if(resource==='products')q=q.order('sort_order',{ascending:true});
  const {data,error}=await q.limit(500);if(error)throw error;return respond({items:data});
 }catch(e){console.error('admin read',e);return fail('Could not load management data',503)}
}
export async function POST(req:Request,{params}:Ctx){
 const {resource}=await params;const staff=await actor(req,resource,true);if(!staff)return fail('Not authorized',403);
 if(['orders','customers','settings','staff','stats'].includes(resource))return fail('Creation not permitted',405);
 const b=await jsonBody(req);if(!b)return fail('Invalid data');const db=serviceDb();
 try{
  let row:Record<string,unknown>={};
  if(resource==='products'){
   const price=clampInt(b.price,1,199999),category=text(b.category,20);if(!price||!allowedCategory.includes(category)||!text(b.name,120))return fail('Name, valid category and price are required');
   row={id:crypto.randomUUID(),name:text(b.name,120),description:text(b.description,800),price,category,image:text(b.image,1200)||null,active:b.active!==false,veg:b.veg===true,featured:b.featured===true,stock_qty:b.stock_qty===null||b.stock_qty===''?null:clampInt(b.stock_qty,0,999999)};
  }else if(resource==='zones'){
   if(!/^[0-9]{6}$/.test(text(b.pin_code)))return fail('Enter a six-digit PIN code');
   row={pin_code:text(b.pin_code),fee_paise:clampInt(b.fee_paise,0,500000),minimum_paise:clampInt(b.minimum_paise,0,10000000),active:b.active!==false};
  }else if(resource==='coupons'){
   const discount_type=text(b.discount_type);const value=clampInt(b.value,1,1000000);if(!text(b.code,32)||!['fixed','percent'].includes(discount_type)||!value||(discount_type==='percent'&&value>100))return fail('Invalid coupon data');
   row={code:text(b.code,32).toUpperCase(),discount_type,value,minimum_paise:clampInt(b.minimum_paise,0,10000000)||0,max_uses:b.max_uses?clampInt(b.max_uses,1,999999):null,expires_at:b.expires_at||null,active:b.active!==false,campaign_id:isUuid(b.campaign_id)?b.campaign_id:null};
  }else if(resource==='campaigns'){
   row={name:text(b.name,120),segment:text(b.segment,60)||'all',status:'draft',message:text(b.message,1200),starts_at:b.starts_at||null,ends_at:b.ends_at||null};if(!row.name||!allowedSegments.includes(String(row.segment)))return fail('Valid campaign name and customer segment required');
  }else if(resource==='rewards'){
   row={name:text(b.name,140),points_cost:clampInt(b.points_cost,1,100000),discount_paise:clampInt(b.discount_paise,100,1000000),active:b.active!==false};if(!row.name||!row.points_cost||!row.discount_paise)return fail('Invalid reward');
  }else return fail('Unsupported resource',404);
  const {data,error}=await db.from(resources[resource]).insert(row).select().single();if(error)throw error;
  await db.from('audit_log').insert({actor_id:staff.id,action:`${resource}.create`,object_id:String(data.id)});
  return respond({item:data},201);
 }catch(e){console.error('admin create',e);return fail('Could not create. Check for duplicates and invalid values.',400)}
}
export async function PATCH(req:Request,{params}:Ctx){
 const {resource}=await params;const staff=await actor(req,resource,true);if(!staff)return fail('Not authorized',403);
 const b=await jsonBody(req);if(!b)return fail('Invalid data');const id=text(b.id,100);if(!id)return fail('Item id required');const db=serviceDb();
 try{
  if(resource==='orders'){
   if(b.rider_id!==undefined){if(!['owner','manager'].includes(staff.role)||!isUuid(b.rider_id))return fail('Valid rider required');const {data:rider}=await db.from('profiles').select('role').eq('id',b.rider_id).single();if(rider?.role!=='rider')return fail('Choose a registered rider');const {error}=await db.from('orders').update({rider_id:b.rider_id}).eq('id',id).eq('payment_status','paid');if(error)throw error;return respond({ok:true})}
   const status=text(b.status);if(!allowedOrderStatus.includes(status))return fail('Invalid status');
   const {data,error}=await db.rpc('transition_order',{p_order_id:id,p_status:status,p_actor:staff.id});if(error)return fail(error.message);return respond({item:data});
  }
  if(resource==='staff'){
   if(staff.role!=='owner')return fail('Only the owner can change roles');
   if(staff.id===id)return fail('Do not change your own owner role');
   const role=text(b.role);if(!['customer','manager','kitchen','rider'].includes(role))return fail('Invalid role');
   const {data,error}=await db.from('profiles').update({role}).eq('id',id).select().single();if(error)throw error;return respond({item:data});
  }
  if(resource==='settings'){
   if(staff.role!=='owner')return fail('Only the owner can change store settings');
   if(id!=='store'||typeof b.value!=='object'||!b.value)return fail('Invalid settings');const v=b.value as Record<string,unknown>;
   const safe={name:text(v.name,100)||'Mane & Oggarane',open:v.open===true,pickup_enabled:v.pickup_enabled===true,delivery_enabled:v.delivery_enabled===true,booking_enabled:v.booking_enabled===true,support_phone:text(v.support_phone,24),address:text(v.address,400),hours:text(v.hours,160),tax_rate_percent:clampInt(v.tax_rate_percent,0,30)||0,free_delivery_threshold_paise:clampInt(v.free_delivery_threshold_paise,0,500000)??10000};
   const {error}=await db.from('settings').update({value:safe,updated_at:new Date().toISOString()}).eq('key','store');if(error)throw error;return respond({ok:true});
  }
  const fields:Record<string,string[]>={products:['name','description','price','category','image','active','veg','featured','stock_qty','sort_order'],zones:['pin_code','fee_paise','minimum_paise','active'],coupons:['code','active','expires_at','max_uses','minimum_paise','campaign_id','discount_type','value'],campaigns:['name','segment','status','message','starts_at','ends_at'],rewards:['name','points_cost','discount_paise','active'],bookings:['status','note']};
  if(!fields[resource])return fail('Unknown resource',404);
  const row=allow(b,fields[resource]);if(!Object.keys(row).length)return fail('No changes');
  if(resource==='products'){
   if(row.price!==undefined){const n=clampInt(row.price,1,199999);if(!n)return fail('Invalid price');row.price=n}
   if(row.category!==undefined&&!allowedCategory.includes(String(row.category)))return fail('Invalid category');
   if(row.name!==undefined)row.name=text(row.name,120);
   if(row.description!==undefined)row.description=text(row.description,800);
   if(row.image!==undefined)row.image=text(row.image,1200)||null;
   if(row.stock_qty!==undefined&&row.stock_qty!==null){const n=clampInt(row.stock_qty,0,999999);if(n===null)return fail('Invalid stock');row.stock_qty=n}
   row.updated_at=new Date().toISOString();
  }
  if(resource==='zones'){
   if(row.pin_code!==undefined&&!/^[0-9]{6}$/.test(String(row.pin_code)))return fail('Delivery PIN must contain six digits');
   for(const key of ['fee_paise','minimum_paise'])if(row[key]!==undefined){const v=clampInt(row[key],0,key==='fee_paise'?500000:10000000);if(v===null)return fail('Delivery amount must be a non-negative number of paise');row[key]=v}
  }
  if(resource==='coupons'){
   if(row.code!==undefined)row.code=text(row.code,32).toUpperCase();
   if(row.campaign_id!==undefined&&row.campaign_id!==null&&!isUuid(row.campaign_id))return fail('Invalid campaign');
   if(row.discount_type!==undefined&&!['fixed','percent'].includes(String(row.discount_type)))return fail('Invalid discount type');
   let kind=String(row.discount_type||'');
   if(row.value!==undefined&&!kind){const {data:existing}=await db.from('coupons').select('discount_type').eq('id',id).maybeSingle();kind=String(existing?.discount_type||'');}
   if(row.value!==undefined){const v=clampInt(row.value,1,kind==='percent'?100:1000000);if(v===null)return fail('Invalid coupon discount value');row.value=v}
   for(const key of ['minimum_paise','max_uses'])if(row[key]!==undefined&&row[key]!==null){const v=clampInt(row[key],key==='max_uses'?1:0,9999999);if(v===null)return fail('Invalid coupon limit');row[key]=v}
  }
  if(resource==='campaigns'){
   if(row.status!==undefined&&!allowedCampaignStatus.includes(String(row.status)))return fail('Invalid campaign status');
   if(row.segment!==undefined&&!allowedSegments.includes(String(row.segment)))return fail('Invalid campaign segment');
  }
  if(resource==='bookings'&&!['requested','confirmed','declined','cancelled'].includes(String(row.status)))return fail('Invalid booking status');
  const {data,error}=await db.from(resources[resource]).update(row).eq(resource==='settings'?'key':'id',id).select().single();if(error)throw error;
  await db.from('audit_log').insert({actor_id:staff.id,action:`${resource}.update`,object_id:id});return respond({item:data});
 }catch(e){console.error('admin update',e);return fail('Could not save the changes',400)}
}
