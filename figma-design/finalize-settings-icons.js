// Separate swap properties prevent the selected glyph from becoming the
// default icon for both variants of a Figma component set.
await figma.loadAllPagesAsync();
const icons=JSON.parse(figma.root.getPluginData('holink-phosphor-assets'));
const settings=await figma.getNodeByIdAsync('9:2866');
const names=new Map(Object.entries(icons).flatMap(([name,pair])=>[[pair.outline,name],[pair.filled,name]]));
const definitions=settings.componentPropertyDefinitions;
const legacyKey=Object.keys(definitions).find(key=>key.startsWith('Icon#'));
const sourceKey=legacyKey||Object.keys(definitions).find(key=>key.startsWith('Outline icon'));
const instances=[];
for(const node of figma.root.findAll(node=>node.type==='INSTANCE')){
  const main=await node.getMainComponentAsync();
  if(main?.parent?.id!==settings.id)continue;
  instances.push({node,name:names.get(node.componentProperties[sourceKey]?.value)||'user',selected:Object.values(node.componentProperties).some(property=>property.type==='VARIANT'&&property.value==='Selected')});
}
const outlineKey=Object.keys(definitions).find(key=>key.startsWith('Outline icon'))||settings.addComponentProperty('Outline icon','INSTANCE_SWAP',icons.user.outline);
const filledKey=Object.keys(definitions).find(key=>key.startsWith('Filled icon'))||settings.addComponentProperty('Filled icon','INSTANCE_SWAP',icons.user.filled);
const variables=await figma.variables.getLocalVariablesAsync();
const resolve=variable=>{const value=Object.values(variable.valuesByMode)[0];return value.type==='VARIABLE_ALIAS'?resolve(variables.find(parent=>parent.id===value.id)):value;};
const paint=selected=>{const variable=variables.find(v=>v.name===(selected?'color/icon/brand':'color/icon/default'));return figma.variables.setBoundVariableForPaint({type:'SOLID',color:resolve(variable)},'color',variable);};
function colorize(node,selected){for(const vector of node.findAll(node=>node.type==='VECTOR'))vector.fills=[paint(selected)];}
for(const variant of settings.children){
  const selected=variant.name.includes('Selected');
  const glyph=variant.children.find(node=>node.type==='INSTANCE');
  glyph.componentPropertyReferences={...glyph.componentPropertyReferences,mainComponent:selected?filledKey:outlineKey};
  glyph.swapComponent(await figma.getNodeByIdAsync(icons.user[selected?'filled':'outline']));
  glyph.resize(20,20);colorize(glyph,selected);
}
for(const item of instances){
  item.node.setProperties({[outlineKey]:icons[item.name].outline,[filledKey]:icons[item.name].filled});
  colorize(item.node.children.find(node=>node.type==='INSTANCE'),item.selected);
}
if(legacyKey)settings.deleteComponentProperty(legacyKey);
return {updated:instances.length,outlineProperty:outlineKey,filledProperty:filledKey};
