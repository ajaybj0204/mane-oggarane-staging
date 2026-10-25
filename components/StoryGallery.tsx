'use client';
import {useState} from 'react';
import {useApp} from './AppProvider';
import Link from 'next/link';
const slides=[
 {topic:'Dosa & the hot tawa',k:'ದೋಸೆ ಮತ್ತು ಬಿಸಿ ತವಾ',match:'dosa'},
 {topic:'Rice, lentils & one-pot comfort',k:'ಅಕ್ಕಿ, ಬೇಳೆ ಮತ್ತು ಮನೆಮಾತಾದ ಊಟ',match:'bath'},
 {topic:'Aromatic biryani traditions',k:'ಸುವಾಸನೆಯ ಬಿರಿಯಾನಿ ಪರಂಪರೆ',match:'biryani'}
];
export default function StoryGallery({kannada=false}:{kannada?:boolean}){
 const {menu}=useApp();const [active,setActive]=useState(0);const entry=slides[active];
 const dish=menu.find(d=>d.active&&d.image&&d.name.toLowerCase().includes(entry.match))||menu.find(d=>d.active&&d.image);
 return <div className="story-gallery"><div className="story-gallery-frame">{dish?.image?<img key={dish.id} src={dish.image} alt={dish.name+' — menu photograph or illustration'} loading="lazy" referrerPolicy="no-referrer"/>:<img src="/mane-oggarane-logo.png" alt="Mane & Oggarane logo" loading="lazy"/>}<span>{dish?.name||(kannada?'ನಮ್ಮ ಅಡುಗೆಮನೆ':'Our Kitchen')}</span></div><div className="story-gallery-controls">{slides.map((s,i)=><button type="button" key={s.match} aria-pressed={active===i} onClick={()=>setActive(i)}>{kannada?s.k:s.topic}</button>)}</div><p className="fineprint">{kannada?'ಚಿತ್ರಗಳು ನಮ್ಮ ಮೆನು ಚಿತ್ರಸಂಗ್ರಹದಿಂದ. ನಿಜವಾದ ಅಡುಗೆಮನೆಯ ಪ್ರಕ್ರಿಯೆಯ ಚಿತ್ರಗಳಲ್ಲ.':'Images from our menu collection; not documentary photographs of our kitchen process.'} <Link href="/menu">{kannada?'ಮೆನು ನೋಡಿ →':'Browse the menu →'}</Link></p></div>
}