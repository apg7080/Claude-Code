/**
 * NovaMed Editor Component
 * Handles editor sections: findings (multi-editor), summary/recommendations (single-editor)
 * Focus states, action bars, review banners, add-finding button
 */

window.NovaMed = window.NovaMed || {};

NovaMed.Editor = (() => {

  function activateFinding(el) { el.classList.add('active'); }
  function deactivateFinding(el) { el.classList.remove('active'); }

  function setReview(findingEl, bannerId) {
    findingEl.classList.add('review');
    findingEl.classList.remove('active');
    const ban = document.getElementById(bannerId);
    if (ban) ban.classList.add('vis');
  }

  function showPlaceholder(textEl, text) {
    textEl.innerHTML = `<span class="ph">${text || 'Begin writing or select from Text Blocks...'}</span>`;
  }

  function showCursor(textEl) {
    hideCursor(textEl);
    const c = document.createElement('span');
    c.className = 'cur';
    textEl.appendChild(c);
  }

  function hideCursor(textEl) {
    const c = textEl.querySelector('.cur');
    if (c) c.remove();
  }

  function scanOn(scanEl, on) {
    scanEl.classList.toggle('on', on);
  }

  function showElement(el, show) {
    el.classList.toggle('vis', show);
  }

  function revealElement(el, opts = {}) {
    const dur = opts.duration || 350;
    el.style.display = '';
    el.style.opacity = '0';
    el.style.transform = `translateY(${opts.translateY || 6}px)`;
    anime({
      targets: el,
      opacity: 1,
      translateY: 0,
      duration: dur,
      easing: opts.easing || 'easeOutCubic'
    });
  }

  // Slash menu helpers
  function slashShow(menuEl, on) { menuEl.classList.toggle('open', on); }
  function slashSearch(searchEl, html) { searchEl.innerHTML = html; }
  function slashFilter(menuEl, q) {
    const items = menuEl.querySelectorAll('.sl-item');
    let first = null;
    items.forEach(i => {
      const t = i.querySelector('.sl-txt').textContent.toLowerCase();
      const m = !q || t.includes(q.toLowerCase());
      i.classList.toggle('hid', !m);
      i.classList.remove('hi');
      if (m && !first) first = i;
    });
    if (first) first.classList.add('hi');
  }
  function slashHighlight(menuEl, id) {
    menuEl.querySelectorAll('.sl-item').forEach(i =>
      i.classList.toggle('hi', i.dataset.block === id)
    );
  }

  // AI panel helpers
  function aiPanelShow(panelEl, on) { panelEl.classList.toggle('vis', on); }
  function aiPanelPopulate(bodyEl, terms) {
    bodyEl.innerHTML = '';
    terms.forEach(t => bodyEl.appendChild(NovaMed.Chips.createAITermRow(t)));
  }
  function aiPanelReveal(bodyEl, cb) {
    const rows = bodyEl.querySelectorAll('.ai-row');
    rows.forEach((r, i) => setTimeout(() => {
      r.classList.add('vis');
      if (i === rows.length - 1 && cb) setTimeout(cb, 300);
    }, i * 150));
  }
  function aiPanelConfirm(bodyEl, cb) {
    const rows = bodyEl.querySelectorAll('.ai-row');
    rows.forEach((r, i) => setTimeout(() => {
      NovaMed.Chips.confirmTermRow(r);
      if (i === rows.length - 1 && cb) setTimeout(cb, 400);
    }, i * 100));
  }

  // Dropdown helpers
  function dropdownShow(ddEl, on) { ddEl.classList.toggle('open', on); }

  // Stats
  function showStats(statsEl, on) { statsEl.classList.toggle('vis', on); }

  return {
    activateFinding, deactivateFinding, setReview,
    showPlaceholder, showCursor, hideCursor, scanOn,
    showElement, revealElement,
    slashShow, slashSearch, slashFilter, slashHighlight,
    aiPanelShow, aiPanelPopulate, aiPanelReveal, aiPanelConfirm,
    dropdownShow, showStats
  };
})();
