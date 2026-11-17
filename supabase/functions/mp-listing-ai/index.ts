// MP MARKET AI — deployed as Supabase Edge Function mp-listing-ai.
// Set OPENAI_API_KEY as a Supabase Edge Function secret. Never commit it.
import { createClient } from 'npm:@supabase/supabase-js@2.90.1';
const cors = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST,OPTIONS'};
const json = (obj:unknown,status=200)=>new Response(JSON.stringify(obj),{status,headers:{...cors,'Content-Type':'application/json'}});
Deno.serve(async req=>{
 if(req.method==='OPTIONS') return new Response('ok',{headers:cors});
 if(req.method!=='POST')return json({error:'Method not allowed'},405);
 const token=req.headers.get('Authorization');
 if(!token?.startsWith('Bearer '))return json({error:'Sign in first'},401);
 const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:token}}});
 const {data:{user},error}=await db.auth.getUser();
 if(error||!user)return json({error:'Unauthorized'},401);
 let body:{prompt?:string;purpose?:string};
 try{body=await req.json()}catch{return json({error:'Invalid JSON'},400)}
 const prompt=String(body.prompt||'').trim();
 if(!prompt||prompt.length>2000)return json({error:'Prompt must be between 1 and 2000 characters'},400);
 const key=Deno.env.get('OPENAI_API_KEY');
 if(!key)return json({error:'AI key not configured'},503);
 const {data:live}=await db.from('mp_listings').select('title,price,location,category,condition').eq('status','active').limit(35);
 const instructions=body.purpose==='polish'
  ? 'Polish marketplace product descriptions using only facts supplied by the seller. Never invent specs, warranty, defects or prices. Return only the final description under 150 words.'
  : 'You are MP AI for MP MARKET in Mpumalanga, South Africa. Only suggest products actually in the supplied live listing data. Never fabricate sellers, prices, listings or guarantees. Offer helpful, concise advice about scams and safe buying. Live listings: '+JSON.stringify(live||[]).slice(0,10000);
 try{
  const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-4.1-mini',temperature:0.2,max_tokens:400,messages:[{role:'system',content:instructions},{role:'user',content:prompt}]})});
  if(!r.ok)return json({error:'AI service temporarily unavailable'},502);
  const result=await r.json();
  const reply=result.choices?.[0]?.message?.content;
  return reply?json({reply}):json({error:'Empty AI response'},502);
 }catch{return json({error:'AI temporarily unavailable'},503)}
});