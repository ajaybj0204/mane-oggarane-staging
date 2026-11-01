import Link from 'next/link';
import type {ReactNode} from 'react';
import {DELIVERY_RULES,type Business} from '../lib/business';

/*
 * Customer policies for direct online ordering. Written as standard Indian
 * restaurant / food-delivery terms that satisfy payment-gateway website checks
 * (Terms, Privacy, Cancellation & Refunds, Delivery/Shipping, Contact) and the
 * DPDP Act 2023 notice basics. Owners should have them reviewed before going live.
 */
export const POLICY_UPDATED='1 November 2026';
export type PolicySlug='terms'|'privacy'|'refund-policy'|'delivery-policy'|'contact';
export const POLICY_LINKS:[PolicySlug,string][]=[['terms','Terms & Conditions'],['privacy','Privacy Policy'],['refund-policy','Cancellation & Refunds'],['delivery-policy','Delivery & Pickup'],['contact','Contact Us']];

function contactLine(b:Business){
  const bits:ReactNode[]=[];
  if(b.phone)bits.push(<span key="p">phone <a href={'tel:'+b.phone.replace(/\s/g,'')}>{b.phone}</a></span>);
  if(b.email)bits.push(<span key="e">email <a href={'mailto:'+b.email}>{b.email}</a></span>);
  return bits.length?<>{bits.reduce<ReactNode[]>((a,x,i)=>i?[...a,' or ',x]:[x],[])}</>:<>the contact details on our <Link href="/contact">Contact page</Link></>;
}

export function PolicyShell({title,kicker,children}:{title:string;kicker:string;children:ReactNode}){
  return <main className="mo-policy mo-parchment">
    <div className="mo-shell mo-policy-layout">
      <nav className="mo-policy-nav" aria-label="Policies">{POLICY_LINKS.map(([s,t])=><Link key={s} href={'/'+s}>{t}</Link>)}</nav>
      <article className="mo-policy-body">
        <p className="mo-kicker mo-kicker-dark"><span className="mo-kicker-rule" aria-hidden="true"/>{kicker}</p>
        <h1>{title}</h1>
        <p className="mo-policy-updated">Last updated: {POLICY_UPDATED}</p>
        {children}
      </article>
    </div>
  </main>;
}

export function Terms({b}:{b:Business}){return <>
  <p>These terms apply when you browse the {b.name} website or place an order for pickup or delivery. By placing an order you agree to them, together with our <Link href="/privacy">Privacy Policy</Link>, <Link href="/refund-policy">Cancellation &amp; Refunds</Link> and <Link href="/delivery-policy">Delivery &amp; Pickup</Link> policies.</p>
  <h2>1. Who we are</h2><p>{b.name} is a restaurant located at {b.address}. We prepare food on order and serve it for pickup or local delivery.</p>
  <h2>2. Accounts</h2><p>You need an account to place an order so that we can show your order history, track your order and credit rewards. Keep your login details private; you are responsible for activity on your account. Please give a correct name, phone number and address.</p>
  <h2>3. Menu, prices and availability</h2><p>All prices are in Indian Rupees (₹). Menu photos are representative and the actual dish may look slightly different. Items depend on availability. The final bill — food, any discount, delivery fee and applicable taxes — is calculated by our server and shown to you <strong>before</strong> you pay; that confirmed bill is the price you are charged.</p>
  <h2>4. Placing an order</h2><p>Your order is confirmed only after payment succeeds and you see an order confirmation with a tracking link. We may decline or cancel an order if an item becomes unavailable, the delivery address is outside our area, we are closed, or we suspect misuse. If we cancel a paid order you get a full refund (see <Link href="/refund-policy">Cancellation &amp; Refunds</Link>).</p>
  <h2>5. Payments</h2><p>Online payments are processed securely by Razorpay (UPI, cards, net banking and wallets as available). We never see or store your full card or UPI PIN details. Do not share OTPs or passwords with anyone, including people claiming to be from the restaurant.</p>
  <h2>6. Coupons and rewards</h2><ul><li>One coupon can be used per order. Coupons have their own minimum order value, expiry and usage limits, which are checked at checkout.</li><li>You earn <strong>1 reward point for every ₹100</strong> of eligible spend. Points are added only after a paid order is marked delivered/completed.</li><li>Points and coupons have no cash value, cannot be transferred or exchanged for money, and may be reversed if the order is cancelled or refunded.</li><li>We may change or end the rewards programme with reasonable notice on this website; points you have already earned will be honoured for at least 30 days after such notice.</li></ul>
  <h2>7. Food safety, allergies and dietary choices</h2><p>Our food is prepared in a kitchen that handles milk and dairy, nuts, gluten (wheat), sesame, eggs, fish and other common allergens, so we cannot guarantee any dish is free of them. Veg/Non-Veg labels describe the dish ingredients. If you have an allergy or dietary restriction, please contact us before ordering. Eat food soon after delivery or pickup; we are not responsible for food stored for long periods after handover.</p>
  <h2>8. Acceptable use</h2><p>Do not misuse the website, place fake orders, abuse coupons or rewards, or try to access other customers' information. We may suspend accounts involved in fraud or abuse.</p>
  <h2>9. Liability</h2><p>We take reasonable care in preparing and delivering your order. To the extent permitted by law, our total liability for any order is limited to the amount you paid for that order. Nothing in these terms limits your rights under the Consumer Protection Act, 2019.</p>
  <h2>10. Governing law</h2><p>These terms are governed by the laws of India. Courts in Bengaluru, Karnataka have jurisdiction, without affecting your right to approach a consumer commission.</p>
  <h2>11. Changes and contact</h2><p>We may update these terms; the version on this page at the time of your order applies. Questions? Reach us via {contactLine(b)}.</p>
</>}

export function Privacy({b}:{b:Business}){return <>
  <p>This notice explains what personal data {b.name} collects through this website, why, and the choices you have, in line with the Digital Personal Data Protection Act, 2023.</p>
  <h2>1. What we collect</h2><ul><li><strong>Account details:</strong> name, email address and, if you use Google sign-in, your basic Google profile.</li><li><strong>Order details:</strong> phone number, delivery address and PIN code, items ordered, order notes and order history.</li><li><strong>Payment references:</strong> Razorpay order/payment IDs and payment status. Card, UPI and bank details are handled by Razorpay, not stored by us.</li><li><strong>Rewards and preferences:</strong> points, coupons, saved dishes, saved addresses, feedback and your marketing choice.</li><li><strong>Technical data:</strong> basic logs and a privacy-protected (hashed) network identifier used to prevent abuse. Your browser stores your basket and food preference locally.</li></ul>
  <h2>2. Why we use it</h2><p>To create your account, prepare and deliver orders, take payment, send order updates, provide rewards and coupons, answer support requests, prevent fraud, and meet legal and tax obligations. With your consent only, we may send you offers; you can opt out any time from your account.</p>
  <h2>3. Who we share it with</h2><p>Only service providers needed to run the service: Razorpay (payments), Supabase (secure database and login), Vercel (website hosting) and, where used, the delivery person handling your order (name, phone and address only). We do not sell your personal data.</p>
  <h2>4. How long we keep it</h2><p>Order and payment records are kept as required for accounting and tax purposes (generally up to 8 years). Other account data is kept while your account is active and deleted or anonymised within a reasonable time after you ask us to close it.</p>
  <h2>5. Your rights</h2><p>You can ask to access, correct or erase your personal data, withdraw consent for marketing, nominate another person to exercise your rights, and raise a grievance. Some data may need to be kept where the law requires it.</p>
  <h2>6. Security</h2><p>Data is transmitted over HTTPS, access is restricted by role, and customers can only see their own orders and rewards.</p>
  <h2>7. Children</h2><p>This service is meant for adults. If you are under 18, please order with a parent or guardian.</p>
  <h2>8. Grievance contact</h2><p>For privacy requests or complaints, contact the restaurant's grievance contact via {contactLine(b)}. We aim to respond within 7 working days.</p>
</>}

export function Refunds({b}:{b:Business}){return <>
  <p>Because food is freshly prepared and perishable, cancellations work differently from other online purchases. Here is exactly what happens in each case.</p>
  <h2>Cancelling your order</h2><ul><li><strong>Before the kitchen accepts it</strong> (status “Order received”): contact us and we will cancel it with a <strong>full refund</strong>.</li><li><strong>After the kitchen has accepted or started preparing it:</strong> the order usually cannot be cancelled, because the food is already being made for you.</li></ul>
  <h2>When we cancel</h2><p>If we cancel a paid order — for example an item is unavailable, we cannot deliver to your address, or the kitchen is closed — you receive a <strong>full refund</strong> automatically.</p>
  <h2>Problems with your order</h2><p>If an item is missing, wrong, damaged or spilled, or there is a quality issue, tell us <strong>within 2 hours</strong> of delivery or pickup with your order number and a photo where possible. After checking, we will offer a replacement, a refund for the affected item(s), or a full refund where the whole order is affected.</p>
  <h2>Payment issues</h2><ul><li>If money was deducted but no order was confirmed, or you were charged twice, the extra amount is refunded in full once our payment check confirms it.</li><li>If a payment fails, you are not charged; any amount held by your bank is released by the bank, usually within 5–7 working days.</li></ul>
  <h2>How refunds are paid</h2><p>Refunds go back to the <strong>original payment method</strong> through Razorpay. We start approved refunds within 2 working days; the money usually reaches you in <strong>5–7 working days</strong>, though some banks may take up to 10. Coupon value and reward points used on a cancelled order are restored where possible, and points earned on a refunded order are reversed.</p>
  <h2>Contact</h2><p>For cancellations and refunds, reach us via {contactLine(b)} with your order number.</p>
</>}

export function Delivery({b,pins}:{b:Business;pins:string[]}){return <>
  <p>We serve fresh food for pickup from our kitchen and delivery to nearby areas.</p>
  <h2>Opening hours</h2><p>{b.hours}. Orders are prepared during these hours only.</p>
  <h2>Where we deliver</h2><p>We deliver only to these PIN codes{pins.length?':':'.'} {pins.length?<strong>{pins.join(', ')}</strong>:null}. Enter your PIN code at checkout to confirm. Other areas can choose pickup.</p>
  <h2>Delivery charges</h2><ul><li>Order subtotal up to and including ₹{DELIVERY_RULES.freeAboveRupees}: <strong>₹{DELIVERY_RULES.feeRupees}</strong> delivery fee.</li><li>Order subtotal above ₹{DELIVERY_RULES.freeAboveRupees}: <strong>free delivery</strong>.</li><li>The exact fee is always shown in your bill before payment.</li></ul>
  <h2>Delivery time</h2><p>Most orders reach you in about <strong>30–60 minutes</strong>, depending on kitchen load, distance, traffic and weather. This is an estimate, not a guarantee. You can follow every step on the order tracking page.</p>
  <h2>Receiving your order</h2><p>Please keep your phone reachable and give clear address and landmark details. If we cannot reach you after reasonable attempts, the order may be treated as delivered and is not refundable.</p>
  <h2>Pickup</h2><p>Choose pickup at checkout and collect your order from {b.address} once tracking shows “Food is ready”. Please collect within 30 minutes so the food stays fresh.</p>
  <h2>Shipping</h2><p>We deliver freshly prepared food locally only. We do not courier or ship orders to other cities.</p>
</>}

export function Contact({b}:{b:Business}){return <>
  <p>We're happy to help with orders, delivery, rewards or anything else.</p>
  <dl className="mo-contact-list">
    <div><dt>Restaurant</dt><dd>{b.name}</dd></div>
    <div><dt>Address</dt><dd>{b.address}</dd></div>
    <div><dt>Opening hours</dt><dd>{b.hours}</dd></div>
    {b.phone&&<div><dt>Phone</dt><dd><a href={'tel:'+b.phone.replace(/\s/g,'')}>{b.phone}</a></dd></div>}
    {b.email&&<div><dt>Email</dt><dd><a href={'mailto:'+b.email}>{b.email}</a></dd></div>}
    {b.fssai&&<div><dt>FSSAI licence</dt><dd>{b.fssai}</dd></div>}
  </dl>
  <p><a className="mo-btn mo-btn-gold" href={'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(b.name+', '+b.address)} target="_blank" rel="noreferrer">Open in Google Maps <span aria-hidden="true">→</span></a></p>
  <p>For an existing order, keep your order number ready. You can also check live status on <Link href="/orders">Track Orders</Link>, or ask our kitchen assistant (the chat button at the bottom right).</p>
</>}
