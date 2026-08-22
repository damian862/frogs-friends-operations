const acorn=require('acorn');
const astring=require('astring');

const TARGETS=new Set([
  'render','enter','setBookingTab','renderRecurringBookings','renderIncomeSummary',
  'renderBookingCalendar','renderLifeguardServices','renderMonthlyBilling',
  'renderBookingTables','renderTermDates'
]);

function targetName(node){
  if(!node)return null;
  if(node.type==='Identifier'&&TARGETS.has(node.name))return node.name;
  if(node.type==='MemberExpression'&&!node.computed&&node.object?.type==='Identifier'&&node.object.name==='window'&&node.property?.type==='Identifier'&&TARGETS.has(node.property.name))return node.property.name;
  return null;
}

function walk(node,visit,parent=null,key=null){
  if(!node||typeof node!=='object')return;
  visit(node,parent,key);
  for(const [k,value] of Object.entries(node)){
    if(k==='start'||k==='end')continue;
    if(Array.isArray(value))value.forEach((child,i)=>walk(child,visit,value,i));
    else if(value&&typeof value==='object'&&typeof value.type==='string')walk(value,visit,node,k);
  }
}

function collectAliases(ast){
  const aliases=new Map();
  walk(ast,node=>{
    if(node.type!=='VariableDeclarator'||node.id?.type!=='Identifier')return;
    const target=targetName(node.init);
    if(target)aliases.set(node.id.name,target);
  });
  return aliases;
}

function aliasRefs(node,target,aliases){
  const refs=new Set();
  walk(node,(child,parent,key)=>{
    if(child.type!=='Identifier'||aliases.get(child.name)!==target)return;
    if(parent?.type==='MemberExpression'&&key==='property'&&!parent.computed)return;
    if(parent?.type==='Property'&&key==='key'&&!parent.computed&&!parent.shorthand)return;
    refs.add(child.name);
  });
  return refs;
}

function replaceAliases(node,names){
  if(!node||typeof node!=='object')return;
  for(const [key,value] of Object.entries(node)){
    if(key==='start'||key==='end')continue;
    if(Array.isArray(value)){
      for(let i=0;i<value.length;i++){
        const child=value[i];
        if(child?.type==='Identifier'&&names.has(child.name))value[i]={type:'Identifier',name:'next'};
        else replaceAliases(child,names);
      }
    }else if(value&&typeof value==='object'){
      if(value.type==='Identifier'&&names.has(value.name))node[key]={type:'Identifier',name:'next'};
      else replaceAliases(value,names);
    }
  }
}

function lifecycleMember(method){
  return {type:'MemberExpression',computed:false,object:{type:'Identifier',name:'OpsLifecycle'},property:{type:'Identifier',name:method}};
}
function call(method,args){return {type:'CallExpression',optional:false,callee:lifecycleMember(method),arguments:args};}
function literal(value){return {type:'Literal',value,raw:JSON.stringify(value)};}

function specialCases(file,source){
  if(file!=='app-49.js')return source;
  const start=source.lastIndexOf('  const originalStaffingRender=window.renderLifeguardServices;');
  const close=source.lastIndexOf('})();');
  if(start<0||close<0||close<start)throw new Error('app-49 staffing dedupe block changed; review lifecycle flattening before build.');
  const replacement=`  if(typeof window.renderLifeguardServices==='function'&&window.OpsUtil?.createBurstDeduper){\n    let dedupedStaffingRender=null;\n    OpsLifecycle.use('renderLifeguardServices',function(next,...args){\n      if(!dedupedStaffingRender){\n        dedupedStaffingRender=OpsUtil.createBurstDeduper(\n          (...innerArgs)=>next(...innerArgs),\n          {\n            windowMs:250,\n            key:()=>[\n              document.getElementById('lgMonth')?.value||'',\n              document.getElementById('lgSite')?.value||'',\n              document.getElementById('lgCustomer')?.value||''\n            ].join('|')\n          }\n        );\n      }\n      return dedupedStaffingRender(...args);\n    });\n  }\n`;
  return source.slice(0,start)+replacement+source.slice(close);
}

function transformLifecycle(file,input){
  const source=specialCases(file,input);
  const ast=acorn.parse(source,{ecmaVersion:'latest',sourceType:'script',allowHashBang:true});
  const aliases=collectAliases(ast);
  let wrappers=0,resets=0;

  function transform(node){
    if(!node||typeof node!=='object')return node;
    for(const [key,value] of Object.entries(node)){
      if(key==='start'||key==='end')continue;
      if(Array.isArray(value))node[key]=value.map(transform);
      else if(value&&typeof value==='object'&&typeof value.type==='string')node[key]=transform(value);
    }

    if(node.type!=='AssignmentExpression'||node.operator!=='=')return node;
    const target=targetName(node.left);
    if(!target||!['FunctionExpression','ArrowFunctionExpression'].includes(node.right?.type))return node;

    const refs=aliasRefs(node.right,target,aliases);
    if(refs.size){
      const middleware=node.right;
      replaceAliases(middleware.body,refs);
      middleware.params=[{type:'Identifier',name:'next'},...middleware.params];
      wrappers++;
      return call('use',[literal(target),middleware]);
    }

    resets++;
    return {type:'SequenceExpression',expressions:[call('reset',[literal(target)]),node]};
  }

  const transformed=transform(ast);
  return {code:astring.generate(transformed,{comments:false}),wrappers,resets};
}

const prelude=`(function(){\n  const registry=new Map();\n  const stats={registered:0,resets:0,installed:{}};\n  window.OpsLifecycle=Object.freeze({\n    use(name,middleware){\n      if(typeof middleware!=='function')throw new TypeError('Lifecycle middleware must be a function');\n      const list=registry.get(name)||[];list.push(middleware);registry.set(name,list);stats.registered++;\n    },\n    reset(name){registry.set(name,[]);stats.resets++;},\n    install(names){\n      names.forEach(name=>{\n        const base=window[name];if(typeof base!=='function')return;\n        const list=(registry.get(name)||[]).slice();\n        let composed=base;\n        list.forEach(middleware=>{\n          const previous=composed;\n          composed=function(...args){\n            const next=(...nextArgs)=>previous.apply(this,nextArgs);\n            return middleware.apply(this,[next,...args]);\n          };\n        });\n        window[name]=composed;stats.installed[name]=list.length;\n      });\n    },\n    debug(){return JSON.parse(JSON.stringify(stats));}\n  });\n})();\n`;

const footer=`\nOpsLifecycle.install(${JSON.stringify([...TARGETS])});\n`;

module.exports={TARGETS,transformLifecycle,prelude,footer};
