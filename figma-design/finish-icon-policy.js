// Final policy: Fill is reserved for selected navigation, header and Page Settings.
await figma.loadAllPagesAsync();
const map=JSON.parse(figma.root.getPluginData('holink-phosphor-assets'));
const variables=await figma.variables.getLocalVariablesAsync();
const byName=name=>variables.find(v=>v.name===name);
const resolve=v=>{const value=Object.values(v.valuesByMode)[0];return value.type==='VARIABLE_ALIAS'?resolve(variables.find(p=>p.id===value.id)):value;};
const paint=name=>{const v=byName(name);return figma.variables.setBoundVariableForPaint({type:'SOLID',color:resolve(v)},'color',v);};
const layout=await figma.getNodeByIdAsync('9:2896');
for(const c of layout.children)for(const n of c.findAll(n=>n.type==='TEXT'||n.type==='INSTANCE')){const refs={...n.componentPropertyReferences};delete refs.mainComponent;delete refs.characters;n.componentPropertyReferences=refs;}
for(const[key,definition]of Object.entries(layout.componentPropertyDefinitions))if(definition.type!=='VARIANT')layout.deleteComponentProperty(key);
const stackSelected=await figma.getNodeByIdAsync('9:2878'),gridDefault=await figma.getNodeByIdAsync('9:2888');
const stackDefault=figma.root.findOne(n=>n.type==='COMPONENT'&&n.name==='Layout=Stack, State=Default')||gridDefault.clone();
const gridSelected=figma.root.findOne(n=>n.type==='COMPONENT'&&n.name==='Layout=Grid, State=Selected')||stackSelected.clone();
layout.appendChild(stackDefault);layout.appendChild(gridSelected);
const variants=[{n:stackSelected,label:'Stack',selected:true},{n:gridDefault,label:'Grid',selected:false},{n:stackDefault,label:'Stack',selected:false},{n:gridSelected,label:'Grid',selected:true}];
for(let i=0;i<variants.length;i++){
  const{n,label,selected}=variants[i];n.name='Layout='+label+', State='+(selected?'Selected':'Default');
  const glyph=n.findOne(n=>n.type==='INSTANCE');glyph.swapComponent(await figma.getNodeByIdAsync(map[label==='Stack'?'list':'layout-grid'].outline));glyph.resize(24,24);
  for(const v of glyph.findAll(n=>n.type==='VECTOR')){v.fills=[paint(selected?'color/icon/brand':'color/icon/default')];v.strokes=[];}
  const text=n.findOne(n=>n.type==='TEXT');await figma.loadFontAsync(text.fontName);text.characters=label;
  n.x=24+(i%2)*172;n.y=24+Math.floor(i/2)*112;
}
layout.resize(368,248);
const filledToName=new Map(Object.entries(map).map(([name,pair])=>[pair.filled,name]));
let reverted=0;
const icons=figma.root.findAll(n=>n.type==='INSTANCE'&&n.name.startsWith('Icon / '));
for(const node of icons){
  const main=await node.getMainComponentAsync(),name=filledToName.get(main?.id);if(!name)continue;
  let allowed=false,parent=node.parent;
  while(parent){if(['AppNavigation','SettingsItem','Global navigation','Navigation / HoLink','EditorHeader','Editor header'].includes(parent.name)){allowed=true;break;}parent=parent.parent;}
  if(allowed)continue;
  const shape=node.findOne(n=>n.type==='VECTOR');const color=shape?.fills?.find(p=>p.type==='SOLID')||paint('color/icon/default');const w=node.width,h=node.height;
  node.swapComponent(await figma.getNodeByIdAsync(map[name].outline));node.resize(w,h);
  for(const v of node.findAll(n=>n.type==='VECTOR')){v.fills=[color];v.strokes=[];}
  reverted++;
}
const logo=figma.root.findOne(n=>n.type==='COMPONENT'&&n.name==='Brand / HoLink logo');
for(const child of logo.children){child.layoutSizingHorizontal='FILL';child.layoutSizingVertical='FILL';}
for(const id of ['9:2926','14:7457']){const nav=await figma.getNodeByIdAsync(id);const top=nav.children.find(n=>n.name==='Navigation brand');top.strokes=[paint('color/border/default')];top.strokeWeight=1;top.strokeAlign='INSIDE';}
const expanded=await figma.getNodeByIdAsync('14:7457');expanded.setBoundVariable('cornerRadius',byName('radius/16'));expanded.clipsContent=true;expanded.description='Expanded navigation is a floating drawer: 8 px viewport inset, 16 px radius, dimmed backdrop and Escape / outside-click dismissal. It does not resize the editor.';
const progress=expanded.findOne(n=>n.name==='Setup progress / 40%');const chart=progress.children.find(n=>n.type==='FRAME');chart.resize(48,48);chart.x=0;chart.y=0;
for(const text of figma.root.findAll(n=>n.type==='TEXT')){
  if(text.characters==='At narrow widths the navigation opens as a drawer, with Escape and focus return.'){await figma.loadFontAsync(text.fontName);text.characters='Expanded navigation floats 8 px from the viewport on every screen size, with a dimmed backdrop, Escape and focus return.';}
  if(text.characters==='Regular icons use the same outline weight. Selected navigation, candidates and layout choices use their matched Fill glyph.'){await figma.loadFontAsync(text.fontName);text.characters='Regular icons use one consistent weight. Fill is reserved for selected sidebar, header and Page Settings controls; block and layout icons stay outlined.';}
  if(text.characters.includes('Selected icons use the matched Fill glyph.')){await figma.loadFontAsync(text.fontName);text.characters=text.characters.replace('Selected icons use the matched Fill glyph.','Fill is reserved for selected sidebar, header and Page Settings controls.');}
}
figma.root.setPluginData('holink-icon-policy',JSON.stringify({family:'Phosphor',outline:'Regular',filledContexts:['sidebar','header','page-settings'],expandedNavigation:'floating-drawer',inset:8,headerHeight:72}));
return {revertedBlockIcons:reverted,layoutVariants:layout.children.map(n=>({id:n.id,name:n.name})),expanded:expanded.id};
