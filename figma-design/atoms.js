const page=await figma.getNodeByIdAsync(LEDGER.pages.components);await figma.setCurrentPageAsync(page);
if(page.children.length)throw Error('Component page is not empty; inspect before retrying.');
const C={},SET={},SECTIONS={};
const atoms=S('01 / Atoms','Shared controls',0,0);page.appendChild(atoms);atoms.resizeWithoutConstraints(1800,1920);SECTIONS.atoms=atoms.id;
const title=f('Atoms / documentation',1680,112);title.x=40;title.y=32;atoms.appendChild(title);gap(title,8);
add(title,T('01 / ATOMS','Micro / 11','color/text/brand'));
add(title,T('The details that hold the flow together.','Title / 28'));
add(title,T('Bound color, spacing and radius variables · Manrope type styles · minimum 40 px desktop hit areas','Body / 14','color/text/secondary'));
const iconWrap=f('Icon library / Phosphor Regular SVGs',1680,280,'HORIZONTAL','color/surface/base');pad(iconWrap,24);gap(iconWrap,16);iconWrap.layoutWrap='WRAP';iconWrap.counterAxisSpacing=16;rad(iconWrap,16);iconWrap.x=40;iconWrap.y=176;atoms.appendChild(iconWrap);
for(const [name,svg]of Object.entries(ICON_SOURCES)){
 const tile=f('Icon specimen / '+name,96,64);gap(tile,8);tile.counterAxisAlignItems='CENTER';
 const comp=f('Icon / '+name,24,24,'HORIZONTAL',null,true);comp.primaryAxisAlignItems='CENTER';comp.counterAxisAlignItems='CENTER';
 const vector=figma.createNodeFromSvg(svg.replace('currentColor','#4D5A70'));CREATED.push(vector.id);vector.name='SVG / '+name;vector.resize(24,24);add(comp,vector);
 vector.fills=[];
 for(const n of vector.findAll().filter(n=>n.type==='VECTOR'||n.type==='BOOLEAN_OPERATION')){if(Array.isArray(n.strokes)&&n.strokes.length)n.strokes=[paint('color/icon/default')];if(Array.isArray(n.fills)&&n.fills.length)n.fills=[paint('color/icon/default')];}
 comp.description='Phosphor Regular SVG retrieved through better-icons. Keep source geometry and uniform weight; recolor with semantic icon tokens.';C['icon/'+name]=comp;add(tile,comp);add(tile,T(name,'Micro / 11','color/text/tertiary',92));add(iconWrap,tile);
}
function icon(name,color='color/icon/default',size=20){const n=inst(C['icon/'+name],'Icon / '+name,{},size,size);for(const v of n.findAll().filter(v=>v.type==='VECTOR'||v.type==='BOOLEAN_OPERATION')){if(Array.isArray(v.strokes)&&v.strokes.length)v.strokes=[paint(color)];if(Array.isArray(v.fills)&&v.fills.length)v.fills=[paint(color)];}return n;}
function note(text,x,y,w=1200){const n=T(text,'Body / 13','color/text/secondary',w);atoms.appendChild(n);n.x=x;n.y=y;return n;}
note('Button · Type × State · text, optional icon, and icon swap properties',40,492);
const buttonVars=[];
for(const type of ['Primary','Secondary','Ghost'])for(const state of ['Default','Hover','Pressed','Focus','Disabled']){
 const c=f('Type='+type+', State='+state,164,40,'HORIZONTAL','color/surface/base',true);rad(c,10);pad(c,8,16);gap(c,8);c.primaryAxisAlignItems='CENTER';c.counterAxisAlignItems='CENTER';token(c,'height','size/control/40');
 const primary=type==='Primary';let textColor=primary?'color/text/inverse':'color/text/primary',iconColor=primary?'color/icon/inverse':'color/icon/default';
 if(primary&&(state==='Default'||state==='Focus'))fill(c,'color/brand/primary');
 if(type==='Secondary')stroke(c,'color/border/default');
 if(type==='Ghost')c.fills=[];
 if(state==='Hover')fill(c,primary?'color/brand/hover':'color/surface/subtle');
 if(state==='Pressed')fill(c,primary?'color/brand/hover':'color/surface/muted');
 if(state==='Focus'){stroke(c,'color/border/selected',2);c.effects=[{type:'DROP_SHADOW',color:{...col('#BDD5FF'),a:.85},offset:{x:0,y:0},radius:0,spread:3,visible:true,blendMode:'NORMAL'}];}
 if(state==='Disabled'){fill(c,'color/surface/muted');c.strokes=[];textColor='color/text/tertiary';iconColor='color/icon/muted';}
 const ic=icon('plus',iconColor,16);add(c,ic);expose(c,ic,'Icon','mainComponent','INSTANCE_SWAP',C['icon/plus'].id);expose(c,ic,'Show icon','visible','BOOLEAN',true);
 const tx=T('Button','Label / 14',textColor);add(c,tx);expose(c,tx,'Label');
 c.description='40 px desktop control. Use Primary for the next committed action; secondary for cancel; ghost for contextual actions. State changes are instant in this prototype.';
 buttonVars.push(c);C['button/'+type+'/'+state]=c;
}
const buttons=placeSet(atoms,'Button',buttonVars,5);buttons.x=40;buttons.y=532;SET.Button=buttons;
note('IconButton · consistent 40 × 40 hit target; icon remains a nested instance',40,772);
const ib=[];for(const state of ['Default','Hover','Selected','Focus','Disabled']){const c=f('State='+state,40,40,'HORIZONTAL',null,true);rad(c,10);c.primaryAxisAlignItems='CENTER';c.counterAxisAlignItems='CENTER';if(state==='Hover')fill(c,'color/surface/subtle');if(state==='Selected')fill(c,'color/surface/selected');if(state==='Focus')stroke(c,'color/border/selected',2);if(state==='Disabled')c.opacity=.4;const ic=icon('ellipsis',state==='Selected'?'color/icon/brand':'color/icon/default');add(c,ic);expose(c,ic,'Icon','mainComponent','INSTANCE_SWAP',C['icon/ellipsis'].id);ib.push(c);C['iconbutton/'+state]=c;}
const ibs=placeSet(atoms,'IconButton',ib,5);ibs.x=40;ibs.y=812;SET.IconButton=ibs;
note('Checkbox · checked, hover, focus and disabled states; 40 px interaction area',560,772);
const checks=[];for(const state of ['Unchecked','Checked','Hover','Focus','Disabled unchecked','Disabled checked']){
 const c=f('State='+state,40,40,'HORIZONTAL',null,true);c.primaryAxisAlignItems='CENTER';c.counterAxisAlignItems='CENTER';const on=state==='Checked'||state==='Disabled checked';
 const box=f('Checkbox / 20 px visual',20,20,'HORIZONTAL',on?'color/brand/primary':'color/surface/base');rad(box,4);box.primaryAxisAlignItems='CENTER';box.counterAxisAlignItems='CENTER';stroke(box,state==='Focus'?'color/border/selected':'color/border/strong',state==='Focus'?2:1.5);if(on)box.strokes=[];if(state==='Hover')fill(box,'color/surface/selected');if(state.startsWith('Disabled'))c.opacity=.4;if(on)add(box,icon('check','color/icon/inverse',14));add(c,box);checks.push(c);C['checkbox/'+state]=c;
}
const checkSet=placeSet(atoms,'Checkbox',checks,6);checkSet.x=560;checkSet.y=812;SET.Checkbox=checkSet;
note('Tabs · one pattern for Existing blocks and New block',40,952);
const tabs=[];for(const state of ['Selected','Default']){const c=f('State='+state,148,40,'HORIZONTAL',state==='Selected'?'color/surface/base':null,true);rad(c,8);c.primaryAxisAlignItems='CENTER';c.counterAxisAlignItems='CENTER';if(state==='Selected')applyFx(c,ST.card);const tx=T('Existing blocks','Label / 14',state==='Selected'?'color/text/brand':'color/text/secondary');add(c,tx);expose(c,tx,'Label');tabs.push(c);C['tab/'+state]=c;}
const tabSet=placeSet(atoms,'Tab',tabs,2);tabSet.x=40;tabSet.y=992;SET.Tab=tabSet;
note('Badge · explicit state in words, not color alone',560,952);
const badges=[];for(const tone of ['Success','Info','Neutral']){const c=f('Tone='+tone,84,24,'HORIZONTAL',tone==='Success'?'color/feedback/success':tone==='Info'?'color/surface/selected':'color/surface/subtle',true);rad(c,999);pad(c,4,8);c.primaryAxisAlignItems='CENTER';c.counterAxisAlignItems='CENTER';const tx=T(tone==='Success'?'Live':tone==='Info'?'Selected':'3 blocks','Caption / 12',tone==='Success'?'color/text/success':tone==='Info'?'color/text/brand':'color/text/secondary');add(c,tx);expose(c,tx,'Label');badges.push(c);C['badge/'+tone]=c;}
const bset=placeSet(atoms,'Badge',badges,3);bset.x=560;bset.y=992;SET.Badge=bset;
note('Input · default, focus, error and disabled; Label and icon properties',40,1132);
const fields=[];for(const state of ['Default','Focus','Error','Disabled']){const c=f('State='+state,312,44,'HORIZONTAL',state==='Disabled'?'color/surface/subtle':'color/surface/base',true);pad(c,12);gap(c,8);rad(c,10);c.counterAxisAlignItems='CENTER';stroke(c,state==='Focus'?'color/border/selected':state==='Error'?'color/text/error':'color/border/default',state==='Focus'?2:1);const ic=icon('search','color/icon/muted',18);add(c,ic);expose(c,ic,'Show icon','visible','BOOLEAN',true);expose(c,ic,'Icon','mainComponent','INSTANCE_SWAP',C['icon/search'].id);const tx=T('Search page blocks','Body / 13',state==='Error'?'color/text/error':'color/text/tertiary');add(c,tx,true);expose(c,tx,'Value');fields.push(c);C['input/'+state]=c;}
const fieldSet=placeSet(atoms,'Input',fields,4);fieldSet.x=40;fieldSet.y=1172;SET.Input=fieldSet;
note('Avatar · initials keep the reference editable; no decorative imagery',40,1328);
const av=f('Avatar',40,40,'HORIZONTAL','color/surface/selected',true);rad(av,999);av.primaryAxisAlignItems='CENTER';av.counterAxisAlignItems='CENTER';const initials=T('VM','Label / 14','color/text/brand');add(av,initials);expose(av,initials,'Initials');atoms.appendChild(av);av.x=40;av.y=1376;C.avatar=av;
note('Toggle · explicit on / off shape plus consistent hit target',560,1328);
const toggles=[];for(const state of ['On','Off']){const c=f('State='+state,40,40,'HORIZONTAL',null,true);c.primaryAxisAlignItems='CENTER';c.counterAxisAlignItems='CENTER';const track=f('Track',36,22,'HORIZONTAL',state==='On'?'color/brand/primary':'color/surface/muted');rad(track,999);track.paddingLeft=3;track.paddingRight=3;track.primaryAxisAlignItems=state==='On'?'MAX':'MIN';track.counterAxisAlignItems='CENTER';const thumb=figma.createEllipse();CREATED.push(thumb.id);thumb.name='Thumb';thumb.resize(16,16);fill(thumb,'color/surface/base');add(track,thumb);add(c,track);toggles.push(c);C['toggle/'+state]=c;}
const toggleSet=placeSet(atoms,'Toggle',toggles,2);toggleSet.x=560;toggleSet.y=1376;SET.Toggle=toggleSet;
const molecules=S('02 / Molecules','Reusable blocks composed from shared atoms',0,2080);page.appendChild(molecules);molecules.resizeWithoutConstraints(1800,1480);SECTIONS.molecules=molecules.id;
const mh=f('Molecules / documentation',1680,100);molecules.appendChild(mh);mh.x=40;mh.y=32;gap(mh,8);add(mh,T('02 / MOLECULES','Micro / 11','color/text/brand'));add(mh,T('Small patterns. Clear decisions.','Title / 28'));add(mh,T('Nested instances and text properties keep each repeated row consistent and editable.','Body / 14','color/text/secondary'));
const candidateVariants=[];for(const state of ['Default','Selected','Hover']){
 const c=f('State='+state,312,80,'HORIZONTAL',state==='Selected'?'color/surface/selected':'color/surface/base',true);rad(c,12);pad(c,12,8,12,12);gap(c,8);c.counterAxisAlignItems='CENTER';stroke(c,state==='Selected'?'color/border/selected':'color/border/default',state==='Selected'?1.5:1);if(state==='Hover')fill(c,'color/surface/subtle');
 const tile=f('Block type',36,36,'HORIZONTAL',state==='Selected'?'color/surface/base':'color/surface/subtle');rad(tile,10);tile.primaryAxisAlignItems='CENTER';tile.counterAxisAlignItems='CENTER';add(tile,icon('link','color/icon/brand',20));add(c,tile);
 const content=f('Block information',184,44);gap(content,4);const name=T('Brand identity','Label / 14','color/text/primary',180);const meta=T('behance.net/vahri','Caption / 12','color/text/tertiary',180);add(content,name,true);add(content,meta,true);add(c,content,true);expose(c,name,'Title');expose(c,meta,'Metadata');add(c,inst(C['checkbox/'+(state==='Selected'?'Checked':'Unchecked')],'Selection'));
 c.description='Existing page block. Entire row is a 40+ px checkbox target. Select locally; move only after explicit confirmation.';candidateVariants.push(c);C['candidate/'+state]=c;
}
const cand=placeSet(molecules,'CandidateRow',candidateVariants,3);cand.x=40;cand.y=176;SET.CandidateRow=cand;
const blockVariants=[];for(const state of ['Default','Nested','Selected']){
 const c=f('State='+state,state==='Nested'?232:248,60,'HORIZONTAL',state==='Selected'?'color/surface/selected':'color/surface/base',true);rad(c,state==='Nested'?8:10);pad(c,8);gap(c,8);c.counterAxisAlignItems='CENTER';if(state==='Selected')stroke(c,'color/border/selected');
 add(c,icon('grip-vertical','color/icon/muted',16));const content=f('Block information',156,40);gap(content,0);const nm=T('Case studies','Body / 13','color/text/primary',148);const dm=T('Link','Caption / 12','color/text/tertiary',148);add(content,nm,true);add(content,dm,true);add(c,content,true);expose(c,nm,'Title');expose(c,dm,'Metadata');const more=inst(C['iconbutton/Default'],'Block actions',{},40,40);const mi=more.findOne(n=>n.type==='INSTANCE'&&n.name.startsWith('Icon /'));if(mi)mi.resize(16,16);add(c,more);
 c.description='Block list row. Default, nested and selected states. Preserve the existing order and drag-to-reorder affordance.';blockVariants.push(c);C['block/'+state]=c;
}
const blockSet=placeSet(molecules,'BlockRow',blockVariants,3);blockSet.x=40;blockSet.y=368;SET.BlockRow=blockSet;
const navs=[];for(const state of ['Default','Selected']){const c=f('State='+state,248,40,'HORIZONTAL',state==='Selected'?'color/surface/selected':null,true);rad(c,10);pad(c,8,12);gap(c,12);c.counterAxisAlignItems='CENTER';const ic=icon('user',state==='Selected'?'color/icon/brand':'color/icon/default',18);add(c,ic);expose(c,ic,'Icon','mainComponent','INSTANCE_SWAP',C['icon/user'].id);const tx=T('Header','Body / 13',state==='Selected'?'color/text/brand':'color/text/secondary');add(c,tx);expose(c,tx,'Label');navs.push(c);C['nav/'+state]=c;}
const navSet=placeSet(molecules,'SettingsItem',navs,2);navSet.x=40;navSet.y=560;SET.SettingsItem=navSet;
const link=f('PreviewLink',264,56,'HORIZONTAL','color/surface/base',true);pad(link,8,12);gap(link,8);rad(link,12);link.counterAxisAlignItems='CENTER';stroke(link,'color/border/default');applyFx(link,ST.card);const tile=f('Icon tile',28,28,'HORIZONTAL','color/surface/selected');rad(tile,8);tile.primaryAxisAlignItems='CENTER';tile.counterAxisAlignItems='CENTER';add(tile,icon('link','color/icon/brand',16));add(link,tile);const tx=T('Case studies','Body / 13');add(link,tx,true);expose(link,tx,'Title');add(link,icon('arrow-up-right','color/icon/muted',16));molecules.appendChild(link);link.x=760;link.y=584;C.previewlink=link;
const layoutCards=[];for(const state of ['Selected','Default']){const c=f('State='+state,148,88,'VERTICAL',state==='Selected'?'color/surface/selected':'color/surface/base',true);rad(c,12);pad(c,16);gap(c,8);c.counterAxisAlignItems='CENTER';c.primaryAxisAlignItems='CENTER';stroke(c,state==='Selected'?'color/border/selected':'color/border/default',state==='Selected'?1.5:1);const ic=icon(state==='Selected'?'list':'layout-grid',state==='Selected'?'color/icon/brand':'color/icon/default',24);add(c,ic);expose(c,ic,'Icon','mainComponent','INSTANCE_SWAP',C['icon/'+(state==='Selected'?'list':'layout-grid')].id);const tx=T(state==='Selected'?'Stack':'Grid','Body / 13',state==='Selected'?'color/text/brand':'color/text/secondary');add(c,tx);expose(c,tx,'Label');layoutCards.push(c);C['layout/'+state]=c;}
const layoutSet=placeSet(molecules,'LayoutChoice',layoutCards,2);layoutSet.x=40;layoutSet.y=760;SET.LayoutChoice=layoutSet;
const toast=f('Toast / Moved',456,56,'HORIZONTAL','color/surface/base',true);rad(toast,12);pad(toast,8,12);gap(toast,12);stroke(toast,'color/border/default');applyFx(toast,ST.toast);toast.counterAxisAlignItems='CENTER';add(toast,icon('circle-check','color/icon/success',22));const tt=T('2 blocks moved to Portfolio','Body / 13');add(toast,tt,true);expose(toast,tt,'Message');add(toast,inst(C['button/Ghost/Default'],'Undo action',{Label:'Undo','Show icon':false},64,40));molecules.appendChild(toast);toast.x=760;toast.y=800;C.toast=toast;
const usage=f('Molecule usage notes',1680,232,'HORIZONTAL','color/surface/base');pad(usage,24);gap(usage,32);rad(usage,16);molecules.appendChild(usage);usage.x=40;usage.y=1000;
for(const [a,b]of [['Staged selection','Checkmarks and selected rows persist while the picker is open. Cancel discards the staged selection.'],['Clear consequences','Move means reparent, not duplicate. The destination is always named before the action is committed.'],['Recoverable feedback','A confirmation toast and Undo make a completed move visible and recoverable.']]){const cell=f(a,520,176);gap(cell,12);add(cell,T(a,'Heading / 16'));add(cell,T(b,'Body / 14','color/text/secondary',496));add(usage,cell,true);}
const logo=figma.createComponent();CREATED.push(logo.id);logo.name='Brand / HoLink logo';logo.layoutMode='HORIZONTAL';logo.resize(96,24);logo.fills=[];const img=figma.createRectangle();CREATED.push(img.id);img.name='Official product logo';img.resize(96,24);img.fills=[{type:'IMAGE',imageHash:figma.createImage(figma.base64Decode(LOGO_BASE64)).hash,scaleMode:'FIT'}];logo.appendChild(img);atoms.appendChild(logo);logo.x=40;logo.y=1512;logo.description='Original transparent logo exported from app.ho.link/images/logo.png. Preserved without redrawing.';C.logo=logo;
await Promise.all(PENDING);
const result={components:Object.fromEntries(Object.entries(C).map(([k,v])=>[k,v.id])),sets:Object.fromEntries(Object.entries(SET).map(([k,v])=>[k,v.id])),sections:SECTIONS,createdIds:CREATED,counts:{mainComponents:Object.keys(C).length,sets:Object.keys(SET).length,icons:Object.keys(ICON_SOURCES).length},validation:{buttonVariants:buttons.children.length,checkboxVariants:checkSet.children.length,candidateVariants:cand.children.length,allButtonsUseAutoLayout:buttons.children.every(n=>n.layoutMode==='HORIZONTAL'),buttonProperties:buttons.componentPropertyDefinitions}};
figma.viewport.scrollAndZoomIntoView([buttons,cand]);return result;
