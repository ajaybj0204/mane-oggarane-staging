import Link from 'next/link';
import HeroExperience from '../components/HeroExperience';
import CategoryGallery from '../components/CategoryGallery';
import HomeSpecials from '../components/HomeSpecials';
import PreparationJourney from '../components/PreparationJourney';
import FlavorBackdrop from '../components/ambient/FlavorBackdrop';
import PrelaunchVisitInfo from '../components/PrelaunchVisitInfo';

export default function Home(){
 const prelaunch=process.env.NEXT_PUBLIC_SITE_PHASE==='prelaunch';
 return <main className="cafe-main">
   <HeroExperience/>
   <div className="cafe-love-strip" aria-label="Our kitchen philosophy"><div className="container"><span>✳ <span lang="kn">ಮನೆಯ ಊಟ</span></span><span>MADE WITH LOVE</span><span>✳ FRESHLY PREPARED</span><span lang="kn">ಒಂದು ತುತ್ತು, ಸಾವಿರ ನೆನಪುಗಳು.</span></div></div>
   <PrelaunchVisitInfo/>
   <CategoryGallery/>
   <section className="cafe-manifesto" aria-labelledby="cafe-manifesto-title"><div className="container cafe-manifesto-grid">
     <div className="cafe-manifesto-seal" aria-hidden="true"><span>✺</span><i>MADE WITH LOVE</i><strong lang="kn">ಮನೆಯಲ್ಲಿ ಮಾಡಿದಂತೆ</strong></div>
     <div><p className="cafe-overline">A TABLE FULL OF STORIES</p><h2 id="cafe-manifesto-title">Some things simply <em>taste like home.</em></h2><p>The first sizzle of oggarane. A plate shared across the table. A familiar flavor that brings everyone a little closer. That feeling is what Mane & Oggarane is all about.</p><Link href="/story" className="cafe-text-link">Get to know our kitchen <span>↗</span></Link></div>
   </div></section>
   <HomeSpecials/>
   <PreparationJourney/>
   {!prelaunch&&<section className="cafe-family-section" aria-labelledby="cafe-family-title"><div className="container cafe-family-grid">
     <div><p className="cafe-overline">THE MANE FAMILY</p><h2 id="cafe-family-title">Good food. <em>Good memories.</em> Little rewards.</h2><p lang="kn" className="cafe-family-kannada">ಮತ್ತೆ ಮತ್ತೆ ಬನ್ನಿ, ನಮ್ಮ ಮನೆಯ ರುಚಿ ಸವಿಯಿರಿ.</p><p>Earn points on eligible fulfilled orders and exchange them for personal discounts. Because coming back should feel special.</p><Link href="/rewards" className="cafe-pill cafe-pill-bright">Explore family rewards <span>↗</span></Link></div>
     <div className="cafe-family-stamp" aria-hidden="true"><span>✳</span><strong>MADE FOR<br/>THE MANE<br/>FAMILY</strong><small lang="kn">ಪ್ರೀತಿಯ ಆತಿಥ್ಯ</small></div>
   </div></section>}
   <section className="cafe-final-cta flavor-section"><FlavorBackdrop variant="spice"/><div className="container"><span className="cafe-overline">{prelaunch?'EXPLORE THE MENU · OPENING SOON':'YOUR NEXT FAVORITE IS WAITING'}</span><h2>{prelaunch?<>Our kitchen is <em>getting ready.</em></>:<>Something delicious is <em>just a click away.</em></>}</h2><div><Link className="cafe-pill cafe-pill-bright" href="/menu">{prelaunch?'Explore the menu →':'Order something lovely ↗'}</Link>{!prelaunch&&<Link className="cafe-text-link" href="/orders">Track an order →</Link>}</div></div></section>
 </main>;
}