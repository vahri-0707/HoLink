const page=await figma.getNodeByIdAsync(LEDGER.pages.refinement);await figma.setCurrentPageAsync(page);
const sec=await figma.getNodeByIdAsync('10:4674'),a=await figma.getNodeByIdAsync('10:4679'),b=await figma.getNodeByIdAsync('10:5228');
const right=a.findOne(n=>n.name==='Contextual properties panel');
const old=right.findOne(n=>n.type==='INSTANCE'&&n.name==='Collection properties / before move');if(old)old.remove();
const picker=right.findOne(n=>n.type==='INSTANCE'&&n.name==='Existing block picker');picker.setBoundVariable('visible',null);picker.visible=true;picker.layoutPositioning='AUTO';
const pc=await figma.variables.getVariableCollectionByIdAsync('VariableCollectionId:10:5225');if(pc)pc.remove();
const wiring=[];const action=id=>({type:'NODE',destinationId:id,navigation:'NAVIGATE',transition:null,resetScrollPosition:true});
async function wire(n,to){await n.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[action(to)]}]);wiring.push({id:n.id,name:n.name,destination:to});}
await wire(picker.findOne(n=>n.type==='INSTANCE'&&n.name==='Move 2 blocks'),b.id);
for(const name of ['Cancel','Close block picker']){const n=picker.findOne(n=>n.type==='INSTANCE'&&n.name===name);if(n)await n.setReactionsAsync([]);}
for(const n of b.findAll(n=>n.type==='INSTANCE'&&n.name==='Add to Collection'))await wire(n,a.id);
const toast=b.findOne(n=>n.type==='INSTANCE'&&n.name==='Move confirmation');await wire(toast.findOne(n=>n.type==='INSTANCE'&&n.name==='Undo action'),a.id);
page.flowStartingPoints=[{nodeId:a.id,name:'Move existing blocks to Portfolio'}];
const capA=T('01 / Staged selection · two existing blocks selected; the page stays unchanged until confirmation.','Body / 14','color/text/secondary',1400);sec.appendChild(capA);capA.x=40;capA.y=1160;
const capB=T('02 / Committed result · nested blocks, updated preview, explicit success feedback and Undo.','Body / 14','color/text/secondary',1400);sec.appendChild(capB);capB.x=1552;capB.y=1160;
await Promise.all(PENDING);figma.viewport.scrollAndZoomIntoView([a]);
return {screens:{screenA:a.id,screenB:b.id,screenSection:sec.id,pickerInstance:picker.id,toast:toast.id},prototype:{wiring,scope:'Fixed two-block selection. Move, Add to Collection from result, and Undo are wired using instant navigation. Cancel/close, search, arbitrary row selection and New block are specified in documentation, not simulated. This Starter plan does not support Set Variable or multiple actions.'},createdIds:CREATED,validation:[inspect(a),inspect(b)],fontFamilies:[...new Set([...a.findAll(n=>n.type==='TEXT'),...b.findAll(n=>n.type==='TEXT')].map(n=>n.fontName.family))],imageNodes:a.findAll(n=>'fills'in n&&Array.isArray(n.fills)&&n.fills.some(f=>f.type==='IMAGE')).map(n=>({id:n.id,name:n.name,width:n.width,height:n.height}))};
