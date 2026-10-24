import {publicRestaurant} from '../lib/public-restaurant';
import Link from 'next/link';

export default function Footer(){
 const prelaunch=process.env.NEXT_PUBLIC_SITE_PHASE==='prelaunch';
 return <footer className="footer cafe-footer"><div className="container">
   <div className="cafe-footer-top"><div className="cafe-footer-brand"><Link href="/" className="cafe-footer-logo-link" aria-label="Mane and Oggarane home"><img src="/mane-oggarane-logo.png" alt="Mane and Oggarane logo" width={116} height={116} loading="lazy"/></Link><strong>Mane <em>&</em> Oggarane</strong><p lang="kn">ಮನೆಯ ಘಮ, ಪ್ರೀತಿಯ ರುಚಿ.</p><small>Good food. Warm hearts. A little taste of home.</small></div>
   <div className="cafe-footer-group"><h2>EXPLORE</h2><Link href="/menu">Our Menu</Link><Link href="/story">Our Kitchen</Link>{!prelaunch&&<><Link href="/rewards">Family Rewards</Link><Link href="/booking">Table Requests</Link></>}</div>
   <div className="cafe-footer-group"><h2>HERE TO HELP</h2>{prelaunch?<><span>Pickup only · opening soon</span><a href={"mailto:"+publicRestaurant.supportEmail}>{publicRestaurant.supportEmail}</a><small>{publicRestaurant.hours}</small><small>{publicRestaurant.pickupAddress}</small></>:<><Link href="/orders">Track Orders</Link><Link href="/account">My Account</Link><Link href="/login">Sign In</Link></>}<Link href="/policies">Policies & notices</Link></div></div>
   <div className="cafe-footer-bottom"><span>© {new Date().getFullYear()} Mane & Oggarane</span><span lang="kn">ಒಂದು ತುತ್ತು, ಸಾವಿರ ನೆನಪುಗಳು.</span><span>Menu availability and images are subject to the kitchen's published details.</span></div>
 </div></footer>;
}