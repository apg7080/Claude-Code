/**
 * NovaMed Chip System
 * 20px height, 4px radius, arrow ▾ + separator + close ×
 * Filled = #E6F0FE bg, #393F4C text | Unfilled = #FFDD99 yellow
 */

const ChipSystem = (() => {

  function filledChip(term) {
    const s = document.createElement('span');
    s.className = 'c fill pop';
    s.innerHTML = `${term.term} <span class="c-arr">&#9662;</span><span class="c-sep"></span><span class="c-x">&times;</span>`;
    s.title = `${term.label} — ${term.confidence}%`;
    setTimeout(() => s.classList.remove('pop'), 220);
    return s;
  }

  function unfilledChip(catKey) {
    const labels = {
      anatomy: 'Location', location: 'Location', size: 'Size (mm)', morphology: 'Morphology',
      action: 'Action', equipment: 'Equipment', tissue: 'Tissue', severity: 'Severity',
      finding: 'Finding', retrieved: 'Action'
    };
    const s = document.createElement('span');
    s.className = 'c empty pop';
    s.innerHTML = `${labels[catKey] || catKey} <span class="c-arr">&#9662;</span><span class="c-sep"></span><span class="c-x">&times;</span>`;
    setTimeout(() => s.classList.remove('pop'), 220);
    return s;
  }

  function fillChip(el, value) {
    el.classList.remove('empty');
    el.classList.add('fill', 'pop');
    el.innerHTML = `${value} <span class="c-arr">&#9662;</span><span class="c-sep"></span><span class="c-x">&times;</span>`;
    setTimeout(() => el.classList.remove('pop'), 220);
  }

  function createAITermRow(term) {
    const r = document.createElement('div');
    r.className = 'ai-row';
    r.innerHTML = `
      <div class="ai-row-l">
        <div class="ai-chk"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" stroke-width="3"/></svg></div>
        <span class="c fill" style="font-size:12px;height:18px;line-height:18px;padding:0 4px;">
          ${term.term} <span class="c-arr">&#9662;</span><span class="c-sep" style="height:12px"></span><span class="c-x">&times;</span>
        </span>
        <span style="color:var(--text-secondary);font-size:12px;">&rarr; ${term.label}</span>
      </div>
      <span class="ai-conf ${term.confidence >= 90 ? 'hi' : ''}">${term.confidence}%</span>
    `;
    return r;
  }

  function confirmTermRow(row) {
    const c = row.querySelector('.ai-chk');
    if (c) c.classList.add('ok');
  }

  return { filledChip, unfilledChip, fillChip, createAITermRow, confirmTermRow };
})();
