import {publicRestaurant} from '../lib/public-restaurant';

/** Only shown in separately configured public prelaunch builds. */
export default function PrelaunchVisitInfo(){
 if(process.env.NEXT_PUBLIC_SITE_PHASE!=='prelaunch')return null;
 return <section className="section container flavor-page" aria-label="Restaurant pickup and opening information">
  <div className="form-panel">
   <p className="eyebrow">OPENING SOON · JIGANI, BENGALURU</p>
   <h2>Home-style Karnataka flavours, coming to your neighbourhood.</h2>
   <p><strong>Online orders and payments are not available yet.</strong> The published menu is a preview, not an invitation to place an order.</p>
   <p><strong>Planned pickup location:</strong> {publicRestaurant.pickupAddress}</p>
   <p><strong>Planned hours:</strong> {publicRestaurant.hours}</p>
   <p><strong>Launch service:</strong> {publicRestaurant.fulfillment}</p>
   <p><strong>Contact:</strong> <a href={'mailto:'+publicRestaurant.supportEmail}>{publicRestaurant.supportEmail}</a></p>
   <p className="fineprint">Pickup opening and menu availability will be announced when the kitchen is ready. No delivery or table bookings are offered in this preview.</p>
  </div>
 </section>;
}
