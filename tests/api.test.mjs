import http from 'node:http';
import path from 'node:path';
import test from 'node:test';
import {mkdtempSync,copyFileSync,writeFileSync,rmSync,readdirSync,readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const project=path.resolve(import.meta.dirname,'..'),dir=mkdtempSync(project+'/.postgres-test-');
for(const f of readdirSync(project+'/server').filter(f=>f.endsWith('.mjs')||f.endsWith('.json')))if(f!=='db.mjs')copyFileSync(project+'/server/'+f,dir+'/'+f);
writeFileSync(dir+'/db.mjs',`
import {PGlite} from '@electric-sql/pglite';
export const engine=new PGlite();
await engine.exec(\`CREATE SCHEMA app_private;
CREATE TABLE app_private.users(id TEXT PRIMARY KEY,name TEXT,email TEXT UNIQUE,password TEXT,created BIGINT);
CREATE TABLE app_private.sessions(token TEXT PRIMARY KEY,user_id TEXT REFERENCES app_private.users(id),expires BIGINT);
CREATE TABLE app_private.attempts(id TEXT PRIMARY KEY,user_id TEXT REFERENCES app_private.users(id),challenge_id TEXT,version INTEGER,difficulty TEXT,started BIGINT,deadline BIGINT,status TEXT,code TEXT,explanation TEXT DEFAULT '',report TEXT,reason TEXT,ai_count INTEGER DEFAULT 0,model TEXT,revision INTEGER DEFAULT 0);
CREATE TABLE app_private.messages(id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,attempt_id TEXT REFERENCES app_private.attempts(id),role TEXT,content TEXT,created BIGINT);
CREATE TABLE app_private.snapshots(id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,attempt_id TEXT REFERENCES app_private.attempts(id),code TEXT,created BIGINT);\`);
function adapter(client){const sql=async(parts,...values)=>{const query=parts.reduce((s,p,i)=>s+(i?'$'+i:'')+p,'');if(query.includes('pg_advisory_xact_lock'))return [];return (await client.query(query,values)).rows;};sql.unsafe=async(q,args)=> (await client.query(q,args)).rows;sql.begin=cb=>engine.transaction(tx=>cb(adapter(tx)));return sql;}
export const sql=adapter(engine);
export function normalizeRow(row){if(!row)return;const r={...row};for(const k of ['created','started','deadline','expires','version','revision','ai_count'])if(r[k]!=null)r[k]=Number(r[k]);return r;}
`);
test('Supabase-compatible PostgreSQL API and Vercel request grading',async()=>{
process.env.VERCEL='1';process.env.AI_PROVIDER='openai-compatible';process.env.AI_API_KEY='test-only';process.env.AI_MODEL='mock';process.env.AI_BASE_URL='https://test.invalid/v1';
const nativeFetch=globalThis.fetch;globalThis.fetch=(url,options)=>String(url).startsWith('https://test.invalid')?Promise.resolve(Response.json({choices:[{message:{content:'hello'}}]})):nativeFetch(url,options);
let server,engine;
try{
 writeFileSync(dir+'/entry.mjs',readFileSync(project+'/api/index.mjs','utf8').replace('../server/index.mjs','./index.mjs'));
 const {default:entry}=await import(pathToFileURL(dir+'/entry.mjs'));server=http.createServer(entry);({engine}=await import(pathToFileURL(dir+'/db.mjs')));const {challenges}=await import(pathToFileURL(dir+'/challenges.mjs'));
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const previewHost=await fetch(base+'/preview-host.html');assert.equal(previewHost.status,200);assert.equal(previewHost.headers.get('x-frame-options'),null);assert.match(previewHost.headers.get('content-security-policy'),/sandbox allow-scripts/);
 let cookie='';async function api(p,method='GET',data){const r=await fetch(base+'/api/index?route='+encodeURIComponent(p.replace(/^\//,'')),{method,headers:{'Content-Type':'application/json',Cookie:cookie},...(data?{body:JSON.stringify(data)}:{})});const body=await r.json();return {status:r.status,body,cookie:r.headers.get('set-cookie')?.split(';')[0]};}
 const signup=await api('/auth/signup','POST',{name:'Migration Test',email:'migration@example.com',password:'testing-migration-123'});assert.equal(signup.status,201,JSON.stringify(signup));cookie=signup.cookie;
 assert.equal((await api('/me')).body.name,'Migration Test');
 assert.equal((await api('/auth/signup','POST',{name:'Migration Test',email:'migration@example.com',password:'testing-migration-123'})).status,409);
 assert.equal((await api('/config')).body.counts.hard,10);
 const started=await api('/attempts','POST',{difficulty:'easy',category:'UI & rendering',model:'mock'});assert.equal(started.status,201,JSON.stringify(started));const a=started.body;const ownerCookie=cookie;const other=await api('/auth/signup','POST',{name:'Other Engineer',email:'other@example.com',password:'testing-migration-123'});cookie=other.cookie;assert.equal((await api('/attempts/'+a.id)).status,404);cookie=ownerCookie;assert.equal(typeof a.deadline,'number');const correct=challenges.find(c=>c.id===a.challenge_id).reference;
 const draft=await api('/attempts/'+a.id+'/draft','PUT',{code:correct,explanation:'Migration test.',revision:0,snapshot:true});assert.equal(draft.status,200,JSON.stringify(draft));assert.equal(draft.body.revision,1);
 const examples=await api('/attempts/'+a.id+'/examples','POST',{code:correct});assert.equal(examples.body.score,100);
 const full=await api('/attempts/'+a.id+'/check','POST',{code:correct});assert.equal(full.body.totalChecks,40);assert.equal(full.body.score,100);assert.equal(full.body.checks.length,2);assert.deepEqual(full.body.hiddenSummary,{passed:38,total:38});
 assert.equal((await api('/attempts/'+a.id+'/chat','POST',{message:'Hello'})).body.answer,'hello');
 const submitted=await api('/attempts/'+a.id+'/submit','POST',{code:correct,explanation:'Verified.',revision:1});assert.equal(submitted.status,200,JSON.stringify(submitted));
 let final;for(let n=0;n<50;n++){const r=await api('/attempts/'+a.id);if(r.body.status==='submitted'){final=r.body;break;}await new Promise(r=>setTimeout(r,100));}assert.equal(final.report.score,100);assert.equal(final.messages.length,2);
 assert.equal((await api('/attempts/'+a.id+'/draft','PUT',{code:'bad',revision:2})).status,409);
 const second=await api('/attempts','POST',{difficulty:'hard'});await engine.query('UPDATE app_private.attempts SET deadline=$1 WHERE id=$2',[Date.now()-1,second.body.id]);await api('/attempts/'+second.body.id);let timeout;for(let n=0;n<50;n++){const r=await api('/attempts/'+second.body.id);if(r.body.status==='submitted'){timeout=r.body;break;}await new Promise(r=>setTimeout(r,100));}assert.equal(timeout.reason,'timeout');
 assert.equal((await api('/attempts')).body.length,2);
 await api('/auth/logout','POST',{});assert.equal((await api('/me')).status,401);
 console.log('PASS: PostgreSQL engine integration: signup/session, private schema queries, row normalization, assignment, snapshots/revisions, examples, 40-case checks, AI adapter, immutable submission, queue claim, timeout grading, history and logout.');
}finally{if(server)await new Promise(r=>server.close(r));if(engine)await engine.close();rmSync(dir,{recursive:true,force:true});}

});
