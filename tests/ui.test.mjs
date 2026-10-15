import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import path from 'node:path';
import {JSDOM} from 'jsdom';
import {transformWithOxc} from 'vite';
import {challenges,publicChallenge} from '../server/challenges.mjs';
test('Senior React journey: signup, file tabs, draft, hidden checks, reasoning and submission',async()=>{
 const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://127.0.0.1:5173'});
 for(const key of ['window','document','HTMLElement','HTMLDialogElement','MutationObserver','Node','Event','MouseEvent','KeyboardEvent','FormData'])Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true,writable:true});
 Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
 globalThis.getComputedStyle=dom.window.getComputedStyle;globalThis.requestAnimationFrame=cb=>setTimeout(cb,0);
 dom.window.HTMLElement.prototype.scrollIntoView=function(){};dom.window.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};dom.window.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
 const {render,screen,waitFor,cleanup}=await import('@testing-library/react');const {default:userEvent}=await import('@testing-library/user-event');const React=await import('react');const user=userEvent.setup({document:dom.window.document});
 const root=path.resolve(import.meta.dirname,'..'),dir=mkdtempSync(path.join(root,'.ui-test-'));
 let source=readFileSync(path.join(root,'src/main.tsx'),'utf8').replace("import './style.css';",'').replace("from './workspace'","from './workspace.mjs'").replace('function App(){','export function App(){').replace("createRoot(document.getElementById('root')!).render(<App/>);",'');
 writeFileSync(path.join(dir,'workspace.mjs'),(await transformWithOxc(readFileSync(path.join(root,'src/workspace.ts'),'utf8'),'workspace.ts')).code);
 writeFileSync(path.join(dir,'ui.mjs'),(await transformWithOxc(source,'main.tsx')).code);
 const challenge=publicChallenge(challenges[0]);let authenticated=false,current=null,startBody=null,saveCount=0;
 globalThis.fetch=async(url,options={})=>{
  const route=String(url).replace('/api',''),method=options.method||'GET',b=options.body?JSON.parse(options.body):{};
  if(route==='/me')return Response.json(authenticated?{id:'u',name:'Shoeb',email:'test@example.com'}:{error:'Please sign in.'},{status:authenticated?200:401});
  if(route==='/auth/signup'){authenticated=true;return Response.json({id:'u',name:b.name,email:b.email});}
  if(route==='/config')return Response.json({configured:false,provider:'gemini',model:'',models:[],maxRequests:15,categories:['UI state'],counts:{easy:10,medium:10,hard:10}});
  if(route==='/attempts'&&method==='GET')return Response.json(current?[{...current,title:challenge.title,category:challenge.category}]:[]);
  if(route==='/attempts'&&method==='POST'){startBody=b;current={id:'a',challenge_id:challenge.id,difficulty:'easy',started:Date.now(),deadline:Date.now()+600000,status:'active',code:challenge.starter,explanation:'',revision:0,report:null,reason:null,serverNow:Date.now(),challenge,messages:[],ai_count:0,model:'unconfigured'};return Response.json(current);}
  if(route==='/attempts/a')return Response.json({...current,serverNow:Date.now()});
  if(route==='/attempts/a/draft'){saveCount++;current={...current,code:b.code,explanation:b.explanation,revision:current.revision+1};return Response.json({revision:current.revision,savedAt:Date.now()});}
  if(route==='/attempts/a/check')return Response.json({score:100,passed:true,checks:Array.from({length:40},(_,i)=>({caseNumber:i+1,name:'Case '+(i+1),hidden:true,passed:true})),passedChecks:40,totalChecks:40});
  if(route==='/attempts/a/examples')return Response.json({score:100,passed:true,checks:[],passedChecks:2,totalChecks:2});
  if(route==='/attempts/a/submit'){current={...current,status:'submitted',reason:'manual',report:{score:100,passed:true,securityGatePassed:true,checks:[],passedChecks:5,totalChecks:5,feedback:'All checks passed.'}};return Response.json(current);}
  throw new Error('Unexpected mock request '+method+' '+route);
 };
 try{
  const {App}=await import(path.join(dir,'ui.mjs'));render(React.createElement(App));
  await screen.findByText('Welcome back.');await user.click(screen.getByRole('button',{name:'Create an account'}));
  await user.type(screen.getByLabelText('Your name'),'Shoeb');await user.type(screen.getByLabelText('Email address'),'test@example.com');await user.type(screen.getByLabelText('Password'),'a-long-password');await user.click(screen.getByRole('button',{name:'Create account'}));
  await screen.findByRole('heading',{name:/Your engineering playground/});assert.ok(screen.getByText('30'));
  await user.click(screen.getByRole('button',{name:/Easy/}));await user.click(screen.getByRole('button',{name:'Enter the lab'}));
  await screen.findByRole('heading',{name:challenge.title,level:1});assert.equal(startBody.difficulty,'easy');assert.match(document.querySelector('.timer strong').textContent,/^(09:\d{2}|10:0[01])$/);
  await user.click(screen.getByRole('button',{name:/RELEASE.md/}));assert.equal(screen.getByLabelText('JavaScript solution editor').readOnly,true);await user.click(screen.getByRole('button',{name:'solution.js'}));assert.ok(screen.getByLabelText('JavaScript solution editor').value.includes('require'));await user.click(screen.getByRole('button',{name:'service.js'}));const editor=screen.getByLabelText('JavaScript solution editor');await user.clear(editor);await user.type(editor,'function solve(input) {{ return 1; }',{skipClick:true});
  await waitFor(()=>assert.ok(saveCount>0),{timeout:2000});assert.ok(current.code.includes('function solve'));
  assert.equal(screen.getByLabelText('Message to AI assistant').disabled,true);
  await user.click(screen.getByRole('button',{name:'Full checks'}));await screen.findByText('40/40 checks passed');assert.ok(screen.getByText('Case 13'));await user.click(screen.getByRole('button',{name:'Run examples'}));await screen.findByText('2/2 examples passed');
  await user.click(screen.getByRole('button',{name:'Your reasoning'}));assert.ok(screen.getByRole('button',{name:'Insert review checkpoints'}));await user.type(screen.getByPlaceholderText(/My assumptions/),'I checked the boundaries.');
  await user.click(screen.getByRole('button',{name:'Submit solution'}));await screen.findByRole('dialog');await user.click(screen.getByRole('button',{name:'Submit & evaluate'}));
  await screen.findByText('ASSESSMENT PASSED');assert.equal(current.explanation,'I checked the boundaries.');assert.ok(screen.getByText('100'));assert.equal(current.status,'submitted');
 }finally{cleanup();rmSync(dir,{recursive:true,force:true});dom.window.close();}
});
