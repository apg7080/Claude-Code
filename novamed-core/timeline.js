/**
 * NovaMed Timeline Engine
 * Generic scene runner for scripted animation prototypes.
 * Each demo defines its own scene array and passes it here.
 *
 * Features:
 *   - Play / Pause / Replay
 *   - Step navigation (Prev / Next scene)
 *   - Step indicator ("Scene 3 of 7")
 *   - Progress bar with smooth animation
 *   - Caption with inline Material Symbols icons
 *
 * Usage:
 *   NovaMed.Timeline.init({ progEl, capEl, playEl });
 *   NovaMed.Timeline.run(scenes, totalDuration, { onReset, onComplete });
 *
 * Scene format:
 *   { time: 3000, caption: 'Text' | Function, action: () => { ... } }
 */

window.NovaMed = window.NovaMed || {};

NovaMed.Timeline = (() => {
  let tids = [];
  let paused = false;
  let running = false;
  let duration = 0;
  let startTime = 0;

  let els = {};
  let onComplete = null;
  let onResetFn = null;

  // Step navigation state
  let currentScenes = [];
  let currentSceneIdx = -1;
  let stepEl = null;
  let prevBtn = null;
  let nextBtn = null;

  function init(config) {
    els.prog = config.progEl || document.getElementById('progressFill');
    els.cap = config.capEl || document.getElementById('sceneCaption');
    els.play = config.playEl || document.getElementById('playOverlay');

    // Auto-inject step controls into .ctrls container
    const ctrlsContainer = document.querySelector('.ctrls');
    if (ctrlsContainer) {
      // Create prev button
      prevBtn = document.createElement('button');
      prevBtn.className = 'ctrl';
      prevBtn.textContent = '← Prev';
      prevBtn.disabled = true;
      prevBtn.addEventListener('click', prevScene);

      // Create step indicator
      stepEl = document.createElement('span');
      stepEl.className = 'step-indicator';
      stepEl.textContent = '';

      // Create next button
      nextBtn = document.createElement('button');
      nextBtn.className = 'ctrl';
      nextBtn.textContent = 'Next →';
      nextBtn.disabled = true;
      nextBtn.addEventListener('click', nextScene);

      // Insert before existing buttons
      const firstChild = ctrlsContainer.firstChild;
      ctrlsContainer.insertBefore(prevBtn, firstChild);
      ctrlsContainer.insertBefore(stepEl, firstChild);
      ctrlsContainer.insertBefore(nextBtn, firstChild);
    }
  }

  function sched(fn, ms) {
    const id = setTimeout(() => { if (!paused) fn(); }, ms);
    tids.push(id);
    return id;
  }

  function prog() {
    if (!running || paused) return;
    const elapsed = Date.now() - startTime;
    setProg(Math.min((elapsed / duration) * 100, 100));
    if (elapsed < duration) requestAnimationFrame(prog);
  }

  function setProg(p) {
    if (els.prog) els.prog.style.width = p + '%';
  }

  /**
   * Set caption text. Supports HTML for inline icons.
   * @param {string} text - Caption text
   * @param {string} icon - Material Symbols icon name (optional)
   * @param {string} iconClass - CSS class: 'cap-icon-ai', 'cap-icon-physician', 'cap-icon-default'
   */
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
    }, 200);
  }

  function hidePlay() {
    if (els.play) els.play.classList.add('hidden');
  }

  function showPlay() {
    if (els.play) els.play.classList.remove('hidden');
  }

  function updateStepDisplay() {
    // Count unique caption scenes (the "steps" users see)
    const captionScenes = currentScenes.filter(s => s.caption !== undefined);
    const totalSteps = captionScenes.length;

    // Find which caption scene we're on
    let currentStep = 0;
    for (let i = 0; i < captionScenes.length; i++) {
      if (captionScenes[i].time <= currentScenes[currentSceneIdx]?.time) {
        currentStep = i + 1;
      }
    }

    if (stepEl) {
      stepEl.textContent = running ? `Step ${currentStep} of ${totalSteps}` : '';
    }
    if (prevBtn) prevBtn.disabled = !running || currentSceneIdx <= 0;
    if (nextBtn) nextBtn.disabled = !running || currentSceneIdx >= currentScenes.length - 1;
  }

  /**
   * Jump to a specific scene index.
   * Resets state, then executes all scenes from 0 to targetIdx immediately.
   */
  function jumpToScene(targetIdx) {
    if (!running || targetIdx < 0 || targetIdx >= currentScenes.length) return;

    // Clear all pending timeouts
    tids.forEach(clearTimeout);
    tids = [];

    // Reset to clean state
    if (onResetFn) onResetFn();
    hidePlay();

    // Execute all scenes from 0 to targetIdx immediately (no delays)
    for (let i = 0; i <= targetIdx; i++) {
      const scene = currentScenes[i];
      if (scene.caption !== undefined) {
        if (typeof scene.caption === 'function') {
          scene.caption();
        } else {
          setCap(scene.caption);
        }
      }
      if (scene.action) {
        scene.action();
      }
    }

    currentSceneIdx = targetIdx;
    const targetTime = currentScenes[targetIdx].time;

    // Set progress bar to target time
    setProg((targetTime / duration) * 100);

    // Adjust startTime so progress bar continues from here
    startTime = Date.now() - targetTime;

    // Schedule remaining scenes from targetIdx+1 onward
    for (let i = targetIdx + 1; i < currentScenes.length; i++) {
      const scene = currentScenes[i];
      const delay = scene.time - targetTime;

      if (scene.caption !== undefined) {
        sched(() => {
          currentSceneIdx = i;
          if (typeof scene.caption === 'function') {
            scene.caption();
          } else {
            setCap(scene.caption);
          }
          updateStepDisplay();
        }, delay);
      }
      if (scene.action) {
        sched(() => {
          if (!scene.caption) {
            currentSceneIdx = i;
            updateStepDisplay();
          }
          scene.action();
        }, delay);
      }
    }

    // Schedule end
    sched(() => {
      running = false;
      setProg(100);
      updateStepDisplay();
      if (onComplete) onComplete();
    }, duration - targetTime);

    // Resume progress animation
    if (!paused) requestAnimationFrame(prog);

    updateStepDisplay();
  }

  function nextScene() {
    if (!running) return;
    // Find next scene that has a caption (major step)
    for (let i = currentSceneIdx + 1; i < currentScenes.length; i++) {
      if (currentScenes[i].caption !== undefined) {
        jumpToScene(i);
        return;
      }
    }
    // No more caption scenes — jump to last scene
    jumpToScene(currentScenes.length - 1);
  }

  function prevScene() {
    if (!running) return;
    // Find previous scene that has a caption
    for (let i = currentSceneIdx - 1; i >= 0; i--) {
      if (currentScenes[i].caption !== undefined) {
        jumpToScene(i);
        return;
      }
    }
    // Go to beginning
    jumpToScene(0);
  }

  /**
   * Run a scene array.
   * @param {Array} scenes - Array of { time, caption?, action? }
   * @param {number} totalDuration - Total animation duration in ms
   * @param {Object} opts - { onComplete?, onReset? }
   */
  function run(scenes, totalDuration, opts = {}) {
    if (running) return;
    running = true;
    paused = false;
    duration = totalDuration;
    startTime = Date.now();
    onComplete = opts.onComplete || null;
    onResetFn = opts.onReset || null;
    currentScenes = scenes;
    currentSceneIdx = 0;

    if (opts.onReset) opts.onReset();
    hidePlay();
    requestAnimationFrame(prog);
    updateStepDisplay();

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const idx = i;

      if (scene.caption !== undefined) {
        sched(() => {
          currentSceneIdx = idx;
          if (typeof scene.caption === 'function') {
            scene.caption();
          } else {
            setCap(scene.caption);
          }
          updateStepDisplay();
        }, scene.time);
      }
      if (scene.action) {
        sched(() => {
          if (!scene.caption) {
            currentSceneIdx = idx;
            updateStepDisplay();
          }
          scene.action();
        }, scene.time);
      }
    }

    // End
    sched(() => {
      running = false;
      setProg(100);
      updateStepDisplay();
      showPlay();
      if (onComplete) onComplete();
    }, totalDuration);
  }

  function pause() {
    paused = true;
  }

  function resume() {
    paused = false;
    if (running) requestAnimationFrame(prog);
  }

  function stop() {
    tids.forEach(clearTimeout);
    tids = [];
    running = false;
    paused = false;
    currentSceneIdx = -1;
    currentScenes = [];
    updateStepDisplay();
  }

  function isRunning() { return running; }
  function isPaused() { return paused; }

  return {
    init, run, pause, resume, stop,
    sched, setProg, setCap, hidePlay, showPlay,
    isRunning, isPaused,
    nextScene, prevScene, jumpToScene
  };
})();
