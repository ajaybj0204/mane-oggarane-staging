'use client';
import Link from 'next/link';

export default function HeroExperience(){
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
        <div className="cafe-hero-photo cafe-hero-branded-art" role="img" aria-label="Mane and Oggarane restaurant logo, home-style Karnataka cooking and the slogan From our kitchen to your table">
          <div className="hero-brand-scene" aria-hidden="true">
            <span className="hero-brand-leaf hero-leaf-left">❧</span>
            <span className="hero-brand-leaf hero-leaf-right">❧</span>
            <div className="hero-brand-light"/>
            <div className="hero-brand-logo-ring"><img src="/mane-oggarane-logo.png" alt=""/></div>
            <p className="hero-brand-tagline" lang="kn">ಮನೆಯ ಘಮ, ಪ್ರೀತಿಯ ರುಚಿ.</p>
            <div className="hero-brand-divider"><span>✦</span></div>
            <p className="hero-brand-english">FROM OUR KITCHEN<br/>TO YOUR TABLE</p>
            <div className="hero-brand-spice">✺ &nbsp; ✳ &nbsp; ✺</div>
          </div>
        </div>
        <div className="cafe-steam cafe-steam-a" aria-hidden="true"/>
        <div className="cafe-steam cafe-steam-b" aria-hidden="true"/>
      </div>
    </div>
    <a className="cafe-scroll-nudge" href="#kitchens">SCROLL TO EXPLORE <span>↓</span></a>
  </section>;
}