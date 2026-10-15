import test from 'node:test';
import assert from 'node:assert/strict';
import {allChallenges,publicChallenge} from '../server/challenges.mjs';
const challenges=allChallenges.filter(c=>c.version===2);
import {scenarios} from '../server/scenarios.mjs';
import {evaluate,runCases} from '../server/evaluate.mjs';
import {packFiles,executable,unpackFiles} from '../server/workspace.mjs';
import {analyze} from '../server/quality.mjs';
test('30 projects each contain 40 checks, 38 hidden and two workload checks',()=>{for(const c of challenges){assert.equal(c.version,2);assert.equal(c.tests.length,40);assert.equal(c.tests.filter(t=>t.hidden).length,38);assert.equal(c.tests.filter(t=>t.kind==='performance').length,2);assert.ok(Object.keys(c.files).length>=4);const p=publicChallenge(c);assert.equal(p.buildTests,undefined);assert.equal(p.tests,undefined);assert.equal(p.reference,undefined);assert.equal(p.testCount,40);}});
test('manual business invariants independently verify all ten oracles',()=>{
 const byId=id=>scenarios.find(s=>s.id===id).reference;
 for(const l of [1,2,3]){
 const checkout={tenant:'t',actor:{tenant:'other'},catalog:[{id:'a',price:100}],stock:{a:1},requests:[{key:'r',items:[{id:'a',qty:1}]}]};assert.deepEqual(byId('checkout')(checkout,l),{stock:{a:1},results:[{status:'denied'}]});
 assert.equal(byId('policy')({actor:{tenant:'t',roles:['admin']},resource:{tenant:'other',path:'/a'},action:'read',rules:[{effect:'allow',role:'admin',action:'read',path:'/a'}],now:0},l),false);
 assert.deepEqual(byId('limiter')({limit:2,window:10,requests:[{tenant:'t',user:'u',time:0,cost:2,id:'a'},{tenant:'t',user:'u',time:10,cost:2,id:'b'}]},l),[true,true]);
 assert.deepEqual(byId('cache')({capacity:1,events:[{op:'put',tenant:'t',key:'a',time:0,ttl:1,value:false},{op:'get',tenant:'t',key:'a',time:1}]},l),[true,null]);
 assert.deepEqual(byId('routing')({servers:[{id:'a',weight:3,healthy:true,capacity:9},{id:'b',weight:1,healthy:true,capacity:9}],events:Array.from({length:4},()=>({op:'route'}))},l),['a','a','b','a']);
 assert.equal(byId('pipeline')({budget:2,jobs:[{id:'a',deps:['b'],cpu:1,priority:1},{id:'b',deps:['a'],cpu:1,priority:1}]},l),null);
 assert.deepEqual(byId('retrieval')({tenant:'t',query:[1,0],k:1,documents:[{id:'secret',tenant:'other',vector:[1,0],revision:9},{id:'ok',tenant:'t',vector:[0,1],revision:1}]},l),['ok']);
 assert.deepEqual(byId('reservations')({stock:{a:1,b:1},events:[{op:'reserve',id:'r',time:0,ttl:1,items:{a:1,b:2}}]},l),{stock:{a:1,b:1},results:[false]});
 assert.deepEqual(byId('journal')({tenant:'t',events:[{eventId:'a',tenant:'t',paymentId:'p',version:0,status:'paid',amount:17}]},l),[{paymentId:'p',version:0,status:'paid',amount:17}]);
 assert.deepEqual(byId('projection')({tenant:'t',events:[{id:'a',tenant:'t',entity:'x',version:2,op:'delete'},{id:'b',tenant:'t',entity:'x',version:1,op:'upsert',data:{x:1}}]},l),[]);
 }
});
test('all senior oracle implementations leave request inputs unchanged',()=>{for(const c of challenges){const ref=scenarios.find(s=>s.id===c.scenario).reference;for(const t of c.tests){const before=JSON.stringify(t.input);ref(t.input,c.level);assert.equal(JSON.stringify(t.input),before);}}});
test('hidden test reports contain only opaque case identifiers and verdicts',async()=>{const c=challenges[0];const r=await evaluate(c,c.reference);for(const check of r.checks.filter(c=>c.hidden))assert.deepEqual(Object.keys(check).sort(),['caseNumber','hidden','name','passed']);assert.equal(r.score,100);assert.equal(r.passed,true);});
test('a solution hardcoded to both examples passes examples but fails full checks',async()=>{const c=challenges.find(c=>c.scenario==='checkout'&&c.level===3);const pairs=c.tests.slice(0,2).map(t=>[JSON.stringify(t.input),t.expected]);const code=`function solve(input){const pairs=JSON.parse(${JSON.stringify(JSON.stringify(pairs))});return pairs.find(p=>p[0]===JSON.stringify(input))?.[1]??null;}`;const examples=await evaluate(c,code,{examplesOnly:true});assert.equal(examples.passedChecks,2);const full=await evaluate(c,code);assert.ok(full.passedChecks<full.totalChecks);assert.equal(full.passed,false);});
test('generated hidden suites vary by seed, stay reproducible, and preserve visible examples',()=>{for(const c of challenges){const a=c.buildTests(100),b=c.buildTests(101);assert.deepEqual(a,c.buildTests(100));assert.deepEqual(a.slice(0,2),b.slice(0,2));assert.notDeepEqual(a.slice(12),b.slice(12));}});
test('strict full-credit requirement rejects a partial score',async()=>{const c={version:2,tests:[{input:1,expected:1,weight:1},{input:2,expected:9,weight:1,hidden:true}]};const r=await evaluate(c,'function solve(i){return i;}');assert.equal(r.score,50);assert.equal(r.passed,false);});
test('workspace modules execute and prototype-like JSON input keys survive transport',async()=>{const code=packFiles({'solution.js':"const {sum}=require('./lib.js');module.exports=i=>({sum:sum(i.x),keys:Object.keys(i.stock)});",'lib.js':'exports.sum=a=>a.reduce((s,n)=>s+n,0);'});const r=await runCases(code,[{input:{x:[1,2],stock:JSON.parse('{"__proto__":2}')}}]);assert.deepEqual(r[0].actual,{sum:3,keys:['__proto__']});assert.ok(unpackFiles(code)['lib.js']);});
test('quality review is structural, not a line-count penalty',()=>{const q=analyze('function solve(i){ if(i) return 1; return 0; debugger; }');assert.ok(q.metrics.branches>=1);assert.ok(q.findings.some(f=>f.message.includes('Unreachable')));assert.equal(q.prohibited,false);assert.equal(analyze('function solve(){return eval("1");}').prohibited,true);});
test('performance deadline interrupts excessive work in the isolated runner',async()=>{const r=await runCases('function solve(){while(true){}}',[{input:null,budgetMs:20}]);assert.ok(r[0].error);});
test('input non-mutation requirement is executable rather than a text-only promise',async()=>{const r=await runCases('function solve(input){input.x=2;return 1;}',[{input:{x:1},assertUnchanged:true}]);assert.ok(r[0].error.includes('Input mutation'));});
