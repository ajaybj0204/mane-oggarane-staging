import type {Metadata} from 'next';
import {PolicyShell,Contact} from '../../components/PolicyDocs';
import {getBusiness} from '../../lib/business';
export const revalidate=300;
export const metadata:Metadata={title:'Contact Us | Mane & Oggarane',description:'Address, opening hours and contact details for Mane & Oggarane, Jigani, Bengaluru.'};
export default async function Page(){const b=await getBusiness();return <PolicyShell title="Contact Us" kicker="GET IN TOUCH"><Contact b={b}/></PolicyShell>}
