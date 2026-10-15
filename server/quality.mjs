import {parse} from 'acorn';
import {unpackFiles} from './workspace.mjs';
export function analyze(code){const files=unpackFiles(code)||{'solution.js':code};const metrics={bytes:0,lines:0,functions:0,branches:0},findings=[];let prohibited=false;
 for(const [file,source]of Object.entries(files)){if(!file.endsWith('.js'))continue;metrics.bytes+=Buffer.byteLength(source);metrics.lines+=source.split('\n').length;let tree;try{tree=parse(source,{ecmaVersion:'latest',sourceType:'script',locations:true});}catch(e){findings.push({file,line:e.loc?.line||1,severity:'error',message:'JavaScript syntax error: '+e.message});continue;}
 const visit=node=>{if(!node||typeof node!=='object')return;if(['FunctionDeclaration','FunctionExpression','ArrowFunctionExpression'].includes(node.type))metrics.functions++;if(['IfStatement','ConditionalExpression','ForStatement','ForOfStatement','ForInStatement','WhileStatement','DoWhileStatement','SwitchCase','CatchClause','LogicalExpression'].includes(node.type))metrics.branches++;
 const finding=(severity,message)=>findings.push({file,line:node.loc.start.line,severity,message});
 if(node.type==='DebuggerStatement')finding('warning','Remove debugger statements before submission.');
 if(node.type==='CatchClause'&&node.body.body.length===0)finding('warning','Empty catch block silently discards failure information.');
 if((['CallExpression','NewExpression'].includes(node.type)&&node.callee.type==='Identifier'&&['eval','Function'].includes(node.callee.name))||node.type==='ImportExpression'){prohibited=true;finding('error','Dynamic evaluation/import is prohibited by the execution contract.');}
 if(node.type==='BlockStatement'){let ended=false;for(const stmt of node.body){if(ended&&stmt.type!=='FunctionDeclaration')findings.push({file,line:stmt.loc.start.line,severity:'warning',message:'Unreachable statement after unconditional exit.'});if(['ReturnStatement','ThrowStatement'].includes(stmt.type))ended=true;}}
 for(const [k,value]of Object.entries(node))if(k!=='loc')if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value);
 };visit(tree);
 }
 return {metrics,findings:findings.slice(0,30),prohibited,note:'AST findings support review; line count is not an optimization score. Branch count is a structural diagnostic, not a correctness or performance verdict.'};
}
