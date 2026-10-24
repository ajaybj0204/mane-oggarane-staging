import {createHmac,timingSafeEqual} from 'node:crypto';
function credentials(){const id=process.env.RAZORPAY_KEY_ID,secret=process.env.RAZORPAY_KEY_SECRET;if(!id||!secret)throw new Error('Razorpay credentials are missing');if(!id.startsWith('rzp_test_'))throw new Error('Only Razorpay Test Mode credentials are allowed in this staging release');return {id,secret}}
export async function razorpay(path:string,method='GET',body?:Record<string,unknown>){
 const {id,secret}=credentials();const response=await fetch(`https://api.razorpay.com/v1/${path}`,{method,headers:{Authorization:'Basic '+Buffer.from(`${id}:${secret}`).toString('base64'),'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,cache:'no-store'});
 const result=await response.json();if(!response.ok)throw new Error(`Payment provider error (${response.status}): ${JSON.stringify(result).slice(0,220)}`);return result;
}
export function validHmac(message:string,signature:string,secret:string){if(!/^[a-f0-9]{64}$/i.test(signature)||!secret)return false;const expected=createHmac('sha256',secret).update(message).digest();const provided=Buffer.from(signature,'hex');return expected.length===provided.length&&timingSafeEqual(expected,provided)}
export function verifyCheckout(orderId:string,paymentId:string,signature:string){return validHmac(orderId+'|'+paymentId,signature,process.env.RAZORPAY_KEY_SECRET||'')}
export function verifyWebhook(raw:string,signature:string){return validHmac(raw,signature,process.env.RAZORPAY_WEBHOOK_SECRET||'')}
