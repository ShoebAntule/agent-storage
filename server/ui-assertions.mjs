import {parseHTML} from 'linkedom';
import {isDeepStrictEqual} from 'node:util';
export function semanticDOM(html){
 if(typeof html!=='string'||html.length>1500000)throw new Error('Invalid rendered HTML.');
 const {document}=parseHTML('<html><body>'+html+'</body></html>');
 if(document.querySelector('script,iframe,object,embed,img,svg,link,style'))throw new Error('Use native text and controls; active/remote markup is outside the view contract.');
 const nodes=[...document.querySelectorAll('*')];
 if(nodes.some(n=>[...n.attributes].some(a=>/^on/i.test(a.name)||/^(?:href|src|action)$/i.test(a.name)&&/^\s*javascript:/i.test(a.value))))throw new Error('Unsafe rendered attributes.');
 // Layout wrappers, headings, CSS and button wording are intentionally unscored.
 const keys=['data-action','data-row','data-ticket','data-id','data-column','data-field','data-choice','data-delta','data-direction','data-request-id','data-ok','name'];
 const controls=nodes.filter(n=>n.matches('button,input')).map(n=>{
  if(n.matches('button')&&!n.textContent.trim()&&!n.getAttribute('aria-label'))throw new Error('Buttons need accessible names.');
  if(n.matches('input')&&!n.closest('label')&&!document.querySelector(`label[for="${n.id}"]`)&&!n.getAttribute('aria-label'))throw new Error('Inputs need labels.');
  return {tag:n.tagName.toLowerCase(),key:JSON.stringify(keys.filter(k=>n.hasAttribute(k)).map(k=>[k,n.getAttribute(k)])),disabled:n.hasAttribute('disabled'),value:n.matches('input')?n.getAttribute('value')??'':null};
 }).sort((a,b)=>a.key<b.key?-1:a.key>b.key?1:0);
 const roles=['option','row','alert','status','listbox','table'];
 const semantics=roles.map(role=>[role,[...document.querySelectorAll(`[role="${role}"]`)].map(n=>({text:['option','row'].includes(role)?n.textContent.replace(/\s+/g,' ').trim():null,selected:n.getAttribute('aria-selected'),row:n.getAttribute('data-row')}))]);
 const probes=[...document.querySelectorAll('[data-testid],[data-ticket]')].map(n=>({id:n.getAttribute('data-testid')||n.getAttribute('data-ticket'),text:n.hasAttribute('data-testid')?n.textContent.trim():null,busy:n.getAttribute('aria-busy')}));
 return {controls,semantics,probes};
}
export function matchesUI(actual,expected){try{return actual&&isDeepStrictEqual(actual.state,expected.state)&&isDeepStrictEqual(semanticDOM(actual.html),semanticDOM(expected.html));}catch{return false;}}
