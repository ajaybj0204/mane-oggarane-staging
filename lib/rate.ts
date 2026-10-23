import {createHash} from 'node:crypto';import {serviceDb} from './supabase';
export async function withinRate(req:Request,scope:'checkout'|'booking'|'reward'|'media',max:number,seconds:number,subject?:string){
 const forwarded=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'';
 const ip=forwarded||req.headers.get('x-real-ip')||'unknown';
 const key=createHash('sha256').update([scope,subject||'',ip,process.env.RATE_LIMIT_SALT||'mno-dev'].join('|')).digest('hex');
 const {data,error}=await serviceDb().rpc('take_rate_limit',{p_scope:scope,p_subject_hash:key,p_window_seconds:seconds,p_max:max});
 if(error)throw error;return data===true;
}
