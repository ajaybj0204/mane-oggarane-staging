import type {Metadata} from 'next';
import {PolicyShell,Terms} from '../../components/PolicyDocs';
import {getBusiness} from '../../lib/business';
export const revalidate=300;
export const metadata:Metadata={title:'Terms & Conditions | Mane & Oggarane',description:'Terms & Conditions for ordering from Mane & Oggarane.'};
export default async function Page(){const b=await getBusiness();return <PolicyShell title="Terms & Conditions" kicker="TERMS OF ORDERING"><Terms b={b}/></PolicyShell>}
