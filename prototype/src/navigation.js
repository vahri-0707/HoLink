import { button, e, icon, iconButton } from './components.js';

const groups = [
  {label:'Menu',items:[['HoLink','layout-dashboard','home'],['Analytics','chart-no-axes-column'],['SEO','search']]},
  {label:'Tools',items:[['QR Center','qr-code'],['Business Card','contact']]},
  {label:'Help',items:[['Billing','credit-card'],['Settings','settings'],['Help','help','nav-help'],['Invite','user-plus']]}
];

export function progressRing(percent, className='') {
  const circumference = 2*Math.PI*18;
  return `<span class="setup-progress ${className}" role="img" aria-label="${percent}% of setup complete"><svg viewBox="0 0 44 44" aria-hidden="true"><circle class="setup-progress-track" cx="22" cy="22" r="18"/><circle class="setup-progress-value" cx="22" cy="22" r="18" stroke-dasharray="${circumference}" stroke-dashoffset="${circumference*(1-percent/100)}"/></svg><span>${percent}%</span></span>`;
}

export function appNavigation({expanded,overlay,helpOpen,steps}) {
  const helpExpanded=expanded&&helpOpen;
  const completed=steps.filter(step=>step.done).length;
  const percent=Math.round(completed/steps.length*100);
  const item=([label,glyph,action])=>{
    const selected=action==='home';
    const attrs=selected?'aria-current="page"':action==='nav-help'?`aria-expanded="${helpExpanded}" aria-controls="nav-help-links"`:'';
    const contents=`${icon(glyph,20,'',{selected:selected||(action==='nav-help'&&helpExpanded)})}<span class="nav-label">${e(label)}</span>${action==='nav-help'?icon(helpExpanded?'chevron-down':'chevron-right',16,'nav-item-chevron'):''}`;
    const row=action?`<button type="button" class="nav-item ${selected?'is-current':''}" data-action="${action}" data-focus-key="nav-${action}" aria-label="${e(label)}" title="${e(label)}" ${attrs}>${contents}</button>`:`<div class="nav-item nav-item--reference" role="img" aria-label="${e(label)}" title="${e(label)}">${contents}</div>`;
    return row+(action==='nav-help'&&helpExpanded?`<div id="nav-help-links" class="nav-help-links">${button('Editor guide',{kind:'ghost',action:'help',attrs:'data-focus-key="nav-guide"'})}${button('Setup checklist',{kind:'ghost',action:'setup',attrs:'data-focus-key="nav-setup"'})}</div>`:'');
  };
  return `<aside class="app-rail ${expanded?'is-expanded':''}" ${overlay?'role="dialog" aria-modal="true"':''} aria-label="Primary navigation">
    <div class="nav-brand-row">${expanded?'<img class="nav-brand-logo" src="/assets/holink-logo.png" width="120" height="30" alt="HoLink">':''}${iconButton('sidebar',expanded?'Collapse sidebar':'Expand sidebar',{action:'nav-toggle',className:'nav-toggle',attrs:`aria-expanded="${expanded}" aria-controls="main-navigation" data-focus-key="nav-toggle"`})}</div>
    <nav id="main-navigation" class="nav-scroll" aria-label="Main navigation" data-scroll-key="navigation">${groups.map(group=>`<section class="nav-group" aria-label="${group.label}"><h2 class="nav-group-label">${group.label}</h2>${group.items.map(item).join('')}</section>`).join('')}</nav>
    <div class="nav-footer">${expanded?`<section class="setup-card" aria-label="Your setup checklist"><div class="setup-card-summary">${progressRing(percent)}<div><h2>Your setup checklist</h2><p>${completed} of ${steps.length} complete</p></div></div>${button(completed===steps.length?'Review setup':'Finish setup',{action:'setup',attrs:'data-focus-key="setup-checklist"'})}</section>`:`<button type="button" class="setup-compact" data-action="setup" data-focus-key="setup-checklist" aria-label="Setup checklist, ${percent}% complete" title="Your setup checklist">${progressRing(percent)}</button>`}</div>
  </aside>`;
}
