/**
 * NovaMed Field States
 * State machine: empty → AI-populated → user-edited
 * When AI populates: AI badge appears, field gets .ai-populated class
 * When user edits: AI badge removed, field returns to base component
 */

window.NovaMed = window.NovaMed || {};

NovaMed.Fields = (() => {
  const STATES = { EMPTY: 'empty', AI: 'ai-populated', USER: 'user-edited' };

  function createSelectField(label, opts = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'nm-field nm-select';
    wrap.setAttribute('data-state', STATES.EMPTY);
    wrap.innerHTML = `
      <label class="nm-field-label">${label}${opts.required ? ' <span class="nm-req">*</span>' : ''}</label>
      <div class="nm-field-input">
        <span class="nm-field-value">${opts.placeholder || 'Select'}</span>
        <span class="nm-field-arrow">&#9662;</span>
      </div>
    `;
    return wrap;
  }

  function setAIValue(fieldEl, value, source) {
    fieldEl.setAttribute('data-state', STATES.AI);
    fieldEl.classList.add('ai-populated');
    const inputEl = fieldEl.querySelector('.nm-field-input');
    inputEl.innerHTML = `
      ${NovaMed.AIIcon.createBadgeHTML(source)}
      <span class="nm-field-value">${value}</span>
      <span class="nm-field-clear">&times;</span>
      <span class="nm-field-arrow">&#9662;</span>
    `;
    // Wire up tooltip on the badge
    const badge = inputEl.querySelector('.ai-badge');
    if (badge) {
      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        NovaMed.AIIcon.toggleTooltip(badge, source);
      });
    }
  }

  function setUserValue(fieldEl, value) {
    fieldEl.setAttribute('data-state', STATES.USER);
    fieldEl.classList.remove('ai-populated');
    const inputEl = fieldEl.querySelector('.nm-field-input');
    inputEl.innerHTML = `
      <span class="nm-field-value">${value}</span>
      <span class="nm-field-clear">&times;</span>
      <span class="nm-field-arrow">&#9662;</span>
    `;
  }

  function clearField(fieldEl, placeholder) {
    fieldEl.setAttribute('data-state', STATES.EMPTY);
    fieldEl.classList.remove('ai-populated');
    const inputEl = fieldEl.querySelector('.nm-field-input');
    inputEl.innerHTML = `
      <span class="nm-field-value">${placeholder || 'Select'}</span>
      <span class="nm-field-arrow">&#9662;</span>
    `;
  }

  function createTimeField(label, opts = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'nm-field nm-time';
    wrap.setAttribute('data-state', STATES.EMPTY);
    wrap.innerHTML = `
      <label class="nm-field-label">${label}${opts.required ? ' <span class="nm-req">*</span>' : ''}</label>
      <div class="nm-field-input">
        <span class="nm-field-value">--:--</span>
        <span class="nm-field-icon">&#128336;</span>
      </div>
    `;
    return wrap;
  }

  function setAITime(fieldEl, time, source) {
    fieldEl.setAttribute('data-state', STATES.AI);
    fieldEl.classList.add('ai-populated');
    const inputEl = fieldEl.querySelector('.nm-field-input');
    inputEl.innerHTML = `
      ${NovaMed.AIIcon.createBadgeHTML(source)}
      <span class="nm-field-value">${time}</span>
      <span class="nm-field-icon">&#128336;</span>
    `;
  }

  return {
    STATES,
    createSelectField, createTimeField,
    setAIValue, setUserValue, clearField, setAITime
  };
})();
