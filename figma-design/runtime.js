// Reused by every Desktop Bridge phase. The official $fig builder is unavailable
// in Desktop Bridge; these helpers wrap the supported native Plugin API.
const CREATED=[],PENDING=[];
const V={}; for(const [key,id] of Object.entries(LEDGER.variables))V[key]=await figma.variables.getVariableByIdAsync(id);
const ST={};for(const [key,id] of Object.entries(LEDGER.styles))ST[key]=await figma.getStyleByIdAsync(id);
for(const style of ['Regular','Medium','SemiBold','Bold','ExtraBold'])await figma.loadFontAsync({family:'Manrope',style});
const col=hex=>{const n=parseInt(hex.replace('#',''),16);return{r:((n>>16)&255)/255,g:((n>>8)&255)/255,b:(n&255)/255};};
function resolvedColor(v){const value=Object.values(v.valuesByMode)[0];if(value&&value.type==='VARIABLE_ALIAS'){const parent=Object.values(V).find(x=>x.id===value.id);if(!parent)throw Error('Missing primitive alias '+value.id);return resolvedColor(parent);}return{r:value.r,g:value.g,b:value.b};}
function paint(key){const v=V[key];if(!v)throw Error('Missing token '+key);const p={type:'SOLID',color:resolvedColor(v)};return figma.variables.setBoundVariableForPaint(p,'color',v);}
function fill(n,key){n.fills=[paint(key)];return n;}
function stroke(n,key,width=1){n.strokes=[paint(key)];n.strokeWeight=width;n.strokeAlign='INSIDE';return n;}
function token(n,field,key){n.setBoundVariable(field,V[key]);return n;}
function rad(n,size=12){return token(n,'cornerRadius','radius/'+size);}
function gap(n,size){return token(n,'itemSpacing','space/'+size);}
function pad(n,t=16,r=t,b=t,l=r){for(const [k,v]of Object.entries({paddingTop:t,paddingRight:r,paddingBottom:b,paddingLeft:l}))token(n,k,'space/'+v);return n;}
function f(name,w,h,dir='VERTICAL',bg=null,component=false){const n=component?figma.createComponent():figma.createFrame();CREATED.push(n.id);n.name=name;n.layoutMode=dir;n.resize(w,h);n.primaryAxisSizingMode='FIXED';n.counterAxisSizingMode='FIXED';n.fills=[];n.clipsContent=false;if(bg)fill(n,bg);return n;}
function add(parent,node,fillX=false,fillY=false){parent.appendChild(node);if(fillX)node.layoutSizingHorizontal='FILL';if(fillY)node.layoutSizingVertical='FILL';return node;}
function hug(n,axis='VERTICAL'){if(axis==='VERTICAL')n.primaryAxisSizingMode='AUTO';else n.counterAxisSizingMode='AUTO';return n;}
function T(text,style='Body / 14',color='color/text/primary',width){const n=figma.createText();CREATED.push(n.id);n.name=text.length>48?text.slice(0,48)+'…':text; n.fontName=ST[style].fontName;n.fontSize=ST[style].fontSize;n.lineHeight=ST[style].lineHeight;n.characters=text;PENDING.push(n.setTextStyleIdAsync(ST[style].id));n.fills=[paint(color)];n.textAutoResize='WIDTH_AND_HEIGHT';if(width){n.resize(width,n.height);n.textAutoResize='HEIGHT';}return n;}
function applyFill(n,style){n.fills=style.paints;PENDING.push(n.setFillStyleIdAsync(style.id));return n;}
function applyFx(n,style){n.effects=style.effects;PENDING.push(n.setEffectStyleIdAsync(style.id));return n;}
function row(name,w,h,bg){return f(name,w,h,'HORIZONTAL',bg);}
function spacer(parent){const n=f('Flexible space',1,1,'VERTICAL');add(parent,n,true,true);return n;}
function line(parent,w){const n=f('Divider',w,1,'HORIZONTAL','color/surface/muted');add(parent,n,true);return n;}
function expose(comp,node,name,property='characters',type='TEXT',value){const p=comp.addComponentProperty(name,type,value===undefined?node.characters:value);node.componentPropertyReferences={...node.componentPropertyReferences,[property]:p};return p;}
function props(inst,map){const vals={};for(const[k,v]of Object.entries(map)){const actual=Object.keys(inst.componentProperties).find(p=>p===k||p.startsWith(k+'#'));if(!actual)throw Error('Property '+k+' missing on '+inst.name);vals[actual]=v;}inst.setProperties(vals);return inst;}
function inst(comp,name,map={},w,h){const n=comp.createInstance();CREATED.push(n.id);if(name)n.name=name;props(n,map);if(w||h)n.resize(w||n.width,h||n.height);return n;}
function S(name,description,x=0,y=0){const s=figma.createSection();CREATED.push(s.id);s.name=name;s.x=x;s.y=y;s.fills=[{type:'SOLID',color:col('#E9EDF4')}];return s;}
function propSummary(c){return{id:c.id,name:c.name,type:c.type,properties:c.componentPropertyDefinitions};}
function inspect(root){const nodes=[root,...root.findAll()];const counts={};for(const n of nodes)counts[n.type]=(counts[n.type]||0)+1;return{id:root.id,name:root.name,width:root.width,height:root.height,counts,autoLayout:nodes.filter(n=>'layoutMode'in n&&n.layoutMode!=='NONE').length,bindings:nodes.filter(n=>Object.keys(n.boundVariables||{}).length).length};}
function placeSet(parent,name,variants,columns=3){const set=figma.combineAsVariants(variants,parent);CREATED.push(set.id);set.name=name;const cw=Math.max(...variants.map(n=>n.width));const ch=Math.max(...variants.map(n=>n.height));variants.forEach((n,i)=>{n.x=24+(i%columns)*(cw+24);n.y=24+Math.floor(i/columns)*(ch+24);});set.resize(48+Math.min(columns,variants.length)*(cw+24)-24,48+Math.ceil(variants.length/columns)*(ch+24)-24);set.fills=[];return set;}
function makeLabel(parent,title,subtitle,w){const g=f(title+' / label',w,72);gap(g,8);add(g,T(title,'Title / 20'));if(subtitle)add(g,T(subtitle,'Body / 13','color/text/secondary',w));add(parent,g,true);hug(g);return g;}
