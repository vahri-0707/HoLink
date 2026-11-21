const FILE_KEY = 'mLcMwe2h5guYPYIuYbIBbc';
if (figma.currentPage.children.length || (await figma.variables.getLocalVariableCollectionsAsync()).length) {
  throw new Error('Expected verified empty target. Inspect existing work before retrying.');
}
const pages = { refinement: figma.currentPage };
pages.refinement.name = '01 · Refinement';
for (const [key, name] of [['foundations', '02 · Foundations'], ['components', '03 · Components']]) {
  pages[key] = figma.root.children.find(p => p.name === name) || figma.createPage();
  pages[key].name = name;
}
for (const style of ['Regular','Medium','SemiBold','Bold','ExtraBold']) await figma.loadFontAsync({family:'Manrope',style});
const vars={}, collections={}, styles={};
function collection(key,name,mode) {
  const c=figma.variables.createVariableCollection(name); c.renameMode(c.defaultModeId,mode);
  collections[key]=c; return c;
}
const primitive=collection('primitives','HoLink / Primitives','Value');
function variable(c,name,type,value,scopes,description) {
  const v=figma.variables.createVariable(name,c,type);v.setValueForMode(c.defaultModeId,value);
  v.scopes=scopes;v.description=description||name;
  v.setVariableCodeSyntax('WEB','var(--holink-'+name.replace(/\//g,'-')+')');vars[name]=v;return v;
}
function rgb(hex){const n=parseInt(hex.replace('#',''),16);return {r:((n>>16)&255)/255,g:((n>>8)&255)/255,b:(n&255)/255};}
const colors={
 'brand/cyan':'#008FDB','brand/blue':'#004ED7','brand/deep':'#003EA9',
 'blue/50':'#EFF5FF','blue/100':'#DCEBFF','blue/200':'#BDD5FF',
 'neutral/0':'#FFFFFF','neutral/25':'#FBFCFE','neutral/50':'#F5F7FA','neutral/100':'#ECEFF4',
 'neutral/200':'#DCE2EB','neutral/300':'#C5CEDC','neutral/400':'#94A0B2','neutral/500':'#66738A','neutral/600':'#4D5A70','neutral/900':'#151C2B',
 'green/50':'#EDF9F3','green/100':'#D6F0E2','green/700':'#127653','red/50':'#FFF1F1','red/700':'#BC3434'
};
for(const [name,value] of Object.entries(colors))variable(primitive,'primitive/'+name,'COLOR',rgb(value),[],value+' · source/product-derived palette');
for(const n of [0,4,8,10,12,16,20,24,28,32,40,44,48,56,64,999])variable(primitive,'primitive/number/'+n,'FLOAT',n,[]);
const semantic=collection('semantic','HoLink / Semantic','Light');
const aliases={
 'color/brand/primary':['brand/blue',['FRAME_FILL','SHAPE_FILL']],
 'color/brand/start':['brand/cyan',['FRAME_FILL','SHAPE_FILL']],
 'color/brand/hover':['brand/deep',['FRAME_FILL','SHAPE_FILL']],
 'color/surface/base':['neutral/0',['FRAME_FILL','SHAPE_FILL']],
 'color/surface/canvas':['neutral/25',['FRAME_FILL','SHAPE_FILL']],
 'color/surface/subtle':['neutral/50',['FRAME_FILL','SHAPE_FILL']],
 'color/surface/muted':['neutral/100',['FRAME_FILL','SHAPE_FILL']],
 'color/surface/selected':['blue/50',['FRAME_FILL','SHAPE_FILL']],
 'color/text/primary':['neutral/900',['TEXT_FILL']],
 'color/text/secondary':['neutral/600',['TEXT_FILL']],
 'color/text/tertiary':['neutral/500',['TEXT_FILL']],
 'color/text/inverse':['neutral/0',['TEXT_FILL']],
 'color/text/brand':['brand/blue',['TEXT_FILL']],
 'color/text/success':['green/700',['TEXT_FILL']],
 'color/text/error':['red/700',['TEXT_FILL']],
 'color/border/default':['neutral/200',['STROKE_COLOR']],
 'color/border/strong':['neutral/300',['STROKE_COLOR']],
 'color/border/selected':['brand/blue',['STROKE_COLOR']],
 'color/border/focus':['blue/200',['STROKE_COLOR']],
 'color/icon/default':['neutral/600',['SHAPE_FILL','STROKE_COLOR']],
 'color/icon/muted':['neutral/400',['SHAPE_FILL','STROKE_COLOR']],
 'color/icon/brand':['brand/blue',['SHAPE_FILL','STROKE_COLOR']],
 'color/icon/inverse':['neutral/0',['SHAPE_FILL','STROKE_COLOR']],
 'color/icon/success':['green/700',['SHAPE_FILL','STROKE_COLOR']],
 'color/feedback/success':['green/50',['FRAME_FILL','SHAPE_FILL']],
 'color/feedback/error':['red/50',['FRAME_FILL','SHAPE_FILL']]
};
for(const [name,[ref,scopes]] of Object.entries(aliases))variable(semantic,name,'COLOR',figma.variables.createVariableAlias(vars['primitive/'+ref]),scopes,'Alias → '+ref);
const dimension=collection('dimensions','HoLink / Dimensions','Value');
for(const n of [0,4,8,12,16,20,24,32,40,48,64])variable(dimension,'space/'+n,'FLOAT',figma.variables.createVariableAlias(vars['primitive/number/'+n]),['GAP']);
for(const n of [4,8,10,12,16,24,999])variable(dimension,'radius/'+n,'FLOAT',figma.variables.createVariableAlias(vars['primitive/number/'+n]),['CORNER_RADIUS']);
for(const n of [40,44,48,56])variable(dimension,'size/control/'+n,'FLOAT',figma.variables.createVariableAlias(vars['primitive/number/'+n]),['WIDTH_HEIGHT']);
const typography=[
 ['Display / 40','ExtraBold',40,48],['Title / 28','Bold',28,36],['Title / 20','Bold',20,28],
 ['Heading / 16','Bold',16,24],['Body / 14','Regular',14,22],['Label / 14','SemiBold',14,20],
 ['Body / 13','Medium',13,20],['Caption / 12','Medium',12,18],['Micro / 11','Bold',11,16]
];
for(const [name,weight,size,line] of typography){const s=figma.createTextStyle();s.name='HoLink / '+name;s.fontName={family:'Manrope',style:weight};s.fontSize=size;s.lineHeight={unit:'PIXELS',value:line};s.description='Aeonik is used in production. Manrope is the documented available-font substitute for this refinement.';styles[name]=s;}
const gradient=figma.createPaintStyle();gradient.name='HoLink / Brand gradient';gradient.description='Retained from live Add Block button, #008FDB → #004ED7.';
gradient.paints=[{type:'GRADIENT_LINEAR',gradientTransform:[[1,0,0],[0,1,0]],gradientStops:[{position:0,color:{...rgb(colors['brand/cyan']),a:1},boundVariables:{color:figma.variables.createVariableAlias(vars['color/brand/start'])}},{position:1,color:{...rgb(colors['brand/blue']),a:1},boundVariables:{color:figma.variables.createVariableAlias(vars['color/brand/primary'])}}]}];styles.gradient=gradient;
for(const [key,name,y,blur,alpha] of [['card','Card',2,8,.04],['preview','Preview',12,40,.08],['toast','Toast',8,28,.12]]){
const s=figma.createEffectStyle();s.name='HoLink / Elevation / '+name;s.effects=[{type:'DROP_SHADOW',color:{r:.05,g:.1,b:.2,a:alpha},offset:{x:0,y},radius:blur,spread:0,visible:true,blendMode:'NORMAL'}];styles[key]=s;}
return {runId:'holink-collection-20261121',scope:'two-state refinement + scoped atomic library',pages:Object.fromEntries(Object.entries(pages).map(([k,v])=>[k,v.id])),collections:Object.fromEntries(Object.entries(collections).map(([k,v])=>[k,v.id])),variables:Object.fromEntries(Object.entries(vars).map(([k,v])=>[k,v.id])),styles:Object.fromEntries(Object.entries(styles).map(([k,v])=>[k,v.id])),font:{source:'Aeonik',design:'Manrope',reason:'Source font is not available in this Figma environment.'},palette:colors,createdIds:[...Object.values(pages).map(v=>v.id),...Object.values(collections).map(v=>v.id),...Object.values(vars).map(v=>v.id),...Object.values(styles).map(v=>v.id)]};
