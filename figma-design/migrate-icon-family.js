// Desktop Bridge migration. ASSETS is injected from the verified local SVGs.
// Existing main-component IDs and all instance color overrides are retained.
await figma.loadAllPagesAsync();
const page=figma.root.children.find(p=>p.name==='03 · Components');
if(!page)throw Error('HoLink component page is missing.');
await figma.setCurrentPageAsync(page);
const vars=await figma.variables.getLocalVariablesAsync();
const byName=name=>vars.find(v=>v.name===name);
const resolve=v=>{const value=Object.values(v.valuesByMode)[0];return value.type==='VARIABLE_ALIAS'?resolve(vars.find(p=>p.id===value.id)):value;};
const paint=name=>{const v=byName(name);return figma.variables.setBoundVariableForPaint({type:'SOLID',color:resolve(v)},'color',v);};
const styles=await figma.getLocalTextStylesAsync();
for(const style of ['Regular','Medium','SemiBold','Bold','ExtraBold'])await figma.loadFontAsync({family:'Manrope',style});
let section=page.children.find(n=>n.name==='05 / Icons · Phosphor Regular & Fill');
if(!section){section=figma.createSection();section.name='05 / Icons · Phosphor Regular & Fill';page.appendChild(section);section.x=0;section.y=6720;section.resizeWithoutConstraints(1800,960);section.fills=[paint('color/surface/muted')];}
function frame(name,w,h,dir='VERTICAL'){
  const n=figma.createFrame();n.name=name;n.layoutMode=dir;n.resize(w,h);n.primaryAxisSizingMode='FIXED';n.counterAxisSizingMode='FIXED';n.fills=[];return n;
}
async function text(value,styleName,width){const compact=s=>s.replaceAll(' ','');const s=styles.find(s=>compact(s.name).endsWith(compact(styleName)));if(!s)throw Error('Missing text style '+styleName);const n=figma.createText();n.fontName=s.fontName;n.characters=value;await n.setTextStyleIdAsync(s.id);n.fills=[paint('color/text/secondary')];if(width){n.resize(width,n.height);n.textAutoResize='HEIGHT';}return n;}
if(!section.children.length){const intro=frame('Icon family / documentation',1680,112);section.appendChild(intro);intro.x=40;intro.y=32;intro.itemSpacing=8;intro.appendChild(await text('PHOSPHOR / OUTLINE + FILLED','Micro / 11'));intro.appendChild(await text('One family. One consistent outline weight.','Title / 28'));intro.appendChild(await text('Retrieved with better-icons · Regular outlines use a consistent 16-unit weight on a 256 grid (1.5 at 24 px). Selected icons use the matched Fill glyph.','Body / 14',1640));}
const existing=figma.root.findAll(n=>n.type==='COMPONENT'&&n.name.startsWith('Icon / '));
const map=JSON.parse(figma.root.getPluginData('holink-phosphor-assets')||'{}');
const mainToName=new Map(existing.filter(n=>!n.name.endsWith(' / Filled')).map(n=>[n.id,n.name.slice(7)]));
const names=new Set(ASSETS.map(a=>a.name));
const possible=figma.root.findAll(n=>n.type==='INSTANCE'&&n.name.startsWith('Icon / '));
const snapshots=(await Promise.all(possible.map(async node=>{
  const main=await node.getMainComponentAsync();const name=mainToName.get(main?.id);
  if(!names.has(name))return null;
  const shape=node.findOne(n=>n.type==='VECTOR'||n.type==='BOOLEAN_OPERATION');
  const color=shape?.strokes?.find(p=>p.type==='SOLID')||shape?.fills?.find(p=>p.type==='SOLID')||paint('color/icon/default');
  let selected=false,parent=node.parent;
  for(let i=0;parent&&i<18;i++,parent=parent.parent){
    if(/State=Selected|Selected Collection/.test(parent.name))selected=true;
    if(parent.type==='INSTANCE'&&Object.values(parent.componentProperties||{}).some(p=>p.type==='VARIANT'&&p.value==='Selected'))selected=true;
  }
  if(name==='folder'&&color.boundVariables?.color?.id===byName('color/icon/brand')?.id)selected=true;
  return {node,name,color,w:node.width,h:node.height,selected:selected&&['layout-dashboard','folder','link','user','layout-grid','list','help'].includes(name)};
}))).filter(Boolean);
function colorize(node,color){for(const v of node.findAll(n=>n.type==='VECTOR'||n.type==='BOOLEAN_OPERATION')){v.fills=[color];v.strokes=[];}}
function replaceGlyph(main,svg,name){for(const child of [...main.children])child.remove();const glyph=figma.createNodeFromSvg(svg.replaceAll('currentColor','#4D5A70'));main.appendChild(glyph);glyph.name='SVG / '+name;glyph.resize(24,24);glyph.layoutSizingHorizontal='FILL';glyph.layoutSizingVertical='FILL';colorize(main,paint('color/icon/default'));main.description='Phosphor · '+name+' · better-icons / Iconify. Regular weight for outlines; Fill only for selected states.';}
for(const asset of ASSETS){
  let cell=section.children.find(n=>n.name==='Icon pair / '+asset.name);
  if(!cell){cell=frame('Icon pair / '+asset.name,176,112);section.appendChild(cell);cell.x=40+(asset.index%8)*212;cell.y=168+Math.floor(asset.index/8)*140;cell.itemSpacing=8;cell.appendChild(await text(asset.name,'Caption / 12',172));}
  let row=cell.children.find(n=>n.name==='Outline / Fill');if(!row){row=frame('Outline / Fill',160,40,'HORIZONTAL');row.itemSpacing=24;row.counterAxisAlignItems='CENTER';cell.appendChild(row);}
  let regular=existing.find(n=>n.name==='Icon / '+asset.name);
  if(!regular){regular=figma.createComponent();regular.name='Icon / '+asset.name;row.appendChild(regular);regular.layoutMode='HORIZONTAL';regular.resize(24,24);}
  regular.primaryAxisAlignItems='CENTER';regular.counterAxisAlignItems='CENTER';replaceGlyph(regular,asset.outline,asset.name);
  if(regular.parent!==row&&!row.children.some(n=>n.name==='Outline')){const sample=regular.createInstance();row.insertChild(0,sample);sample.name='Outline';}
  let filled=existing.find(n=>n.name==='Icon / '+asset.name+' / Filled');
  if(!filled){filled=figma.createComponent();filled.name='Icon / '+asset.name+' / Filled';row.appendChild(filled);filled.layoutMode='HORIZONTAL';filled.resize(24,24);}
  filled.primaryAxisAlignItems='CENTER';filled.counterAxisAlignItems='CENTER';replaceGlyph(filled,asset.filled,asset.name+' / Filled');
  regular.setPluginData('iconify-id',asset.outlineId);filled.setPluginData('iconify-id',asset.filledId);
  map[asset.name]={outline:regular.id,filled:filled.id};
}
for(const snap of snapshots){const pair=map[snap.name];if(snap.selected){const filled=await figma.getNodeByIdAsync(pair.filled);snap.node.swapComponent(filled);}if(snap.node.width!==snap.w||snap.node.height!==snap.h)snap.node.resize(snap.w,snap.h);colorize(snap.node,snap.color);}
for(const node of figma.root.findAll(n=>n.name.includes('Lucide')))node.name=node.name.replaceAll('Lucide source SVGs','Phosphor Regular SVGs').replaceAll('Lucide','Phosphor');
figma.root.setPluginData('holink-phosphor-assets',JSON.stringify(map));
return {updated:ASSETS.map(a=>a.name),restoredColorOverrides:snapshots.length,section:section.id,componentCount:Object.keys(map).length*2};
