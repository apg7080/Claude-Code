/**
 * NovaMed Image Component
 * Handles procedure images attached to findings.
 * Images appear on the right side of each finding.
 * Supports: AI-imported (from endoscope), manual drag-drop, captioning.
 */

window.NovaMed = window.NovaMed || {};

NovaMed.Images = (() => {

  const CAMERA_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>`;

  const DRAG_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>`;

  /**
   * Create an image card placeholder (no actual image)
   * @param {Object} opts
   * @param {string} opts.label - e.g., "2A", "3A"
   * @param {string} opts.caption - e.g., "Add A Caption"
   * @param {string} opts.source - "ai" | "manual" | "drag"
   * @param {string} opts.description - e.g., "Ascending Colon"
   */
  function createPlaceholder(opts = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'f-content-image';

    const card = document.createElement('div');
    card.className = 'f-image-card' + (opts.source === 'ai' ? ' ai-imported' : '');

    const placeholder = document.createElement('div');
    placeholder.className = 'f-image-placeholder';
    placeholder.innerHTML = `${CAMERA_SVG}<span>${opts.description || 'Procedure Image'}</span>`;
    card.appendChild(placeholder);

    if (opts.label) {
      const tag = document.createElement('div');
      tag.className = 'f-image-label-tag';
      tag.textContent = opts.label;
      card.appendChild(tag);
    }

    wrap.appendChild(card);

    if (opts.caption) {
      const cap = document.createElement('div');
      cap.className = 'f-image-caption';
      cap.textContent = opts.caption;
      wrap.appendChild(cap);
    }

    return wrap;
  }

  /**
   * Create a filled image card (with a colored rectangle representing an endoscopy image)
   * Uses a gradient to simulate a medical image without using real patient photos.
   */
  function createFilledImage(opts = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'f-content-image';

    const card = document.createElement('div');
    card.className = 'f-image-card' + (opts.source === 'ai' ? ' ai-imported' : '');

    // Simulated endoscopy image (warm tones like the real Figma reference)
    const img = document.createElement('div');
    img.className = 'f-image-simulated';
    img.style.cssText = `
      width:100%; height:100%;
      background: radial-gradient(ellipse at 45% 45%, #E8A87C, #C97B5B 40%, #8B4A3A 70%, #5C2E24 100%);
      border-radius: 2px;
    `;
    card.appendChild(img);

    if (opts.label) {
      const tag = document.createElement('div');
      tag.className = 'f-image-label-tag';
      tag.textContent = opts.label;
      card.appendChild(tag);
    }

    wrap.appendChild(card);

    if (opts.caption) {
      const cap = document.createElement('div');
      cap.className = 'f-image-caption';
      cap.textContent = opts.caption;
      wrap.appendChild(cap);
    }

    return wrap;
  }

  /**
   * Create a drag-drop zone placeholder
   */
  function createDropZone() {
    const zone = document.createElement('div');
    zone.className = 'f-image-dropzone';
    zone.innerHTML = `${DRAG_SVG}<span>Drop image here</span>`;
    return zone;
  }

  /**
   * Create an "Add Image" button that sits next to a finding
   */
  function createAddButton() {
    const btn = document.createElement('button');
    btn.className = 'f-add-image';
    btn.innerHTML = `${CAMERA_SVG} <span>Add Image</span>`;
    return btn;
  }

  /**
   * Wrap a finding's body in a content row layout (text left, image right)
   * @param {HTMLElement} bodyEl - The .f-body element
   * @param {HTMLElement} imageEl - The image component to place on the right
   */
  function wrapWithImage(bodyEl, imageEl) {
    const existing = bodyEl.querySelector('.f-content-row');
    if (existing) {
      // Already wrapped — just replace/add the image
      const imgSlot = existing.querySelector('.f-content-image');
      if (imgSlot) imgSlot.replaceWith(imageEl);
      else existing.appendChild(imageEl);
      return;
    }

    // Wrap existing content
    const main = document.createElement('div');
    main.className = 'f-content-main';

    // Move all children into main
    while (bodyEl.firstChild) {
      main.appendChild(bodyEl.firstChild);
    }

    const row = document.createElement('div');
    row.className = 'f-content-row';
    row.appendChild(main);
    row.appendChild(imageEl);

    bodyEl.appendChild(row);
  }

  /**
   * Simulate an AI image import animation
   * @param {HTMLElement} targetEl - Where to place the image
   * @param {Object} opts - Image options
   * @param {Function} onDone - Callback when animation completes
   */
  function animateAIImport(targetEl, opts, onDone) {
    const imageEl = createFilledImage({ ...opts, source: 'ai' });
    imageEl.style.opacity = '0';
    imageEl.style.transform = 'scale(0.9)';
    targetEl.appendChild(imageEl);

    anime({
      targets: imageEl,
      opacity: [0, 1],
      scale: [0.9, 1],
      duration: 300,
      easing: 'easeOutCubic',
      complete: () => { if (onDone) onDone(imageEl); }
    });

    return imageEl;
  }

  /**
   * Simulate a drag-drop image animation
   * @param {HTMLElement} targetEl - Where to place the image
   * @param {Object} opts - Image options
   * @param {Function} onDone - Callback
   */
  function animateDragDrop(targetEl, opts, onDone) {
    const imageEl = createFilledImage({ ...opts, source: 'manual' });
    imageEl.style.opacity = '0';
    imageEl.style.transform = 'translateY(-20px)';
    targetEl.appendChild(imageEl);

    anime({
      targets: imageEl,
      opacity: [0, 1],
      translateY: [-20, 0],
      duration: 400,
      easing: 'easeOutCubic',
      complete: () => { if (onDone) onDone(imageEl); }
    });

    return imageEl;
  }

  // Inject dropzone CSS
  function injectStyles() {
    if (document.getElementById('nm-images-styles')) return;
    const style = document.createElement('style');
    style.id = 'nm-images-styles';
    style.textContent = `
      .f-image-dropzone {
        width: 120px; height: 90px;
        border: 2px dashed var(--border);
        border-radius: var(--r-section);
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        gap: 4px; color: var(--text-softest);
        transition: all 200ms;
      }
      .f-image-dropzone svg { width: 20px; height: 20px; opacity: 0.4; }
      .f-image-dropzone span { font-size: 10px; font-weight: 500; }
      .f-image-dropzone.drag-over {
        border-color: var(--accent);
        background: var(--accent-container);
        color: var(--accent);
      }
      .f-image-dropzone.drag-over svg { opacity: 0.8; }
      .f-image-simulated { position: relative; }
    `;
    document.head.appendChild(style);
  }

  // Auto-inject on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectStyles);
  } else {
    injectStyles();
  }

  return {
    createPlaceholder, createFilledImage, createDropZone, createAddButton,
    wrapWithImage, animateAIImport, animateDragDrop,
    CAMERA_SVG, DRAG_SVG
  };
})();
