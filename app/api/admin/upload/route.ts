import {serviceDb,staffFromRequest} from '../../../../lib/supabase';import {withinRate} from '../../../../lib/rate';import {respond,fail} from '../../../../lib/api';
export const runtime='nodejs';
export async function POST(req:Request){
 try{const staff=await staffFromRequest(req,['owner','manager']);if(!staff)return fail('Staff access required',403);if(!await withinRate(req,'media',30,3600,staff.id))return fail('Upload limit reached. Try later.',429);
  const form=await req.formData();const f=form.get('file');if(!(f instanceof File))return fail('Choose an image');
  if(!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>5*1024*1024||f.size<100)return fail('Only JPG, PNG or WebP images up to 5 MB are accepted');
  const bytes=new Uint8Array(await f.arrayBuffer());
  const valid=f.type==='image/png'?bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71:f.type==='image/jpeg'?bytes[0]===255&&bytes[1]===216:f.type==='image/webp'?new TextDecoder().decode(bytes.subarray(0,4))==='RIFF'&&new TextDecoder().decode(bytes.subarray(8,12))==='WEBP':false;
  if(!valid)return fail('Image file format is invalid');
  const ext=f.type==='image/png'?'png':f.type==='image/webp'?'webp':'jpg';const name=`${crypto.randomUUID()}.${ext}`;
  const db=serviceDb();const {error}=await db.storage.from('product-images').upload(name,bytes,{contentType:f.type,upsert:false});if(error)throw error;
  const {data}=db.storage.from('product-images').getPublicUrl(name);return respond({url:data.publicUrl});
 }catch(e){console.error('image upload',e);return fail('Image upload failed',503)}
}
