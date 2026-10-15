import {writeFileSync} from 'node:fs';
import {format} from 'prettier';
process.env.REBUILD_PROJECT_SOURCES='1';
const {projects}=await import('../server/catalog-v3.mjs');
import {unpackFiles,packFiles} from '../server/workspace.mjs';
const output={};
for(const c of projects){const formatFiles=async files=>Object.fromEntries(await Promise.all(Object.entries(files).map(async([name,text])=>{const parser=name.endsWith('.js')?'babel':name.endsWith('.css')?'css':name.endsWith('.html')?'html':name.endsWith('.json')?'json':'markdown';return [name,await format(text,{parser,printWidth:88,singleQuote:true})];})));const files=await formatFiles(unpackFiles(c.starter)),referenceFiles=await formatFiles(unpackFiles(c.reference));output[c.id]={files,starter:packFiles(files),reference:packFiles(referenceFiles)};}
writeFileSync(new URL('../server/project-sources.json',import.meta.url),JSON.stringify(output));
console.log('Formatted 30 project workspaces.');
