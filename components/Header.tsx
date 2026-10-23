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
  const isOwner=role==='owner';
  const isStaff=['manager','kitchen','rider'].includes(role||'');
  const links=[['/','Home'],['/menu','Our Menu'],['/story','Our Kitchen'],['/rewards','Rewards'],['/orders','Track Orders']];
  return <>
    <div className="preview-flag" role="status">{mode==='preview'?'DESIGN PREVIEW · SAMPLE ITEMS · CHECKOUT DISABLED':mode==='connected'?'ಮನೆಯ ಘಮ, ಪ್ರೀತಿಯ ರುಚಿ · WELCOME HOME':mode==='error'?'MENU TEMPORARILY UNAVAILABLE':'FRESH FLAVORS · MADE WITH LOVE'}</div>
    <header className="site-header cafe-site-header">
      <div className="container nav cafe-nav">
        <Link className="brand cafe-brand" href="/" aria-label="Mane and Oggarane home">
          <span className="brand-emblem cafe-brand-emblem" aria-hidden="true">✽</span>
          <span><b>Mane <em>&</em> Oggarane</b><small lang="kn">ಮನೆ & ಒಗ್ಗರಣೆ</small></span>
        </Link>
        <button type="button" className="cafe-nav-toggle" aria-expanded={open} aria-controls="cafe-primary-navigation" aria-label={open?'Close navigation':'Open navigation'} onClick={()=>setOpen(!open)}><span/><span/><span/></button>
        <nav id="cafe-primary-navigation" className={'nav-links cafe-nav-links '+(open?'is-open':'')} aria-label="Primary">
          {links.map(([href,name])=><Link key={href} href={href} aria-current={pathname===href?'page':undefined}>{name}</Link>)}
          {isOwner&&<Link href="/owner">Owner</Link>}
          {isStaff&&<Link href="/owner">Staff Console</Link>}
          <Link href={userId?'/account':'/login'}>{userId?'My Account':'Sign in'}</Link>
        </nav>
        <Link className="cart-link cafe-cart-link" href="/menu#cart" aria-label={'Basket with '+cartCount+' items'}><span aria-hidden="true">◉</span> Basket <span className="count">{cartCount}</span></Link>
      </div>
    </header>
  </>;
}