'use client';
import Link from 'next/link';
import {useApp} from './AppProvider';
import type {Category,Dish} from '../lib/types';

type Story={dishId:string;category:Category;kannada:string;title:string;text:string};
// Photos come from the live menu (by dish id, then category) so the homepage never shows a dish we don't sell.
const stories:Story[]=[
  {dishId:'v3',category:'veg',kannada:'ಬೆಳಗಿನ ತಾಜಾ ತಿಂಡಿಯ ಸಂತಸ',title:'The joy of a fresh start',text:'A comforting breakfast, a familiar aroma, and a little happiness on the plate.'},
  {dishId:'nv4',category:'nonveg',kannada:'ಸ್ವಲ್ಪ ಖಾರ, ತುಂಬಾ ಪ್ರೀತಿ',title:'A little spice, a lot of heart',text:'Rich flavours, patient cooking and a tradition of sharing good food.'},
  {dishId:'s1',category:'cafe',kannada:'ಪ್ರತಿ ಗುಟುಕಿನಲ್ಲೂ ಮನೆಯ ಮಮತೆ',title:'The perfect little pause',text:'Filter kaapi, something to nibble, and a moment worth savouring.'},
];
function pick(menu:Dish[],s:Story){const usable=menu.filter(d=>d.active&&d.image);return usable.find(d=>d.id===s.dishId)||usable.find(d=>d.category===s.category)}

export default function KitchenStories(){
  const {menu}=useApp();
  return <section className="mo-stories mo-parchment" aria-labelledby="mo-stories-title">
    <img className="mo-sprig mo-sprig-left" src="/theme/decor-leaf-parchment-left.webp" alt="" aria-hidden="true" width={140} height={148} loading="lazy"/>
    <img className="mo-sprig mo-sprig-right" src="/theme/decor-leaf-parchment-right.webp" alt="" aria-hidden="true" width={126} height={124} loading="lazy"/>
    <div className="mo-shell">
      <div className="mo-stories-head">
        <div>
          <p className="mo-kicker mo-kicker-dark"><span className="mo-kicker-rule" aria-hidden="true"/>STORIES FROM OUR KITCHEN</p>
          <h2 id="mo-stories-title" lang="kn"><span className="mo-star" aria-hidden="true">✳</span> ಅಡಿಗೆ ಎಂದರೆ ಪ್ರೀತಿಯ ಅಭಿವ್ಯಕ್ತಿ.</h2>
        </div>
        <p><span className="mo-star" aria-hidden="true">✳</span> Every plate has a little story. Follow the familiar flavours that inspire our kitchen.</p>
      </div>
      <div className="mo-story-grid">
        {stories.map((s,i)=>{const dish=pick(menu,s);return <article className="mo-story-card" key={s.title}>
          {dish?.image&&<img className="mo-story-photo" src={dish.image} alt={dish.name} loading="lazy" referrerPolicy="no-referrer"/>}
          <div className="mo-story-body">
            <p className="mo-story-count">0{i+1} <span>/</span> 03</p>
            <p className="mo-story-kn" lang="kn">{s.kannada}</p>
            <h3>{s.title}</h3>
            <p className="mo-story-text">{s.text}</p>
            <Link className="mo-story-link" href={'/menu?category='+s.category}>Discover dishes <span aria-hidden="true">→</span></Link>
          </div>
        </article>})}
      </div>
    </div>
  </section>;
}
