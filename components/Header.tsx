'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useApp} from './AppProvider';

export default function Header(){
  const {cartCount,mode,userId,role}=useApp();
  const [open,setOpen]=useState(false);
  const pathname=usePathname();
  useEffect(()=>setOpen(false),[pathname]);
  const prelaunch=process.env.NEXT_PUBLIC_SITE_PHASE==='prelaunch';
  const isOwner=role==='owner';
  const isStaff=['manager','kitchen','rider'].includes(role||'');
  const links=prelaunch?[['/','Home'],['/menu','Our Menu'],['/story','Our Kitchen'],['/policies','Policies']]:[['/','Home'],['/menu','Our Menu'],['/story','Our Kitchen'],['/rewards','Rewards'],['/orders','Track Orders']];
  return <>
    <div className="preview-flag" role="status">{prelaunch?'OPENING SOON · JIGANI · PICKUP ONLY · ONLINE ORDERS DISABLED':mode==='preview'?'DESIGN PREVIEW · SAMPLE ITEMS · CHECKOUT DISABLED':mode==='connected'?'ಮನೆಯ ಘಮ, ಪ್ರೀತಿಯ ರುಚಿ · WELCOME HOME':mode==='error'?'MENU TEMPORARILY UNAVAILABLE':'FRESH FLAVORS · MADE WITH LOVE'}</div>
    <header className="site-header cafe-site-header">
      <div className="container nav cafe-nav">
        <Link className="brand cafe-brand" href="/" aria-label="Mane and Oggarane home">
          <span className="brand-emblem cafe-brand-emblem cafe-logo-holder"><img className="cafe-logo-image" src="/mane-oggarane-logo.png" alt="" width={48} height={48}/></span>
          <span><b>Mane <em>&</em> Oggarane</b><small lang="kn">ಮನೆ & ಒಗ್ಗರಣೆ</small></span>
        </Link>
        <button type="button" className="cafe-nav-toggle" aria-expanded={open} aria-controls="cafe-primary-navigation" aria-label={open?'Close navigation':'Open navigation'} onClick={()=>setOpen(!open)}><span/><span/><span/></button>
        <nav id="cafe-primary-navigation" className={'nav-links cafe-nav-links '+(open?'is-open':'')} aria-label="Primary">
          {links.map(([href,name])=><Link key={href} href={href} aria-current={pathname===href?'page':undefined}>{name}</Link>)}
          {isOwner&&<Link href="/owner">Owner</Link>}
          {isStaff&&<Link href="/owner">Staff Console</Link>}
          {!prelaunch&&<Link href={userId?'/account':'/login'}>{userId?'My Account':'Sign in'}</Link>}
        </nav>
        {!prelaunch&&<Link className="cart-link cafe-cart-link" href="/menu#cart" aria-label={'Basket with '+cartCount+' items'}><span aria-hidden="true">◉</span> Basket <span className="count">{cartCount}</span></Link>}
      </div>
    </header>
  </>;
}