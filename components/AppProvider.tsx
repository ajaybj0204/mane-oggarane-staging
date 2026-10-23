'use client';
import React,{createContext,useContext,useEffect,useMemo,useState} from 'react';
import type {Dish,CartLine} from '../lib/types';
import {seedMenu} from '../lib/menu';
import {browserDb,publicConfigured} from '../lib/supabase';
type AppContext={menu:Dish[];cart:CartLine[];cartCount:number;mode:'loading'|'connected'|'preview'|'error';add:(id:string)=>void;changeQty:(id:string,q:number)=>void;clear:()=>void;reload:()=>Promise<void>;userId:string|null;role:string|null;authReady:boolean};
const Context=createContext<AppContext|null>(null);const KEY='mane-oggarane-basket-v2';
export function AppProvider({children}:{children:React.ReactNode}){
 const[menu,setMenu]=useState<Dish[]>([]);const[cart,setCart]=useState<CartLine[]>([]);const[mode,setMode]=useState<AppContext['mode']>('loading');const[userId,setUserId]=useState<string|null>(null);const[role,setRole]=useState<string|null>(null);const[authReady,setAuthReady]=useState(false);
 useEffect(()=>{try{const raw=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(raw))setCart(raw.filter((x)=>x&&typeof x.id==='string'&&Number.isInteger(x.quantity)&&x.quantity>0).slice(0,30))}catch{}},[]);
 useEffect(()=>{localStorage.setItem(KEY,JSON.stringify(cart))},[cart]);
 async function reload(){if(!publicConfigured()){setMenu(seedMenu);setMode('preview');return}try{const r=await fetch('/api/menu',{cache:'no-store'});if(!r.ok)throw new Error();const x=await r.json();setMenu(Array.isArray(x.products)?x.products:[]);setMode('connected')}catch{setMode('error');setMenu([])}}
 useEffect(()=>{void reload();if(!publicConfigured()){setAuthReady(true);return;}const db=browserDb();let alive=true;let seq=0;
 async function updateRole(user:string|null){const current=++seq;if(alive){setUserId(user);setRole(null);setAuthReady(!user);}if(!user)return;
 try{const {data:{session}}=await db.auth.getSession();if(!session?.access_token||session.user.id!==user)return;
 const r=await fetch('/api/me',{headers:{Authorization:`Bearer ${session.access_token}`},cache:'no-store'});if(!r.ok)return;
 const x=await r.json();if(alive&&current===seq)setRole(typeof x.profile?.role==='string'?x.profile.role:null);
 }catch{}finally{if(alive&&current===seq)setAuthReady(true)}}
 void db.auth.getUser().then(({data})=>updateRole(data.user?.id||null)).catch(()=>updateRole(null));
 const{data:{subscription}}=db.auth.onAuthStateChange((_event,session)=>{void updateRole(session?.user?.id||null)});
 return()=>{alive=false;seq++;subscription.unsubscribe()};},[]);
 const add=(id:string)=>setCart(old=>old.some(x=>x.id===id)?old.map(x=>x.id===id?{...x,quantity:Math.min(20,x.quantity+1)}:x):[...old,{id,quantity:1}]);
 const changeQty=(id:string,q:number)=>setCart(old=>q<=0?old.filter(x=>x.id!==id):old.map(x=>x.id===id?{...x,quantity:Math.min(20,q)}:x));
 const clear=()=>setCart([]);const cartCount=useMemo(()=>cart.reduce((n,i)=>n+i.quantity,0),[cart]);
 return <Context.Provider value={{menu,cart,cartCount,mode,add,changeQty,clear,reload,userId,role,authReady}}>{children}</Context.Provider>
}
export const useApp=()=>{const x=useContext(Context);if(!x)throw new Error('AppProvider required');return x};
