'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {useSearchParams,useRouter} from 'next/navigation';
import {bearerFetch} from '../lib/supabase';
import {useApp} from './AppProvider';
import DishImage from './DishImage';
import FoodPreferenceSelector from './FoodPreferenceSelector';
import {categoryNames,rupees,type Category} from '../lib/types';

const categories:[string,string][]=[['all','All dishes'],['veg','Vegetarian'],['nonveg','Non-Veg'],['combos','Family combos'],['cafe','Café & Chaats'],['under150','Under ₹150']];

export default function MenuExperience(){
 const params=useSearchParams();const router=useRouter();
 const first=params.get('category');const focusedDish=params.get('dish');
 const[category,setCategory]=useState<string>(categories.some(([k])=>k===first)?first!:'all');
 const[query,setQuery]=useState('');const[saveNotice,setSaveNotice]=useState('');const[drawerOpen,setDrawerOpen]=useState(false);
 const{menu,cart,add,changeQty,clear,mode,foodPreference,userId}=useApp();
 const visible=useMemo(()=>menu.filter(d=>d.active&&(d.stock_qty===null||d.stock_qty===undefined||d.stock_qty>0)&&(focusedDish?d.id===focusedDish:(category==='all'||(category==='under150'?d.price<150:d.category===category)))&&(foodPreference==='both'||d.veg===(foodPreference==='veg'))&&(d.name.toLowerCase().includes(query.trim().toLowerCase())||d.description?.toLowerCase().includes(query.trim().toLowerCase())||d.category.toLowerCase().includes(query.trim().toLowerCase()))),[menu,category,query,foodPreference,focusedDish]);
 // The header basket link points to /menu#cart; on small screens that opens the basket drawer.
 useEffect(()=>{const sync=()=>{if(window.location.hash==='#cart'&&window.matchMedia('(max-width: 1099px)').matches)setDrawerOpen(true)};sync();window.addEventListener('hashchange',sync);return()=>window.removeEventListener('hashchange',sync)},[]);
 useEffect(()=>{if(!drawerOpen)return;const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')setDrawerOpen(false)};document.addEventListener('keydown',onKey);document.body.classList.add('mo-drawer-lock');return()=>{document.removeEventListener('keydown',onKey);document.body.classList.remove('mo-drawer-lock')}},[drawerOpen]);
 async function saveDish(id:string){setSaveNotice('');try{const r=await bearerFetch('/api/me/saved',{method:'POST',body:JSON.stringify({product_id:id})});const x=await r.json();if(!r.ok)throw Error(x.error||'Could not save dish');setSaveNotice('Dish saved to your account collection.')}catch(e){setSaveNotice(e instanceof Error?e.message:'Could not save dish')}}
 const lines=cart.map(line=>({line,dish:menu.find(d=>d.id===line.id)})).filter(x=>x.dish);
 const subtotal=lines.reduce((s,x)=>s+(x.dish?.price||0)*x.line.quantity,0);
 const itemCount=lines.reduce((n,x)=>n+x.line.quantity,0);
 const qtyOf=(id:string)=>cart.find(x=>x.id===id)?.quantity||0;
 const checkoutHref=lines.length?(userId?'/checkout':'/login?next=%2Fcheckout'):'/menu#cart';
 return <main className="mo-menu-page">
  <div className="mo-menu-backdrop" aria-hidden="true"/>
  <img className="mo-menu-decor mo-menu-pot" src="/theme/decor-menu-pot.webp" alt="" aria-hidden="true" width={148} height={363}/>
  <img className="mo-menu-decor mo-menu-brass" src="/theme/decor-brass.webp" alt="" aria-hidden="true" width={413} height={163}/>
  <img className="mo-menu-decor mo-menu-mortar" src="/theme/decor-mortar.webp" alt="" aria-hidden="true" width={413} height={421} loading="lazy"/>
  <div className="mo-shell mo-menu-layout">
   <div className="mo-menu-main">
    <header className="mo-menu-hero">
     <p className="mo-kicker"><span className="mo-kicker-rule" aria-hidden="true"/><span className="mo-kicker-underline">OUR KITCHEN</span> · <span lang="kn">ಮನೆ ಊಟದ ಸವಿಗಳು</span> <span className="mo-kicker-star" aria-hidden="true">✳</span></p>
     <h1>Food with the <em>warmth of home.</em></h1>
     <p className="mo-menu-intro">Explore our four culinary worlds. Prices are confirmed by the server before you pay.</p>
     <FoodPreferenceSelector/>
    </header>
    <div className="mo-menu-board">
     <div className="menu-filters mo-filters" role="group" aria-label="Menu categories">{categories.map(([k,t])=><button type="button" key={k} aria-pressed={!focusedDish&&category===k} className={'chip '+(!focusedDish&&category===k?'selected':'')} onClick={()=>{setCategory(k);if(focusedDish)router.replace('/menu?category='+k,{scroll:false})}}>{t}</button>)}</div>
     <label className="mo-search"><span>Find your favorite</span>
      <span className="mo-search-field"><svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2"/><path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg><input type="search" placeholder="Search dosa, biryani, kaapi…" value={query} onChange={e=>setQuery(e.target.value)}/></span>
     </label>
     {saveNotice&&<p role="status" className="mo-notice">{saveNotice}</p>}
     {focusedDish&&<p className="mo-notice">Showing one dish. <button type="button" className="mo-link-button" onClick={()=>router.replace('/menu',{scroll:false})}>Show the full menu</button></p>}
     <div aria-live="polite">
     {mode==='error'?<p className="mo-empty">Our kitchen menu is temporarily unavailable. Please refresh in a little while.</p>:visible.length?<div className="mo-dish-grid">{visible.map(d=>{const q=qtyOf(d.id);const low=typeof d.stock_qty==='number'&&d.stock_qty<=5;return <article className="mo-dish-card" key={d.id}>
       <div className="mo-dish-photo"><DishImage url={d.image} name={d.name}/>
        {userId?<button type="button" className="mo-save" onClick={()=>void saveDish(d.id)} aria-label={'Save '+d.name+' to your collection'}><Heart/></button>:<Link className="mo-save" href="/login" aria-label={'Sign in to save '+d.name}><Heart/></Link>}
        {low&&<span className="mo-stock-badge">Only {d.stock_qty} left</span>}
       </div>
       <div className="mo-dish-info">
        <p className="mo-dish-meta">{categoryNames[d.category as Category]} <span className={'mo-diet-dot mo-diet-'+(d.veg?'veg':'nonveg')} aria-hidden="true"/> {d.veg?'Veg':'Non-Veg'}</p>
        <h3>{d.name}</h3>
        <p className="mo-dish-desc">{d.description||'Prepared with care and rich, homely flavors.'}</p>
        <div className="mo-dish-foot"><strong>{rupees(d.price)}</strong>
         {q>0?<div className="mo-stepper" role="group" aria-label={d.name+' quantity'}><button type="button" aria-label={'Remove one '+d.name} onClick={()=>changeQty(d.id,q-1)}>−</button><b aria-live="polite">{q}</b><button type="button" aria-label={'Add one more '+d.name} onClick={()=>changeQty(d.id,q+1)} disabled={q>=20||(typeof d.stock_qty==='number'&&q>=d.stock_qty)}>+</button></div>
         :<button type="button" className="mo-add" onClick={()=>add(d.id)} aria-label={'Add '+d.name+' to basket'} disabled={d.stock_qty!==null&&d.stock_qty!==undefined&&d.stock_qty<1}>+ Add</button>}
        </div>
       </div>
      </article>})}</div>:<div className="mo-empty">{mode==='loading'?<p>Fetching the fresh menu…</p>:<><p>No dishes match your search.</p><button type="button" className="mo-link-button" onClick={()=>{setQuery('');setCategory('all')}}>Clear search and filters</button></>}</div>}
     </div>
    </div>
   </div>
   <aside className={'mo-basket '+(drawerOpen?'is-open':'')} id="cart" aria-label="Your leaf basket">
    <div className="mo-basket-head"><h2>Your leaf basket</h2>
     <div><button type="button" className="mo-link-button" onClick={clear} disabled={!lines.length}>Clear</button><button type="button" className="mo-basket-close" onClick={()=>setDrawerOpen(false)} aria-label="Close basket">×</button></div>
    </div>
    {lines.length?<ul className="mo-basket-lines">{lines.map(({line,dish})=><li key={line.id}>
      <div className="mo-basket-thumb"><DishImage url={dish?.image} name={dish?.name||''}/></div>
      <div className="mo-basket-name"><strong>{dish?.name}</strong><small>{rupees((dish?.price||0)*line.quantity)}</small><button type="button" className="mo-link-button" onClick={()=>changeQty(line.id,0)} aria-label={'Remove '+dish?.name}>Remove</button></div>
      <div className="mo-stepper mo-stepper-light"><button type="button" aria-label={'Remove one '+dish?.name} onClick={()=>changeQty(line.id,line.quantity-1)}>−</button><b>{line.quantity}</b><button type="button" aria-label={'Add one '+dish?.name} onClick={()=>changeQty(line.id,line.quantity+1)} disabled={line.quantity>=20}>+</button></div>
     </li>)}</ul>
    :<div className="mo-basket-empty"><img src="/theme/basket-empty.webp" alt="" aria-hidden="true" width={138} height={102}/><p>Your basket is empty. Add something delicious!</p></div>}
    <div className="mo-basket-total"><span>Subtotal</span><strong>{rupees(subtotal)}</strong></div>
    <Link className={'mo-checkout '+(!lines.length?'is-disabled':'')} aria-disabled={!lines.length} href={checkoutHref} onClick={e=>{if(!lines.length)e.preventDefault()}}>{userId||!lines.length?'Continue to checkout':'Sign in to checkout'} <span aria-hidden="true">→</span></Link>
    <p className="mo-fineprint">Final delivery fees, discounts, and taxes are recalculated securely at checkout.</p>
   </aside>
   {drawerOpen&&<button type="button" className="mo-scrim" aria-label="Close basket" onClick={()=>setDrawerOpen(false)}/>}
  </div>
  {itemCount>0&&!drawerOpen&&<div className="mo-cartbar" role="region" aria-label="Basket summary">
   <button type="button" onClick={()=>setDrawerOpen(true)} aria-label={'View basket, '+itemCount+' items'}><span className="mo-basket-count">{itemCount}</span><span>{itemCount===1?'item':'items'} · <b>{rupees(subtotal)}</b></span></button>
   <Link href={checkoutHref}>{userId?'Checkout':'Sign in to checkout'} <span aria-hidden="true">→</span></Link>
  </div>}
 </main>;
}
function Heart(){return <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.5-9.3C1 7.6 3.4 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.6.7-1.4 2.2-2.6 4.3-2.6 3.3 0 5.7 3.1 4.2 6.7-2 4.7-9.5 9.3-9.5 9.3Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>}
