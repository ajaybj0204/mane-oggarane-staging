import {stagingTransactionsAllowed,prelaunchMessage} from '../../../../lib/launch';
import {userFromRequest} from '../../../../lib/supabase';
import {respond,fail,jsonBody,text} from '../../../../lib/api';
import {withinRate} from '../../../../lib/rate';
import {isOggattuRef,oggattuMode,simulatedBankConfirmation} from '../../../../lib/oggattu';
export const runtime='nodejs';export const dynamic='force-dynamic';

/** TEST MODE ONLY: a simulated customer bank. Approving with test PIN 1234 returns a signed confirmation. */
export async function POST(req:Request){
 if(!stagingTransactionsAllowed())return fail(prelaunchMessage(),503);
 if(oggattuMode()!=='test')return fail('The test bank is switched off. Pay with a real UPI app.',403);
 if(!await withinRate(req,'checkout',30,900,'oggattu-bank'))return fail('Too many attempts. Please wait.',429);
 const user=await userFromRequest(req);if(!user)return fail('Sign in first.',401);
 const b=await jsonBody(req);if(!b)return fail('Invalid request');
 const ref=text(b.ref,40);const amount=Math.round(Number(b.amount));
 if(!isOggattuRef(ref)||!Number.isInteger(amount)||amount<=0)return fail('Invalid payment request');
 if(b.decline===true)return respond(simulatedBankConfirmation(ref,amount,'FAILURE',`${user.id.slice(0,8)}@okbank`));
 if(text(b.pin,6)!=='1234')return fail('Wrong UPI PIN (test PIN is 1234)',400);
 return respond(simulatedBankConfirmation(ref,amount,'SUCCESS',`${user.id.slice(0,8)}@okbank`));
}
