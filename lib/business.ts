import {serviceDb} from './supabase';

/** Public, owner-approved restaurant details. Blank fields are hidden by the UI, never faked. */
export type Business={name:string;address:string;hours:string;openingTime:string;closingTime:string;timezone:string;phone:string;email:string;fssai:string;pickup:boolean;delivery:boolean;acceptingOrders:boolean};

export const BUSINESS_DEFAULTS:Business={
  name:'Mane & Oggarane',
  address:'Jigani APC Circle, Bannerghatta–Anekal Road, Jigani Industrial Area Phase 1, Ittina Nagar, Jigani, Anekal Taluk, Bengaluru, Karnataka 560105',
  hours:'Monday to Sunday, 9:00 AM – 10:00 PM',openingTime:'09:00',closingTime:'22:00',timezone:'Asia/Kolkata',
  phone:'',email:'explorexplorer02@gmail.com',fssai:'',pickup:true,delivery:true,acceptingOrders:true,
};

/** Delivery rules mirrored from the checkout database function (create_checkout_order). */
export const DELIVERY_RULES={feeRupees:40,freeAboveRupees:100};

const str=(v:unknown,f:string)=>typeof v==='string'&&v.trim()?v.trim():f;

export async function getBusiness():Promise<Business>{
  try{
    const {data}=await serviceDb().from('settings').select('value').eq('key','store').maybeSingle();
    const v=(data?.value||{}) as Record<string,unknown>;
    return {
      name:str(v.name,BUSINESS_DEFAULTS.name),address:str(v.address,BUSINESS_DEFAULTS.address),hours:str(v.hours,BUSINESS_DEFAULTS.hours),
      openingTime:str(v.opening_time,BUSINESS_DEFAULTS.openingTime),closingTime:str(v.closing_time,BUSINESS_DEFAULTS.closingTime),timezone:str(v.timezone,BUSINESS_DEFAULTS.timezone),
      phone:str(v.support_phone,''),email:str(v.support_email,''),fssai:str(v.fssai_number,''),
      pickup:v.pickup_enabled!==false,delivery:v.delivery_enabled!==false,acceptingOrders:v.open!==false,
    };
  }catch{return BUSINESS_DEFAULTS}
}

/** Delivery PIN codes from the live delivery_zones table. */
export async function getDeliveryPins():Promise<string[]>{
  try{const {data}=await serviceDb().from('delivery_zones').select('pin_code').eq('active',true).order('pin_code');return (data||[]).map(z=>String(z.pin_code))}
  catch{return []}
}

/** Is the kitchen inside its published hours right now (restaurant's own time zone)? */
export function isOpenNow(b:Business,now=new Date()){
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:b.timezone,hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(now);
  const h=Number(parts.find(p=>p.type==='hour')?.value),m=Number(parts.find(p=>p.type==='minute')?.value);
  const mins=h*60+m;const toMin=(t:string)=>{const [a,c]=t.split(':').map(Number);return a*60+(c||0)};
  return b.acceptingOrders&&mins>=toMin(b.openingTime)&&mins<toMin(b.closingTime);
}
