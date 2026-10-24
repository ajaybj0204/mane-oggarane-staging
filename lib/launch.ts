/** Fail-closed prelaunch gate. Staging is unchanged unless an explicit phase is set.
 * Setting either flag to prelaunch/unknown/live prevents new financial or
 * customer-submitted workflows. This revision NEVER authorizes live payments.
 * A separately reviewed go-live release is required to replace this policy.
 */
export function stagingTransactionsAllowed():boolean{
 const server=process.env.MNO_SITE_PHASE||'staging';
 const client=process.env.NEXT_PUBLIC_SITE_PHASE||'staging';
 return server==='staging' && client==='staging';
}
export function prelaunchMessage(){
 return 'Online ordering is not open yet. Please check back after the restaurant announces its launch.';
}
