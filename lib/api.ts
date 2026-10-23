import {NextResponse} from 'next/server';
export const respond=(value:unknown,status=200)=>NextResponse.json(value,{status,headers:{'Cache-Control':'no-store'}});
export const fail=(message:string,status=400)=>respond({error:message},status);
export const clampInt=(n:unknown,min:number,max:number)=>{const x=Number(n);return Number.isInteger(x)&&x>=min&&x<=max?x:null};
export const text=(s:unknown,max=200)=>(typeof s==='string'?s.trim().slice(0,max):'');
export async function jsonBody(request:Request){try{return await request.json() as Record<string,unknown>}catch{return null}}
export const isUuid=(s:unknown)=>typeof s==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
