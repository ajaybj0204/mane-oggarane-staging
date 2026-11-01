import Link from 'next/link';
import {BUSINESS_DEFAULTS} from '../lib/business';

export default function Footer(){
 const b=BUSINESS_DEFAULTS;
 return <footer className="footer cafe-footer"><div className="container">
   <div className="cafe-footer-top mo-footer-top">
     <div className="cafe-footer-brand"><Link href="/" className="cafe-footer-logo-link" aria-label="Mane and Oggarane home"><img src="/theme/logo-128.webp" alt="Mane and Oggarane logo" width={96} height={96} loading="lazy"/></Link><strong>Mane <em>&amp;</em> Oggarane</strong><p lang="kn">ಮನೆಯ ಊಟ, ಪ್ರೀತಿಯ ರುಚಿ.</p><small>Good food. Warm hearts. A little taste of home.</small></div>
     <div className="cafe-footer-group"><h2>EXPLORE</h2><Link href="/menu">Our Menu</Link><Link href="/story">Our Kitchen</Link><Link href="/rewards">Family Rewards</Link><Link href="/orders">Track Orders</Link><Link href="/account">My Account</Link></div>
     <div className="cafe-footer-group"><h2>POLICIES</h2><Link href="/terms">Terms &amp; Conditions</Link><Link href="/privacy">Privacy Policy</Link><Link href="/refund-policy">Cancellation &amp; Refunds</Link><Link href="/delivery-policy">Delivery &amp; Pickup</Link><Link href="/contact">Contact Us</Link></div>
     <div className="cafe-footer-group mo-footer-visit"><h2>VISIT US</h2><address>{b.address}</address><span>{b.hours}</span><Link href="/contact">Directions &amp; contact →</Link></div>
   </div>
   <div className="cafe-footer-bottom"><span>© {new Date().getFullYear()} Mane &amp; Oggarane</span><span lang="kn">ಒಂದು ತುತ್ತು, ಸಾವಿರ ನೆನಪುಗಳು.</span><span>Prices and availability are confirmed at checkout.</span></div>
 </div></footer>;
}
