import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
test('watch-mode internal IPC messages cannot become test results',async()=>{const dir=mkdtempSync(path.join(tmpdir(),'agent-storage-watch-')),file=path.join(dir,'check.mjs'),url=new URL('../server/evaluate.mjs',import.meta.url).href;writeFileSync(file,`import {runCases} from ${JSON.stringify(url)};console.log('RESULT:'+JSON.stringify(await runCases('function solve(i){return i+1;}',[{input:1}])));`);const child=spawn(process.execPath,['--watch',file],{stdio:['ignore','pipe','pipe']});try{const result=await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(new Error('Watch-mode regression timed out.')),6000);child.stdout.on('data',b=>{output+=b;const m=/RESULT:(\[[^\n]+\])/.exec(output);if(m){clearTimeout(timer);resolve(JSON.parse(m[1]));}});child.once('error',e=>{clearTimeout(timer);reject(e);});});assert.ok(Array.isArray(result));assert.equal(result[0].actual,2);}finally{child.kill();await new Promise(resolve=>child.once('exit',resolve));rmSync(dir,{recursive:true,force:true});}});
