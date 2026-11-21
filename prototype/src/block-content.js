import { BLOCK_TYPES, BLOCK_CATEGORIES, blockMeta, blockLabel, blockIcon, displayLabel, youtubeId } from './catalog.js';
import { e, icon, iconButton, input, button, previewLink } from './components.js';
import { domain } from './model.js';
import qrcode from './vendor/qrcode.js';

// Encode locally: QR destinations are never sent to an external image service.
qrcode.stringToBytes = text => Array.from(new TextEncoder().encode(text));
const qrCache=new Map();
export function qrSvg(url) {
  if(!qrCache.has(url)) {
    const qr=qrcode(0,'M'); qr.addData(url); qr.make();
    if(qrCache.size>40) qrCache.clear();
    qrCache.set(url,qr.createSvgTag({cellSize:4,margin:16,scalable:true}));
  }
  return qrCache.get(url);
}

export function blockSummary(block) {
  const detail=block.url?domain(block.url):block.email||block.address||'';
  return `${blockLabel(block)}${detail ? ` · ${detail}` : ''}`;
}

const fieldAttrs=(id,key,draft)=>draft?`data-draft-property="${key}"`:`data-edit-block="${e(id)}" data-property="${key}"`;
export function displayOptions(value, attrs, prefix='display') {
  return `<fieldset class="block-display-options"><legend>Display</legend><div>${['classic','cover','showcase'].map(style=>`<label class="display-option ${value===style?'is-selected':''}"><input type="radio" class="sr-only" name="${prefix}" value="${style}" ${value===style?'checked':''} data-focus-key="${prefix}-${style}" ${attrs}><span>${displayLabel(style)}</span></label>`).join('')}</div></fieldset>`;
}

export function contentFields(block,{draft=false,errors={}}={}) {
  const meta=blockMeta(block),prefix=draft?'new':'block';
  let fields='';
  if(block.type==='link') fields+=displayOptions(block.display||'classic',fieldAttrs(block.id,'display',draft),`${prefix}-display`);
  for(const[key,label,kind='text']of meta.fields) {
    const id=`${prefix}-${key}`,attrs=fieldAttrs(block.id,key,draft),value=block[key] ?? '';
    if(kind==='separator-style') {
      fields+=`<div class="field"><label for="${id}">${label}</label><select id="${id}" data-focus-key="${id}" ${attrs}>${[['line','Line'],['dots','Dots'],['space','Space only']].map(([style,name])=>`<option value="${style}" ${value===style?'selected':''}>${name}</option>`).join('')}</select></div>`;
      continue;
    }
    const placeholders={url:block.type==='video'?'https://youtube.com/watch?v=…':block.type==='podcast'?'https://podcasts.apple.com/…':block.type==='calendly'?'https://calendly.com/your-name':block.type==='music'?'https://example.com/track.mp3':'https://example.com',email:'hello@example.com',phone:'+62 812 3456 7890',images:'https://example.com/image-one.jpg\nhttps://example.com/image-two.jpg',address:'Street, city, country'};
    fields+=input({id,label,value:kind==='images'?(Array.isArray(value)?value.join('\n'):value):value,type:['url','youtube','audio'].includes(kind)?'url':kind==='email'?'email':kind==='tel'?'tel':'text',multiline:['textarea','images'].includes(kind),maxLength:['url','youtube','audio','images'].includes(kind)?12000:kind==='textarea'?500:key==='phone'?40:150,placeholder:placeholders[key]||'',error:errors[key]||'',attrs:`${attrs} ${kind==='images'?'rows="4"':''}`});
  }
  if(block.type==='link' && block.display && block.display!=='classic') fields+=input({id:`${prefix}-image`,label:'Cover image URL',value:block.image||'',type:'url',maxLength:2048,attrs:fieldAttrs(block.id,'image',draft)});
  if(block.type==='dropdown') {
    fields+=`<section class="dropdown-editor"><div class="section-heading"><h3>Dropdown items</h3><span class="row-space"></span><span class="metadata">${block.items.length} / 8</span></div>${block.items.map((item,index)=>`<div class="dropdown-item-editor"><div class="section-heading"><span class="eyebrow">Item ${index+1}</span><span class="row-space"></span>${iconButton('x',`Remove item ${index+1}`,{action:'remove-dropdown-item',id:block.id,disabled:block.items.length===1,attrs:`data-index="${index}" data-draft="${draft}"`})}</div>${input({id:`${prefix}-question-${index}`,label:'Question',value:item.question,maxLength:120,attrs:`data-item-index="${index}" data-item-property="question" data-block="${e(block.id||'')}" data-draft="${draft}"`})}${input({id:`${prefix}-answer-${index}`,label:'Answer',value:item.answer,multiline:true,maxLength:500,attrs:`data-item-index="${index}" data-item-property="answer" data-block="${e(block.id||'')}" data-draft="${draft}"`})}</div>`).join('')}${button('Add item',{kind:'secondary',glyph:'plus',action:'add-dropdown-item',id:block.id,disabled:block.items.length>=8,attrs:`data-draft="${draft}"`})}</section>`;
  }
  if(block.type==='gallery') fields+=`<p class="form-help">Up to 6 images. Use direct image links; the slider keeps every image in the same frame.</p>${draft?button('Try sample images',{kind:'secondary',glyph:'image',action:'sample-images'}):''}`;
  if(block.type==='music') fields+=`<p class="form-help">Use a direct MP3 or WAV URL. Your audience can play and pause the track in Preview.</p>${draft?button('Try sample audio',{kind:'secondary',glyph:'music',action:'sample-audio'}):''}`;
  if(block.type==='qr') fields+='<p class="form-help">The QR code updates automatically when you change its destination.</p>';
  return fields;
}

export function newBlockForm(type,draft,{scoped=false,errors={}}={}) {
  const meta=BLOCK_TYPES[type];
  return `<form id="new-block-form" class="new-block-form" novalidate><div class="new-block-type"><span class="icon-tile">${icon(meta.icon,20)}</span><span><strong>${e(meta.singular)}</strong><small>${e(meta.category)}</small></span>${button('Change',{kind:'ghost',action:'change-block-type',attrs:'data-focus-key="change-block-type"'})}</div>${errors.form?`<p class="field-error" id="new-form-error" role="alert" tabindex="-1" data-focus-key="new-form-error">${e(errors.form)}</p>`:''}${contentFields({...draft,type},{draft:true,errors})}<p class="form-help">${scoped?'Added directly to this Collection.':'Added to your page after you save.'}</p></form>`;
}

function previewShell(block,inner,previewMode,selected,extra='') {
  return `<div class="preview-content preview-${block.type} ${selected&&!previewMode?'is-selected':''} ${!previewMode?'preview-editable':''} ${extra}" data-preview-block="${e(block.id)}" ${!previewMode?`role="button" tabindex="0" data-action="select-block" data-id="${e(block.id)}" data-focus-key="preview-${e(block.id)}" aria-label="Edit ${e(block.title)}"`:''}>${inner}</div>`;
}
function outbound(block,url,inner,previewMode,extra='') {
  const content=`<span class="preview-link-icon">${icon(blockIcon(block),16)}</span><span class="preview-link-copy"><span>${e(block.title)}</span>${inner}</span>${icon('arrow-up-right',16,'muted')}`;
  return previewMode?`<a class="preview-link ${extra}" data-preview-block="${e(block.id)}" href="${e(url)}" ${/^(mailto:|tel:)/.test(url)?'':'target="_blank" rel="noopener noreferrer"'}>${content}</a>`:`<button type="button" class="preview-link ${extra}" data-preview-block="${e(block.id)}" data-action="select-block" data-id="${e(block.id)}">${content}</button>`;
}

export function previewBlock(block,previewMode,{selected=false,slide=0,playing=false}={}) {
  if(block.type==='link') return previewLink(block,previewMode);
  if(block.type==='text') return previewShell(block,`<h3>${e(block.title)}</h3><p>${e(block.description)}</p>`,previewMode,selected);
  if(block.type==='separator') return previewShell(block,`<span class="separator-label">${e(block.title)}</span><span class="separator-rule separator-rule--${e(block.style)}" aria-hidden="true">${block.style==='dots'?'· · ·':''}</span>`,previewMode,selected);
  if(block.type==='dropdown') return previewShell(block,`<h3>${e(block.title)}</h3><div class="preview-answers">${block.items.map(item=>previewMode?`<details class="preview-answer"><summary><span>${e(item.question)}</span>${icon('chevron-down',16)}</summary><p>${e(item.answer)}</p></details>`:`<div class="preview-answer"><div class="answer-label"><span>${e(item.question)}</span>${icon('chevron-down',16)}</div></div>`).join('')}</div>`,previewMode,selected);
  if(block.type==='gallery') {
    const index=Math.min(Math.max(0,slide),block.images.length-1);
    return previewShell(block,`<div class="gallery-frame" data-gallery-id="${e(block.id)}"><img src="${e(block.images[index])}" alt="${e(block.title)} · image ${index+1}" loading="lazy">${previewMode&&block.images.length>1?`<div class="gallery-controls">${iconButton('chevron-left','Previous image',{action:'gallery-step',id:block.id,attrs:`data-value="-1" data-focus-key="gallery-prev-${e(block.id)}"`})}<span class="gallery-position" aria-live="polite">${index+1} / ${block.images.length}</span>${iconButton('chevron-right','Next image',{action:'gallery-step',id:block.id,attrs:`data-value="1" data-focus-key="gallery-next-${e(block.id)}"`})}</div>`:`<span class="gallery-count">${index+1} / ${block.images.length}</span>`}</div><div class="preview-card-copy"><h3>${e(block.title)}</h3>${block.description?`<p>${e(block.description)}</p>`:''}</div>`,previewMode,selected);
  }
  if(block.type==='video') return previewShell(block,`${previewMode&&playing?`<iframe class="video-player" src="https://www.youtube-nocookie.com/embed/${youtubeId(block.url)}" title="${e(block.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`:`${previewMode?`<button type="button" class="video-poster" data-action="play-video" data-id="${e(block.id)}" aria-label="Play ${e(block.title)}">`:'<div class="video-poster">'}<span class="video-poster-kicker">A LITTLE INSPIRATION</span><span class="video-poster-art" aria-hidden="true"></span><span class="video-play">${icon('play',24)}</span><span class="video-poster-caption">Press play. Find an idea.</span>${previewMode?'</button>':'</div>'}`}<div class="preview-card-copy"><h3>${e(block.title)}</h3>${block.description?`<p>${e(block.description)}</p>`:''}</div>`,previewMode,selected);
  if(block.type==='qr') return previewShell(block,`<h3>${e(block.title)}</h3><div class="preview-qr-code" role="img" aria-label="QR code for ${e(block.url)}">${qrSvg(block.url)}</div><p>${e(domain(block.url))}</p>`,previewMode,selected);
  if(block.type==='music') return previewShell(block,`<div class="audio-heading"><span class="audio-art">${icon('music',24)}</span><span><h3>${e(block.title)}</h3><p>${e(block.artist||'Audio track')}</p></span></div>${previewMode?`<audio controls preload="none" src="${e(block.url)}" aria-label="${e(block.title)}">Your browser does not support audio playback.</audio>`:`<div class="audio-placeholder">${icon('play',20)}<span class="waveform" aria-hidden="true">${[10,16,24,12,20,28,18,12,24,30,16,22,12,28,18,24,12,20,28,16].map(height=>`<i style="height:${height}px"></i>`).join('')}</span><span>Audio</span></div>`}`,previewMode,selected);
  if(block.type==='podcast') {
    const card=`<span class="podcast-art">${icon('podcast',24)}</span><span class="preview-link-copy"><small>APPLE PODCASTS</small><span>${e(block.title)}</span><small>${e(block.artist||'Listen to the episode')}</small></span>${icon('arrow-up-right',16,'muted')}`;
    return previewMode?`<a class="preview-content preview-podcast" href="${e(block.url)}" target="_blank" rel="noopener noreferrer">${card}</a>`:previewShell(block,card,false,selected);
  }
  if(block.type==='pdf') return outbound(block,block.url,`<small>${e(block.description||'Open document · PDF')}</small>`,previewMode);
  if(block.type==='calendly') return outbound(block,block.url,`<small>${e(block.description||'Find a time that works for you')}</small>`,previewMode);
  if(block.type==='email') return outbound(block,`mailto:${block.email}${block.subject?`?subject=${encodeURIComponent(block.subject)}`:''}`,`<small>${e(block.email)}</small>`,previewMode);
  if(block.type==='phone') return outbound(block,`tel:${block.phone.replace(/[^\d+]/g,'')}`,`<small>${e(block.phone)}</small>`,previewMode);
  if(block.type==='whatsapp') return outbound(block,`https://wa.me/${block.phone.replace(/\D/g,'')}${block.message?`?text=${encodeURIComponent(block.message)}`:''}`,`<small>${e(block.phone)}</small>`,previewMode);
  if(block.type==='location') return outbound(block,`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(block.address)}`,`<small>${e(block.address)}</small>`,previewMode,'preview-location');
  return '';
}

function libraryDemo(type,display) {
  if(type==='link') return `<div class="library-example library-example--${display}">${display!=='classic'?'<img src="/assets/illustrations/studio-blue.svg" alt="">':''}<div class="example-link">${icon('link',18)}<span><strong>Your next great idea</strong><small>A little context goes a long way.</small></span>${icon('arrow-up-right',16)}</div></div>`;
  if(type==='text') return '<div class="library-text-example"><span>YOUR STORY STARTS HERE</span><strong>Ideas, made tangible.</strong><p>Give your audience a little context. A few words can make all the difference.</p></div>';
  if(type==='dropdown') return `<div class="library-dropdown-example"><strong>Good to know</strong><div>What can we work on together?${icon('chevron-down',16)}</div><div>Are you open to new projects?${icon('chevron-down',16)}</div></div>`;
  if(type==='separator') return '<div class="library-separator-example"><span>Explore more</span><i></i></div>';
  if(type==='gallery') return '<div class="library-gallery-example"><img src="/assets/illustrations/studio-coral.svg" alt="An original geometric design study"><span>1 / 3</span></div>';
  if(type==='video') return `<div class="library-video-example"><span class="video-play">${icon('play',24)}</span><strong>A fresh perspective.</strong><span>Your video, right on your page.</span></div>`;
  if(type==='qr') return `<div class="library-qr-example">${qrSvg('https://ho.link/vahri')}<span>Scan to connect</span></div>`;
  const meta=BLOCK_TYPES[type];
  return `<div class="library-generic-example"><span class="library-example-icon">${icon(meta.icon,24)}</span><strong>${({music:'A little inspiration',podcast:'A conversation worth hearing',pdf:'Your work, in one place',calendly:'Let’s find a time',email:'Say hello.',phone:'A conversation away.',whatsapp:'Let’s start a chat.',location:'Come say hello.'})[type]}</strong><span>${e(meta.description)}</span><div class="example-action">${({music:'Listen to the track',podcast:'Listen on Apple Podcasts',pdf:'Open portfolio',calendly:'Book a conversation',email:'Send an email',phone:'Call now',whatsapp:'Open WhatsApp',location:'View on map'})[type]}${icon('arrow-up-right',16)}</div></div>`;
}

export function blockLibrary({type='link',display='classic',query='',targetName=''}) {
  const terms=query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const shown=Object.entries(BLOCK_TYPES).filter(([,meta])=>terms.every(term=>`${meta.label} ${meta.category} ${meta.description}`.toLocaleLowerCase().includes(term)));
  const matches=new Set(shown.map(([key])=>key)),meta=BLOCK_TYPES[type];
  return `<div class="modal-backdrop block-library-backdrop"><section class="block-library" role="dialog" aria-modal="true" aria-labelledby="library-title"><header class="library-header"><div><p class="eyebrow">${targetName?`Collection / ${e(targetName)}`:'Make it yours'}</p><h2 id="library-title">Add a block</h2><p>A place for everything you create.</p></div>${iconButton('x','Close block library',{action:'close-dialog',attrs:'data-focus-key="dialog-close"'})}</header><div class="library-search search-field">${icon('search',18)}<label class="sr-only" for="library-search">Search block types</label><input id="library-search" type="search" data-focus-key="library-search" placeholder="Search blocks, media, and more…" value="${e(query)}" autocomplete="off">${query?iconButton('x','Clear block search',{action:'clear-library-search'}):''}</div><div class="library-body"><nav class="library-categories" aria-label="Block types" data-scroll-key="library-categories">${BLOCK_CATEGORIES.map(category=>{const entries=shown.filter(([,item])=>item.category===category);return entries.length?`<section><h3>${category}</h3>${entries.map(([key,item])=>`<button type="button" class="library-type ${type===key?'is-selected':''}" data-action="library-type" data-value="${key}" data-focus-key="library-${key}" aria-pressed="${type===key}"><span class="library-type-icon">${icon(item.icon,20)}</span><span>${e(item.label)}</span>${icon('chevron-right',16,'muted')}</button>`).join('')}</section>`:''}).join('')}${!shown.length?'<p class="library-no-results">No matching blocks.</p>':''}</nav><main class="library-detail" data-scroll-key="library-detail">${!matches.has(type)&&shown.length===0?`<div class="empty-state">${icon('search',24)}<h3>No blocks found</h3><p>Try “video”, “text”, or “contact”.</p>${button('Clear search',{kind:'secondary',action:'clear-library-search'})}</div>`:`<div class="library-detail-heading"><span class="library-detail-mark">${icon(meta.icon,24)}</span><div><p class="eyebrow">${meta.category}</p><h3>${e(meta.label)}</h3></div></div><p class="library-description">${e(meta.description)}</p><p class="eyebrow library-display-label">${type==='link'?'Choose a display':'A little preview'}</p><div class="library-displays ${type==='link'?'library-displays--links':''}">${(meta.displays||['classic']).map(style=>`<button type="button" class="library-display ${display===style?'is-selected':''}" data-action="library-display" data-value="${style}" data-focus-key="library-display-${style}" aria-pressed="${display===style}">${libraryDemo(type,style)}<span class="library-display-caption"><span>${type==='link'?displayLabel(style):'Classic'}</span>${display===style?icon('circle-check',18):'<span class="display-selection-placeholder"></span>'}</span></button>`).join('')}</div><p class="library-detail-note">${icon('info',16)}<span>You can edit the content and appearance in the properties panel.</span></p>`}</main></div><footer class="library-footer"><p>${icon(targetName?'folder':'layout-dashboard',16)}<span>${targetName?`Adding to ${e(targetName)}`:'Adding to your page'}</span></p><div>${button('Cancel',{kind:'secondary',action:'close-dialog'})}${button('Continue',{glyph:'arrow-right',action:'use-block-type',disabled:!shown.length,attrs:'data-focus-key="library-continue"'})}</div></footer></section></div>`;
}
