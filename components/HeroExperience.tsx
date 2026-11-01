import Link from 'next/link';

/**
 * Homepage hero — follows the approved "arched kitchen" reference.
 * The kitchen scenery is a real image; all wording (including Kannada) is live
 * Unicode text, and the logo is the official uploaded asset.
 */
export default function HeroExperience(){
  return <section className="mo-hero" aria-labelledby="mo-hero-title">
    <img className="mo-hero-decor mo-hero-leaves" src="/theme/decor-leaves-dark.webp" alt="" aria-hidden="true" width={150} height={202}/>
    <img className="mo-hero-decor mo-hero-pot" src="/theme/decor-clay-pot.webp" alt="" aria-hidden="true" width={205} height={280}/>
    <div className="mo-hero-grid">
      <div className="mo-hero-copy">
        <p className="mo-kicker"><span className="mo-kicker-rule" aria-hidden="true"/>MADE WITH LOVE · KARNATAKA <span className="mo-kicker-star" aria-hidden="true">✳</span></p>
        <h1 id="mo-hero-title" lang="kn"><span>ಮನೆಯ ಊಟ,</span><em>ಪ್ರೀತಿಯ ರುಚಿ.</em></h1>
        <p className="mo-hero-text">Comfort food that feels like coming home. Freshly made Karnataka favourites, thoughtful little details, and the joy of sharing a good meal.</p>
        <div className="mo-hero-actions">
          <Link className="mo-btn mo-btn-gold" href="/menu">Explore our menu <span aria-hidden="true">→</span></Link>
          <Link className="mo-btn mo-btn-ghost" href="/story">Our little story <span aria-hidden="true">→</span></Link>
        </div>
        <p className="mo-hero-footnote"><span aria-hidden="true">✦</span><span lang="kn">ಒಂದು ತುತ್ತು, ಸಾವಿರ ನೆನಪುಗಳು.</span><i aria-hidden="true"/></p>
      </div>
      <div className="mo-hero-art"><div className="cafe-hero-photo">
        <picture>
          <source media="(max-width: 860px)" srcSet="/theme/hero-kitchen-tall.webp" width={937} height={1142}/>
          <img src="/theme/hero-kitchen-wide.webp" alt="A warm Karnataka kitchen with a wood-fired stove and brass vessels" width={976} height={562} fetchPriority="high"/>
        </picture></div>
        <div className="mo-hero-emblem">
          <img src="/theme/logo-720.webp" alt="Mane & Oggarane — ಮನೆ & ಒಗ್ಗರಣೆ" width={360} height={360}/>
          <p><span>FROM OUR KITCHEN</span><b aria-hidden="true">✳</b><span>TO YOUR TABLE</span></p>
        </div>
      </div>
    </div>
  </section>;
}
