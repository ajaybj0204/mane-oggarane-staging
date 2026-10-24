'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {useApp} from './AppProvider';
import DishImage from './DishImage';
import {rupees} from '../lib/types';
export default function KitchenHighlights(){
 const {menu,foodPreference}=useApp();
 const dishes=menu.filter(d=>d.active&&(d.stock_qty===null||d.stock_qty===undefined||d.stock_qty>0)&&(foodPreference==='both'||d.veg===(foodPreference==='veg')));
 const picks=(dishes.filter(d=>d.featured).length?dishes.filter(d=>d.featured):dishes).slice(0,4);
 const [index,setIndex]=useState(0);
 const current=picks[index%Math.max(picks.length,1)];
 useEffect(()=>{if(!picks.length)return;const media=window.matchMedia('(prefers-reduced-motion: reduce)');if(media.matches)return;const id=window.setInterval(()=>setIndex(v=>(v+1)%picks.length),6500);return()=>window.clearInterval(id)},[picks.length,foodPreference]);
 if(!current)return null;
 return <section className="kitchen-highlights container" aria-label="Featured dishes"><div className="kitchen-highlights-copy"><p className="cafe-overline">HIGHLIGHTS FROM OUR KITCHEN</p><h2>{current.name}</h2><p>{current.description||'Freshly prepared, with the warmth of home.'}</p><strong>{rupees(current.price)}</strong><Link href="/menu" className="cafe-pill cafe-pill-bright">Explore this dish →</Link><div className="kitchen-highlight-controls"><button aria-label="Previous highlight" type="button" onClick={()=>setIndex(v=>(v+picks.length-1)%picks.length)}>←</button>{picks.map((dish,i)=><button type="button" key={dish.id} aria-label={'Show '+dish.name} aria-pressed={index%picks.length===i} onClick={()=>setIndex(i)}>{index%picks.length===i?'●':'○'}</button>)}<button aria-label="Next highlight" type="button" onClick={()=>setIndex(v=>(v+1)%picks.length)}>→</button></div></div><div className="kitchen-highlights-image"><DishImage url={current.image} name={current.name}/></div></section>
}
