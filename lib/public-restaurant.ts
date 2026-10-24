/** Restaurant facts supplied by the owner on 24 October 2026.
 * Public PRELAUNCH content only. User reports ownership of explorexdeals.com,
 * which currently serves a separate e-commerce storefront. Proposed test
 * subdomain is NOT connected; licence IDs, approved policies and allergens
 * were NOT supplied.
 * Do not use this module as payment authorization or tax/legal validation.
 */
export const publicRestaurant={
  name:'Mane & Oggarane',
  pickupAddress:'APC Circle Road, Jigani Industrial Area Phase 1, Ittina Nagar, Jigani, Anekal Taluk, Bengaluru, Karnataka 560105',
  hours:'Every day, 8:00 AM – 10:00 PM IST',
  supportEmail:'explorexplorer02@gmail.com',
  fulfillment:'Pickup only',
  status:'Prelaunch — online orders and payments are not open',
  domainProvided:'explorexdeals.com', // Existing separate e-commerce domain; do not re-point root.
  proposedTestSubdomain:'mane.explorexdeals.com', // Proposal only: NO DNS/project binding authorized.
} as const;
