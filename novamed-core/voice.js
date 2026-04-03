/**
 * NovaMed Voice Component
 * Waveform indicator (CSS animated bars) and transcript streaming.
 * Used by both ambient capture and active dictation demos.
 */

window.NovaMed = window.NovaMed || {};

NovaMed.Voice = (() => {

  function createWaveform(opts = {}) {
    const barCount = opts.bars || 5;
    const wrap = document.createElement('div');
    wrap.className = 'voice-waveform';
    if (opts.recording) wrap.classList.add('recording');
    for (let i = 0; i < barCount; i++) {
      const bar = document.createElement('div');
      bar.className = 'voice-bar';
      bar.style.animationDelay = `${i * 0.12}s`;
      wrap.appendChild(bar);
    }
    return wrap;
  }

  function createRecordingIndicator() {
    const wrap = document.createElement('div');
    wrap.className = 'voice-recording-indicator';
    wrap.innerHTML = `
      <div class="voice-rec-dot"></div>
      <span class="voice-rec-label">Recording</span>
      <span class="voice-rec-time">00:00</span>
    `;
    return wrap;
  }

  function createVoicePanel() {
    const panel = document.createElement('div');
    panel.className = 'voice-panel';
    panel.innerHTML = `
      <div class="voice-panel-header">
        <div class="voice-recording-indicator">
          <div class="voice-rec-dot"></div>
          <span class="voice-rec-label">Recording</span>
          <span class="voice-rec-time">00:00</span>
        </div>
      </div>
      <div class="voice-transcript"></div>
    `;
    return panel;
  }

  function startTimer(timerEl, startSeconds) {
    let sec = startSeconds || 0;
    const fmt = s => {
      const m = Math.floor(s / 60);
      const ss = s % 60;
      return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
    };
    timerEl.textContent = fmt(sec);
    const id = setInterval(() => {
      sec++;
      timerEl.textContent = fmt(sec);
    }, 1000);
    return id;
  }

  function stopTimer(timerId) {
    clearInterval(timerId);
  }

  function streamTranscript(el, text, charMs, onDone) {
    let i = 0;
    const id = setInterval(() => {
      if (i >= text.length) {
        clearInterval(id);
        if (onDone) onDone();
        return;
      }
      el.textContent += text[i];
      i++;
    }, charMs || 40);
    return id;
  }

  function setWaveformActive(waveEl, active) {
    waveEl.classList.toggle('active', active);
  }

  function createMicButton(opts = {}) {
    const btn = document.createElement('button');
    btn.className = 'voice-mic-btn' + (opts.active ? ' active' : '');
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>`;
    return btn;
  }

  return {
    createWaveform, createRecordingIndicator, createVoicePanel,
    startTimer, stopTimer, streamTranscript,
    setWaveformActive, createMicButton
  };
})();
