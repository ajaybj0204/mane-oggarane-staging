/** Read-only prelaunch readiness check. Prints only check labels, NEVER env values.
 * Run with a separately prepared production environment before any domain cutover.
 * Does not create projects, charge customers, call any APIs or modify DNS.
 */
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const env=process.env;
const checks=[];
function check(name,ok,note=''){checks.push({name,ok:!!ok,note})}
const hasValue=(name)=>{
 const val=env[name]||'';
 return Boolean(val&&val.trim().length>=12&&!/(YOUR_|REPLACE|CHANGE_ME|PLACEHOLDER|EXAMPLE)/i.test(val));
};
function httpsHost(raw){
 try {
   const url=new URL(raw||'');
   if(url.protocol!=='https:'||url.username||url.password||url.port||url.search||url.hash||url.pathname!=='/')return null;
   return url.hostname.toLowerCase();
 }catch{return null}
}
const publicHost=httpsHost(env.NEXT_PUBLIC_APP_URL);
const dbHost=httpsHost(env.NEXT_PUBLIC_SUPABASE_URL);
check('Explicit server phase PRELAUNCH',env.MNO_SITE_PHASE==='prelaunch');
check('Explicit browser phase PRELAUNCH',env.NEXT_PUBLIC_SITE_PHASE==='prelaunch');
check('Public domain uses HTTPS and is NOT the staging Vercel address',Boolean(publicHost&&publicHost!== 'project-aexe8.vercel.app'&&!publicHost.endsWith('.vercel.app')&&!publicHost.endsWith('.supabase.co')&&!publicHost.includes('example')));
check('Independent production Supabase project',Boolean(dbHost&&dbHost.endsWith('.supabase.co')&&dbHost!=='zkowkikjsrfqqqsfrfwv.supabase.co'));
check('Production public Supabase key is configured',hasValue('NEXT_PUBLIC_SUPABASE_ANON_KEY'));
check('Production service-role key is configured privately',hasValue('SUPABASE_SERVICE_ROLE_KEY'));
check('Do not use Razorpay LIVE keys on the prelaunch website',!(env.RAZORPAY_KEY_ID||'').startsWith('rzp_live_'));
check('Live refunds remain disabled',env.RAZORPAY_ALLOW_LIVE_REFUNDS!=='true');
check('Source retains a server-side prelaunch checkout guard',fs.readFileSync(path.join(root,'app/api/checkout/route.ts'),'utf8').includes('!stagingTransactionsAllowed()'));
check('Source retains test-only payment provider guard',fs.readFileSync(path.join(root,'lib/razorpay.ts'),'utf8').includes("id.startsWith('rzp_test_')"));
check('Production policies still require explicit restaurant owner approval',fs.readFileSync(path.join(root,'app/policies/page.tsx'),'utf8').includes('Owner action required'));
for(const entry of checks)console.log((entry.ok?'PASS':'FAIL')+' '+entry.name);
const problems=checks.filter(x=>!x.ok).length;
console.log('\nPrelaunch checks: '+(checks.length-problems)+'/'+checks.length+' passed. No secrets, customer records or endpoints were accessed.');
if(problems){console.log('Do not point the business domain to this deployment or disable authentication until these are fixed.');process.exitCode=1;}
