import Link from 'next/link';

export default function Footer(){
 return <footer className="footer cafe-footer"><div className="container">
   <div className="cafe-footer-top"><div className="cafe-footer-brand"><Link href="/" className="cafe-footer-logo-link" aria-label="Mane and Oggarane home"><img src="/mane-oggarane-logo.png" alt="Mane and Oggarane logo" width={116} height={116} loading="lazy"/></Link><strong>Mane <em>&</em> Oggarane</strong><p lang="kn">ಮನೆಯ ಘಮ, ಪ್ರೀತಿಯ ರುಚಿ.</p><small>Good food. Warm hearts. A little taste of home.</small></div>
   <div className="cafe-footer-group"><h2>EXPLORE</h2><Link href="/menu">Our Menu</Link><Link href="/story">Our Kitchen</Link><Link href="/rewards">Family Rewards</Link><Link href="/booking">Table Requests</Link></div>
   <div className="cafe-footer-group"><h2>HERE TO HELP</h2><Link href="/orders">Track Orders</Link><Link href="/account">My Account</Link><Link href="/policies">Policies</Link><Link href="/login">Sign In</Link></div></div>
   <div className="cafe-footer-bottom"><span>© {new Date().getFullYear()} Mane & Oggarane</span><span lang="kn">ಒಂದು ತುತ್ತು, ಸಾವಿರ ನೆನಪುಗಳು.</span><span>Menu availability and images are subject to the kitchen's published details.</span></div>
 </div></footer>;
}