import type {Metadata} from 'next';
import {PolicyShell,Refunds} from '../../components/PolicyDocs';
import {getBusiness} from '../../lib/business';
export const revalidate=300;
export const metadata:Metadata={title:'Cancellation & Refunds | Mane & Oggarane',description:'Order cancellation, refund timelines and how to report a problem with your order.'};
export default async function Page(){const b=await getBusiness();return <PolicyShell title="Cancellation & Refunds" kicker="CANCELLATION & REFUNDS"><Refunds b={b}/></PolicyShell>}
