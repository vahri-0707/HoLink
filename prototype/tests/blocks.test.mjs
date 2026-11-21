import test from 'node:test';
import assert from 'node:assert/strict';
import { initialPage, migratePage } from '../src/data.js';
import { BLOCK_TYPES, draftForType, youtubeId } from '../src/catalog.js';
import { addBlock, assertPage, contentCount, eligibleBlocks, History, moveBlocks, normalizeContent, removeBlock, updateBlock } from '../src/model.js';

const values={
  link:{title:'Work',url:'https://example.com'},qr:{url:'https://ho.link/vahri'},text:{description:'A few words about my work.'},
  dropdown:{items:[{question:'Available?',answer:'Yes, send me a message.'}]},separator:{style:'dots'},
  gallery:{images:['/assets/illustrations/studio-blue.svg','https://example.com/art.png']},music:{url:'/assets/audio/studio-ambient.wav',artist:'Studio'},
  podcast:{url:'https://podcasts.apple.com/us/podcast/example/id123'},pdf:{url:'https://example.com/portfolio.pdf'},
  video:{url:'https://www.youtube.com/watch?v=aqz-KE-bpKQ'},calendly:{url:'https://calendly.com/studio'},
  email:{email:'hello@example.com',subject:'A new project'},phone:{phone:'+62 812 3456 7890'},whatsapp:{phone:'+62 812 3456 7890',message:'Hello!'},location:{address:'Jakarta, Indonesia'}
};

test('all 15 catalogue types can be created, edited, moved, and removed as real content',()=>{
  assert.equal(Object.keys(BLOCK_TYPES).length,15);
  for(const type of Object.keys(BLOCK_TYPES)) {
    let page=initialPage({varied:false});
    const id=`test-${type}`,draft={...draftForType(type),...values[type]};
    page=addBlock(page,{...draft,id,type},'portfolio');
    assert.equal(contentCount(page),5,type);
    assert.equal(page.blocks.portfolio.children.includes(id),true,type);
    assert.equal(page.rootIds.includes(id),false,type);
    page=updateBlock(page,id,{title:'My custom title'});
    assert.equal(page.blocks[id].title,'My custom title');
    page=moveBlocks(page,[id],null);
    assert.equal(page.rootIds.at(-1),id);
    assertPage(page);
    page=removeBlock(page,id);
    assert.equal(contentCount(page),4);
  }
});

test('mixed moves keep every type-specific setting and support exact Undo',()=>{
  const before=initialPage(),history=new History();
  const ids=['quick-answers','studio-gallery','about-work'];
  const after=moveBlocks(before,ids,'portfolio');
  assert.deepEqual(after.blocks.portfolio.children,['case-studies','about-work','studio-gallery','quick-answers']);
  for(const id of ids) assert.deepEqual(after.blocks[id],before.blocks[id]);
  assert.equal(eligibleBlocks(before,'portfolio','image slider')[0].id,'studio-gallery');
  assert.equal(eligibleBlocks(before,'portfolio','dropdown')[0].id,'quick-answers');
  history.commit(before,after,'Mixed blocks moved');
  assert.deepEqual(history.undo(after).page,before);
});

test('the v1 migration preserves user edits, groups and order, and runs only once',()=>{
  const original=initialPage({varied:false});original.version=1;
  original.blocks['brand-identity'].title='My very own title';
  const saved=structuredClone(original),migrated=migratePage(original);
  assert.equal(migrated.version,2);
  for(const id of Object.keys(original.blocks)) assert.deepEqual(migrated.blocks[id],original.blocks[id]);
  assert.deepEqual(migrated.rootIds.filter(id=>original.rootIds.includes(id)),original.rootIds);
  assert.deepEqual(original,saved);
  assert.equal(migratePage(migrated),migrated);
  assertPage(migrated);
});

test('type validation blocks unsafe URLs, incomplete content, and invalid provider links atomically',()=>{
  for(const [type,changes] of [
    ['link',{url:'javascript:alert(1)'}],['video',{url:'https://example.com'}],['podcast',{url:'https://example.com'}],['calendly',{url:'https://calendly.com.example.com'}],
    ['gallery',{images:['javascript:alert(1)']}],['dropdown',{items:[{question:'Hello',answer:''}]}],['email',{email:'hello@example.com\nBcc:x@evil.com'}],['phone',{phone:'123'}],['text',{description:''}]
  ]) {
    const before=initialPage();
    assert.throws(()=>addBlock(before,{...draftForType(type),...values[type],...changes,type,id:'bad'}),type);
    assert.deepEqual(before,initialPage());
  }
  assert.equal(youtubeId('https://youtu.be/aqz-KE-bpKQ'),'aqz-KE-bpKQ');
  assert.equal(youtubeId('https://www.youtube.com/shorts/aqz-KE-bpKQ'),'aqz-KE-bpKQ');
  assert.equal(youtubeId('https://youtube.com.evil.com/watch?v=aqz-KE-bpKQ'),null);
});

test('every content type counts towards the existing 20-block page limit',()=>{
  let page=initialPage({varied:false});
  for(let n=4;n<20;n++)page=addBlock(page,{id:`text-${n}`,type:'text',title:'A note',description:'A little context.'});
  assert.equal(contentCount(page),20);
  assert.throws(()=>addBlock(page,{id:'overflow',type:'separator',title:'More'}),/20-block/);
  assert.equal(normalizeContent({...draftForType('separator'),type:'separator',id:'line'}).style,'line');
});
