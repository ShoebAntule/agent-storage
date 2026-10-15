import {Worker} from 'node:worker_threads';
import {isDeepStrictEqual} from 'node:util';
import {analyze} from './quality.mjs';
export async function runCases(code,tests){
 if(typeof code!=='string'||Buffer.byteLength(code)>60000)throw new Error('Workspace must be at most 60 KB.');
 return new Promise((resolve,reject)=>{const worker=new Worker(new URL('./runner-worker.mjs',import.meta.url),{execArgv:[],workerData:{code,tests},resourceLimits:{maxOldGenerationSizeMb:192}});const timer=setTimeout(()=>{worker.terminate();reject(new Error('Runner exceeded total execution budget.'));},Math.max(6000,tests.reduce((n,t)=>n+(t.budgetMs||750),0)+6000));worker.on('message',r=>{if(!Array.isArray(r))return;clearTimeout(timer);resolve(r);});worker.once('error',e=>{clearTimeout(timer);reject(e);});worker.once('exit',c=>{if(c){clearTimeout(timer);reject(new Error('Runner stopped unexpectedly.'));}});});
}
export async function evaluate(challenge,code,{examplesOnly=false,seed}={}){
 const suite=challenge.buildTests&&seed!==undefined?challenge.buildTests(seed):challenge.tests;
 const tests=examplesOnly?suite.filter(t=>!t.hidden):suite;
 let quality;try{quality=analyze(code);}catch(e){quality={prohibited:true,metrics:{},findings:[{severity:'error',message:'Invalid workspace format.'}]};}
 const runs=quality.prohibited&&challenge.version===2?tests.map(()=>({error:'Prohibited dynamic code execution or invalid workspace.',durationMs:0})):await runCases(code,tests);
 const internal=tests.map((t,i)=>({...t,...runs[i],passed:!runs[i].error&&isDeepStrictEqual(runs[i].actual,t.expected)}));
 const strict=challenge.version===2,total=internal.reduce((a,c)=>a+(c.weight||1),0),passedChecks=internal.filter(c=>c.passed).length;
 const score=Math.round(internal.reduce((a,c)=>a+(c.passed?(c.weight||1):0),0)/total*100),securityGatePassed=internal.every(c=>!c.critical||c.passed),performanceGatePassed=internal.every(c=>c.kind!=='performance'||c.passed);
 const checks=internal.map((c,i)=>c.hidden?{caseNumber:i+1,name:`Case ${i+1}`,hidden:true,passed:c.passed}:{caseNumber:i+1,name:c.name,hidden:false,passed:c.passed,input:c.input,expected:c.expected,actual:c.actual,durationMs:c.durationMs,...(c.error?{error:c.error}:{})});
 return {score,passed:strict?passedChecks===tests.length&&!quality.prohibited:score>=60&&securityGatePassed,securityGatePassed,performanceGatePassed,checks,passedChecks,totalChecks:checks.length,failedCaseNumbers:checks.filter(c=>!c.passed).map(c=>c.caseNumber),kind:examplesOnly?'examples':'submission',quality,feedback:passedChecks===tests.length?'Every defined check passed. Review findings and explain your implementation. This is evidence for this suite, not a universal security certification.':`${passedChecks} of ${checks.length} checks passed. Revisit the release contract, review the existing files, and reproduce edge cases with your own inputs. Hidden inputs and expected outputs are withheld.`,evaluatedAt:new Date().toISOString(),rubricVersion:strict?2:1};
}
