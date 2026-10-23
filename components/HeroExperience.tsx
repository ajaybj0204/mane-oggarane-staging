'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {useApp} from './AppProvider';

export default function HeroExperience(){
  const {menu}=useApp();
  const [imageFailed,setImageFailed]=useState(false);
  const dishes=menu.filter(d=>d.active&&d.image&&(d.stock_qty==null||d.stock_qty>0));
  const featured=dishes.find(d=>d.featured)||dishes[0];
  useEffect(()=>setImageFailed(false),[featured?.id]);
  return <section className="cafe-hero" aria-labelledby="cafe-hero-title">
    <div className="cafe-hero-grain" aria-hidden="true"/>
    <div className="container cafe-hero-grid">
      <div className="cafe-hero-content">
        <div className="cafe-hero-kicker"><span className="cafe-kicker-line"/> MADE WITH LOVE · KARNATAKA <span>✳</span></div>
        <p className="cafe-hero-supertitle" lang="kn">ಮನೆಯ ಸವಿಯ ನೆನಪು</p>
        <h1 id="cafe-hero-title"><span lang="kn">ಮನೆಯ ಘಮ,</span><br/><em lang="kn">ಪ್ರೀತಿಯ ರುಚಿ.</em></h1>
        <p className="cafe-hero-description">Comfort food that feels like coming home. Freshly made Karnataka favorites, thoughtful little details, and the joy of sharing a good meal.</p>
        <div className="cafe-hero-actions">
          <Link className="cafe-pill cafe-pill-bright" href="/menu">Explore our menu <span aria-hidden="true">↗</span></Link>
          <Link className="cafe-pill cafe-pill-outline" href="/story">Our little story <span aria-hidden="true">→</span></Link>
        </div>
        <div className="cafe-hero-footnote"><span className="cafe-footnote-mark">✦</span><span lang="kn">ಒಂದು ತುತ್ತು, ಸಾವಿರ ನೆನಪುಗಳು.</span><span className="cafe-footnote-rule"/></div>
      </div>
      <div className="cafe-hero-art">
        <div className="cafe-hero-orbit cafe-orbit-one" aria-hidden="true"/>
        <div className="cafe-hero-orbit cafe-orbit-two" aria-hidden="true"/>
        <div className="cafe-hero-spice cafe-spice-one" aria-hidden="true">✺</div>
        <div className="cafe-hero-spice cafe-spice-two" aria-hidden="true">✳</div>
        <div className="cafe-hero-photo">
          {featured?.image&&!imageFailed?
            <img src={featured.image} alt={featured.name+' freshly prepared at Mane & Oggarane'} fetchPriority="high" referrerPolicy="no-referrer" onError={()=>setImageFailed(true)}/>:
            <div className="cafe-hero-photo-fallback" aria-label="Mane & Oggarane kitchen"><span>✳</span><strong lang="kn">ಮನೆಯ ರುಚಿ</strong></div>}
          <div className="cafe-hero-photo-shade"/>
          <span className="cafe-hero-photo-label">FROM THE KITCHEN <span>✦</span> FRESH EVERY DAY</span>
        </div>
        <div className="cafe-steam cafe-steam-a" aria-hidden="true"/>
        <div className="cafe-steam cafe-steam-b" aria-hidden="true"/>
      </div>
    </div>
    <a className="cafe-scroll-nudge" href="#kitchens">SCROLL TO EXPLORE <span>↓</span></a>
  </section>;
}