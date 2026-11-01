import type {Metadata} from 'next';
import Link from 'next/link';
import {PolicyShell,POLICY_LINKS} from '../../components/PolicyDocs';
export const metadata:Metadata={title:'Policies | Mane & Oggarane',description:'Terms, privacy, cancellation & refund, delivery and contact information.'};
const blurbs:Record<string,string>={terms:'How ordering, payments, coupons and rewards work.',privacy:'What data we collect and your rights.','refund-policy':'When you can cancel and how refunds are paid.','delivery-policy':'Areas, charges, timings and pickup.',contact:'Address, hours and how to reach us.'};
export default function Policies(){return <PolicyShell title="Policies & help" kicker="BEFORE YOU ORDER"><p>Everything you need to know about ordering from us, in plain language.</p><ul className="mo-policy-cards">{POLICY_LINKS.map(([s,t])=><li key={s}><Link href={'/'+s}><strong>{t}</strong><span>{blurbs[s]}</span></Link></li>)}</ul></PolicyShell>}
