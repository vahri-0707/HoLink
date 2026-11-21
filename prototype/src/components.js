import { domain } from './model.js';
import { ICONS, ICON_FAMILY } from './icons.js';
import { blockLabel, blockIcon } from './catalog.js';
import { assetUrl } from './paths.js';

export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
export const e = escapeHtml;

/** One Phosphor weight for outlines; the matched Fill asset for selected states. */
export function icon(name, size = 20, className = '', { selected = false } = {}) {
  const source = ICONS[name];
  if (!source) throw new Error(`Unknown icon: ${name}`);
  return `<span class="icon icon--${size} ${className}" data-icon-family="${ICON_FAMILY}" data-icon-weight="${selected?'Fill':'Regular'}" data-icon-id="${source[selected?'filled':'outline']}" style="--icon-url:url('${e(assetUrl(`/assets/icons/${name}${selected?'-fill':''}.svg`))}')" aria-hidden="true"></span>`;
}

export function button(label, { action = '', kind = 'primary', glyph, id = '', attrs = '', disabled = false, className = '', type = 'button', selected = false } = {}) {
  return `<button type="${type}" class="button button--${kind} ${className}" ${action ? `data-action="${action}"` : ''} ${id ? `data-id="${e(id)}"` : ''} ${disabled ? 'disabled' : ''} ${attrs}>${glyph ? icon(glyph, 16, '', {selected}) : ''}<span>${e(label)}</span></button>`;
}

export function iconButton(glyph, label, { action = '', id = '', attrs = '', className = '', disabled = false, size = 20, selected = false } = {}) {
  return `<button type="button" class="icon-button ${className}" aria-label="${e(label)}" title="${e(label)}" ${action ? `data-action="${action}"` : ''} ${id ? `data-id="${e(id)}"` : ''} ${disabled ? 'disabled' : ''} ${attrs}>${icon(glyph, size, '', {selected})}</button>`;
}

export function badge(label, tone = 'neutral') { return `<span class="badge badge--${tone}">${e(label)}</span>`; }

export function input({ id, label, value = '', placeholder = '', type = 'text', name = id, required = false, maxLength = 80, error = '', multiline = false, attrs = '' }) {
  const field = multiline ? `<textarea id="${id}" name="${name}" data-focus-key="${id}" maxlength="${maxLength}" placeholder="${e(placeholder)}" ${attrs}>${e(value)}</textarea>` : `<input id="${id}" name="${name}" data-focus-key="${id}" type="${type}" value="${e(value)}" placeholder="${e(placeholder)}" maxlength="${maxLength}" ${required ? 'required' : ''} ${error ? `aria-invalid="true" aria-describedby="${id}-error"` : ''} ${attrs}>`;
  return `<div class="field"><label for="${id}">${e(label)}${required ? '<span class="required">Required</span>' : ''}</label>${field}${error ? `<p id="${id}-error" class="field-error" role="alert">${e(error)}</p>` : ''}</div>`;
}

export function candidateRow(block, checked, ownerName = '') {
  return `<label class="candidate-row ${checked ? 'is-selected' : ''}" data-testid="candidate-${e(block.id)}">
    <span class="icon-tile">${icon(blockIcon(block), 20)}</span>
    <span class="candidate-info"><span class="candidate-title" title="${e(block.title)}">${e(block.title)}</span><span class="metadata" title="${e(block.url||blockLabel(block))}">${e(blockLabel(block))}${block.url?` · ${e(domain(block.url))}`:''}${ownerName ? ` · ${e(ownerName)}` : ''}</span></span>
    <span class="checkbox-target"><input type="checkbox" class="checkbox" data-select="${e(block.id)}" data-focus-key="pick-${e(block.id)}" aria-label="Select ${e(block.title)}" ${checked ? 'checked' : ''}><span class="checkbox-mark">${icon('check', 14)}</span></span>
  </label>`;
}

export function blockRow(block, { nested = false, active = false, bulk = false, checked = false } = {}) {
  return `<div class="block-row ${nested ? 'block-row--nested' : ''} ${active ? 'is-active' : ''} ${!block.visible ? 'is-hidden' : ''}" data-block-id="${e(block.id)}" draggable="${!bulk}" aria-label="${e(block.title)} block">
    ${bulk ? `<label class="bulk-checkbox checkbox-target"><input type="checkbox" class="checkbox" aria-label="Select ${e(block.title)} for move" data-bulk-select="${e(block.id)}" data-focus-key="bulk-${e(block.id)}" ${checked ? 'checked' : ''}><span class="checkbox-mark">${icon('check', 14)}</span></label>` : `<span class="drag-handle" title="Drag to reorder">${icon('grip-vertical', 16)}</span>`}
    <button class="block-main" type="button" data-action="select-block" data-id="${e(block.id)}" data-focus-key="block-${e(block.id)}" aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"><span class="block-title" title="${e(block.title)}">${e(block.title)}</span><span class="metadata block-type-label">${icon(blockIcon(block),14)}<span>${e(blockLabel(block))}${block.visible?'':' · Hidden'}</span></span></button>
    ${iconButton('ellipsis', `Actions for ${block.title}`, { action: 'block-menu', id: block.id, attrs: `aria-haspopup="menu" data-focus-key="more-${e(block.id)}"`, className: 'block-actions', size: 16 })}
  </div>`;
}

export function previewLink(block, previewMode) {
  const inner = `<span class="preview-link-icon">${icon('link', 16)}</span><span class="preview-link-copy"><span>${e(block.title)}</span>${block.description ? `<small>${e(block.description)}</small>` : ''}</span>${icon('arrow-up-right', 16, 'muted')}`;
  const display=block.display||'classic',content=display==='classic'?inner:`<img class="preview-cover-image" src="${e(assetUrl(block.image||'/assets/illustrations/studio-blue.svg'))}" alt="" loading="lazy"><span class="preview-cover-copy">${inner}</span>`;
  const className=`preview-link ${display!=='classic'?`preview-link--${display}`:''}`;
  return previewMode ? `<a class="${className}" data-preview-block="${e(block.id)}" href="${e(block.url)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${e(block.title)}">${content}</a>` : `<button type="button" class="${className}" data-preview-block="${e(block.id)}" data-action="select-block" data-id="${e(block.id)}">${content}</button>`;
}

export function tabs(items, active, name, action) {
  return `<div class="segmented-control" role="tablist" aria-label="${e(name)}">${items.map(item => `<button type="button" role="tab" id="tab-${item.value}" aria-selected="${active === item.value}" aria-controls="panel-${item.value}" tabindex="${active === item.value ? 0 : -1}" data-action="${action}" data-value="${item.value}" data-focus-key="tab-${item.value}" class="segment ${active === item.value ? 'is-selected' : ''}">${e(item.label)}</button>`).join('')}</div>`;
}

export function layoutChoice(value, label, selected) {
  return `<label class="layout-choice ${selected ? 'is-selected' : ''}"><input class="sr-only" type="radio" name="collection-layout" aria-label="${e(label)}" value="${value}" data-focus-key="layout-${value}" ${selected ? 'checked' : ''}>${icon(value === 'stack' ? 'list' : 'layout-grid', 24)}<span>${label}</span></label>`;
}

export function toggle(id, label, checked, attrs = '') {
  return `<label class="toggle-row"><span>${e(label)}</span><span class="toggle-control"><input type="checkbox" role="switch" id="${e(id)}" data-focus-key="${e(id)}" aria-label="${e(label)}" ${checked ? 'checked' : ''} ${attrs}><span class="toggle-track"></span></span></label>`;
}
