const page=await figma.getNodeByIdAsync(LEDGER.pages.refinement);await figma.setCurrentPageAsync(page);
if(page.children.length)throw Error('Refinement page should be empty before screen assembly.');
const O={};await Promise.all(Object.entries(LEDGER.organisms).map(async([key,id])=>O[key]=await figma.getNodeByIdAsync(id)));
const sec=S('01 / High-fidelity states','Two focused states, same three-panel editor',0,880);page.appendChild(sec);sec.resizeWithoutConstraints(3032,1280);
const lead=f('High fidelity / introduction',2840,108);sec.appendChild(lead);lead.x=40;lead.y=32;gap(lead,8);add(lead,T('PART B / UI–UX REFINEMENT','Micro / 11','color/text/brand'));add(lead,T('One Collection. One clear destination.','Title / 28'));add(lead,T('Same familiar three-panel editor. A contextual picker replaces the detour through bulk selection.','Body / 14','color/text/secondary'));
function screen(state,name,x){const root=f(name,1440,960,'HORIZONTAL','color/surface/base');root.clipsContent=true;sec.appendChild(root);root.x=x;root.y=176;add(root,inst(O.rail,'Global navigation'));const workspace=f('Editor workspace',1376,960);add(root,workspace);add(workspace,inst(O.header,'Editor header'));const body=row('Three-panel editor',1376,888);add(workspace,body,true);add(body,inst(O['sidebar/'+state],'Block list'));add(body,inst(O['canvas/'+state],'Live preview'));return{root,body};}
const a=screen('Before','01 · Choose existing blocks',40);
const right=f('Contextual properties panel',360,888);add(a.body,right);
const originalProperties=inst(O.properties,'Collection properties / before move');add(right,originalProperties);
for(const n of originalProperties.findAll(n=>n.type==='INSTANCE'&&['Collection content / Brand identity','Collection content / Latest projects'].includes(n.name)))n.visible=false;
const origCount=originalProperties.findOne(n=>n.type==='INSTANCE'&&n.name==='Contents count');if(origCount)props(origCount,{Label:'1 block'});
const picker=inst(O.picker,'Existing block picker');add(right,picker);
const prototypeCollection=figma.variables.createVariableCollection('HoLink / Prototype');prototypeCollection.renameMode(prototypeCollection.defaultModeId,'Interaction');
const isOpen=figma.variables.createVariable('prototype/picker-open',prototypeCollection,'BOOLEAN');isOpen.setValueForMode(prototypeCollection.defaultModeId,true);isOpen.hiddenFromPublishing=true;isOpen.description='Prototype only. Boolean variables support ALL_SCOPES only. Open the contextual existing-block picker.';isOpen.setVariableCodeSyntax('WEB','var(--holink-prototype-picker-open)');
picker.layoutPositioning='ABSOLUTE';picker.x=0;picker.y=0;picker.setBoundVariable('visible',isOpen);
const b=screen('After','02 · Collection updated',1552);const updated=inst(O.properties,'Collection properties / updated');add(b.body,updated);
const toast=I('toast','Move confirmation');add(b.root,toast);toast.layoutPositioning='ABSOLUTE';toast.x=492;toast.y=888;
function nodeAction(id){return{type:'NODE',destinationId:id,navigation:'NAVIGATE',transition:null,resetScrollPosition:true};}
function variableAction(v,value){return{type:'SET_VARIABLE',variableId:v.id,variableValue:{type:'BOOLEAN',resolvedType:'BOOLEAN',value}};}
const openActions=[variableAction(isOpen,true)];
const closeActions=[variableAction(isOpen,false)];
const wiring=[];
async function wire(n,actions){if(!n)throw Error('Missing interaction target');await n.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions}]);wiring.push({id:n.id,name:n.name,actions});}
await wire(picker.findOne(n=>n.type==='INSTANCE'&&n.name==='Move 2 blocks'),[nodeAction(b.root.id)]);
await wire(picker.findOne(n=>n.type==='INSTANCE'&&n.name==='Cancel'),closeActions);
await wire(picker.findOne(n=>n.type==='INSTANCE'&&n.name==='Close block picker'),closeActions);
for(const n of originalProperties.findAll(n=>n.type==='INSTANCE'&&n.name==='Add to Collection'))await wire(n,openActions);
for(const n of a.root.findAll(n=>n.type==='INSTANCE'&&n.name==='Add to Collection'))if(!wiring.some(w=>w.id===n.id))await wire(n,openActions);
for(const n of b.root.findAll(n=>n.type==='INSTANCE'&&n.name==='Add to Collection'))await wire(n,[nodeAction(a.root.id)]);
await wire(toast.findOne(n=>n.type==='INSTANCE'&&n.name==='Undo action'),[nodeAction(a.root.id)]);
page.flowStartingPoints=[{nodeId:a.root.id,name:'Move existing blocks to Portfolio'}];
const capA=T('01 / Staged selection · two existing blocks selected; the page stays unchanged until confirmation.','Body / 14','color/text/secondary',1400);sec.appendChild(capA);capA.x=40;capA.y=1160;
const capB=T('02 / Committed result · nested blocks, updated preview, explicit success feedback and Undo.','Body / 14','color/text/secondary',1400);sec.appendChild(capB);capB.x=1552;capB.y=1160;
const ids={screenA:a.root.id,screenB:b.root.id,screenSection:sec.id,pickerInstance:picker.id,propertiesBefore:originalProperties.id,toast:toast.id};
await Promise.all(PENDING);figma.viewport.scrollAndZoomIntoView([a.root]);
return {screens:ids,prototype:{collection:prototypeCollection.id,openVariable:isOpen.id,wiring,scope:'Fixed two-block selection. Move, Cancel, Close, reopen and Undo are wired. Starter supports one action per reaction. Arbitrary search, row selection and the existing new-block catalog are documented production behaviors, not simulated.'},createdIds:CREATED,validation:[inspect(a.root),inspect(b.root)],fontFamilies:[...new Set([...a.root.findAll(n=>n.type==='TEXT'),...b.root.findAll(n=>n.type==='TEXT')].map(n=>n.fontName.family))],imageNodes:a.root.findAll(n=>'fills'in n&&Array.isArray(n.fills)&&n.fills.some(f=>f.type==='IMAGE')).map(n=>({id:n.id,name:n.name,width:n.width,height:n.height}))};
