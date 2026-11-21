import { BLOCK_TYPES, isContentBlock, youtubeId } from './catalog.js';

export const BLOCK_LIMIT = 20;
export const contentCount = page => Object.values(page.blocks).filter(isContentBlock).length;

export function normalizeUrl(input) {
  const raw = String(input || '').trim();
  if (!raw) throw new Error('Enter a link to continue.');
  const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`);
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname.includes('.')) throw new Error('Enter a valid website URL, such as https://example.com.');
  if(url.href.length>2048) throw new Error('Keep this URL under 2,048 characters.');
  return url.href;
}

export function domain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
}

export function normalizeAsset(input) {
  const value=String(input || '').trim();
  if(/^\/assets\/(?:illustrations\/[a-z\d-]+\.svg|audio\/[a-z\d-]+\.wav)$/.test(value)) return value;
  return normalizeUrl(value);
}

/** Validate each type before a transaction is committed or saved data is accepted. */
export function normalizeContent(input) {
  if(!isContentBlock(input)) throw new Error('Choose a supported block type.');
  const b={...input,title:String(input.title || '').trim().slice(0,80),visible:input.visible !== false};
  if(!b.title && b.type !== 'link') throw new Error('Give this block a title.');
  if(['link','qr','music','podcast','pdf','video','calendly'].includes(b.type)) {
    b.url=b.type==='music'?normalizeAsset(b.url):normalizeUrl(b.url);
    if(!b.title) b.title=domain(b.url);
  }
  if(b.type==='video' && !youtubeId(b.url)) throw new Error('Enter a YouTube video URL, such as youtube.com/watch?v=…');
  if(b.type==='qr' && b.url.length>1024) throw new Error('Use a shorter URL for this QR code (up to 1,024 characters).');
  if(b.type==='calendly' && !/(^|\.)calendly\.com$/.test(new URL(b.url).hostname)) throw new Error('Enter a booking link from calendly.com.');
  if(b.type==='podcast' && new URL(b.url).hostname!=='podcasts.apple.com') throw new Error('Enter a link from podcasts.apple.com.');
  if(b.description !== undefined) b.description=String(b.description).trim().slice(0,500);
  if(b.artist !== undefined) b.artist=String(b.artist).trim().slice(0,100);
  if(b.type==='link') {
    b.display=['classic','cover','showcase'].includes(b.display)?b.display:'classic';
    b.image=b.image?normalizeAsset(b.image):'/assets/illustrations/studio-blue.svg';
  }
  if(b.type==='text' && !b.description) throw new Error('Add a description for this text block.');
  if(b.type==='separator') b.style=['line','space','dots'].includes(b.style)?b.style:'line';
  if(b.type==='dropdown') {
    if(!Array.isArray(b.items) || !b.items.length || b.items.length>8) throw new Error('Add between 1 and 8 dropdown items.');
    b.items=b.items.map(item=>({question:String(item.question||'').trim().slice(0,120),answer:String(item.answer||'').trim().slice(0,500)}));
    if(b.items.some(item=>!item.question || !item.answer)) throw new Error('Give every dropdown item a question and an answer.');
  }
  if(b.type==='gallery') {
    if(!Array.isArray(b.images) || !b.images.length || b.images.length>6) throw new Error('Add between 1 and 6 image URLs.');
    b.images=b.images.map(normalizeAsset);
  }
  if(b.type==='email') {
    b.email=String(b.email||'').trim();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email) || /[\r\n]/.test(b.email)) throw new Error('Enter a valid email address.');
    b.subject=String(b.subject||'').trim().slice(0,150);
  }
  if(['phone','whatsapp'].includes(b.type)) {
    b.phone=String(b.phone||'').trim();
    if(!/^\+?[\d\s()-]+$/.test(b.phone) || !/^\d{7,15}$/.test(b.phone.replace(/\D/g,''))) throw new Error('Enter a phone number with country code, such as +62 812 3456 7890.');
    b.message=String(b.message||'').trim().slice(0,500);
  }
  if(b.type==='location') {
    b.address=String(b.address||'').trim().slice(0,300);
    if(!b.address) throw new Error('Add an address for this location.');
  }
  return b;
}

export function ownerOf(page, id) {
  return Object.values(page.blocks).find(b => b.type === 'collection' && b.children.includes(id))?.id || null;
}

export function orderedIds(page) {
  return page.rootIds.flatMap(id => page.blocks[id].type === 'collection' ? [id, ...page.blocks[id].children] : [id]);
}

export function eligibleBlocks(page, collectionId, query = '') {
  const target = page.blocks[collectionId];
  if (!target || target.type !== 'collection') return [];
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return orderedIds(page).map(id => page.blocks[id]).filter(block => isContentBlock(block) && !target.children.includes(block.id) && terms.every(term => `${block.title} ${BLOCK_TYPES[block.type].label} ${block.url||''} ${block.description||''} ${block.email||''} ${block.address||''}`.toLocaleLowerCase().includes(term)));
}

export function assertPage(page) {
  if (!page || ![1,2].includes(page.version) || !page.profile || typeof page.profile.name !== 'string' || typeof page.profile.bio !== 'string' || !Array.isArray(page.rootIds) || !page.blocks || typeof page.blocks !== 'object') throw new Error('Invalid saved page.');
  const seen = new Set();
  const visit = (id, nested = false) => {
    const b = page.blocks[id];
    if (!b || b.id !== id || seen.has(id) || (!isContentBlock(b) && b.type!=='collection') || typeof b.title !== 'string') throw new Error('A block is missing or appears more than once.');
    seen.add(id);
    if (isContentBlock(b)) normalizeContent(b);
    else {
      if (nested || !Array.isArray(b.children) || !['stack', 'grid'].includes(b.layout)) throw new Error('Invalid Collection.');
      b.children.forEach(child => visit(child, true));
    }
  };
  page.rootIds.forEach(id => visit(id));
  if (seen.size !== Object.keys(page.blocks).length) throw new Error('An orphan block was found.');
  return page;
}

/** One immutable transaction: move, never duplicate, in the original page order. */
export function moveBlocks(page, ids, collectionId) {
  const target = collectionId === null ? null : page.blocks[collectionId];
  if (collectionId !== null && (!target || target.type !== 'collection')) throw new Error('Choose a Collection to move to.');
  const selected = new Set(ids);
  for (const id of selected) if (!isContentBlock(page.blocks[id])) throw new Error('Only content blocks can be moved into a Collection.');
  const moving = orderedIds(page).filter(id => selected.has(id) && ownerOf(page, id) !== collectionId);
  if (!moving.length) return page;
  const movingSet = new Set(moving);
  const blocks = { ...page.blocks };
  for (const block of Object.values(blocks)) if (block.type === 'collection') {
    blocks[block.id] = { ...block, children: block.children.filter(id => !movingSet.has(id)) };
  }
  const rootIds = page.rootIds.filter(id => !movingSet.has(id));
  if (target) blocks[target.id] = { ...blocks[target.id], children: [...blocks[target.id].children, ...moving] };
  else rootIds.push(...moving);
  return assertPage({ ...page, blocks, rootIds });
}

export function reorderBlock(page, id, direction) {
  if (!page.blocks[id]) throw new Error('Block not found.');
  const owner = ownerOf(page, id);
  const order = [...(owner ? page.blocks[owner].children : page.rootIds)];
  const index = order.indexOf(id), next = index + direction;
  if (index < 0 || next < 0 || next >= order.length) return page;
  [order[index], order[next]] = [order[next], order[index]];
  return owner ? { ...page, blocks: { ...page.blocks, [owner]: { ...page.blocks[owner], children: order } } } : { ...page, rootIds: order };
}

export function reorderBefore(page, id, targetId) {
  if (id === targetId || ownerOf(page, id) !== ownerOf(page, targetId)) return page;
  const owner = ownerOf(page, id), order = [...(owner ? page.blocks[owner].children : page.rootIds)];
  if (!order.includes(id) || !order.includes(targetId)) return page;
  order.splice(order.indexOf(id), 1); order.splice(order.indexOf(targetId), 0, id);
  return owner ? { ...page, blocks: { ...page.blocks, [owner]: { ...page.blocks[owner], children: order } } } : { ...page, rootIds: order };
}

export function updateBlock(page, id, changes) {
  const old = page.blocks[id];
  if (!old) throw new Error('Block not found.');
  const next = { ...old, ...changes, id: old.id, type: old.type };
  if (!next.title.trim()) throw new Error('Give this block a name.');
  next.title = next.title.trim().slice(0, 80);
  if (old.type === 'collection') next.children = old.children;
  const normalized=old.type==='collection'?next:normalizeContent(next);
  if (JSON.stringify(old) === JSON.stringify(normalized)) return page;
  return assertPage({ ...page, blocks: { ...page.blocks, [id]: normalized } });
}

export function addBlock(page, { id, type, ...properties }, collectionId = null) {
  if (contentCount(page) >= BLOCK_LIMIT) throw new Error('This page has reached its 20-block limit.');
  if (!id || page.blocks[id]) throw new Error('This block already exists.');
  const block=normalizeContent({id,type,...properties,visible:true});
  let result = { ...page, blocks: { ...page.blocks, [id]: block }, rootIds: [...page.rootIds, id] };
  if (collectionId) result = moveBlocks(result, [id], collectionId);
  return assertPage(result);
}

export function addLink(page, properties, collectionId = null) {
  return addBlock(page,{...properties,type:'link'},collectionId);
}

export function addCollection(page, { id, title }) {
  if (!title.trim()) throw new Error('Give your Collection a name.');
  if (!id || page.blocks[id]) throw new Error('This Collection already exists.');
  return assertPage({ ...page, rootIds: [...page.rootIds, id], blocks: { ...page.blocks, [id]: { id, type: 'collection', title: title.trim().slice(0, 40), children: [], layout: 'stack', showTitle: true, visible: true } } });
}

export function removeBlock(page, id) {
  const b = page.blocks[id];
  if (!isContentBlock(b)) throw new Error('Choose a content block.');
  const blocks = { ...page.blocks }; delete blocks[id];
  for (const collection of Object.values(blocks).filter(b => b.type === 'collection')) blocks[collection.id] = { ...collection, children: collection.children.filter(child => child !== id) };
  return assertPage({ ...page, blocks, rootIds: page.rootIds.filter(child => child !== id) });
}

/** Small snapshot history makes every local edit and reset recoverable. */
export class History {
  past = [];
  future = [];
  commit(before, after, label) {
    if (before === after) return false;
    this.past.push({ page: structuredClone(before), label });
    if (this.past.length > 40) this.past.shift();
    this.future = [];
    return true;
  }
  undo(current) {
    const entry = this.past.pop();
    if (!entry) return null;
    this.future.push({ page: structuredClone(current), label: entry.label });
    return entry;
  }
  redo(current) {
    const entry = this.future.pop();
    if (!entry) return null;
    this.past.push({ page: structuredClone(current), label: entry.label });
    return entry;
  }
}
