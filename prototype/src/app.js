import { initialPage, migratePage } from './data.js';
import { BLOCK_LIMIT, History, addCollection, addBlock, assertPage, contentCount, eligibleBlocks, moveBlocks, ownerOf, removeBlock, reorderBefore, reorderBlock, updateBlock } from './model.js';
import { badge, blockRow, button, candidateRow, e, icon, iconButton, input, layoutChoice, tabs, toggle } from './components.js';
import { appNavigation, progressRing } from './navigation.js';
import { BLOCK_TYPES, blockLabel, blockIcon, draftForType, isContentBlock, youtubeId } from './catalog.js';
import { blockLibrary, newBlockForm, contentFields, previewBlock } from './block-content.js';

const STORAGE_KEY = 'holink-collection-prototype-v1';
const PREVIEW_STORAGE_KEY = 'holink-preview-reviewed-v1';
const root = document.querySelector('#app');
const announcer = document.querySelector('#announcer');
const history = new History();
let page;
try {
  const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));
  assertPage(saved);
  page=assertPage(migratePage(saved));
  if(saved.version===1) {
    if(!localStorage.getItem(`${STORAGE_KEY}-backup`)) localStorage.setItem(`${STORAGE_KEY}-backup`,JSON.stringify(saved));
    localStorage.setItem(STORAGE_KEY,JSON.stringify(page));
  }
} catch { page = initialPage(); }
const readPreference = key => { try { return localStorage.getItem(key) === 'true'; } catch { return false; } };
const writePreference = (key,value) => { try { localStorage.setItem(key,String(value)); } catch { /* Preferences can remain in memory. */ } };
const ui = {
  selectedId: page.rootIds.find(id => page.blocks[id].type === 'collection') || page.rootIds[0],
  panel: 'properties', targetId: null, source: 'existing', selected: new Set(), query: '',
  newType:'link',newDraft:draftForType('link'), errors: {}, collapsed: new Set(),
  mode: 'edit', bulk: false, bulkSelected: new Set(), menu: null, dialog: null,
  toast: null, hint: '', pickerOrigin: null, dialogOrigin: null, pendingFocus: null, scrollToCollection: null,scrollToBlock:null,
  navExpanded: false,
  navOverlay: false, navHelpOpen: false, previewReviewed: readPreference(PREVIEW_STORAGE_KEY),
  libraryType:'link',libraryDisplay:'classic',libraryQuery:'',libraryTarget:null,
  mediaSlides:new Map(),playingVideo:null
};
let toastTimer, dragId = null;

const collectionFor = id => page.blocks[id]?.type === 'collection' ? id : ownerOf(page, id);
const currentCollection = () => page.blocks[ui.targetId || collectionFor(ui.selectedId) || page.rootIds.find(id => page.blocks[id].type === 'collection')];
const countBlocks = () => contentCount(page);
const blockNoun = n => `${n} block${n === 1 ? '' : 's'}`;

function persist() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(page)); } catch { /* The editor remains usable in memory-only browsing. */ } }
function announce(message) { announcer.textContent = ''; queueMicrotask(() => { announcer.textContent = message; }); }
function showToast(message, undo = false, tone = 'success') {
  clearTimeout(toastTimer); ui.toast = { message, undo, tone }; announce(message);
  toastTimer = setTimeout(() => { ui.toast = null; render(); }, 12000);
}
function commit(next, message) {
  if (!history.commit(page, next, message)) return false;
  page = next; persist(); ui.menu = null; ui.hint = ''; showToast(message, true); return true;
}
function fail(message) { showToast(message, false, 'error'); render(); }

const isNavigationOverlay = () => ui.navExpanded;
function setupSteps() {
  return [
    {id:'profile',label:'Add your name and bio',done:!!(page.profile.name.trim()&&page.profile.bio.trim())},
    {id:'link',label:'Add your first link',done:countBlocks()>0},
    {id:'organize',label:'Organize links in a Collection',done:Object.values(page.blocks).some(b=>b.type==='collection'&&b.children.length>=3)},
    {id:'description',label:'Add context to a link',done:Object.values(page.blocks).some(b=>b.type==='link'&&b.description?.trim())},
    {id:'preview',label:'Review your page preview',done:ui.previewReviewed}
  ];
}

function rail() {
  return appNavigation({expanded:ui.navExpanded,overlay:isNavigationOverlay(),helpOpen:ui.navHelpOpen,steps:setupSteps()});
}

function header() {
  return `<header class="topbar" ${isNavigationOverlay()?'inert':''}><h1 class="sr-only">HoLink page editor</h1><div class="header-brand-slot"><img class="header-brand" src="/assets/holink-logo.png" width="112" height="28" alt="HoLink"></div>
    <button type="button" class="page-url" data-action="copy-url" aria-label="Copy page URL">${icon('link', 16)}<span>ho.link/${e(page.profile.slug)}</span>${icon('copy', 16)}</button>
    <div class="header-actions"><span class="save-status">${icon('circle-check', 16)}<span>All changes saved</span></span>
    ${button('Support', { glyph:'headphones',action:'help',className:'support-button',selected:ui.dialog==='help',attrs:'data-focus-key="support"' })}
    ${button('Preview', { kind:'secondary',action:'compact-preview',glyph:'eye',className:'compact-preview-trigger',attrs:'data-focus-key="compact-preview"' })}
    ${iconButton('bell', 'Notifications', { action: 'notifications',selected:ui.menu?.type==='notifications',className:ui.menu?.type==='notifications'?'is-active':'',attrs:'data-focus-key="notifications"' })}<span class="avatar header-avatar" aria-label="Account: Vahri Maulana">VM</span></div>
  </header>`;
}

function collectionCard(collection) {
  const active = collectionFor(ui.selectedId) === collection.id || ui.targetId === collection.id;
  const closed = ui.collapsed.has(collection.id);
  return `<section class="collection-card ${active ? 'is-active' : ''}" data-collection-id="${e(collection.id)}" aria-label="${e(collection.title)} Collection">
    <div class="collection-heading">
      ${iconButton(closed ? 'chevron-right' : 'chevron-down', `${closed ? 'Expand' : 'Collapse'} ${collection.title}`, { action: 'collapse', id: collection.id, className: 'disclosure', size: 16, attrs: `aria-expanded="${!closed}" aria-controls="children-${e(collection.id)}" data-focus-key="disclosure-${e(collection.id)}"` })}
      <button class="collection-name" type="button" data-action="select-block" data-id="${e(collection.id)}" data-focus-key="collection-${e(collection.id)}" title="${e(collection.title)}">${e(collection.title)}</button>
      ${badge(collection.children.length, 'info')}${iconButton('ellipsis', `Actions for ${collection.title}`, { action: 'collection-menu', id: collection.id, size: 16, attrs: `aria-haspopup="menu" data-focus-key="more-${e(collection.id)}"` })}
    </div>
    <div id="children-${e(collection.id)}" class="collection-children ${closed ? 'is-collapsed' : ''}">
      ${collection.children.length ? collection.children.map(id => blockRow(page.blocks[id], { nested: true, active: ui.selectedId === id, bulk: ui.bulk, checked: ui.bulkSelected.has(id) })).join('') : '<p class="collection-empty">Your next great links go here.</p>'}
      ${button('Add to Collection', { kind: 'secondary', glyph: 'plus', action: 'open-picker', id: collection.id, className: 'collection-add', attrs: `data-focus-key="add-${e(collection.id)}"` })}
    </div>
  </section>`;
}

function sidebar() {
  const collections = page.rootIds.filter(id => page.blocks[id].type === 'collection');
  const ungrouped = page.rootIds.filter(id => isContentBlock(page.blocks[id]));
  return `<aside class="blocks-sidebar" aria-label="Block list" data-scroll-key="sidebar">
    <section class="page-settings"><h2 class="eyebrow">Page settings</h2><div class="settings-items">
      <button class="settings-item ${ui.panel === 'profile' ? 'is-active' : ''}" type="button" data-action="profile">${icon('user', 18, '', {selected:ui.panel==='profile'})}<span>Header</span></button>
      ${[['Social','link'],['Message','mail'],['Subscribe','contact']].map(([label,glyph]) => `<div class="settings-item settings-item--reference" title="${label}">${icon(glyph, 18)}<span>${label}</span></div>`).join('')}
    </div></section>
    <section class="block-controls"><div class="section-heading"><h2>Blocks</h2>${badge(`${countBlocks()} / ${BLOCK_LIMIT}`)}<span class="row-space"></span>${button(ui.bulk ? 'Done' : 'Select', { kind: 'ghost', action: 'bulk', className: 'select-button', attrs: `aria-pressed="${ui.bulk}"` })}</div>
      <div class="create-actions">${button('Add Block', { glyph: 'plus', action: 'global-new', disabled: countBlocks() >= BLOCK_LIMIT, attrs:'data-focus-key="global-add"' })}${iconButton('folder', 'Create Collection', { action: 'new-collection', attrs: 'data-focus-key="create-collection"' })}</div>
    </section>
    <div class="collections-list">${collections.map(id => collectionCard(page.blocks[id])).join('')}</div>
    <section class="ungrouped"><h2 class="eyebrow">Other blocks · ${ungrouped.length}</h2>${ungrouped.map(id => blockRow(page.blocks[id], { active: ui.selectedId === id, bulk: ui.bulk, checked: ui.bulkSelected.has(id) })).join('')}${!ungrouped.length ? '<p class="empty-ungrouped">All your blocks are organized.</p>' : ''}</section>
    <div class="sidebar-space"></div>
    ${ui.bulk ? `<div class="bulk-toolbar"><span>${ui.bulkSelected.size} selected</span>${button('Move', { action: 'bulk-move', disabled: !ui.bulkSelected.size })}</div>` : ''}
    <div class="branding-footer">${icon('eye', 16)}<span>HoLink footer</span><span>Free</span></div>
  </aside>`;
}

function phoneContent(previewMode = ui.mode === 'preview') {
  const profile = page.profile;
  const blocks = page.rootIds.map(id => {
    const block = page.blocks[id];
    if (!block.visible) return '';
    if (isContentBlock(block)) return previewBlock(block,previewMode,{selected:ui.selectedId===id,slide:ui.mediaSlides.get(id)||0,playing:ui.playingVideo===id});
    const selected = !previewMode && (collectionFor(ui.selectedId) === id || ui.targetId === id);
    return `<section class="preview-collection ${selected ? 'is-selected' : ''}" data-preview-collection="${e(id)}" aria-label="${e(block.title)} links">
      ${block.showTitle ? previewMode ? `<h3 class="preview-collection-title">${e(block.title)}</h3>` : `<button type="button" class="preview-collection-title" data-action="select-block" data-id="${e(id)}">${icon('folder', 16)}<span>${e(block.title)}</span></button>` : ''}
      <div class="preview-collection-links ${block.layout === 'grid' ? 'preview-collection-links--grid' : ''}">${block.children.filter(child => page.blocks[child].visible).map(child => previewBlock(page.blocks[child],previewMode,{selected:ui.selectedId===child,slide:ui.mediaSlides.get(child)||0,playing:ui.playingVideo===child})).join('') || (!previewMode ? '<p class="preview-empty">Add your first block.</p>' : '')}</div>
    </section>`;
  }).join('');
  return `<div class="phone-preview ${previewMode ? 'phone-preview--view' : ''}" data-scroll-key="phone">
    <div class="profile-tools"><span class="profile-brand">${icon('link', 20)}</span>${iconButton('copy', 'Copy profile link', { action: 'copy-url' })}</div>
    <div class="creator-profile"><span class="avatar avatar--profile">${e(profile.initials)}</span><h2>${e(profile.name)}</h2><p>${e(profile.bio)}</p><div class="social-icons"><span>${icon('mail', 16)}</span><span>${icon('link', 16)}</span><span>${icon('external-link', 16)}</span></div></div>
    <div class="preview-blocks">${blocks}</div><div class="phone-space"></div><p class="phone-credit">Made with HoLink</p>
  </div>`;
}

function canvas() {
  const hint = ui.panel === 'picker' ? ui.source === 'existing' ? 'Preview stays unchanged until you move the blocks.' : 'Your new block appears here after you add it.' : ui.hint || 'Your page, just as your audience will see it.';
  return `<main class="preview-canvas" aria-label="Live page preview"><div class="view-switch" role="tablist" aria-label="Edit or preview the page">${['edit','preview'].map(mode => `<button type="button" role="tab" id="view-tab-${mode}" aria-controls="page-preview" aria-selected="${ui.mode === mode}" tabindex="${ui.mode === mode ? 0 : -1}" class="segment ${ui.mode === mode ? 'is-selected' : ''}" data-action="view-mode" data-value="${mode}" data-focus-key="view-${mode}">${mode === 'edit' ? 'Edit' : 'Preview'}</button>`).join('')}</div><p class="preview-address">ho.link/${e(page.profile.slug)}</p><div id="page-preview" role="tabpanel" aria-labelledby="view-tab-${ui.mode}">${phoneContent()}</div><p class="preview-hint">${e(hint)}</p></main>`;
}

function pickerPanel() {
  const target = page.blocks[ui.targetId];
  const all = eligibleBlocks(page, target.id), shown = eligibleBlocks(page, target.id, ui.query);
  const count = [...ui.selected].filter(id => all.some(b => b.id === id)).length;
  const existing = ui.source === 'existing';
  const list = shown.map(block => candidateRow(block, ui.selected.has(block.id), ownerOf(page, block.id) ? page.blocks[ownerOf(page, block.id)].title : '')).join('');
  return `<div class="inspector-main picker-main" data-scroll-key="inspector"><header class="panel-heading"><p class="eyebrow">Collection / ${e(target.title)}</p><div class="panel-title-row"><h2 id="inspector-heading">Add to Collection</h2>${iconButton('x', 'Close block picker', { action: 'cancel-picker' })}</div><p>${existing ? `Bring existing blocks into ${e(target.title)}.` : `Create something new in ${e(target.title)}.`}</p></header>
    ${tabs([{label:'Existing blocks',value:'existing'},{label:'New block',value:'new'}], ui.source, 'Block source', 'source-tab')}
    ${existing ? `<section id="panel-existing" role="tabpanel" aria-labelledby="tab-existing"><div class="search-field">${icon('search', 18)}<label class="sr-only" for="picker-search">Search page blocks</label><input id="picker-search" data-focus-key="picker-search" type="search" placeholder="Search page blocks" value="${e(ui.query)}" autocomplete="off">${ui.query ? iconButton('x', 'Clear search', { action: 'clear-search' }) : ''}</div>
      <div class="available-heading"><h3>Available on this page</h3>${badge(shown.length)}</div><div class="candidate-list" aria-label="Available blocks">${list || `<div class="empty-state">${icon(ui.query ? 'search' : 'circle-check', 24)}<h3>${ui.query ? 'No blocks found' : 'You’re all organized.'}</h3><p>${ui.query ? 'Try a block title or website, or clear your search.' : `All eligible blocks are already in ${e(target.title)}.`}</p>${button(ui.query ? 'Clear search' : 'Create new block', { kind: 'secondary', action: ui.query ? 'clear-search' : 'switch-new' })}</div>`}</div>
      <div class="info-card"><strong>Moves, never duplicates.</strong><p>Selected blocks leave their current position. Blocks already in ${e(target.title)} are not listed.</p></div>
    </section>` : `<section id="panel-new" role="tabpanel" aria-labelledby="tab-new">${newBlockForm(ui.newType,ui.newDraft,{scoped:true,errors:ui.errors})}</section>`}
    </div><footer class="picker-footer"><div class="selection-summary"><span aria-live="polite">${existing ? `${count} ${count === 1 ? 'block' : 'blocks'} selected` : blockLabel(ui.newType)}</span><span class="destination" title="${e(target.title)}">${icon('folder', 16)}<span>${e(target.title)}</span></span></div>
      <div class="picker-actions">${button('Cancel', { kind: 'secondary', action: 'cancel-picker' })}${existing ? button(count ? `Move ${blockNoun(count)}` : 'Move blocks', { action: 'confirm-move', disabled: !count, attrs: `aria-describedby="move-help" data-focus-key="confirm-move"` }) : button('Add block', { type: 'submit', attrs: 'form="new-block-form"' })}</div>${existing ? `<span id="move-help" class="sr-only">${count ? `Move ${blockNoun(count)} to ${e(target.title)}. This does not duplicate your blocks.` : 'Select at least one block to enable Move.'}</span>` : ''}
    </footer>`;
}

function collectionProperties(collection) {
  return `<div class="inspector-main properties-main" data-scroll-key="inspector"><header class="panel-heading"><p class="eyebrow">Collection</p><h2 id="inspector-heading">Collection properties</h2><p>Keep related links together.</p></header>
    ${input({ id:'collection-name',label:'Name',value:collection.title,maxLength:40,attrs:`data-edit-block="${e(collection.id)}" data-property="title"` })}
    <section class="collection-contents"><div class="section-heading"><h3>Collection contents</h3><span class="row-space"></span>${badge(`${blockNoun(collection.children.length)}`)}</div><div class="inspector-block-list">${collection.children.map(id => blockRow(page.blocks[id],{nested:true})).join('') || '<p class="inline-empty">Add your first link to this Collection.</p>'}</div>${button('Add to Collection', { glyph:'plus',action:'open-picker',id:collection.id,attrs:`data-focus-key="properties-add-${e(collection.id)}"` })}</section>
    <fieldset class="layout-options"><legend>Layout</legend><div>${layoutChoice('stack','Stack',collection.layout === 'stack')}${layoutChoice('grid','Grid',collection.layout === 'grid')}</div></fieldset>
    ${toggle('show-title','Show collection title',collection.showTitle,`data-collection="${e(collection.id)}"`)}
    <div class="panel-space"></div><div class="info-card"><strong>Your order stays yours.</strong><p>Drag blocks within the Collection to change their order.</p></div>
  </div>`;
}

function blockProperties(block) {
  const meta=BLOCK_TYPES[block.type];
  return `<div class="inspector-main properties-main" data-scroll-key="inspector"><header class="panel-heading"><p class="eyebrow">${e(meta.category)} / ${e(meta.singular)}</p><h2 id="inspector-heading">${e(meta.singular)} properties</h2><p>${e(meta.description)}</p></header>
    ${contentFields(block)}
    ${toggle('show-link','Visible on your page',block.visible,`data-block="${e(block.id)}"`)}
    <div class="info-card"><strong>Make it yours.</strong><p>Changes save when you leave a field. Switch to Preview to try the live interaction.</p></div>
    <div class="panel-space"></div>${button(ownerOf(page,block.id) ? 'Move out of Collection' : 'Move to Collection',{kind:'secondary',action:ownerOf(page,block.id)?'move-out':'move-single',id:block.id,glyph:'folder'})}
  </div>`;
}

function inspector() {
  let content;
  if (ui.panel === 'picker' && page.blocks[ui.targetId]) content = pickerPanel();
  else if (ui.panel === 'new-block') content = `<div class="inspector-main properties-main" data-scroll-key="inspector"><header class="panel-heading"><p class="eyebrow">New block / ${e(BLOCK_TYPES[ui.newType].category)}</p><div class="panel-title-row"><h2 id="inspector-heading">Add ${e(blockLabel(ui.newType))}</h2>${iconButton('x','Cancel new block',{action:'close-panel'})}</div><p>${e(BLOCK_TYPES[ui.newType].description)}</p></header>${newBlockForm(ui.newType,ui.newDraft,{errors:ui.errors})}</div><footer class="form-footer">${button('Cancel',{kind:'secondary',action:'close-panel'})}${button('Add block',{type:'submit',attrs:'form="new-block-form"'})}</footer>`;
  else if (ui.panel === 'new-collection') content = `<div class="inspector-main properties-main"><header class="panel-heading"><p class="eyebrow">Organize your page</p><h2 id="inspector-heading">Create a Collection</h2><p>Bring related links together.</p></header><form id="new-collection-form" novalidate>${input({id:'new-collection-name',label:'Name',value:ui.newDraft.title,placeholder:'e.g. My work',required:true,maxLength:40,error:ui.errors.title})}<div class="info-card"><strong>Start with the links you have.</strong><p>After creating your Collection, choose existing blocks or add something new.</p></div></form></div><footer class="form-footer">${button('Cancel',{kind:'secondary',action:'close-panel'})}${button('Create Collection',{type:'submit',attrs:'form="new-collection-form"',disabled:!ui.newDraft.title.trim()})}</footer>`;
  else if (ui.panel === 'profile') content = `<div class="inspector-main properties-main"><header class="panel-heading"><p class="eyebrow">Profile</p><h2 id="inspector-heading">Header properties</h2><p>A little about the person behind the links.</p></header><div class="profile-image-display"><span class="avatar avatar--large">${e(page.profile.initials)}</span></div>${input({id:'profile-name',label:'Bio name',value:page.profile.name,maxLength:40,attrs:'data-profile="name"'})}${input({id:'profile-bio',label:'Bio description',value:page.profile.bio,multiline:true,maxLength:200,attrs:'data-profile="bio"'})}<div class="info-card"><strong>A familiar introduction.</strong><p>Changes appear in your page preview and save when you leave the field.</p></div></div>`;
  else { const selected = page.blocks[ui.selectedId]; content = selected?.type === 'collection' ? collectionProperties(selected) : selected ? blockProperties(selected) : '<div class="inspector-main"><h2 id="inspector-heading">Your page</h2><p>Select a block to edit it.</p></div>'; }
  content = content.replace('id="inspector-heading"', 'id="inspector-heading" data-focus-key="inspector-title" tabindex="-1"');
  return `<aside class="inspector" id="inspector" aria-labelledby="inspector-heading" tabindex="-1">${content}</aside>`;
}

function menu() {
  if (!ui.menu) return '';
  const {id,top,left,type} = ui.menu, block = page.blocks[id];
  if (type === 'notifications') return `<section class="context-menu notifications-popover" style="--menu-top:${top}px;--menu-left:${left}px" aria-label="Notifications"><strong>You’re all caught up.</strong><p>Your latest page changes have been saved.</p></section>`;
  if (!block) return '';
  const items = block.type === 'collection' ? [
    ['Rename Collection','rename','user'],['Add existing blocks','menu-existing','folder'],['Add a new block','menu-new','plus']
  ] : [['Edit block','rename',blockIcon(block)],[ownerOf(page,id)?'Move out of Collection':'Move to Collection',ownerOf(page,id)?'move-out':'move-single','folder'],[block.visible?'Hide from page':'Show on page','visibility','eye'],['Move up','move-up','chevron-down'],['Move down','move-down','chevron-down'],['Remove block','remove-block','x']];
  return `<div class="context-menu" role="menu" aria-label="Actions for ${e(block.title)}" style="--menu-top:${top}px;--menu-left:${left}px">${items.map(([label,action,glyph])=>`<button type="button" role="menuitem" tabindex="-1" data-action="${action}" data-id="${e(id)}" class="menu-item ${action==='remove-block'?'is-danger':''}">${icon(glyph,16,action==='move-up'?'icon--rotate-up':'')}<span>${label}</span></button>`).join('')}</div>`;
}

function toast() {
  if (!ui.toast) return '';
  return `<div class="toast ${ui.toast.tone==='error'?'toast--error':''}" data-toast>${icon(ui.toast.tone==='error'?'x':'circle-check',20)}<span>${e(ui.toast.message)}</span>${ui.toast.undo ? button('Undo',{kind:'ghost',action:'undo',attrs:'data-focus-key="undo"'}) : iconButton('x','Dismiss notification',{action:'dismiss-toast',size:16})}</div>`;
}

function dialog() {
  if (!ui.dialog) return '';
  if(ui.dialog==='block-library') return blockLibrary({type:ui.libraryType,display:ui.libraryDisplay,query:ui.libraryQuery,targetName:page.blocks[ui.libraryTarget]?.title||''});
  if (ui.dialog === 'preview') return `<div class="modal-backdrop"><section class="preview-modal" role="dialog" aria-modal="true" aria-label="Page preview">${iconButton('x','Close preview',{action:'close-dialog',attrs:'data-focus-key="dialog-close"'})}${phoneContent(true)}</section></div>`;
  if (ui.dialog === 'setup') {
    const steps=setupSteps(),done=steps.filter(s=>s.done).length,percent=Math.round(done/steps.length*100);
    return `<div class="modal-backdrop"><section class="help-dialog setup-dialog" role="dialog" aria-modal="true" aria-labelledby="setup-title"><div class="panel-title-row">${progressRing(percent)}${iconButton('x','Close setup checklist',{action:'close-dialog',attrs:'data-focus-key="dialog-close"'})}</div><p class="eyebrow">${done} of ${steps.length} complete</p><h2 id="setup-title">Make your page yours.</h2><p>A few small steps to a page worth sharing.</p><div class="setup-step-list">${steps.map(s=>`<button type="button" class="setup-step ${s.done?'is-complete':''}" data-action="setup-step" data-value="${s.id}">${icon(s.done?'circle-check':'circle',20)}<span>${s.label}</span>${s.done?'<span class="sr-only">Complete</span>':icon('arrow-right',16)}</button>`).join('')}</div><div class="help-footer">${button('Close',{kind:'secondary',action:'close-dialog'})}${button(done===steps.length?'All set':'Continue setup',{action:'setup-continue',glyph:done===steps.length?'check':'arrow-right'})}</div></section></div>`;
  }
  return `<div class="modal-backdrop"><section class="help-dialog" role="dialog" aria-modal="true" aria-labelledby="help-title"><div class="panel-title-row"><span class="help-mark">${icon('folder',24)}</span>${iconButton('x','Close help',{action:'close-dialog',attrs:'data-focus-key="dialog-close"'})}</div><p class="eyebrow">A little guidance</p><h2 id="help-title">Your links. Better together.</h2><p>Organize the content you already have in a Collection.</p><ol><li>Choose <strong>Add to Collection</strong> in your block list.</li><li>In <strong>Existing blocks</strong>, select the links you want.</li><li>Choose <strong>Move</strong>. Your list and preview update together.</li><li>Changed your mind? Choose <strong>Undo</strong>.</li></ol><div class="help-shortcuts"><span><kbd>Esc</kbd> Cancel selection</span><span><kbd>⌘ / Ctrl</kbd> + <kbd>Z</kbd> Undo</span></div><p class="help-local">This prototype saves your edits in this browser.</p><div class="help-footer">${button('Reset demo',{kind:'secondary',action:'reset'})}${button('Got it',{action:'close-dialog'})}</div></section></div>`;
}

// Keep the visible content inset identical with overlay or classic scrollbars.
function syncScrollGutters() {
  for (const node of root.querySelectorAll('.blocks-sidebar,.inspector-main')) {
    const style = getComputedStyle(node);
    const borders = parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);
    node.style.setProperty('--scrollbar-width', `${Math.max(0,node.offsetWidth-node.clientWidth-borders)}px`);
  }
}

function render() {
  const active = document.activeElement;
  const key = ui.pendingFocus || active?.dataset.focusKey;
  const range = active && ['INPUT','TEXTAREA'].includes(active.tagName) && ['text','search','url','textarea'].includes(active.type) ? [active.selectionStart,active.selectionEnd] : null;
  const scroll = new Map([...root.querySelectorAll('[data-scroll-key]')].map(n=>[n.dataset.scrollKey,n.scrollTop]));
  ui.navOverlay=isNavigationOverlay();
  root.innerHTML = `<div class="editor-shell ${ui.navExpanded?'editor-shell--nav-expanded':''}" ${ui.dialog?'inert':''}>${rail()}${ui.navOverlay?'<button type="button" class="nav-backdrop" data-action="nav-close" tabindex="-1" aria-label="Close navigation"></button>':''}${header()}<div class="editor-workspace" ${ui.navOverlay?'inert':''}>${sidebar()}${canvas()}${inspector()}</div>${menu()}${toast()}</div>${dialog()}`;
  syncScrollGutters();
  for (const node of root.querySelectorAll('[data-scroll-key]')) node.scrollTop = scroll.get(node.dataset.scrollKey) || 0;
  if (key) { const node = root.querySelector(`[data-focus-key="${CSS.escape(key)}"]`); if(node){node.focus({preventScroll:true});if(range && typeof node.setSelectionRange === 'function')try{node.setSelectionRange(...range);}catch{}} }
  ui.pendingFocus = null;
  if (ui.scrollToCollection) { root.querySelector(`[data-preview-collection="${CSS.escape(ui.scrollToCollection)}"]`)?.scrollIntoView({block:'nearest',behavior:'instant'});ui.scrollToCollection=null; }
  if (ui.scrollToBlock) { root.querySelector(`.phone-preview [data-preview-block="${CSS.escape(ui.scrollToBlock)}"]`)?.scrollIntoView({block:'nearest',behavior:'instant'});ui.scrollToBlock=null; }
}

function closePicker() {
  const target = ui.targetId;
  ui.selected.clear(); ui.query = ''; ui.errors = {}; ui.targetId = null; ui.panel = 'properties';
  if (target && page.blocks[target]) ui.selectedId = target;
  ui.pendingFocus = ui.pickerOrigin || `add-${ui.selectedId}`;
  announce('Selection canceled. Your page is unchanged.');
}

function openPicker(id, selected = [], origin = null) {
  if (page.blocks[id]?.type !== 'collection') return;
  const eligible = new Set(eligibleBlocks(page,id).map(b=>b.id));
  ui.selectedId = id; ui.targetId = id; ui.panel = 'picker'; ui.source = 'existing'; ui.query = '';
  ui.selected = new Set(selected.filter(id=>eligible.has(id))); ui.errors = {}; ui.newType='link';ui.newDraft = draftForType('link');
  ui.collapsed.delete(id); ui.pickerOrigin = origin || `add-${id}`; ui.pendingFocus = 'picker-search'; ui.menu = null;
}

function openLibrary(targetId = null, origin = 'global-add', type='link') {
  ui.dialog='block-library';ui.dialogOrigin=origin;ui.libraryTarget=targetId;
  ui.libraryType=type;ui.libraryDisplay=type==='link'?(ui.newDraft.display||'classic'):'classic';ui.libraryQuery='';
  ui.pendingFocus='library-search';ui.menu=null;
}

function undo(redo = false) {
  const entry = redo ? history.redo(page) : history.undo(page);
  if (!entry) return;
  page = entry.page; persist(); ui.panel = 'properties'; ui.targetId = null; ui.selected.clear();
  ui.bulkSelected.clear(); ui.bulk = false; ui.menu = null; ui.hint = 'Your previous arrangement has been restored.';
  if (!page.blocks[ui.selectedId]) ui.selectedId = page.rootIds.find(id=>page.blocks[id].type==='collection') || page.rootIds[0];
  ui.pendingFocus = 'inspector-title';
  showToast(redo ? 'Change redone' : /moved/.test(entry.label) ? 'Move undone' : 'Change undone', false);
}

function markPreviewReviewed() {
  ui.previewReviewed=true;writePreference(PREVIEW_STORAGE_KEY,true);
}

function goToSetupStep(step) {
  ui.dialog=null;
  if(isNavigationOverlay())ui.navExpanded=false;
  if(step==='profile'){ui.panel='profile';ui.targetId=null;ui.pendingFocus='profile-name';}
  else if(step==='link')openLibrary();
  else if(step==='organize'){
    const collection=currentCollection();if(collection)openPicker(collection.id);
  } else if(step==='description') {
    const link=Object.values(page.blocks).find(b=>b.type==='link');
    if(link){ui.selectedId=link.id;ui.panel='properties';ui.targetId=null;ui.pendingFocus='block-description';}
    else openLibrary();
  } else if(step==='preview') {
    markPreviewReviewed();
    if(matchMedia('(max-width:1000px)').matches){ui.dialog='preview';ui.pendingFocus='dialog-close';}
    else {ui.mode='preview';ui.pendingFocus='view-preview';}
  }
}

function activate(action, node, event = {}) {
  const id = node.dataset.id, value = node.dataset.value;
  if (!['block-menu','collection-menu','notifications'].includes(action)) ui.menu = null;
  switch (action) {
    case 'nav-toggle': ui.navExpanded=!ui.navExpanded;ui.pendingFocus='nav-toggle';break;
    case 'nav-close': ui.navExpanded=false;ui.pendingFocus='nav-toggle';break;
    case 'nav-help': ui.navHelpOpen=!ui.navHelpOpen;if(!ui.navExpanded){ui.navExpanded=true;ui.navHelpOpen=true;}ui.pendingFocus='nav-nav-help';break;
    case 'setup': ui.dialogOrigin='setup-checklist';if(isNavigationOverlay())ui.navExpanded=false;ui.dialog='setup';ui.pendingFocus='dialog-close';break;
    case 'setup-step': goToSetupStep(value);break;
    case 'setup-continue': {const next=setupSteps().find(s=>!s.done);if(next)goToSetupStep(next.id);else{ui.dialog=null;ui.pendingFocus=ui.dialogOrigin||'setup-checklist';}break;}
    case 'home': if(isNavigationOverlay())ui.navExpanded=false;ui.selectedId = page.rootIds.find(id=>page.blocks[id].type==='collection') || page.rootIds[0]; ui.panel='properties';ui.targetId=null;ui.selected.clear();ui.pendingFocus='inspector-title';break;
    case 'select-block': ui.selectedId=id;ui.panel='properties';ui.targetId=null;ui.selected.clear();ui.errors={};ui.scrollToBlock=id; break;
    case 'library-type': ui.libraryType=value;ui.libraryDisplay='classic';break;
    case 'library-display': ui.libraryDisplay=value;break;
    case 'clear-library-search': ui.libraryQuery='';ui.pendingFocus='library-search';break;
    case 'change-block-type': openLibrary(ui.panel==='picker'?ui.targetId:null,'change-block-type',ui.newType);break;
    case 'sample-audio': ui.newDraft.url='/assets/audio/studio-ambient.wav';ui.newDraft.artist='HoLink Studio · sample audio';ui.errors={};break;
    case 'sample-images': ui.newDraft.images=['/assets/illustrations/studio-blue.svg','/assets/illustrations/studio-coral.svg','/assets/illustrations/studio-lilac.svg'];ui.errors={};break;
    case 'use-block-type': {
      const type=ui.libraryType,target=ui.libraryTarget,display=ui.libraryDisplay;
      const unchanged=type===ui.newType && ['picker','new-block'].includes(ui.panel);
      const draft=unchanged?ui.newDraft:draftForType(type,`https://ho.link/${page.profile.slug}`);
      if(target && ui.panel!=='picker')openPicker(target,[],ui.dialogOrigin);
      ui.newType=type;ui.newDraft={...draft,...(type==='link'?{display}:{})};ui.errors={};ui.dialog=null;
      if(target){ui.targetId=target;ui.panel='picker';ui.source='new';}else{ui.panel='new-block';ui.targetId=null;ui.selected.clear();}
      ui.pendingFocus=type==='link'?'new-url':'new-title';break;
    }
    case 'add-dropdown-item': case 'remove-dropdown-item': {
      const draft=node.dataset.draft==='true',block=draft?ui.newDraft:page.blocks[id];
      const items=block.items.map(item=>({...item}));
      if(action==='add-dropdown-item' && items.length<8)items.push({question:draft?'':'New question',answer:draft?'':'Add your answer here.'});
      if(action==='remove-dropdown-item' && items.length>1)items.splice(Number(node.dataset.index),1);
      if(draft)ui.newDraft={...ui.newDraft,items};else commit(updateBlock(page,id,{items}),'Dropdown items updated');
      break;
    }
    case 'gallery-step': {
      const block=page.blocks[id],index=((ui.mediaSlides.get(id)||0)+Number(value)+block.images.length)%block.images.length;
      ui.mediaSlides.set(id,index);
      for(const frame of root.querySelectorAll(`[data-gallery-id="${CSS.escape(id)}"]`)) {
        const image=frame.querySelector('img');image.src=block.images[index];image.alt=`${block.title} · image ${index+1}`;
        const count=frame.querySelector('.gallery-position,.gallery-count');if(count)count.textContent=`${index+1} / ${block.images.length}`;
      }
      return;
    }
    case 'play-video': {
      const block=page.blocks[id],videoId=youtubeId(block.url);if(!videoId)return;
      ui.playingVideo=id;
      const frame=document.createElement('iframe');frame.className='video-player';frame.src=`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;frame.title=block.title;frame.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';frame.allowFullscreen=true;
      node.replaceWith(frame);return;
    }
    case 'open-picker': openPicker(id,[],node.dataset.focusKey); break;
    case 'cancel-picker': closePicker(); break;
    case 'confirm-move': {
      const target = page.blocks[ui.targetId];
      const valid = new Set(eligibleBlocks(page,target.id).map(b=>b.id));
      const selected = [...ui.selected].filter(id=>valid.has(id));
      if (!selected.length) return;
      if (commit(moveBlocks(page,selected,target.id),`${blockNoun(selected.length)} moved to ${target.title}`)) {
        ui.selectedId=target.id;ui.targetId=null;ui.panel='properties';ui.selected.clear();ui.query='';ui.bulk=false;ui.bulkSelected.clear();
        ui.hint=`${target.title} now contains ${blockNoun(page.blocks[target.id].children.length)}.`;
        ui.pendingFocus='inspector-title';ui.scrollToCollection=target.id;
      }
      break;
    }
    case 'source-tab': ui.source=value;ui.errors={};ui.pendingFocus=event.type==='keydown'?`tab-${value}`:value==='new'?'new-url':'picker-search';break;
    case 'switch-new': ui.source='new';ui.errors={};ui.pendingFocus='new-url';break;
    case 'clear-search': ui.query='';ui.pendingFocus='picker-search';break;
    case 'view-mode': ui.mode=value;if(value==='preview')markPreviewReviewed();ui.pendingFocus=`view-${value}`;break;
    case 'collapse': ui.collapsed.has(id)?ui.collapsed.delete(id):ui.collapsed.add(id);break;
    case 'global-new': openLibrary();break;
    case 'new-collection': ui.panel='new-collection';ui.targetId=null;ui.newDraft={title:'',url:'',description:''};ui.errors={};ui.pendingFocus='new-collection-name';break;
    case 'close-panel': ui.panel='properties';ui.errors={};ui.targetId=null;ui.pendingFocus='inspector-title';break;
    case 'bulk': ui.bulk=!ui.bulk;ui.bulkSelected.clear();break;
    case 'bulk-move': { const target=currentCollection();if(target)openPicker(target.id,[...ui.bulkSelected]);break; }
    case 'profile': ui.panel='profile';ui.targetId=null;ui.selected.clear();ui.pendingFocus='profile-name';break;
    case 'block-menu': case 'collection-menu': case 'notifications': {
      const rect=node.getBoundingClientRect();
      if(ui.menu?.id===id&&ui.menu?.type===action){ui.menu=null;break;}
      ui.menu={id,type:action==='notifications'?'notifications':action,top:Math.min(rect.bottom+6,innerHeight-320),left:Math.max(12,Math.min(rect.right-232,innerWidth-244))};
      break;
    }
    case 'rename': ui.selectedId=id;ui.panel='properties';ui.targetId=null;ui.pendingFocus=page.blocks[id].type==='collection'?'collection-name':'block-title';break;
    case 'menu-existing': openPicker(id,[],`more-${id}`);break;
    case 'menu-new': openLibrary(id,`more-${id}`);break;
    case 'move-single': { const target=currentCollection();if(target)openPicker(target.id,[id]);break; }
    case 'move-out': commit(moveBlocks(page,[id],null),'Block moved out of Collection');ui.selectedId=id;ui.panel='properties';ui.targetId=null;break;
    case 'visibility': commit(updateBlock(page,id,{visible:!page.blocks[id].visible}),page.blocks[id].visible?'Block hidden from your page':'Block is visible on your page');break;
    case 'move-up': case 'move-down': commit(reorderBlock(page,id,action==='move-up'?-1:1),'Block order updated');break;
    case 'remove-block': { const title=page.blocks[id].title,owner=ownerOf(page,id);commit(removeBlock(page,id),`${title} removed`);if(ui.selectedId===id)ui.selectedId=owner||page.rootIds.find(id=>page.blocks[id].type==='collection')||page.rootIds[0];ui.panel='properties';ui.targetId=null;break; }
    case 'undo': undo();break;
    case 'dismiss-toast': clearTimeout(toastTimer);ui.toast=null;break;
    case 'help': ui.dialogOrigin=isNavigationOverlay()?'nav-nav-help':node.dataset.focusKey||'nav-nav-help';if(isNavigationOverlay())ui.navExpanded=false;ui.dialog='help';ui.pendingFocus='dialog-close';break;
    case 'compact-preview': ui.dialogOrigin='compact-preview';markPreviewReviewed();ui.dialog='preview';ui.pendingFocus='dialog-close';break;
    case 'close-dialog': ui.dialog=null;ui.pendingFocus=ui.dialogOrigin||'nav-nav-help';break;
    case 'reset': commit(initialPage(),'Demo reset');ui.dialog=null;ui.panel='properties';ui.selectedId='portfolio';ui.targetId=null;ui.selected.clear();ui.collapsed.clear();ui.bulk=false;ui.bulkSelected.clear();ui.query='';ui.hint='';ui.mediaSlides.clear();ui.playingVideo=null;ui.previewReviewed=false;writePreference(PREVIEW_STORAGE_KEY,false);ui.pendingFocus='add-portfolio';break;
    case 'copy-url': navigator.clipboard.writeText(`https://ho.link/${page.profile.slug}`).then(()=>{showToast('Page link copied');render();}).catch(()=>fail('Could not copy the link. Try again.'));break;
    default: return;
  }
  render();
  if(ui.menu&&ui.menu.type!=='notifications')root.querySelector('[role="menuitem"]')?.focus();
}

root.addEventListener('click', event => {
  const node = event.target.closest('[data-action]');
  if (!node || node.disabled) return;
  try { activate(node.dataset.action,node,event); } catch(error) { fail(error.message); }
});

root.addEventListener('input', event => {
  const field=event.target;
  if(field.id==='picker-search'){ui.query=field.value;render();return;}
  if(field.id==='library-search'){
    ui.libraryQuery=field.value;
    const terms=field.value.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    const matches=Object.keys(BLOCK_TYPES).filter(type=>terms.every(term=>`${BLOCK_TYPES[type].label} ${BLOCK_TYPES[type].category} ${BLOCK_TYPES[type].description}`.toLocaleLowerCase().includes(term)));
    if(matches.length&&!matches.includes(ui.libraryType)){ui.libraryType=matches[0];ui.libraryDisplay='classic';}
    render();return;
  }
  if(field.dataset.itemIndex!==undefined && field.dataset.draft==='true'){
    ui.newDraft.items[Number(field.dataset.itemIndex)][field.dataset.itemProperty]=field.value;ui.errors={};return;
  }
  if(field.dataset.draftProperty){
    const key=field.dataset.draftProperty;ui.newDraft[key]=key==='images'?field.value.split('\n').map(v=>v.trim()).filter(Boolean):field.value;
    ui.errors={};if(key==='display')render();return;
  }
  if(field.id==='new-collection-name'){ui.newDraft.title=field.value;delete ui.errors.title;render();}
});

root.addEventListener('change', event => {
  const field=event.target;
  try {
    if(field.dataset.select){field.checked?ui.selected.add(field.dataset.select):ui.selected.delete(field.dataset.select);announce(`${blockNoun(ui.selected.size)} selected`);render();return;}
    if(field.dataset.bulkSelect){field.checked?ui.bulkSelected.add(field.dataset.bulkSelect):ui.bulkSelected.delete(field.dataset.bulkSelect);render();return;}
    if(field.dataset.draftProperty)return;
    if(field.dataset.itemIndex!==undefined){
      if(field.dataset.draft==='true')return;
      const block=page.blocks[field.dataset.block],items=block.items.map(item=>({...item}));items[Number(field.dataset.itemIndex)][field.dataset.itemProperty]=field.value;
      commit(updateBlock(page,block.id,{items}),'Dropdown item updated');
    }
    else if(field.dataset.editBlock)commit(updateBlock(page,field.dataset.editBlock,{[field.dataset.property]:field.dataset.property==='images'?field.value.split('\n').map(v=>v.trim()).filter(Boolean):field.value}),'Block details updated');
    else if(field.name==='collection-layout'){const c=page.blocks[ui.selectedId];if(c?.type==='collection')commit(updateBlock(page,c.id,{layout:field.value}),'Collection layout updated');}
    else if(field.id==='show-title')commit(updateBlock(page,field.dataset.collection,{showTitle:field.checked}),'Collection title visibility updated');
    else if(field.id==='show-link')commit(updateBlock(page,field.dataset.block,{visible:field.checked}),field.checked?'Block is visible on your page':'Block hidden from your page');
    else if(field.dataset.profile){
      const property=field.dataset.profile,value=field.value.trim();if(property==='name'&&!value)throw new Error('Enter a name for your profile.');
      const profile={...page.profile,[property]:value};if(property==='name')profile.initials=value.split(/\s+/).slice(0,2).map(word=>word[0]).join('').toUpperCase();
      commit({...page,profile},'Profile updated');
    }
    else return;
    render();
  } catch(error){fail(error.message);}
});

root.addEventListener('submit', event => {
  event.preventDefault();
  if(event.target.id==='new-block-form'){
    ui.errors={};
    try {
      const id=`${ui.newType}-${crypto.randomUUID()}`, target=ui.panel==='picker'?ui.targetId:null;
      commit(addBlock(page,{...ui.newDraft,id,type:ui.newType},target),`${blockLabel(ui.newType)} added to ${target?page.blocks[target].title:'your page'}`);
      ui.selectedId=id;ui.targetId=null;ui.panel='properties';ui.selected.clear();ui.newDraft=draftForType(ui.newType);ui.pendingFocus='inspector-title';ui.scrollToBlock=id;
      render();
    }catch(error){ui.errors.form=error.message;ui.pendingFocus='new-form-error';render();root.querySelector('#new-form-error')?.scrollIntoView({block:'nearest'});}
  }else if(event.target.id==='new-collection-form'){
    try{const id=`collection-${crypto.randomUUID()}`;commit(addCollection(page,{id,title:ui.newDraft.title}),'Collection created');ui.selectedId=id;ui.panel='properties';ui.pendingFocus='properties-add-'+id;render();}catch(error){ui.errors.title=error.message;ui.pendingFocus='new-collection-name';render();}
  }
});

document.addEventListener('keydown', event => {
  document.body.dataset.input='keyboard';
  const isInput=event.target.matches('input,textarea,[contenteditable="true"]');
  if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='z'&&!isInput){event.preventDefault();undo(event.shiftKey);render();return;}
  if(event.key==='Escape'){
    if(ui.dialog){ui.dialog=null;ui.pendingFocus=ui.dialogOrigin||'nav-nav-help';}
    else if(isNavigationOverlay()){ui.navExpanded=false;ui.pendingFocus='nav-toggle';}
    else if(ui.menu){ui.pendingFocus=ui.menu.id?`more-${ui.menu.id}`:'notifications';ui.menu=null;}
    else if(ui.panel==='picker')closePicker();
    else if(['new-block','new-collection'].includes(ui.panel)){ui.panel='properties';ui.pendingFocus='inspector-title';}
    else if(ui.navExpanded){ui.navExpanded=false;ui.pendingFocus='nav-toggle';}
    else return;
    event.preventDefault();render();return;
  }
  const menuRoot=event.target.closest('[role="menu"]');
  if(menuRoot&&['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
    event.preventDefault();const items=[...menuRoot.querySelectorAll('[role="menuitem"]')],i=items.indexOf(document.activeElement);
    items[event.key==='Home'?0:event.key==='End'?items.length-1:(i+(event.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus();return;
  }
  const tabRoot=event.target.closest('[role="tablist"]');
  if(tabRoot&&['ArrowRight','ArrowLeft','Home','End'].includes(event.key)){
    event.preventDefault();const items=[...tabRoot.querySelectorAll('[role="tab"]')],i=items.indexOf(document.activeElement);
    const next=items[event.key==='Home'?0:event.key==='End'?items.length-1:(i+(event.key==='ArrowRight'?1:-1)+items.length)%items.length];
    if(next)activate(next.dataset.action,next,event);return;
  }
  const row=event.target.closest('[data-block-id]');
  const editablePreview=event.target.closest('.preview-editable[role="button"]');
  if(editablePreview&&['Enter',' '].includes(event.key)){event.preventDefault();activate('select-block',editablePreview,event);return;}
  if(row&&event.altKey&&['ArrowUp','ArrowDown'].includes(event.key)){
    event.preventDefault();commit(reorderBlock(page,row.dataset.blockId,event.key==='ArrowUp'?-1:1),'Block order updated');render();return;
  }
  if((ui.dialog||isNavigationOverlay())&&event.key==='Tab'){
    const modal=ui.dialog?root.querySelector('.modal-backdrop [role="dialog"]'):root.querySelector('.app-rail');const focusables=[...modal.querySelectorAll('button:not([disabled]),a[href],input,textarea,[tabindex="0"]')].filter(n=>n.offsetParent!==null);
    const first=focusables[0],last=focusables.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }
});
document.addEventListener('pointerdown',()=>{document.body.dataset.input='pointer';});
document.addEventListener('click',event=>{if(ui.menu&&!event.target.closest('.context-menu,[data-action="block-menu"],[data-action="collection-menu"],[data-action="notifications"]')){ui.menu=null;render();}});

root.addEventListener('dragstart',event=>{
  const row=event.target.closest('[data-block-id]');if(!row||ui.bulk)return;
  dragId=row.dataset.blockId;event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',dragId);row.classList.add('is-dragging');
});
root.addEventListener('dragover',event=>{
  if(!dragId)return;
  const target=event.target.closest('[data-block-id],[data-collection-id]');if(!target)return;
  event.preventDefault();event.dataTransfer.dropEffect='move';for(const n of root.querySelectorAll('.is-drop-target'))n.classList.remove('is-drop-target');target.classList.add('is-drop-target');
});
root.addEventListener('drop',event=>{
  if(!dragId)return;event.preventDefault();const id=dragId;dragId=null;
  const row=event.target.closest('[data-block-id]'),collection=event.target.closest('[data-collection-id]');
  try{
    if(row&&ownerOf(page,id)===ownerOf(page,row.dataset.blockId))commit(reorderBefore(page,id,row.dataset.blockId),'Block order updated');
    else if(collection)commit(moveBlocks(page,[id],collection.dataset.collectionId),`Block moved to ${page.blocks[collection.dataset.collectionId].title}`);
    render();
  }catch(error){fail(error.message);}
});
root.addEventListener('dragend',()=>{dragId=null;for(const n of root.querySelectorAll('.is-drop-target,.is-dragging'))n.classList.remove('is-drop-target','is-dragging');});
root.addEventListener('mouseover',event=>{if(event.target.closest('[data-toast]'))clearTimeout(toastTimer);});
root.addEventListener('focusin',event=>{if(event.target.closest('[data-toast]'))clearTimeout(toastTimer);});
window.addEventListener('resize',()=>{if(ui.navOverlay!==isNavigationOverlay())render();else syncScrollGutters();});

render();
const updates=new EventSource('/__dev/events');
updates.onmessage=event=>{if(event.data==='reload')location.reload();};
