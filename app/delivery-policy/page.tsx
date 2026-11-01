import type {Metadata} from 'next';
import {PolicyShell,Delivery} from '../../components/PolicyDocs';
import {getBusiness, getDeliveryPins} from '../../lib/business';
export const revalidate=300;
export const metadata:Metadata={title:'Delivery & Pickup | Mane & Oggarane',description:'Delivery areas, charges, timings and pickup at Mane & Oggarane.'};
export default async function Page(){const [b,pins]=await Promise.all([getBusiness(),getDeliveryPins()]);return <PolicyShell title="Delivery & Pickup" kicker="DELIVERY & PICKUP"><Delivery b={b} pins={pins}/></PolicyShell>}
