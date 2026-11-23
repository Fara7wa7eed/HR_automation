import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {scryptSync,timingSafeEqual} from 'node:crypto';

const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const routes={jobs:['GET','hr-open-jobs'],chat:['POST','brightpath-chat'],leave:['POST','brightpath-leave']};
function equal(a,b){let aa=Buffer.from(a),bb=Buffer.from(b);return aa.length===bb.length&&timingSafeEqual(aa,bb);}
export function verifyPassword(password,stored){try{let [type,salt,key]=stored.split(':');return type==='scrypt'&&salt.length===32&&key.length===128&&equal(scryptSync(password,salt,64).toString('hex'),key);}catch{return false;}}
export function createHandler({env=process.env,upstreamFetch=fetch,now=Date.now}={}){
 let attempts=new Map();
 let users={};try{users=JSON.parse(env.EMPLOYEE_USERS_JSON||'{}');}catch{}
 const origin=env.PORTAL_ORIGIN||'http://localhost:8080',n8n=env.N8N_BASE_URL||'http://127.0.0.1:5678';
 return async function handler(req,res){
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Security-Policy',"default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'; object-src 'none'");
  const send=(status,data)=>{if(res.writableEnded)return;res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
  try{
   let url=new URL(req.url,'http://localhost');
   // Apps Script uses this narrow, authenticated relay so the n8n editor stays private.
   if(url.pathname.startsWith('/webhook/')){
    const allowed=new Set(['brightpath-positions','brightpath-apply-external','brightpath-apply-referral','brightpath-leave-review']);
    const hook=url.pathname.slice('/webhook/'.length);if(!allowed.has(hook))return send(404,{ok:false});if(req.method!=='POST')return send(405,{ok:false});
    if(!env.N8N_WEBHOOK_KEY||!equal(req.headers['x-brightpath-key']||'',env.N8N_WEBHOOK_KEY))return send(401,{ok:false,error:'unauthorized'});
    const local=['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress||'');const https=!!req.socket.encrypted||(env.TRUST_HTTPS_PROXY==='true'&&req.headers['x-forwarded-proto']==='https');if(!https&&!local)return send(403,{ok:false,error:'https_required'});
    if(!(req.headers['content-type']||'').startsWith('application/json'))return send(415,{ok:false,error:'json_required'});
    const k='hook:'+(req.socket.remoteAddress||'unknown'),stamp=now(),b=attempts.get(k)||{since:stamp,count:0};if(stamp-b.since>60000){b.since=stamp;b.count=0;}attempts.set(k,b);if(++b.count>30)return send(429,{ok:false,error:'rate_limited'});
    let pieces=[],size=0;for await(const piece of req){size+=piece.length;if(size>16384)return send(413,{ok:false,error:'body_too_large'});pieces.push(piece);}let body;try{body=JSON.parse(Buffer.concat(pieces).toString());}catch{return send(400,{ok:false,error:'invalid_json'});}if(!body||Array.isArray(body)||typeof body!=='object')return send(400,{ok:false,error:'invalid_body'});
    try{const upstream=await upstreamFetch(n8n+'/webhook/'+hook,{method:'POST',redirect:'error',headers:{'Content-Type':'application/json','X-BrightPath-Key':env.N8N_WEBHOOK_KEY},body:JSON.stringify(body),signal:AbortSignal.timeout(135000)});const data=await upstream.json();return send(upstream.status,upstream.ok?data:{ok:false,error:'automation_failed',reference:data.reference});}catch{return send(502,{ok:false,error:'upstream_unavailable'});}
   }
   if(!url.pathname.startsWith('/api/')){
    if(req.method!=='GET'&&req.method!=='HEAD')return send(405,{ok:false});
    const staticFiles=new Set(['index.html','chatbot.html','leave.html','styles.css','app.js','config.js']);let name=url.pathname==='/'?'index.html':url.pathname.slice(1);if(!staticFiles.has(name))return send(404,{ok:false});
    let body=await fs.readFile(path.join(project,'portal',name));res.setHeader('Content-Type',name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.css')?'text/css; charset=utf-8':'text/javascript; charset=utf-8');res.writeHead(200);return res.end(req.method==='HEAD'?undefined:body);
   }
   if(req.headers.origin&&req.headers.origin!==origin)return send(403,{ok:false,error:'origin_denied'});
   res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');
   if(req.method==='OPTIONS'){res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');res.setHeader('Access-Control-Max-Age','600');res.writeHead(204);return res.end();}
   const ip=req.socket.remoteAddress||'unknown',stamp=now(),bucket=attempts.get(ip)||{since:stamp,count:0,failures:0};
   if(stamp-bucket.since>60000){bucket.since=stamp;bucket.count=0;bucket.failures=0;}
   if(attempts.size>10000){for(const [k,v]of attempts)if(stamp-v.since>60000)attempts.delete(k);if(attempts.size>10000)return send(503,{ok:false,error:'busy'});}
   attempts.set(ip,bucket);if(++bucket.count>60||bucket.failures>=5){res.setHeader('Retry-After','60');return send(429,{ok:false,error:'rate_limited',message:'Please wait a minute before trying again.'});}
   let route=url.pathname.slice(5),user;
   if(route!=='jobs'){
    const local=['127.0.0.1','::1','::ffff:127.0.0.1'].includes(ip);
    const https=!!req.socket.encrypted||(env.TRUST_HTTPS_PROXY==='true'&&req.headers['x-forwarded-proto']==='https');
    if(!https&&!local)return send(403,{ok:false,error:'https_required'});
    let auth=req.headers.authorization||'',email='',password='';if(auth.startsWith('Basic ')){const decoded=Buffer.from(auth.slice(6),'base64').toString('utf8'),pos=decoded.indexOf(':');if(pos>0){email=decoded.slice(0,pos).toLowerCase();password=decoded.slice(pos+1);}}
    const record=users[email];if(!record||password.length>256||!verifyPassword(password,record.passwordHash||'')){bucket.failures++;return send(401,{ok:false,error:'unauthorized',message:'Please check your employee sign-in details.'});}user={email,employeeId:record.employeeId};
    if(route==='me'){if(req.method!=='GET')return send(405,{ok:false});return send(200,{ok:true,...user});}
   }
   const spec=routes[route];if(!spec)return send(404,{ok:false});if(req.method!==spec[0])return send(405,{ok:false,error:'method_not_allowed'});
   if(route!=='jobs'&&!env.N8N_WEBHOOK_KEY)return send(503,{ok:false,error:'configuration_required',message:'Employee services are awaiting configuration. Please contact HR.'});
   let body;if(req.method==='POST'){
    if(!(req.headers['content-type']||'').startsWith('application/json'))return send(415,{ok:false,error:'json_required'});
    let chunks=[],size=0;for await(const chunk of req){size+=chunk.length;if(size>8192)return send(413,{ok:false,error:'body_too_large'});chunks.push(chunk);}try{body=JSON.parse(Buffer.concat(chunks).toString());}catch{return send(400,{ok:false,error:'invalid_json'});}if(!body||Array.isArray(body)||typeof body!=='object')return send(400,{ok:false,error:'invalid_body'});
    if(route==='chat'){if(typeof body.question!=='string'||!body.question.trim()||body.question.length>2000)return send(400,{ok:false,error:'invalid_question'});body={question:body.question.trim()};}
    if(route==='leave'){if(!user.employeeId)return send(403,{ok:false,error:'missing_employee_record'});body={requestId:body.requestId,start:body.start,end:body.end,employeeId:user.employeeId,email:user.email};}
   }
   let upstream;try{upstream=await upstreamFetch(n8n+'/webhook/'+spec[1],{method:req.method,redirect:'error',headers:{...(body?{'Content-Type':'application/json'}:{}),...(route!=='jobs'?{'X-BrightPath-Key':env.N8N_WEBHOOK_KEY}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(135000)});}catch{return send(502,{ok:false,error:'upstream_unavailable',message:'The HR service is unavailable. Please try again.'});}
   let data;try{data=await upstream.json();}catch{return send(502,{ok:false,error:'invalid_upstream_response'});}
   if(!upstream.ok)return send(upstream.status>=500?503:upstream.status,{ok:false,error:'request_failed',message:'The request could not be completed. Please contact HR.',...(data.reference?{reference:data.reference}:{})});
   return send(upstream.status,data);
  }catch{return send(500,{ok:false,error:'internal_error'});}
 };
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.env.PORT||8080),host=process.env.HOST||'127.0.0.1';
 http.createServer(createHandler()).listen(port,host,()=>console.log('BrightPath portal: http://'+host+':'+port));
}
