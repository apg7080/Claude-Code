/**
 * NovaMed Billing Component
 * Medical billing codes section — CPT procedure codes + ICD diagnosis codes.
 * Supports AI-generated codes with physician review, inline editing, and manual entry.
 */

window.NovaMed = window.NovaMed || {};

NovaMed.Billing = (() => {
  const esc = NovaMed.Chips ? NovaMed.Chips.esc : s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Inject billing-specific styles once
  function injectStyles() {
    if (document.getElementById('nm-billing-css')) return;
    const style = document.createElement('style');
    style.id = 'nm-billing-css';
    style.textContent = `
      /* === Billing Section === */
      .billing-section {
        background: var(--surface);
        border-bottom: 1px solid var(--border-light);
        border-radius: var(--r-section);
        box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        padding: 20px 24px 16px;
        width: 100%;
        box-sizing: border-box;
        min-height: 200px;
      }
      .billing-title {
        font-size: 20px; font-weight: 600; line-height: 22px;
        color: var(--text-title); padding: 8px 0; margin: 0;
      }

      /* === Subheadings === */
      .billing-subheading {
        font-size: 12px; font-weight: 600; color: var(--text-secondary);
        text-transform: uppercase; letter-spacing: 0.04em;
        margin: 16px 0 8px; padding: 0;
      }
      .billing-subheading:first-of-type { margin-top: 12px; }

      /* === Code List === */
      .billing-codes-list {
        display: flex; flex-direction: column; gap: 2px;
      }

      /* === Code Row === */
      .billing-row {
        display: flex; align-items: center; gap: 10px;
        padding: 8px 12px;
        border: 1px solid transparent;
        border-radius: var(--r-section);
        transition: all 200ms ease-out;
        cursor: pointer;
        min-height: 40px;
        width: 100%;
        box-sizing: border-box;
      }
      .billing-row:hover {
        background: var(--billing-code-bg);
      }
      .billing-row.active {
        border-color: var(--border-focus);
        background: var(--surface);
        box-shadow: 0 0 0 1px var(--border-focus);
      }
      .billing-row.highlight {
        background: rgba(59,125,216,0.06);
      }

      /* === Code Tag (CPT / ICD prefix badges) === */
      .billing-tag {
        display: inline-flex; align-items: center; justify-content: center;
        background: var(--tag-bg); color: var(--tag-text);
        font-size: 12px; font-weight: 600; line-height: 20px;
        height: 24px; padding: 0 8px; border-radius: 2px;
        font-family: var(--font);
        flex-shrink: 0;
        letter-spacing: 0.02em;
      }

      /* === Code & Description === */
      .billing-code {
        font-size: 14px; font-weight: 600; color: var(--text-base);
        white-space: nowrap; flex-shrink: 0;
        font-variant-numeric: tabular-nums;
      }
      .billing-desc {
        font-size: 14px; font-weight: 400; color: var(--text-body);
        line-height: 1.4;
        flex: 1;
        min-width: 0;
      }
      .billing-row.active .billing-desc {
        outline: none;
      }

      /* === Empty State === */
      .billing-empty {
        padding: 16px 0 8px;
        display: flex; flex-direction: column; gap: 12px;
      }

      /* === Add Row === */
      .billing-add-row {
        display: flex; align-items: center; gap: 0;
        padding: 8px 12px;
        border: 1px solid transparent;
        border-radius: var(--r-section);
        cursor: text;
        min-height: 40px;
        transition: all 200ms ease-out;
      }
      .billing-add-row:hover {
        background: var(--billing-code-bg);
      }
      .billing-add-row.active {
        border-color: var(--border-focus);
        background: var(--surface);
        box-shadow: 0 0 0 1px var(--border-focus);
      }
      .billing-add-text {
        font-size: 14px; font-weight: 400;
        color: var(--text-softest);
        line-height: 1.4;
      }
      .billing-add-row.active .billing-add-text {
        color: var(--text-body);
      }

      /* === Generate Button === */
      .billing-generate-btn {
        display: inline-flex; align-items: center; justify-content: center;
        gap: 8px;
        padding: 10px 20px;
        background: var(--accent);
        color: #fff;
        border: none; border-radius: var(--r-section);
        font-size: 14px; font-weight: 600;
        font-family: var(--font);
        cursor: pointer;
        transition: all 200ms ease-out;
        align-self: flex-start;
      }
      .billing-generate-btn:hover {
        background: #2D6BC4;
        box-shadow: 0 2px 8px rgba(59,125,216,0.25);
      }
      .billing-generate-btn.pressed {
        transform: scale(0.97);
        background: #2D6BC4;
      }
      .billing-generate-btn svg {
        width: 16px; height: 16px; fill: currentColor;
      }

      /* === Shimmer Loading Blocks === */
      .billing-shimmer-block {
        height: 40px;
        border-radius: var(--r-section);
        margin-bottom: 4px;
      }
      .billing-shimmer-block.shimmer-w-full { width: 100%; }
      .billing-shimmer-block.shimmer-w-lg { width: 92%; }
      .billing-shimmer-block.shimmer-w-md { width: 85%; }
      .billing-shimmer-block.shimmer-w-sm { width: 78%; }

      /* === Responsive === */
      @media (max-width: 600px) {
        .billing-section { padding: 16px 16px 12px; }
        .billing-row { padding: 6px 8px; gap: 8px; }
        .billing-tag { font-size: 11px; height: 22px; padding: 0 6px; }
        .billing-code { font-size: 13px; }
        .billing-desc { font-size: 13px; }
      }
    `;
    document.head.appendChild(style);
  }

  // Shimmer width classes for natural loading look
  const SHIMMER_WIDTHS = ['shimmer-w-full', 'shimmer-w-lg', 'shimmer-w-md', 'shimmer-w-sm', 'shimmer-w-lg', 'shimmer-w-md'];

  /**
   * Create the Medical Codes section shell
   */
  function createSection() {
    injectStyles();
    const section = document.createElement('div');
    section.className = 'billing-section';
    section.innerHTML = `
      <h2 class="billing-title">Medical Codes</h2>
      <div class="billing-empty" id="billingEmpty">
        <div class="billing-add-row">
          <span class="billing-add-text">+ Write something or hit '/'</span>
        </div>
        <button class="billing-generate-btn" id="billingGenerateBtn">
          <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z"/></svg>
          Generate Codes From Report
        </button>
      </div>
      <div id="billingContent" style="display:none;">
        <div id="billingProcedure">
          <h3 class="billing-subheading">Procedure Codes</h3>
          <div class="billing-codes-list" id="billingProcedureList"></div>
        </div>
        <div id="billingDiagnosis">
          <h3 class="billing-subheading">Diagnosis Codes</h3>
          <div class="billing-codes-list" id="billingDiagnosisList"></div>
        </div>
        <div class="billing-add-row" id="billingAddRow" style="margin-top:4px;">
          <span class="billing-add-text">+ Write something or hit '/'</span>
        </div>
      </div>
    `;
    return section;
  }

  /**
   * Create a billing code row
   * @param {'CPT'|'ICD'} type
   * @param {string} code
   * @param {string} description
   * @param {string} [source='ai'] - 'ai' or 'manual'
   */
  function createCodeRow(type, code, description, source) {
    const row = document.createElement('div');
    row.className = 'billing-row';
    row.dataset.type = type;
    row.dataset.code = code;
    row.dataset.source = source || 'ai';
    row.innerHTML = `
      <span class="billing-tag">${esc(type)}</span>
      <span class="billing-code">${esc(code)}</span>
      <span class="billing-desc">${esc(description)}</span>
    `;
    return row;
  }

  /**
   * Set a row to editable state (active border, focus indicator)
   */
  function setEditable(rowEl) {
    // Deactivate any other active rows
    document.querySelectorAll('.billing-row.active, .billing-add-row.active').forEach(r => r.classList.remove('active'));
    rowEl.classList.add('active');
  }

  /**
   * Set a row back to display state with new values
   */
  function setDisplay(rowEl, code, description) {
    rowEl.classList.remove('active');
    const codeEl = rowEl.querySelector('.billing-code');
    const descEl = rowEl.querySelector('.billing-desc');
    if (codeEl) codeEl.textContent = code;
    if (descEl) descEl.textContent = description;
    rowEl.dataset.code = code;
  }

  /**
   * Create shimmer loading block with CSS-class-based width
   * @param {number} index - Index for varying widths
   */
  function createShimmerBlock(index) {
    const block = document.createElement('div');
    const widthClass = SHIMMER_WIDTHS[index % SHIMMER_WIDTHS.length];
    block.className = `billing-shimmer-block shimmer ${widthClass}`;
    return block;
  }

  return {
    createSection,
    createCodeRow,
    setEditable,
    setDisplay,
    createShimmerBlock,
    injectStyles
  };
})();
