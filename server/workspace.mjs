export const marker='agent-storage-workspace-v2';
export function packFiles(files){return JSON.stringify({format:marker,files});}
export function entryOf(files){let entry='solution.js';if(files['package.json']){try{entry=JSON.parse(files['package.json']).main||entry;}catch{throw new Error('package.json must contain valid JSON.');}}if(typeof entry!=='string'||!Object.hasOwn(files,entry)||!entry.endsWith('.js'))throw new Error('The package.json main entry must name an existing JavaScript file.');return entry;}
export function unpackFiles(code){
 let value;try{value=JSON.parse(code);}catch{return null;}
 if(value?.format!==marker)return null;
 if(!value.files||typeof value.files!=='object'||Array.isArray(value.files))throw new Error('Invalid file workspace.');
 const entries=Object.entries(value.files);
 if(entries.length>40||!entries.length||!entries.every(([p,s])=>/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_.-]+)*\.(js|md|json|css|html)$/.test(p)&&!p.split('/').some(x=>x==='..'||x==='.')&&typeof s==='string'))throw new Error('Use 1–40 local .js, .css, .html, .json or .md files.');
 entryOf(value.files);return value.files;
}
export function executable(code){const files=unpackFiles(code);if(!files)return code;const modules=Object.fromEntries(Object.entries(files).filter(([p])=>p.endsWith('.js')||p.endsWith('.json')));return `const __sources=${JSON.stringify(modules)};const __cache=Object.create(null);
function __resolve(request,from){if(!request.startsWith('./')&&!request.startsWith('../'))throw new Error('Only relative local imports are supported.');const parts=from.split('/');parts.pop();for(const p of request.split('/')){if(p==='.'||p==='')continue;if(p==='..'){if(!parts.length)throw new Error('Import escapes workspace.');parts.pop();}else parts.push(p);}let name=parts.join('/');if(!Object.hasOwn(__sources,name)&&Object.hasOwn(__sources,name+'.js'))name+='.js';return name;}
function __load(name){if(!Object.hasOwn(__sources,name))throw new Error('Module not found: '+name);if(Object.hasOwn(__cache,name))return __cache[name].exports;const module={exports:{}};__cache[name]=module;if(name.endsWith('.json'))module.exports=JSON.parse(__sources[name]);else{const execute=new Function('module','exports','require',__sources[name]);execute(module,module.exports,request=>__load(__resolve(request,name)));}return module.exports;}
const __entry=__load(${JSON.stringify(entryOf(files))});function solve(input){return (typeof __entry==='function'?__entry:__entry.solve)(input);}`;}
