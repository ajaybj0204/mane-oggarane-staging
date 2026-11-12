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
  // Status strip only appears when the customer needs to know something (sample menu or outage).
  const demo=process.env.NEXT_PUBLIC_DEMO_MODE==='true';
  const testPhase=(process.env.NEXT_PUBLIC_SITE_PHASE||'staging')==='staging';
  const notice=demo?'DEMO SITE · TEST PAYMENTS ONLY · USE CARD 4111 1111 1111 1111 · NO REAL ORDERS':mode==='preview'?'DESIGN PREVIEW · SAMPLE ITEMS · CHECKOUT DISABLED':mode==='error'?'MENU TEMPORARILY UNAVAILABLE · PLEASE REFRESH SHORTLY':testPhase?'TEST MODE · PAYMENTS ARE TEST-ONLY (RAZORPAY TEST CARD 4111 1111 1111 1111 OR OGGATTU PAY PIN 1234) · NO REAL ORDERS':'';
  return <>
    {notice&&<div className="preview-flag mo-status-strip" role="status">{notice}</div>}
    <header className="mo-header">
      <div className="mo-shell mo-header-row">
        <Link className="mo-brand" href="/" aria-label="Mane and Oggarane home">
          <span className="mo-brand-seal"><img src="/theme/logo-128.webp" alt="" width={56} height={56}/></span>
          <span className="mo-brand-words"><b>Mane <em>&amp;</em> Oggarane</b><small lang="kn">ಮನೆ &amp; ಒಗ್ಗರಣೆ</small></span>
        </Link>
        <nav id="mo-primary-navigation" className={'mo-nav '+(open?'is-open':'')} aria-label="Primary">
          {links.map(([href,name])=><Link key={href} href={href} aria-current={pathname===href?'page':undefined}>{name}</Link>)}
          {isOwner&&<Link href="/owner">Owner</Link>}
          {isStaff&&<Link href="/owner">Staff Console</Link>}
          <Link href={userId?'/account':'/login'} aria-current={pathname==='/account'||pathname==='/login'?'page':undefined}>{userId?'My Account':'Sign in'}</Link>
        </nav>
        <div className="mo-header-actions">
          <Link className="mo-basket-button" href="/menu#cart" aria-label={'Basket with '+cartCount+' items'}>
            <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"><path d="M3 9h18l-1.6 9.2A2 2 0 0 1 17.4 20H6.6a2 2 0 0 1-2-1.8L3 9Zm4 0 3-5m7 5-3-5M9 13v3m6-3v3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="mo-basket-label">Basket</span><span className="mo-basket-count">{cartCount}</span>
          </Link>
          <button type="button" className="mo-nav-toggle" aria-expanded={open} aria-controls="mo-primary-navigation" aria-label={open?'Close navigation':'Open navigation'} onClick={()=>setOpen(!open)}><span/><span/><span/></button>
        </div>
      </div>
    </header>
  </>;
}
