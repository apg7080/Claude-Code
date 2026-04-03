/**
 * NovaMed Chip System
 * 20px height, 4px radius, arrow + separator + close
 * Filled = #E6F0FE bg | Unfilled = #FFDD99 amber | AI = filled + AI badge
 */

window.NovaMed = window.NovaMed || {};

NovaMed.Chips = (() => {
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const LABELS = {
    anatomy: 'Location', location: 'Location', size: 'Size (mm)',
    morphology: 'Morphology', action: 'Action', equipment: 'Equipment',
    tissue: 'Tissue', severity: 'Severity', finding: 'Finding',
    retrieved: 'Action', pathology: 'Pathology'
  };

  function filledHTML(term) {
    return `<span class="c fill">${esc(term)} <span class="c-arr">&#9662;</span><span class="c-sep"></span><span class="c-x">&times;</span></span>`;
  }

  function unfilledHTML(catKey) {
    const label = LABELS[catKey] || catKey;
    return `<span class="c empty">${esc(label)} <span class="c-arr">&#9662;</span><span class="c-sep"></span><span class="c-x">&times;</span></span>`;
  }

  function aiFilledHTML(term) {
    return `<span class="c fill c-ai">${esc(term)} <span class="c-arr">&#9662;</span><span class="c-sep"></span><span class="c-x">&times;</span></span>`;
  }

  function createFilledEl(term) {
    const s = document.createElement('span');
    s.className = 'c fill pop';
    s.innerHTML = `${esc(term)} <span class="c-arr">&#9662;</span><span class="c-sep"></span><span class="c-x">&times;</span>`;
    setTimeout(() => s.classList.remove('pop'), 220);
    return s;
  }

  function createUnfilledEl(catKey) {
    const label = LABELS[catKey] || catKey;
    const s = document.createElement('span');
    s.className = 'c empty pop';
    s.innerHTML = `${esc(label)} <span class="c-arr">&#9662;</span><span class="c-sep"></span><span class="c-x">&times;</span>`;
    setTimeout(() => s.classList.remove('pop'), 220);
    return s;
  }

  function fillChipEl(el, value) {
    el.classList.remove('empty');
    el.classList.add('fill', 'pop');
    el.innerHTML = `${esc(value)} <span class="c-arr">&#9662;</span><span class="c-sep"></span><span class="c-x">&times;</span>`;
    setTimeout(() => el.classList.remove('pop'), 220);
  }

  function buildChipsFromText(text, terms) {
    const pos = [];
    for (const t of terms) {
      const i = text.toLowerCase().indexOf(t.term.toLowerCase());
      if (i !== -1) pos.push({ ...t, s: i, e: i + t.term.length });
    }
    pos.sort((a, b) => a.s - b.s);
    let html = '', last = 0;
    for (const p of pos) {
      if (p.s > last) html += esc(text.substring(last, p.s));
      html += filledHTML(p.term);
      last = p.e;
    }
    if (last < text.length) html += esc(text.substring(last));
    return html;
  }

  /**
   * Build chip text with AI badges before each chip.
   * Used by ambient voice and similar demos where AI populates findings.
   * @param {string} text - The clinical text
   * @param {Array} terms - Array of { term, category, label, confidence }
   * @param {string} source - AI source label (e.g. 'voice')
   */
  function buildAIChipsFromText(text, terms, source) {
    const pos = [];
    for (const t of terms) {
      const i = text.toLowerCase().indexOf(t.term.toLowerCase());
      if (i !== -1) pos.push({ ...t, s: i, e: i + t.term.length });
    }
    pos.sort((a, b) => a.s - b.s);
    let html = '', last = 0;
    for (const p of pos) {
      if (p.s > last) html += esc(text.substring(last, p.s));
      html += '<span class="ai-badge" data-source="' + esc(source || 'ai') + '" style="margin-right:2px;">AI</span>';
      html += filledHTML(p.term);
      last = p.e;
    }
    if (last < text.length) html += esc(text.substring(last));
    return html;
  }

  function buildBlockTemplate(tpl) {
    const parts = tpl.split(/\{(\w+)\}/g);
    let html = '';
    for (let i = 0; i < parts.length; i++) {
      html += i % 2 === 0 ? esc(parts[i]) : unfilledHTML(parts[i]);
    }
    return html;
  }

  function createAITermRow(term) {
    const r = document.createElement('div');
    r.className = 'ai-row';
    r.innerHTML = `
      <div class="ai-row-l">
        <div class="ai-chk"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" stroke-width="3"/></svg></div>
        <span class="c fill" style="font-size:12px;height:18px;line-height:18px;padding:0 4px;">
          ${esc(term.term)} <span class="c-arr">&#9662;</span><span class="c-sep" style="height:12px"></span><span class="c-x">&times;</span>
        </span>
        <span style="color:var(--text-secondary);font-size:12px;">&rarr; ${esc(term.label)}</span>
      </div>
      <span class="ai-conf ${term.confidence >= 90 ? 'hi' : ''}">${term.confidence}%</span>
    `;
    return r;
  }

  function confirmTermRow(row) {
    const c = row.querySelector('.ai-chk');
    if (c) c.classList.add('ok');
  }

  return {
    filledHTML, unfilledHTML, aiFilledHTML,
    createFilledEl, createUnfilledEl, fillChipEl,
    buildChipsFromText, buildAIChipsFromText, buildBlockTemplate,
    createAITermRow, confirmTermRow,
    LABELS, esc
  };
})();
