const C={};await Promise.all(Object.entries(LEDGER.components).map(async([key,id])=>{C[key]=await figma.getNodeByIdAsync(id);}));
function I(key,name,map={},w,h){if(!C[key])throw Error('Missing component '+key);return inst(C[key],name,map,w,h);}
function icon(name,color='color/icon/default',size=20){const n=I('icon/'+name,'Icon / '+name);if(size!==24)n.rescale(size/24);for(const v of n.findAll().filter(v=>v.type==='VECTOR'||v.type==='BOOLEAN_OPERATION')){if(Array.isArray(v.strokes)&&v.strokes.length)v.strokes=[paint(color)];if(Array.isArray(v.fills)&&v.fills.length)v.fills=[paint(color)];}return n;}
function ib(name,label,state='Default'){return I('iconbutton/'+state,label,{Icon:C['icon/'+name].id});}
function btn(label,type='Primary',width=164,showIcon=false,iconName='plus'){const n=I('button/'+type+'/Default',label,{Label:label,'Show icon':showIcon,Icon:C['icon/'+iconName].id},width,40);if(type==='Primary')for(const v of n.findAll().filter(v=>v.type==='VECTOR')){if(v.strokes.length)v.strokes=[paint('color/icon/inverse')];if(v.fills.length)v.fills=[paint('color/icon/inverse')];}return n;}
function space(parent,size=16){const n=f('Space / '+size,1,size);add(parent,n);return n;}
function textBlock(parent,content,style='Body / 14',color='color/text/primary',w){const n=T(content,style,color,w);add(parent,n,true);return n;}
function headingRow(name,w,title,right){const r=row(name,w,32);r.counterAxisAlignItems='CENTER';gap(r,8);add(r,T(title,'Label / 14'));const flex=f('Flexible label space',1,1);add(r,flex,true);if(right)add(r,right);return r;}
