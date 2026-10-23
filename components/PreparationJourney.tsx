'use client';
import Link from 'next/link';
import {useApp} from './AppProvider';
import FlavorBackdrop from './ambient/FlavorBackdrop';

const stories=[
  {category:'veg',no:'01',kn:'ಬಿಸಿಬಿಸಿ ತವಾದ ಮೇಲೆ ರುಚಿಯ ಆರಂಭ',en:'The joy of a fresh start',desc:'A comforting breakfast, a familiar aroma, and a little happiness on the plate.'},
  {category:'nonveg',no:'02',kn:'ಒಗ್ಗರಣೆಯ ಘಮದಲ್ಲಿ ಮನೆಯ ನೆನಪು',en:'A little spice, a lot of heart',desc:'Rich flavors, patient cooking and a tradition of sharing good food.'},
  {category:'cafe',no:'03',kn:'ಪ್ರತಿ ತುತ್ತಿನಲ್ಲೂ ಮನೆಯ ಮಮತೆ',en:'The perfect little pause',desc:'Filter kaapi, something to nibble, and a moment worth savoring.'}
] as const;

export default function PreparationJourney(){
 const {menu}=useApp();
 return <section className="preparing-story cafe-preparation flavor-section" id="preparation"><FlavorBackdrop variant="veg"/><div className="container">
   <div className="cafe-section-top"><div><p className="cafe-overline">STORIES FROM OUR KITCHEN</p><h2 lang="kn">ಅಡುಗೆ ಎಂದರೆ ಪ್ರೀತಿಯ ಅಭಿವ್ಯಕ್ತಿ.</h2></div><p>Every plate has a little story. Follow the familiar flavors that inspire our kitchen.</p></div>
   <div className="preparing-steps cafe-preparing-steps">{stories.map(s=>{
     const photo=menu.find(d=>d.category===s.category&&d.image&&d.active)?.image;
     return <Link href={'/menu?category='+s.category} key={s.no} className="preparing-step cafe-preparing-step">
       <div className="cafe-preparing-image">{photo?<img loading="lazy" src={photo} alt="" referrerPolicy="no-referrer"/>:<span aria-hidden="true">✳</span>}<small>STORY {s.no}</small></div>
       <div className="preparing-detail"><span className="cafe-story-number">{s.no} / 03</span><strong lang="kn">{s.kn}</strong><h3>{s.en}</h3><p>{s.desc}</p><span className="cafe-story-arrow">Discover dishes ↗</span></div>
     </Link>;
   })}</div>
 </div></section>;
}