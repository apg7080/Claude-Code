/**
 * NovaMed AI Icon Component
 * Blue "AI" badge shown on any field populated by CAQ or Ambient Voice.
 * Clickable — shows tooltip with source + disclaimer.
 * Icon disappears when physician manually edits (trust handoff).
 */

window.NovaMed = window.NovaMed || {};

NovaMed.AIIcon = (() => {
  const DISCLAIMER = 'This field has been populated with data detected during the procedure by an Artificial Intelligence algorithm. It is not intended to replace the decision making of healthcare professionals and you are responsible for confirming its accuracy.';

  const SOURCES = {
    caq: { name: 'Odin Vision', icon: '&#x1F50D;' },
    voice: { name: 'EndoVoice Scribe', icon: '&#x1F3A4;' }
  };

  function createBadge(source) {
    const badge = document.createElement('span');
    badge.className = 'ai-badge';
    badge.setAttribute('data-source', source);
    badge.innerHTML = 'AI';
    badge.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleTooltip(badge, source);
    });
    return badge;
  }

  function createBadgeHTML(source) {
    return `<span class="ai-badge" data-source="${source}">AI</span>`;
  }

  function toggleTooltip(badgeEl, source) {
    // Close any open tooltips
    document.querySelectorAll('.ai-tooltip.open').forEach(t => t.classList.remove('open'));

    let tooltip = badgeEl.querySelector('.ai-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className = 'ai-tooltip';
      const src = SOURCES[source] || SOURCES.voice;
      tooltip.innerHTML = `
        <div class="ai-tooltip-source">Source: ${src.name}</div>
        <div class="ai-tooltip-text">${DISCLAIMER}</div>
      `;
      badgeEl.appendChild(tooltip);
    }
    tooltip.classList.toggle('open');
  }

  function removeBadge(containerEl, opts = {}) {
    const badge = containerEl.querySelector('.ai-badge');
    if (!badge) return;

    if (opts.highlight) {
      badge.classList.add('ai-badge-removing');
      setTimeout(() => badge.remove(), 400);
    } else {
      badge.remove();
    }
  }

  function addBadgeToField(fieldEl, source) {
    if (fieldEl.querySelector('.ai-badge')) return;
    const badge = createBadge(source);
    fieldEl.insertBefore(badge, fieldEl.firstChild);
    fieldEl.classList.add('ai-populated');
  }

  // Close tooltips on outside click
  function initGlobalClose() {
    document.addEventListener('click', () => {
      document.querySelectorAll('.ai-tooltip.open').forEach(t => t.classList.remove('open'));
    });
  }

  return {
    createBadge, createBadgeHTML, toggleTooltip,
    removeBadge, addBadgeToField, initGlobalClose,
    DISCLAIMER, SOURCES
  };
})();
