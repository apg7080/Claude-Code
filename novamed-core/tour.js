/**
 * NovaMed Tour Engine
 * Step-based guided navigation for the Full Report Walkthrough.
 *
 * Unlike timeline.js (time-based, auto-advancing), this is event-driven:
 *   - Next / Back buttons control step advancement
 *   - Each step scrolls to a section, highlights it, shows a caption
 *   - Optional mini-animations per step
 *   - Autoplay mode auto-advances on a timer
 *
 * Usage:
 *   NovaMed.Tour.init({ container, capEl, progEl });
 *   NovaMed.Tour.load(steps);
 *   NovaMed.Tour.start();
 *
 * Step format:
 *   {
 *     caption: { text, icon?, iconClass? },
 *     section: '#sectionId',        // element to scroll to + highlight
 *     onEnter?: () => {},            // runs when step becomes active
 *     onExit?: () => {}              // runs when leaving this step
 *   }
 */

window.NovaMed = window.NovaMed || {};

NovaMed.Tour = (() => {
  let steps = [];
  let currentIdx = -1;
  let active = false;
  let autoplay = false;
  let autoplayTimer = null;
  const AUTOPLAY_DELAY = 4500; // ms per step in autoplay

  /* DOM refs */
  let els = {};
  let prevBtn, nextBtn, stepEl, autoplayBtn, pauseBtn;

  /* Easing */
  const EASE_IN = 'cubicBezier(.39, .575, .565, 1)';

  function init(config) {
    els.container = config.container || document.querySelector('.proto-ui');
    els.cap = config.capEl || document.getElementById('sceneCaption');
    els.prog = config.progEl || document.getElementById('progressFill');
    els.play = config.playEl || document.getElementById('playOverlay');
    els.narration = document.querySelector('.proto-narration');

    // Build controls into .ctrls
    const ctrlsContainer = document.querySelector('.ctrls');
    if (ctrlsContainer) {
      ctrlsContainer.innerHTML = '';

      prevBtn = document.createElement('button');
      prevBtn.className = 'ctrl-icon';
      prevBtn.innerHTML = '<span class="material-symbols-outlined">navigate_before</span>';
      prevBtn.title = 'Previous step';
      prevBtn.disabled = true;
      prevBtn.addEventListener('click', prev);

      stepEl = document.createElement('span');
      stepEl.className = 'step-indicator';

      nextBtn = document.createElement('button');
      nextBtn.className = 'ctrl-icon';
      nextBtn.innerHTML = '<span class="material-symbols-outlined">navigate_next</span>';
      nextBtn.title = 'Next step';
      nextBtn.disabled = true;
      nextBtn.addEventListener('click', next);

      autoplayBtn = document.createElement('button');
      autoplayBtn.className = 'ctrl-icon';
      autoplayBtn.innerHTML = '<span class="material-symbols-outlined">play_arrow</span>';
      autoplayBtn.title = 'Autoplay';
      autoplayBtn.addEventListener('click', toggleAutoplay);

      const replayBtn = document.createElement('button');
      replayBtn.className = 'ctrl-icon';
      replayBtn.innerHTML = '<span class="material-symbols-outlined">replay</span>';
      replayBtn.title = 'Restart tour';
      replayBtn.addEventListener('click', restart);

      ctrlsContainer.appendChild(prevBtn);
      ctrlsContainer.appendChild(stepEl);
      ctrlsContainer.appendChild(nextBtn);
      ctrlsContainer.appendChild(autoplayBtn);
      ctrlsContainer.appendChild(replayBtn);
    }
  }

  function load(stepArray) {
    steps = stepArray;
    updateDisplay();
  }

  function start() {
    if (steps.length === 0) return;
    active = true;
    currentIdx = -1;
    if (els.play) els.play.classList.add('hidden');
    next();
  }

  function restart() {
    stopAutoplay();
    // Clear all highlights
    clearHighlights();
    // Exit current step
    if (currentIdx >= 0 && steps[currentIdx]?.onExit) {
      steps[currentIdx].onExit();
    }
    currentIdx = -1;
    active = false;
    // Reset any step-specific state
    steps.forEach(s => { if (s.onReset) s.onReset(); });
    start();
  }

  function next() {
    if (currentIdx >= steps.length - 1) {
      // Tour complete
      finish();
      return;
    }
    goTo(currentIdx + 1);
  }

  function prev() {
    if (currentIdx <= 0) return;
    goTo(currentIdx - 1);
  }

  function goTo(idx) {
    if (idx < 0 || idx >= steps.length) return;

    // Exit current step
    if (currentIdx >= 0 && steps[currentIdx]?.onExit) {
      steps[currentIdx].onExit();
    }

    // Clear previous highlight
    clearHighlights();

    currentIdx = idx;
    const step = steps[currentIdx];

    // Set caption
    if (step.caption) {
      setCap(step.caption.text, step.caption.icon, step.caption.iconClass);
    }

    // Scroll to and highlight section
    if (step.section) {
      const sectionEl = document.querySelector(step.section);
      if (sectionEl) {
        sectionEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        sectionEl.classList.add('tour-highlight');
      }
    }

    // Update progress
    setProg(((currentIdx + 1) / steps.length) * 100);

    // Run enter callback (mini-animations, etc.)
    if (step.onEnter) {
      setTimeout(() => step.onEnter(), 400); // slight delay for scroll to settle
    }

    updateDisplay();

    // Schedule next step if autoplay
    if (autoplay) {
      scheduleAutoplay();
    }
  }

  function finish() {
    stopAutoplay();
    active = false;
    setProg(100);
    setCap('Tour complete — explore each section above', 'check_circle', 'cap-icon-default');
    clearHighlights();
    updateDisplay();
    // Show play overlay for restart
    if (els.play) {
      els.play.classList.remove('hidden');
      els.play.classList.add('show-smooth');
      setTimeout(() => {
        if (els.play) els.play.classList.remove('show-smooth');
      }, 550);
    }
  }

  function clearHighlights() {
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight');
    });
  }

  /* Autoplay */

  function toggleAutoplay() {
    if (autoplay) {
      stopAutoplay();
    } else {
      startAutoplay();
    }
  }

  function startAutoplay() {
    autoplay = true;
    const icon = autoplayBtn?.querySelector('.material-symbols-outlined');
    if (icon) icon.textContent = 'pause';
    if (autoplayBtn) { autoplayBtn.title = 'Pause autoplay'; autoplayBtn.classList.add('on'); }
    if (!active) {
      start();
    } else {
      scheduleAutoplay();
    }
  }

  function stopAutoplay() {
    autoplay = false;
    if (autoplayTimer) { clearTimeout(autoplayTimer); autoplayTimer = null; }
    const icon = autoplayBtn?.querySelector('.material-symbols-outlined');
    if (icon) icon.textContent = 'play_arrow';
    if (autoplayBtn) { autoplayBtn.title = 'Autoplay'; autoplayBtn.classList.remove('on'); }
  }

  function scheduleAutoplay() {
    if (autoplayTimer) clearTimeout(autoplayTimer);
    autoplayTimer = setTimeout(() => {
      if (autoplay && active) next();
    }, AUTOPLAY_DELAY);
  }

  /* Display helpers */

  function setCap(text, icon, iconClass) {
    if (!els.cap) return;
    els.cap.classList.remove('show');
    setTimeout(() => {
      if (!text) { els.cap.innerHTML = ''; return; }
      let html = '';
      if (icon) {
        html += '<span class="material-symbols-outlined ' + (iconClass || 'cap-icon-default') + '">' + icon + '</span>';
      }
      html += text;
      els.cap.innerHTML = html;
      els.cap.classList.add('show');
    }, 350);
  }

  function setProg(p) {
    if (els.prog) els.prog.style.width = p + '%';
  }

  function updateDisplay() {
    const total = steps.length;
    const current = currentIdx + 1;

    if (stepEl) {
      stepEl.textContent = active ? `Step ${current} of ${total}` : '';
    }
    if (prevBtn) prevBtn.disabled = !active || currentIdx <= 0;
    if (nextBtn) nextBtn.disabled = !active || currentIdx >= total - 1;
  }

  return {
    init, load, start, restart,
    next, prev, goTo,
    startAutoplay, stopAutoplay, toggleAutoplay
  };
})();
