'use client';
import Link from 'next/link';
import {useApp} from './AppProvider';
import DishImage from './DishImage';
import {rupees} from '../lib/types';

export default function HomeSpecials(){
  const {menu,add}=useApp();
  const available=menu.filter(d=>d.active&&(d.stock_qty==null||d.stock_qty>0));
  const featured=available.filter(d=>d.featured).slice(0,3);
  const items=featured.length?featured:available.slice(0,3);
  return <section className="section cafe-specials" id="signature-dishes"><div className="container">
    <div className="cafe-section-top"><div><p className="cafe-overline">A LITTLE SOMETHING DELICIOUS</p><h2>From our kitchen, <em>with love.</em></h2></div><Link href="/menu" className="cafe-text-link">View the whole menu <span>↗</span></Link></div>
    <div className="cafe-specials-grid">{items.length?items.map((d,i)=><article className="cafe-special-card" key={d.id}>
      <div className="cafe-special-image"><DishImage url={d.image} name={d.name}/><span className="cafe-special-index">0{i+1} · KITCHEN FAVORITE</span></div>
      <div className="cafe-special-info"><div><p className="cafe-special-kind">{d.veg?'VEGETARIAN':'KITCHEN SPECIAL'}</p><h3>{d.name}</h3><p>{d.description||'A little comfort, freshly prepared for you.'}</p></div><div className="cafe-special-bottom"><strong>{rupees(d.price)}</strong><button type="button" onClick={()=>add(d.id)} aria-label={'Add '+d.name+' to basket'}>Add to basket <span aria-hidden="true">+</span></button></div></div>
    </article>):<div className="cafe-special-empty">The kitchen is setting the table. <Link href="/menu">Browse the menu →</Link></div>}</div>
  </div></section>;
}