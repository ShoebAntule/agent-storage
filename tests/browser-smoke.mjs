// Optional real-browser smoke test. Uses only authored fixtures and a mock API.
import http from 'node:http';
import {readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {challenges,publicChallenge} from '../server/challenges.mjs';
const project=path.resolve(import.meta.dirname,'..');
let selected=challenges.find(c=>c.id==='project-v3-seat-counter');
let attempt;
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname.startsWith('/api/')){
  let data;for await(const chunk of req)data=(data||'')+chunk;data=data?JSON.parse(data):{};
  res.setHeader('Content-Type','application/json');
  const route=url.pathname.slice(4);
  if(route==='/me')return res.end(JSON.stringify({id:'u',name:'Preview Engineer',email:'test@example.com'}));
  if(route==='/config')return res.end(JSON.stringify({configured:false,models:[],model:'',maxRequests:15,categories:['UI & rendering'],counts:{easy:10,medium:10,hard:10}}));
  if(route==='/attempts'&&req.method==='GET')return res.end('[]');
  if(route==='/attempts'&&req.method==='POST'){attempt={id:'a',challenge_id:selected.id,difficulty:selected.difficulty,started:Date.now(),deadline:Date.now()+600000,status:'active',code:selected.reference,explanation:'',revision:0,report:null,serverNow:Date.now(),challenge:publicChallenge(selected),messages:[],ai_count:0,model:'mock'};return res.end(JSON.stringify(attempt));}
  if(route==='/attempts/a')return res.end(JSON.stringify({...attempt,serverNow:Date.now()}));
  if(route==='/attempts/a/draft'){attempt={...attempt,code:data.code,revision:attempt.revision+1};return res.end(JSON.stringify({revision:attempt.revision}));}
  if(route==='/attempts/a/check')return res.end(JSON.stringify({passedChecks:11,totalChecks:40,checks:[{name:'Baseline',hidden:false,passed:true},{name:'Boundary',hidden:false,passed:false}],score:28}));
  res.statusCode=404;return res.end('{}');
 }
 let file=path.join(project,'dist',url.pathname==='/'?'index.html':url.pathname);
 if(!existsSync(file))file=path.join(project,'dist/index.html');
 res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'image/svg+xml');
 if(file.endsWith('preview-host.html'))res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'; sandbox allow-scripts");
 else if(file.endsWith('index.html'))res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; frame-src 'self'; connect-src 'self'; img-src 'self' data:");
 res.end(readFileSync(file));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;
try{
 const options={headless:true};
 if(process.env.CHROMIUM_EXECUTABLE)options.executablePath=process.env.CHROMIUM_EXECUTABLE;
 if(process.env.CHROMIUM_ARGS)options.args=JSON.parse(process.env.CHROMIUM_ARGS);
 browser=await chromium.launch(options);const page=await browser.newPage({viewport:{width:1440,height:1050}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const c of challenges.filter(c=>c.runtime==='browser')){
  selected=c;await page.goto('http://127.0.0.1:'+server.address().port);await page.getByRole('button',{name:'Enter the lab'}).click();
  await page.getByRole('button',{name:'Run Preview',exact:true}).click();
  const frame=page.frameLocator('iframe[title="Challenge live preview"]');
  await frame.locator('#app h2').waitFor();assert.equal(await frame.locator('#preview-errors').textContent(),'');
  if(c.id.endsWith('seat-counter')){
   assert.equal(await frame.getByTestId('count').textContent(),'2');await frame.getByRole('button',{name:'Add seats'}).click();assert.equal(await frame.getByTestId('count').textContent(),'3');
   await frame.getByRole('button',{name:'Reset',exact:true}).click();assert.equal(await frame.getByTestId('count').textContent(),'2');
  }
  if(c.id.endsWith('approval-form')){
   await frame.getByLabel('Customer name').fill('Alice');await frame.getByLabel('Amount in cents').fill('100');await frame.getByRole('button',{name:'Approve',exact:true}).click();await frame.locator('#app [role="status"]').waitFor();assert.match(await frame.locator('#app [role="status"]').textContent(),/Alice/);
  }
  if(c.id.endsWith('search-races')){
   await frame.getByLabel('Search',{exact:true}).fill('ali');await frame.getByRole('button',{name:'Resolve current request'}).click();assert.equal(await frame.getByRole('option').count(),2);await frame.getByRole('button',{name:'Next',exact:true}).click();await frame.getByRole('button',{name:'Select',exact:true}).click();assert.match(await frame.locator('#app').textContent(),/Selected: a/);
  }
  if(c.id.endsWith('optimistic-board')){
   await frame.getByRole('button',{name:'Move ticket'}).first().click();assert.equal(await frame.locator('[aria-busy="true"]').count(),1);await frame.getByRole('button',{name:'Reject',exact:true}).click();assert.equal(await frame.locator('[aria-busy="true"]').count(),0);
  }
  if(c.id.endsWith('virtual-grid')){
   assert.equal(await frame.getByRole('row').count(),6);await frame.getByRole('button',{name:'Descending',exact:true}).click();assert.equal(await frame.getByRole('row').count(),6);
  }
  if(c.id.endsWith('offline-profile')){
   await frame.getByLabel('name',{exact:true}).fill('Local');await frame.getByRole('button',{name:'Simulate remote update'}).click();await frame.locator('#app [role="alert"]').waitFor();assert.equal(await frame.getByRole('button',{name:'Save profile'}).isDisabled(),true);await frame.getByRole('button',{name:'Keep local name'}).click();assert.equal(await frame.getByRole('button',{name:'Save profile'}).isDisabled(),false);
  }
  const isolated=await frame.locator('body').evaluate(()=>{try{return !!parent.document.body;}catch{return 'blocked';}});assert.equal(isolated,'blocked');
  await page.getByRole('button',{name:'Full checks',exact:true}).click();await page.getByText('11/40 checks passed').waitFor();assert.equal(await page.locator('.check-list details').count(),2);assert.equal(await page.getByText('Case 13',{exact:true}).count(),0);
  if(c.id.endsWith('seat-counter'))await page.screenshot({path:process.env.SMOKE_SCREENSHOT||'/tmp/agent-storage-workspace.png',fullPage:true});
  console.log('Browser PASS:',c.id);
 }
 assert.deepEqual(errors,[]);
 // Phone-sized layout should not create a document-wide horizontal scrollbar.
 await page.setViewportSize({width:390,height:844});await page.reload();await page.getByRole('button',{name:'Enter the lab'}).click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
}finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
