/** Negative-only health probe for the public Test Mode webhook receiver.
 * No payments, refunds or signed events are created. The URL is configured locally.
 * Run after you configured the Razorpay Test Mode secrets in Supabase.
 */
const url=process.env.WEBHOOK_TEST_URL||'';
if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/functions\/v1\/razorpay-test-webhook$/.test(url)){
 console.error('Set WEBHOOK_TEST_URL to the HTTPS Supabase razorpay-test-webhook endpoint.');process.exit(2);
}
let failures=0;
async function check(label,options,expected){
 try{
  const r=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(9000),...options});
  const pass=r.status===expected;
  console.log(pass?'PASS':'FAIL',label,'HTTP',r.status,'expected',expected);
  if(!pass)failures++;
 }catch(e){failures++;console.error('FAIL',label,e instanceof Error?e.message:String(e))}
}
await check('Non-POST requests rejected',{method:'GET'},405);
await check('Unsigned payload rejected',{
 method:'POST',
 headers:{'Content-Type':'application/json','x-razorpay-event-id':'qa-unsigned-safe-'+Date.now()},
 body:JSON.stringify({event:'payment.failed',payload:{}})
},403);
console.log('Negative webhook probes:',failures?'FAILED':'PASSED','— no payments/refunds attempted');
process.exitCode=failures?1:0;
