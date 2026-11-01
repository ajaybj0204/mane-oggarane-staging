/**
 * Mane & Oggarane kitchen assistant — a free, rules-based responder.
 * Every fact comes from live data passed in `ctx` (menu, settings, delivery zones,
 * the signed-in customer's own latest order). Nothing is invented: if data is
 * missing, the assistant says so and points to the right page.
 */
import {DELIVERY_RULES,type Business} from './business';

export type AssistantDish={id:string;name:string;price:number;veg:boolean;category:string;description?:string|null};
export type AssistantOrder={status:string;payment_status:string;fulfillment_type:string;total_paise:number;created_at:string;id:string;tracking_token:string};
export type AssistantCtx={menu:AssistantDish[];business:Business;pins:string[];openNow:boolean;signedIn:boolean;latestOrder?:AssistantOrder|null};
export type AssistantLink={label:string;href:string};
export type AssistantReply={reply:string;links?:AssistantLink[];suggestions?:string[];dishes?:AssistantDish[]};

const STATUS_TEXT:Record<string,string>={awaiting_payment:'waiting for payment confirmation',placed:'received by our kitchen',accepted:'accepted by the kitchen',preparing:'being freshly prepared',ready:'ready',out_for_delivery:'out for delivery',delivered:'delivered',cancelled:'cancelled'};
export const STARTER_SUGGESTIONS=['Explore our menu','Check delivery PIN code','Delivery charges','Track my order','How rewards work'];
const CATEGORY_WORDS:[RegExp,string,string][]=[[/\b(combo|combos|thali|feast|family|box)\b/,'combos','family combos'],[/\b(cafe|caf[eé]|chaat|chat|snack|snacks|kaapi|coffee|drink|drinks|juice|sweet|sweets|dessert)\b/,'cafe','café, chaats, sweets and drinks']];
const KEYWORDS:[RegExp,(d:AssistantDish)=>boolean,string][]=[
 [/\bdos[ae]s?\b/,d=>/dosa/i.test(d.name),'dosa'],[/\bidl[iy]s?\b/,d=>/idli/i.test(d.name),'idli'],[/\bvadas?\b/,d=>/vada/i.test(d.name),'vada'],
 [/\bbiry?ani\b/,d=>/biryani/i.test(d.name),'biryani'],[/\bchicken\b/,d=>/chicken|koli/i.test(d.name),'chicken'],[/\bmutton\b/,d=>/mutton/i.test(d.name),'mutton'],
 [/\bfish\b/,d=>/fish/i.test(d.name),'fish'],[/\beggs?\b/,d=>/egg/i.test(d.name),'egg'],[/\bpaneer\b/,d=>/paneer/i.test(d.name),'paneer'],
 [/\b(meals?|oota|rice)\b/,d=>/meal|oota|rice|pulao|thali/i.test(d.name),'meals and rice'],[/\bpuri\b/,d=>/puri/i.test(d.name),'puri'],
 [/\b(sweet|sweets|dessert|mysore pak|kesari)\b/,d=>/pak|kesari/i.test(d.name),'sweets'],[/\b(coffee|kaapi|juice|milk|drink|drinks|beverage)\b/,d=>/kaapi|juice|milk/i.test(d.name),'drinks'],
];
const rs=(n:number)=>'₹'+n.toLocaleString('en-IN');
const norm=(s:string)=>s.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}₹ ]+/gu,' ').replace(/\s+/g,' ').trim();
const has=(t:string,re:RegExp)=>re.test(t);

function findDish(text:string,menu:AssistantDish[]){
  const t=norm(text);let best:AssistantDish|undefined;let score=0;
  for(const d of menu){const words=norm(d.name).split(' ').filter(w=>w.length>2&&!['and','the'].includes(w));const hit=words.filter(w=>t.includes(w)).length;const s=hit/Math.max(words.length,1)+hit/100;if((hit>=2||s>=1)&&s>score){score=s;best=d}}
  return best;
}
function listDishes(ds:AssistantDish[],max=8){return ds.slice(0,max)}

export function answer(message:string,ctx:AssistantCtx):AssistantReply{
  const raw=message.slice(0,500);const t=norm(raw);const b=ctx.business;const menu=ctx.menu;
  const contact=[b.phone&&`phone ${b.phone}`,b.email&&`email ${b.email}`].filter(Boolean).join(' or ');
  const contactText=contact?`You can reach the restaurant by ${contact}.`:'Our contact details are on the Contact page.';

  // Safety first: never collect secrets.
  if(has(t,/\b(otp|password|passcode|cvv|upi pin|card number) (is|was)\b/)||/\b(otp|password|passcode|cvv)\b\D{0,12}\d{4,}/i.test(raw)||/\d{12,19}/.test(raw.replace(/[\s-]/g,''))){
    return {reply:'For your safety, please never share passwords, OTPs, UPI PINs or card details in chat — not even with us. Payments happen only inside the secure Razorpay window at checkout.',links:[{label:'How payment works',href:'/terms'}],suggestions:['How do I pay?','Track my order']};
  }

  // Delivery PIN check (any 6-digit number).
  const pin=raw.match(/\b(\d{6})\b/)?.[1];
  if(pin){
    if(ctx.pins.includes(pin))return {reply:`Yes! We deliver to ${pin}. Delivery is ${rs(DELIVERY_RULES.feeRupees)} for orders up to ${rs(DELIVERY_RULES.freeAboveRupees)}, and free above ${rs(DELIVERY_RULES.freeAboveRupees)}.`,links:[{label:'Start your order',href:'/menu'}],suggestions:['Delivery charges','How do I place an order?']};
    return {reply:`Sorry, ${pin} is outside our delivery area right now. We currently deliver to ${ctx.pins.join(', ')||'a few nearby PIN codes'}. You can still order for pickup from ${b.address}.`,links:[{label:'Delivery & pickup policy',href:'/delivery-policy'},{label:'Directions',href:'/contact'}],suggestions:['Can I collect my order?','Opening hours']};
  }

  if(has(t,/^(hi|hello|hey|namaskara|namaste|hai|good (morning|afternoon|evening))\b/)&&t.split(' ').length<=4)
    return {reply:'Namaskara! 🙏 How can I help you today? Ask me about our menu, delivery, ordering or rewards.',suggestions:STARTER_SUGGESTIONS};
  if(has(t,/\b(thank|thanks|thank you|dhanyavada)\b/))return {reply:'You are most welcome! Enjoy your meal. 🙏',suggestions:['Explore our menu']};

  if(!has(t,/\b(track|status|where is)\b/)&&has(t,/\b(pick ?up|collect|takeaway|take away|self pick)\b/))return {reply:`Yes — choose “Pickup” at checkout and collect your order from ${b.address} once tracking shows “Food is ready”.`,links:[{label:'Directions',href:'/contact'}]};
  // Personal order status — only the signed-in customer's own order, via server-side ownership check.
  if(has(t,/\b(my order|order status|where is my|track|tracking|status of)\b/)){
    if(!ctx.signedIn)return {reply:'To see your order status, please sign in — then I can show your latest order. You can also open the tracking link from your order confirmation.',links:[{label:'Sign in',href:'/login?next=%2Forders'},{label:'Track orders',href:'/orders'}]};
    const o=ctx.latestOrder;
    if(!o)return {reply:'I could not find any orders on your account yet.',links:[{label:'Explore the menu',href:'/menu'}]};
    const when=new Date(o.created_at).toLocaleString('en-IN',{timeZone:'Asia/Kolkata',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'});
    return {reply:`Your latest order (${o.fulfillment_type}, ${rs(o.total_paise/100)}, placed ${when}) is ${STATUS_TEXT[o.status]||o.status}.`,links:[{label:'Open live tracking',href:`/track?id=${encodeURIComponent(o.id)}&token=${encodeURIComponent(o.tracking_token)}`},{label:'All my orders',href:'/orders'}]};
  }

  if(has(t,/\b(cancel|cancellation)\b/))return {reply:`You can cancel with a full refund only before our kitchen accepts the order (status “Order received”). Once it is accepted or being prepared it usually can't be cancelled. ${contactText}`,links:[{label:'Cancellation & refunds',href:'/refund-policy'}],suggestions:['How long do refunds take?']};
  if(has(t,/\b(refund|refunds|money back|charged twice|deducted)\b/))return {reply:'Approved refunds go back to your original payment method through Razorpay. We start them within 2 working days and they usually reach you in 5–7 working days (some banks take up to 10). If you were charged but got no confirmation, the extra amount is refunded in full.',links:[{label:'Cancellation & refunds',href:'/refund-policy'}]};

  if(has(t,/\b(deliver|delivery|pin ?code|pincode|area|areas|zone)\b/)&&has(t,/\b(charge|charges|fee|fees|cost|free|price)\b/)||has(t,/\bfree delivery\b/))
    return {reply:`Delivery costs ${rs(DELIVERY_RULES.feeRupees)} when your food subtotal is up to and including ${rs(DELIVERY_RULES.freeAboveRupees)}. Above ${rs(DELIVERY_RULES.freeAboveRupees)}, delivery is free. The exact amount is always shown in your bill before you pay.`,links:[{label:'Delivery & pickup',href:'/delivery-policy'}],suggestions:['Check delivery PIN code']};
  if(has(t,/\b(deliver|delivery|pin ?code|pincode|area|areas|zone)\b/))return {reply:`We deliver to these PIN codes: ${ctx.pins.join(', ')||'please check at checkout'}. Type your 6-digit PIN code and I'll check it for you.`,suggestions:['Delivery charges','Can I collect my order?']};
  if(has(t,/\b(how long|delivery time|how much time|eta|minutes)\b/))return {reply:'Most orders arrive in about 30–60 minutes depending on kitchen load, distance and traffic. You can follow every step live on the tracking page.',links:[{label:'Track orders',href:'/orders'}]};

  if(has(t,/\b(reward|rewards|points|loyalty|redeem|coupon|coupons|offer|offers|discount)\b/)){
    if(has(t,/\b(redeem|use)\b/))return {reply:'Open My Account → Rewards, pick a reward you have enough points for, and you\'ll get a personal coupon code. Apply it at checkout — one coupon per order.',links:[{label:'My rewards',href:'/account'}]};
    return {reply:'You earn 1 point for every ₹100 on eligible orders. Points are added once your paid order is marked delivered, and you can exchange them for personal discount coupons in your account.',links:[{label:'How rewards work',href:'/rewards'},{label:'See my points',href:'/account'}],suggestions:['How do I redeem points?']};
  }
  if(has(t,/\b(open|opening|close|closing|timing|timings|hours|time)\b/))return {reply:`We're open ${b.hours}. ${ctx.openNow?'We are open right now. 🟢':'We are closed at the moment — please order during opening hours.'}`,links:[{label:'Order now',href:'/menu'}]};
  if(has(t,/\b(where|address|location|located|directions|map|reach you|visit)\b/))return {reply:`We're at ${b.address}.`,links:[{label:'Open in Google Maps',href:'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(b.name+', '+b.address)},{label:'Contact page',href:'/contact'}]};
  if(has(t,/\b(contact|phone|call|number|email|support|help desk|complain|complaint)\b/))return {reply:`${contactText} Our address is ${b.address}, open ${b.hours}.`,links:[{label:'Contact us',href:'/contact'}]};

  if(has(t,/\b(log ?in|sign ?in|google|account|register|sign ?up)\b/)&&!has(t,/\breset|forgot\b/))return {reply:'Tap “Sign in” at the top. You can continue with Google or use your email and password; new customers can create an account there. You need to be signed in to place an order, and we bring you straight back to checkout afterwards.',links:[{label:'Sign in',href:'/login'}]};
  if(has(t,/\b(reset|forgot|forgotten|change password)\b/))return {reply:'On the Sign in page, tap “Forgot password?”, enter your email, and follow the link we send you to set a new password.',links:[{label:'Reset password',href:'/login'}]};
  if(has(t,/\b(sms|text message|mobile otp|phone otp)\b/))return {reply:'Sign-in by SMS code is not switched on yet, so you won\'t receive an SMS. Please sign in with Google or email and password instead.',links:[{label:'Sign in',href:'/login'}]};
  if(has(t,/\bwithout (log|sign)|guest\b/))return {reply:'You can browse the menu without an account, but you need to sign in to place an order. It keeps your order history, tracking and rewards in one place.',links:[{label:'Sign in',href:'/login'}]};

  if(has(t,/\b(pay|payment|upi|card|cash|cod|razorpay|gpay|phonepe|paytm)\b/))return {reply:'You pay online through Razorpay — UPI, cards, net banking and wallets where available. You first see your final bill, then tap “Proceed to Payment” to open the secure Razorpay window. Cash on delivery is not offered online.',links:[{label:'Terms',href:'/terms'}]};
  if(has(t,/\b(how (do|to|can) i (place )?order|place an order|ordering|how to order|order online)\b/))return {reply:'1) Add dishes to your leaf basket from the menu. 2) Sign in. 3) Choose pickup or delivery and enter your details. 4) Review your final bill. 5) Tap “Proceed to Payment” to pay securely. 6) Track your order live.',links:[{label:'Open the menu',href:'/menu'}],suggestions:['Delivery charges','How do I pay?']};

  if(has(t,/\b(allerg|gluten|nut|nuts|peanut|dairy|lactose|jain|vegan|onion|garlic)\b/))return {reply:`Our kitchen handles dairy, nuts, gluten, sesame, egg, fish and other common allergens, so we can't guarantee any dish is free of them. Please check with the restaurant before ordering. ${contactText}`,links:[{label:'Contact us',href:'/contact'}]};

  // ---- Menu questions (live data) ----
  if(!menu.length&&has(t,/\b(menu|dish|dishes|food|eat|price|cost|veg|available)\b/))return {reply:'Our live menu is not loading right now, so I can\'t confirm dishes or prices. Please try again shortly.',links:[{label:'Menu',href:'/menu'}]};
  const under=t.match(/\b(under|below|less than|within|upto|up to)\s*(?:rs|₹|inr)?\s*(\d{2,4})\b/);
  if(under){const max=Number(under[2]);const ds=menu.filter(d=>d.price<=max).sort((a,c)=>a.price-c.price);return ds.length?{reply:`Here's what's available for ${rs(max)} or less:`,dishes:listDishes(ds,10),links:[{label:'See all under ₹150',href:'/menu?category=under150'}]}:{reply:`Nothing on today's menu is ${rs(max)} or less. Our lowest-priced item is ${rs(Math.min(...menu.map(d=>d.price)))}.`,links:[{label:'Menu',href:'/menu'}]}}
  if(has(t,/\b(cheap|cheapest|budget|lowest)\b/)){const ds=[...menu].sort((a,c)=>a.price-c.price);return {reply:'Our most affordable picks right now:',dishes:listDishes(ds,6)}}

  const dish=findDish(raw,menu);
  if(dish&&!has(t,/\b(non ?veg|vegetarian)\s+(dishes|items|options|menu)\b/))return {reply:`${dish.name} is ${rs(dish.price)} (${dish.veg?'vegetarian':'non-vegetarian'}) and available today.${dish.description?' '+dish.description:''}`,dishes:[dish],links:[{label:'View on menu',href:'/menu?dish='+encodeURIComponent(dish.id)}]};

  if(has(t,/\b(non ?veg|nonveg|meat|non vegetarian)\b/)){const ds=menu.filter(d=>!d.veg);return ds.length?{reply:`We have ${ds.length} non-vegetarian dishes available today:`,dishes:listDishes(ds),links:[{label:'All non-veg dishes',href:'/menu?category=nonveg'}]}:{reply:'No non-vegetarian dishes are available right now.'}}
  if(has(t,/\b(veg|vegetarian|veggie|pure veg)\b/)){const ds=menu.filter(d=>d.veg);return {reply:`We have ${ds.length} vegetarian dishes available today. A few favourites:`,dishes:listDishes(ds),links:[{label:'All vegetarian dishes',href:'/menu?category=veg'}]}}
  for(const [re,cat,label] of CATEGORY_WORDS){if(has(t,re)&&!KEYWORDS.some(([k])=>k.test(t))){const ds=menu.filter(d=>d.category===cat);if(ds.length)return {reply:`Our ${label}:`,dishes:listDishes(ds),links:[{label:'Open this section',href:'/menu?category='+cat}]}}}
  for(const [re,match,label] of KEYWORDS){if(has(t,re)){const ds=menu.filter(match);return ds.length?{reply:`Yes! Our ${label} options today:`,dishes:listDishes(ds),links:[{label:'Open the menu',href:'/menu'}]}:{reply:`We don't have ${label} on the menu right now.`,links:[{label:'See what\'s available',href:'/menu'}]}}}
  if(has(t,/\b(today|available|menu|what (do|can) (you|i)|serve|food|dishes|special|specials|recommend|popular|best)\b/)){const featured=menu.filter(d=>/v1|v2|v3|v4|v5|v6/.test(d.id));const ds=featured.length?featured:menu;return {reply:`Everything on our live menu (${menu.length} dishes) is available today. Some kitchen favourites:`,dishes:listDishes(ds,6),links:[{label:'Explore the full menu',href:'/menu'}]}}

  if(has(t,/\b(what is|who are|about|mane|oggarane|story|cuisine)\b/))return {reply:`${b.name} (ಮನೆ & ಒಗ್ಗರಣೆ) is a homestyle Karnataka kitchen in Jigani, Bengaluru — dosas, thatte idli, biryanis, coastal curries, chaats and filter kaapi, made fresh for pickup and local delivery.`,links:[{label:'Our story',href:'/story'},{label:'Menu',href:'/menu'}]};

  return {reply:`I'm not sure about that one. I can help with our menu and prices, delivery PIN codes and charges, ordering, payments, order tracking and rewards. ${contactText}`,suggestions:STARTER_SUGGESTIONS,links:[{label:'Contact us',href:'/contact'}]};
}
