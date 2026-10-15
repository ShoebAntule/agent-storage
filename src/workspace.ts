export const marker='agent-storage-workspace-v2';
export function filesOf(code:string):Record<string,string>|null{try{const x=JSON.parse(code);return x?.format===marker?x.files:null;}catch{return null;}}
export function replaceFile(code:string,file:string,text:string){const files=filesOf(code);return files?JSON.stringify({format:marker,files:{...files,[file]:text}}):text;}
export function mainFile(files:Record<string,string>|null){try{return files?JSON.parse(files['package.json']||'{}').main||'solution.js':'solution.js';}catch{return 'solution.js';}}
export type Proposal={file:string|null;code:string;language:string};
export function proposalsOf(content:string):Proposal[]{
 const out:Proposal[]=[];
 const fence=/^```([^\n]*)\n([\s\S]*?)^```\s*$/gm;let match;
 while((match=fence.exec(content))){
  const info=match[1].trim(),prefix=content.slice(0,match.index).trimEnd().split('\n').at(-1)||'';
  const pathPattern=/([a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_.-]+)*\.(?:js|css|html|json|md))\b/;
  const explicit=info.match(pathPattern)?.[1]||prefix.replace(/[*`#]/g,'').match(pathPattern)?.[1];
  const header=match[2].split('\n')[0].match(/^\s*(?:\/\/|\/\*|<!--)\s*(?:file(?:name)?\s*:\s*)?([a-zA-Z0-9_./-]+\.(?:js|css|html|json))\b/i)?.[1];
  const file=explicit||header||null;
  out.push({file,code:match[2].replace(/\n$/,''),language:info.split(/\s+/)[0]||'text'});
 }
 return out;
}
