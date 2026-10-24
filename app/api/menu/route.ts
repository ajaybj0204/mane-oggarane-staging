import {approvedPrelaunchMenu} from '../../../lib/approved-prelaunch-menu';
import {serviceDb} from '../../../lib/supabase';import {respond,fail} from '../../../lib/api';
export const dynamic='force-dynamic';
export async function GET(){if(process.env.MNO_SITE_PHASE==='prelaunch'&&process.env.NEXT_PUBLIC_SITE_PHASE==='prelaunch')return respond({products:approvedPrelaunchMenu});try{const {data,error}=await serviceDb().from('products').select('id,name,description,price,category,image,active,veg,featured,stock_qty').eq('active',true).order('sort_order',{ascending:true}).order('name');if(error)throw error;return respond({products:data})}catch{return fail('Menu is temporarily unavailable. Confirm your database setup.',503)}}
