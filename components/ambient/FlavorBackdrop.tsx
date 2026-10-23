import type {ReactNode} from 'react';

type FlavorVariant='mixed'|'veg'|'nonveg'|'cafe'|'spice'|'rewards';

function Icon({kind}:{kind:string}):ReactNode{
  switch(kind){
    case 'leaf':return <svg viewBox="0 0 100 100" fill="none" aria-hidden="true"><path d="M9 83C13 40 52 9 93 10c-1 43-29 78-84 73Z" fill="#698642"/><path d="M9 83 82 21M30 67l-2-28M49 49l24 5" stroke="#d9cb88" strokeWidth="3" strokeLinecap="round"/></svg>;
    case 'chilli':return <svg viewBox="0 0 120 90" fill="none" aria-hidden="true"><path d="M9 52c24 30 76 12 101-40-18 9-27 11-49 12C39 25 23 34 9 52Z" fill="#c74824"/><path d="M107 15c-6-12-17-13-28-7" stroke="#53763c" strokeWidth="9" strokeLinecap="round"/><path d="M22 52c23 8 46-3 64-21" stroke="#f7984e" strokeWidth="3" strokeLinecap="round"/></svg>;
    case 'capsicum':return <svg viewBox="0 0 100 100" fill="none" aria-hidden="true"><path d="M53 14c-6-14-3-21 8-24" stroke="#446b2b" strokeWidth="8" strokeLinecap="round"/><path d="M50 26C25 7 8 31 21 50 8 70 25 91 48 78c22 14 43-8 30-29 11-24-13-37-28-23Z" stroke="#75a236" strokeWidth="12" strokeLinejoin="round"/><path d="M39 35c7-8 19-8 27 1" stroke="#c4cc72" strokeWidth="4" strokeLinecap="round"/></svg>;
    case 'carrot':return <svg viewBox="0 0 92 115" fill="none" aria-hidden="true"><path d="M45 28c-19-9-26-19-21-26 12 0 21 9 23 22M48 26C51 10 62 3 73 4c-1 13-11 20-24 22" fill="#67954a"/><path d="M27 36C9 48 28 85 43 106c15-27 35-63 13-75-12-5-21-4-29 5Z" fill="#f28e34"/><path d="m32 54 18-7M34 72l15-6M42 87l9-5" stroke="#d96b20" strokeWidth="3" strokeLinecap="round"/></svg>;
    case 'bean':return <svg viewBox="0 0 100 100" aria-hidden="true"><path d="M83 26C67 4 36 15 21 33 5 52 15 83 34 90c25 9 61-26 49-64Z" fill="#88512b"/><path d="M51 19c13 16-18 33-8 49 4 6 1 13-3 17" fill="none" stroke="#d7a46b" strokeWidth="8" strokeLinecap="round"/></svg>;
    case 'star':return <svg viewBox="0 0 100 100" fill="none" aria-hidden="true"><path d="M50 6 60 31 86 17 72 43 96 55 67 59 72 88 50 69 28 88 33 59 4 55 28 43 14 17 40 31Z" fill="#985d35"/><circle cx="50" cy="50" r="15" fill="#ce9755"/><circle cx="50" cy="50" r="6" fill="#613c24"/></svg>;
    case 'chicken':return <svg viewBox="0 0 120 100" fill="none" aria-hidden="true"><path d="M20 19c-7-7-19 2-12 13 5 7 12 8 19 8L46 62l15-14-19-19c1-5 1-11-5-15-9-7-17-3-17 5Z" fill="#ddbd8d"/><path d="M49 43C65 15 95 23 106 42c20 33-12 56-40 44-23-10-33-28-17-43Z" fill="#b7783a"/><path d="M63 42c17-10 36 2 36 19" stroke="#f1bb6c" strokeWidth="6" strokeLinecap="round"/></svg>;
    case 'rice':return <svg viewBox="0 0 120 70" fill="none" aria-hidden="true"><ellipse cx="26" cy="33" rx="23" ry="7" transform="rotate(-20 26 33)" fill="#e4bc73"/><ellipse cx="64" cy="23" rx="22" ry="7" transform="rotate(18 64 23)" fill="#eee2b4"/><ellipse cx="88" cy="53" rx="25" ry="7" transform="rotate(-30 88 53)" fill="#d5b373"/></svg>;
    default:return <svg viewBox="0 0 80 80" aria-hidden="true"><path d="M40 7 46 32 72 40 46 46 40 73 34 46 8 40 34 34Z" fill="#e79c35"/></svg>;
  }
}

const themes:Record<FlavorVariant,string[]>={
 mixed:['leaf','chilli','capsicum','carrot','star','rice','leaf','chilli'],
 veg:['leaf','carrot','capsicum','leaf','rice','carrot','capsicum','leaf'],
 nonveg:['star','chilli','chicken','rice','leaf','star','chilli','rice'],
 cafe:['bean','leaf','bean','star','chilli','bean','rice','bean'],
 spice:['chilli','star','leaf','rice','carrot','star','chilli','leaf'],
 rewards:['star','leaf','rice','star','chilli','leaf','rice','star']
};

/** Purely decorative SVG ingredients behind page content, no new JS animation dependency. */
export default function FlavorBackdrop({variant='mixed'}:{variant?:FlavorVariant}){
 return <div className={'flavor-backdrop flavor-theme-'+variant} aria-hidden="true">
   <span className="flavor-powder flavor-powder-a"/>
   <span className="flavor-powder flavor-powder-b"/>
   <span className="flavor-powder flavor-powder-c"/>
   <span className="flavor-sparkles"/>
   {themes[variant].map((kind,i)=><span key={i} className={'flavor-motif flavor-motif-'+(i+1)+' flavor-ingredient-'+kind}><Icon kind={kind}/></span>)}
 </div>;
}
