import Link from 'next/link';

const heroImage = 'https://cdn.shopify.com/s/files/1/0661/5180/9085/files/mane-oggarane-homepage-hero.png?v=1792912345';

export default function HeroExperience(){
 return <section className="cafe-hero-exact" aria-label="Mane and Oggarane welcome">
  <img className="cafe-hero-exact-image" src={heroImage} alt="Mane & Oggarane kitchen welcome: ಮನೆಯ ಊಟ, ಪ್ರೀತಿಯ ರುಚಿ. Warm Karnataka food, the Mane and Oggarane logo, a rustic kitchen, dosa, chutneys and sambar. From our kitchen to your table." width={1377} height={1142} fetchPriority="high"/>
  <Link className="cafe-hero-art-link cafe-hero-art-menu" href="/menu" aria-label="Explore our menu"><span className="sr-only">Explore our menu</span></Link>
  <Link className="cafe-hero-art-link cafe-hero-art-story" href="/story" aria-label="Read our kitchen story"><span className="sr-only">Our little story</span></Link>
  <div className="cafe-hero-mobile-actions"><Link href="/menu" className="cafe-pill cafe-pill-bright">Explore our menu →</Link><Link href="/story" className="cafe-pill cafe-pill-outline">Our little story →</Link></div>
 </section>
}
