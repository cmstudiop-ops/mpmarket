import { createClient } from 'npm:@supabase/supabase-js@2.90.1';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST,OPTIONS'};
const respond=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json'}});
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 if(req.method!=='POST')return respond({error:'Method not allowed'},405);
 const auth=req.headers.get('Authorization');
 if(!auth?.startsWith('Bearer '))return respond({error:'Sign in first'},401);
 const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:auth}}});
 const {data:{user},error}=await db.auth.getUser();
 if(error||!user)return respond({error:'Unauthorized'},401);
 let payload:{prompt?:string;purpose?:string};
 try{payload=await req.json()}catch{return respond({error:'Invalid JSON'},400)}
 const prompt=String(payload.prompt||'').trim();
 if(!prompt||prompt.length>2000)return respond({error:'Prompt must be 1–2000 characters'},400);
 const purpose=payload.purpose==='polish'?'polish':'chat';
 const key=Deno.env.get('OPENAI_API_KEY');
 if(!key)return respond({error:'OPENAI_API_KEY not configured'},503);
 const {data:listings}=await db.from('mp_listings').select('title,price,location,category,condition').eq('status','active').limit(35);
 const system=purpose==='polish'?'You edit South African marketplace product descriptions. Preserve only the facts supplied by the seller. Never fabricate specifications, condition, warranties, accessories, or prices. Return only a clear description under 150 words.':'You are MP AI for MP MARKET in Mpumalanga South Africa. Suggest only actual marketplace listings in this supplied set, and never invent listings, seller identities, availability, prices, or guarantees. Give practical fraud prevention advice. If no matches, say so. Current live marketplace listings: '+JSON.stringify(listings||[]).slice(0,10000);
 try{
  const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-4.1-mini',messages:[{role:'system',content:system},{role:'user',content:prompt}],max_tokens:400,temperature:0.2})});
  if(!r.ok){
   let code='provider_error';
   try{const details=await r.json(); code=String(details?.error?.code||details?.error?.type||code).slice(0,80)}catch{}
   console.error('MP AI upstream request failed',{httpStatus:r.status,code});
   const message=r.status===401?'OpenAI API key rejected. Check the key in Supabase Secrets.'
    :r.status===429?(['insufficient_quota','credit_balance_exhausted'].includes(code)?'OpenAI API credits are unavailable. Add API credits or check your API billing balance.':'OpenAI rate limit reached. Please try again later.')
    :r.status===403?'OpenAI project permissions do not allow this request.'
    :r.status===400?'AI request rejected. Check the configured model and project access.'
    :'AI service returned HTTP '+r.status+'. Please check Edge Function logs.';
   return respond({error:message,provider_status:r.status,provider_code:code},502)
  }
  const j=await r.json();const reply=j.choices?.[0]?.message?.content;
  return reply?respond({reply}):respond({error:'No AI response'},502)
 }catch{return respond({error:'AI temporarily unavailable'},503)}
});