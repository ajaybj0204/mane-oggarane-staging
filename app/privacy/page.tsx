import type {Metadata} from 'next';
import {PolicyShell,Privacy} from '../../components/PolicyDocs';
import {getBusiness} from '../../lib/business';
export const revalidate=300;
export const metadata:Metadata={title:'Privacy Policy | Mane & Oggarane',description:'How Mane & Oggarane collects, uses and protects your personal data.'};
export default async function Page(){const b=await getBusiness();return <PolicyShell title="Privacy Policy" kicker="YOUR DATA"><Privacy b={b}/></PolicyShell>}
