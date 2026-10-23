import {createClient,type User} from '@supabase/supabase-js';

const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
let browserClient:ReturnType<typeof createClient>|undefined;
export function browserDb(){
 if(!url||!publishableKey)throw new Error('Supabase is not configured. See README.md');
 if(!browserClient) browserClient=createClient(url,publishableKey,{auth:{persistSession:true,autoRefreshToken:true}});
 return browserClient;
}
export function serviceDb(){
 if(!url||!process.env.SUPABASE_SERVICE_ROLE_KEY)throw new Error('Missing server Supabase configuration');
 return createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
}
export async function userFromRequest(request:Request):Promise<User|null>{
 const match=/^Bearer\s+(.+)$/i.exec(request.headers.get('authorization')||'');
 if(!match)return null;
 const {data,error}=await serviceDb().auth.getUser(match[1]);
 return error?null:data.user;
}
export async function staffFromRequest(request:Request,allowed:string[]=['owner','manager']):Promise<{id:string;role:string}|null>{
 const user=await userFromRequest(request);if(!user)return null;
 const {data,error}=await serviceDb().from('profiles').select('id,role').eq('id',user.id).single();
 if(error||!data||!allowed.includes(data.role))return null;
 return {id:user.id,role:data.role};
}
export async function bearerFetch(path:string,options:RequestInit={}){
 const {data:{session}}=await browserDb().auth.getSession();
 const headers=new Headers(options.headers||{});
 if(session?.access_token)headers.set('Authorization',`Bearer ${session.access_token}`);
 if(options.body&&!headers.has('Content-Type')&&!(options.body instanceof FormData))headers.set('Content-Type','application/json');
 return fetch(path,{...options,headers,cache:'no-store'});
}
export function publicConfigured(){return Boolean(url&&publishableKey)}
