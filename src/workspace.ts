export const marker='agent-storage-workspace-v2';
export function filesOf(code:string):Record<string,string>|null{try{const x=JSON.parse(code);return x?.format===marker?x.files:null;}catch{return null;}}
export function replaceFile(code:string,file:string,text:string){const files=filesOf(code);return files?JSON.stringify({format:marker,files:{...files,[file]:text}}):text;}
export function proposalsOf(content:string){const out:{file:string;code:string}[]=[];const regex=/(?:(?:^|\n)\s*(?:\*\*|`)?([a-zA-Z0-9_./-]+\.js)(?:\*\*|`)?\s*\n)?```(?:javascript|js)?\s*\n([\s\S]*?)```/g;let match;while((match=regex.exec(content)))out.push({file:match[1]||'solution.js',code:match[2]});return out;}
