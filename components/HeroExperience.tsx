import Link from 'next/link';
const art='/mane-oggarane-logo.png';
export default function HeroExperience(){
 return <section className="mno-home-hero" aria-labelledby="mno-home-heading">
  <div className="container mno-home-hero-grid">
   <div className="mno-home-hero-copy">
    <p className="mno-home-hero-kicker">✦ &nbsp; MADE WITH LOVE · KARNATAKA</p>
    <h1 id="mno-home-heading" lang="kn"><span>ಮನೆಯ ಊಟ,</span><strong>ಪ್ರೀತಿಯ ರುಚಿ.</strong></h1>
    <p className="mno-home-hero-description">Comfort food that feels like coming home. Freshly made Karnataka favourites, thoughtful little details, and the joy of sharing a good meal.</p>
    <div className="mno-home-hero-buttons"><Link href="/menu" className="cafe-pill cafe-pill-bright">Explore our menu <span aria-hidden="true">→</span></Link><Link href="/story" className="cafe-pill cafe-pill-outline">Our little story <span aria-hidden="true">→</span></Link></div>
    <p className="mno-home-hero-foot" lang="kn">✦ &nbsp; ಒಂದು ತುತ್ತು, ಸಾವಿರ ನೆನಪುಗಳು.</p>
   </div>
   <div className="mno-home-hero-visual"><img src={art} width={1448} height={1086} alt="Mane and Oggarane restaurant logo" fetchPriority="high"/><div className="mno-home-hero-visual-caption">FROM OUR KITCHEN ✦ TO YOUR TABLE</div></div>
  </div>
 </section>
}
