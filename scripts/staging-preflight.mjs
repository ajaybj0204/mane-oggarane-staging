// Mane & Oggarane — read-only staging preflight. Does not print values or call APIs.
import fs from 'node:fs';
import path from 'node:path';
const base = process.cwd();
let problems = 0;
function check(label, ok, detail='') {
  console.log(`${ok ? 'PASS' : 'CHECK'} ${label}${detail ? ' — ' + detail : ''}`);
  if (!ok) problems++;
}
const exists = (p) => fs.existsSync(path.join(base,p));
console.log('\nMane & Oggarane — staging preflight (local only)\n');
check('Next.js project root', exists('package.json') && exists('app/page.tsx'));
check('Local environment file present',exists('.env.local'),'never upload or commit this file');
check('Git ignore file present',exists('.gitignore'));
if (exists('.gitignore')) {
 const ignore = fs.readFileSync(path.join(base,'.gitignore'),'utf8');
 check('Local secrets ignored by git',/(^|\n)\.env\*($|\r?\n)/m.test(ignore) || /(^|\n)\.env\.local($|\r?\n)/m.test(ignore));
 check('Vercel linking metadata ignored',/(^|\n)\.vercel\/?($|\r?\n)/m.test(ignore),'add .vercel/ to .gitignore if missing');
}
if (exists('.env.local')) {
 const txt=fs.readFileSync(path.join(base,'.env.local'),'utf8');
 const get = key => (txt.match(new RegExp('^\\s*'+key+'\\s*=\\s*(.*)\\s*$','m'))?.[1]||'').replace(/^['"]|['"]$/g,'').trim();
 const keys=['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','RAZORPAY_KEY_ID','RAZORPAY_KEY_SECRET','RAZORPAY_WEBHOOK_SECRET','CRON_SECRET','RATE_LIMIT_SALT'];
 for(const key of keys)check(`Configured locally: ${key}`,Boolean(get(key)&&!/(REPLACE|YOUR_|CHANGE_ME)/i.test(get(key))));
 check('Razorpay test mode',get('RAZORPAY_KEY_ID').startsWith('rzp_test_'),'no live payments on staging');
 check('Live refunds opt-in disabled',get('RAZORPAY_ALLOW_LIVE_REFUNDS')!=='true');
}
console.log(`\nPreflight: ${problems} issue(s) to review. No data was uploaded or modified.\n`);
process.exitCode=problems>0?1:0;
