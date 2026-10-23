'use client';
import Link from 'next/link';
import {useApp} from './AppProvider';
import type {Category} from '../lib/types';
import FlavorBackdrop from './ambient/FlavorBackdrop';

const galleries:[Category,string,string,string,string][]=[
  ['veg','ಸಸ್ಯಾಹಾರದ ಸವಿ','Vegetarian delights','Dosas, idli & everyday comforts','01'],
  ['nonveg','ಮಸಾಲೆಯ ಮ್ಯಾಜಿಕ್','Non-veg favorites','Rich curries, biryani & more','02'],
  ['combos','ಒಟ್ಟಿಗೆ ಊಟ','Meals to share','Something special for everyone','03'],
  ['cafe','ಕಾಫಿ ಸಮಯ','Café & little bites','Kaapi, chaats & cozy breaks','04']
];

export default function CategoryGallery(){
  const {menu}=useApp();
  return <section className="cafe-categories section flavor-section" id="kitchens"><FlavorBackdrop variant="mixed"/>
    <div className="container">
      <div className="cafe-section-top"><div><p className="cafe-overline">EXPLORE THE FLAVORS</p><h2>There’s love in <em>every craving.</em></h2></div><p>From an everyday breakfast to a family feast, find your kind of comfort.</p></div>
      <div className="cafe-category-grid">
        {galleries.map(([id,kn,en,desc,no])=>{
          const photo=menu.find(d=>d.category===id&&d.image&&d.active)?.image;
          return <Link className={'cafe-category-card cafe-category-'+id} key={id} href={'/menu?category='+id}>
            {photo?<img loading="lazy" src={photo} alt="" referrerPolicy="no-referrer"/>:<div className="cafe-category-fallback" aria-hidden="true">✳</div>}
            <span className="cafe-category-mask"/>
            <span className="cafe-category-index">{no} / 04</span>
            <span className="cafe-category-copy"><small lang="kn">{kn}</small><strong>{en}</strong><span>{desc}</span><span className="cafe-category-explore">Explore kitchen <b>↗</b></span></span>
          </Link>;
        })}
      </div>
    </div>
  </section>;
}