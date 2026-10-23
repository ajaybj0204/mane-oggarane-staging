/** Read-only/negative HTTP checks against your local server (no real payments/refunds). */
const origin=process.env.BASE_URL||'http://localhost:3000';let pass=0,fail=0;
async function check(name,path,{method='GET',body,expected}={}){try{const r=await fetch(origin+path,{method,headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,redirect:'manual'});if((expected||[]).includes(r.status)){console.log('PASS',name,r.status);pass++}else{console.log('FAIL',name,r.status,'expected',expected);fail++}}catch(e){console.log('FAIL',name,e.message);fail++}}
await check('Menu is public','/api/menu',{expected:[200]});
await check('Anonymous admin orders denied','/api/admin/orders',{expected:[401,403]});
await check('Anonymous admin customers denied','/api/admin/customers',{expected:[401,403]});
await check('Anonymous customer history denied','/api/me/orders',{expected:[401]});
await check('Tracking without valid credentials denied','/api/track?id=garbage&token=guessed',{expected:[400,404]});
await check('Unsigned payment webhook rejected','/api/payments/webhook',{method:'POST',body:{event:'payment.captured',id:'QA_FAKE'},expected:[403]});
await check('Empty checkout rejected','/api/checkout',{method:'POST',body:{items:[],fulfillment:'pickup',name:'QA Test',email:'example@invalid.test',phone:'9999999999'},expected:[400,429]});
console.log(`${pass} passed; ${fail} failed. Tests do not attempt payment or refund.`);process.exitCode=fail?1:0;
