import {parentPort,workerData} from 'node:worker_threads';
import {getQuickJS} from 'quickjs-emscripten';
import {executable} from './workspace.mjs';
const Q=await getQuickJS(),results=[];let code,workspaceError;
try{code=executable(workerData.code);}catch(e){workspaceError=e.message;}
for(const t of workerData.tests){
 if(workspaceError){results.push({error:workspaceError,durationMs:0});continue;}
 const runtime=Q.newRuntime();runtime.setMemoryLimit(64*1024*1024);runtime.setMaxStackSize(1024*1024);
 const budget=t.budgetMs||750,deadline=Date.now()+budget;runtime.setInterruptHandler(()=>Date.now()>deadline);
 const ctx=runtime.newContext();const start=performance.now();
 try{
  const setup=ctx.evalCode('"use strict";\n'+code+'\n;typeof solve === "function"');
  if(setup.error){const message=ctx.dump(setup.error);setup.error.dispose();throw new Error(message?.message||'Invalid JavaScript');}
  const defined=ctx.dump(setup.value);setup.value.dispose();if(!defined)throw new Error('Define solve(input) or export the entry function.');
  const evaluated=ctx.evalCode(`(()=>{const input=JSON.parse(${JSON.stringify(JSON.stringify(t.input))});const before=JSON.stringify(input);const actual=solve(input);return JSON.stringify({actual,unchanged:before===JSON.stringify(input)});})()`);
  if(evaluated.error){const message=ctx.dump(evaluated.error);evaluated.error.dispose();throw new Error(message?.message||'Execution failed');}
  const raw=ctx.dump(evaluated.value);evaluated.value.dispose();if(typeof raw!=='string')throw new Error('Return a synchronous JSON-serializable value.');
  const durationMs=Math.round((performance.now()-start)*100)/100;
  if(durationMs>budget)throw new Error('Execution budget exceeded.');
  const value=JSON.parse(raw);if(!Object.hasOwn(value,'actual'))throw new Error('Return a JSON-serializable value.');if(t.assertUnchanged&&!value.unchanged)throw new Error('Input mutation violates the release contract.');results.push({actual:value.actual,durationMs});
 }catch(e){results.push({error:String(e.message).slice(0,250),durationMs:Math.round(performance.now()-start)});}finally{ctx.dispose();runtime.dispose();}
}
parentPort.postMessage(results);
