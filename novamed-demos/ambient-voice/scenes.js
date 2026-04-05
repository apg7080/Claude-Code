/**
 * NovaMed Demo 1: Ambient Voice Capture
 * Scripted ~55s animation
 *
 * Rebuilt to use same editor components as active-dictation/ai-content.
 * Voice recording happens inside the editor card, not a separate panel.
 */

(() => {
  const TRANSCRIPT_TEXT = 'Examining the ascending colon... identified a 5mm sessile polyp with mild erythema at the ascending colon. Removed with cold snare, en bloc. Specimen retrieved and placed in container one.';

  const FINDING1_TERMS = [
    { term: 'ascending colon', category: 'anatomy', label: 'Location', confidence: 97 },
    { term: '5mm', category: 'size', label: 'Size', confidence: 99 },
    { term: 'sessile', category: 'morphology', label: 'Morphology', confidence: 91 },
    { term: 'polyp', category: 'finding', label: 'Finding', confidence: 94 },
    { term: 'mild', category: 'severity', label: 'Severity', confidence: 87 },
    { term: 'erythema', category: 'tissue', label: 'Tissue Quality', confidence: 89 },
    { term: 'cold snare', category: 'equipment', label: 'Equipment', confidence: 96 },
    { term: 'en bloc', category: 'action', label: 'Action', confidence: 93 }
  ];

  const FINDING1_TEXT = '5mm sessile polyp with mild erythema at the ascending colon. Removed with cold snare, en bloc. Specimen retrieved and placed in container 1.';

  const FINDING2_TEXT = 'Two 3mm hyperplastic polyps noted in the sigmoid colon. No biopsy taken. No intervention required.';
  const FINDING2_TERMS = [
    { term: '3mm', category: 'size', label: 'Size', confidence: 99 },
    { term: 'hyperplastic', category: 'pathology', label: 'Pathology', confidence: 88 },
    { term: 'sigmoid colon', category: 'anatomy', label: 'Location', confidence: 96 },
    { term: 'biopsy', category: 'action', label: 'Action', confidence: 93 }
  ];

  const DUR = 55000;
  const FAST = 300, NORMAL = 500, SLOW = 800, STAGGER = 120;
  const EASE_IN = 'cubicBezier(.39, .575, .565, 1)';
  const EASE_OUT = 'cubicBezier(.4, 0, .1, 1)';

  const $ = id => document.getElementById(id);
  const hide = el => { if (el) el.classList.add('hidden'); };
  const show = el => { if (el) el.classList.remove('hidden'); };
  const esc = s => NovaMed.Chips.esc(s);

  function buildAIChipText(text, terms) {
    return NovaMed.Chips.buildAIChipsFromText(text, terms, 'voice');
  }
  function buildPlainChipText(text, terms) {
    return NovaMed.Chips.buildChipsFromText(text, terms);
  }

  // Action indicator helpers
  function showAction(targetEl, icon, text, variant) {
    const indicator = $('actionIndicator');
    if (!indicator || !targetEl) return;
    const rect = targetEl.getBoundingClientRect();
    const protoRect = document.querySelector('.proto-ui').getBoundingClientRect();
    indicator.style.left = (rect.left - protoRect.left + rect.width / 2 - 60) + 'px';
    indicator.style.top = (rect.top - protoRect.top - 36) + 'px';
    indicator.innerHTML = '<span class="material-symbols-outlined">' + icon + '</span>' + text;
    indicator.className = 'action-indicator visible' + (variant ? ' ' + variant : '');
  }
  function hideAction() {
    const indicator = $('actionIndicator');
    if (indicator) indicator.classList.remove('visible');
  }

  let timerId = null;

  function reset() {
    hideAction();

    // Voice header — back to recording state
    const micBtn = $('micBtn');
    if (micBtn) micBtn.classList.add('active');
    const wf = $('waveform');
    if (wf) { wf.classList.remove('active'); }
    const vs = $('voiceStatus');
    if (vs) { vs.textContent = 'Ambient recording'; vs.classList.remove('active'); }
    const recTime = $('recTime');
    if (recTime) recTime.textContent = '03:42';

    // Show voice header + transcript, hide processing + findings
    show($('voiceHeader'));
    const ta = $('transcriptArea');
    if (ta) { show(ta); ta.classList.remove('recording'); ta.style.opacity = ''; }
    const tp = $('transcriptPlaceholder');
    if (tp) show(tp);
    const transcript = $('transcript');
    if (transcript) transcript.textContent = '';

    hide($('processingState'));

    // Findings
    const f1 = $('finding1');
    if (f1) { hide(f1); f1.classList.remove('active', 'review'); f1.style.opacity = ''; f1.style.transform = ''; }
    const rb1 = $('reviewBanner1');
    if (rb1) rb1.classList.remove('vis');
    const ft1 = $('findingText1');
    if (ft1) ft1.innerHTML = '';

    const f2 = $('finding2');
    if (f2) { hide(f2); f2.classList.remove('active', 'review'); f2.style.opacity = ''; f2.style.transform = ''; }
    const rb2 = $('reviewBanner2');
    if (rb2) rb2.classList.remove('vis');
    const ft2 = $('findingText2');
    if (ft2) ft2.innerHTML = '';

    // Stats
    const stats = $('statsFootnote');
    if (stats) stats.classList.remove('vis');

    // Clean up tooltips/highlights
    document.querySelectorAll('.ai-tooltip').forEach(t => t.remove());
    document.querySelectorAll('.suggestion-tooltip').forEach(t => t.remove());
    document.querySelectorAll('.chip-highlight').forEach(c => c.classList.remove('chip-highlight', 'confirmed'));
    document.querySelectorAll('.ai-badge').forEach(b => { b.style.outline = ''; b.style.outlineOffset = ''; });

    if (timerId) { clearInterval(timerId); timerId = null; }

    // Pause button
    const pauseBtn = $('pauseBtn');
    if (pauseBtn) {
      const icon = pauseBtn.querySelector('.material-symbols-outlined');
      if (icon) icon.textContent = 'pause';
      pauseBtn.title = 'Pause';
      pauseBtn.classList.remove('on');
    }
  }

  function buildScenes() {
    return [
      // Scene 1: Voice recording active (0-10s)
      {
        time: 0,
        caption: () => NovaMed.Timeline.setCap('Ambient microphone captures the physician\u2019s narration during the procedure', 'mic', 'cap-icon-default'),
        action: () => {
          // Activate waveform
          const wf = $('waveform');
          if (wf) wf.classList.add('active');
          const vs = $('voiceStatus');
          if (vs) { vs.textContent = 'Recording...'; vs.classList.add('active'); }
          const ta = $('transcriptArea');
          if (ta) ta.classList.add('recording');

          // Start timer from 3:42
          let sec = 222;
          timerId = setInterval(() => {
            sec++;
            const m = Math.floor(sec / 60);
            const s = sec % 60;
            const el = $('recTime');
            if (el) el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
          }, 1000);
        }
      },
      {
        time: 800,
        action: () => {
          // Hide placeholder, start streaming transcript
          hide($('transcriptPlaceholder'));
          const el = $('transcript');
          if (el) NovaMed.Voice.streamTranscript(el, TRANSCRIPT_TEXT, 45);
        }
      },

      // Scene 2: Recording ends, processing (10-14s)
      {
        time: 10000,
        caption: () => NovaMed.Timeline.setCap('Voice recording is compiled into structured clinical data', 'auto_awesome', 'cap-icon-ai'),
        action: () => {
          if (timerId) { clearInterval(timerId); timerId = null; }
          // Stop waveform
          const wf = $('waveform');
          if (wf) wf.classList.remove('active');
          const vs = $('voiceStatus');
          if (vs) { vs.textContent = 'Processing...'; }

          // Fade out transcript, show processing
          const ta = $('transcriptArea');
          anime({
            targets: ta,
            opacity: 0,
            duration: NORMAL,
            easing: EASE_OUT,
            complete: () => {
              hide(ta);
              hide($('voiceHeader'));
              const ps = $('processingState');
              show(ps);
              anime({ targets: ps, opacity: [0, 1], duration: NORMAL, easing: EASE_IN });
            }
          });
        }
      },

      // Scene 3: Report populates (14-28s)
      {
        time: 14000,
        caption: () => NovaMed.Timeline.setCap('Findings populate automatically \u2014 each term classified by AI', 'clinical_notes', 'cap-icon-ai'),
        action: () => {
          // Fade out processing, show findings
          const ps = $('processingState');
          anime({
            targets: ps,
            opacity: 0,
            duration: NORMAL,
            easing: EASE_OUT,
            complete: () => {
              hide(ps);
              // Show finding 1
              const f1 = $('finding1');
              show(f1);
              f1.classList.add('active');
              anime({ targets: f1, opacity: [0, 1], translateY: [8, 0], duration: SLOW, easing: EASE_IN });
            }
          });
        }
      },
      {
        time: 16000,
        action: () => {
          // Populate finding 1 with AI chips
          const ft1 = $('findingText1');
          if (ft1) ft1.innerHTML = buildAIChipText(FINDING1_TEXT, FINDING1_TERMS);
          anime({
            targets: '#findingText1 .c',
            opacity: [0, 1], scale: [0.85, 1],
            delay: anime.stagger(STAGGER),
            duration: NORMAL, easing: EASE_IN
          });
        }
      },
      {
        time: 21000,
        action: () => {
          // Show finding 2
          const f2 = $('finding2');
          show(f2);
          f2.classList.add('active');
          const ft2 = $('findingText2');
          if (ft2) ft2.innerHTML = buildAIChipText(FINDING2_TEXT, FINDING2_TERMS);
          anime({ targets: f2, opacity: [0, 1], translateY: [6, 0], duration: NORMAL, easing: EASE_IN });
          anime({
            targets: '#findingText2 .c',
            opacity: [0, 1], scale: [0.85, 1],
            delay: anime.stagger(STAGGER, { start: FAST }),
            duration: NORMAL, easing: EASE_IN
          });
        }
      },

      // Scene 4: Source attribution (28-36s)
      {
        time: 28000,
        caption: () => NovaMed.Timeline.setCap('Every AI-populated field shows its source', 'info', 'cap-icon-ai'),
        action: () => {
          const ft1 = $('findingText1');
          if (!ft1) return;
          const badges = ft1.querySelectorAll('.ai-badge');
          if (badges.length > 0) {
            const badge = badges[0];
            showAction(badge, 'touch_app', 'View AI source', 'ai-action');
            badge.style.outline = '2px solid var(--accent)';
            badge.style.outlineOffset = '2px';

            setTimeout(() => {
              hideAction();
              const protoUI = document.querySelector('.proto-ui');
              const badgeRect = badge.getBoundingClientRect();
              const protoRect = protoUI.getBoundingClientRect();
              const tooltip = document.createElement('div');
              tooltip.className = 'ai-tooltip open';
              tooltip.style.position = 'absolute';
              tooltip.style.left = (badgeRect.left - protoRect.left) + 'px';
              tooltip.style.top = (badgeRect.bottom - protoRect.top + 6) + 'px';
              tooltip.style.zIndex = '10001';
              tooltip.innerHTML = '<div class="ai-tooltip-source">Source: EndoVoice Scribe</div><div class="ai-tooltip-text">' + NovaMed.AIIcon.DISCLAIMER + '</div>';
              protoUI.appendChild(tooltip);
            }, 1000);
          }
        }
      },
      {
        time: 34000,
        action: () => {
          document.querySelectorAll('.ai-tooltip').forEach(t => {
            anime({ targets: t, opacity: 0, duration: NORMAL, easing: EASE_OUT, complete: () => t.remove() });
          });
          const ft1 = $('findingText1');
          if (ft1) ft1.querySelectorAll('.ai-badge').forEach(b => { b.style.outline = ''; b.style.outlineOffset = ''; });
        }
      },

      // Scene 5: AI suggestion + physician accept (36-48s)
      {
        time: 36000,
        caption: () => NovaMed.Timeline.setCap('AI suggests a correction \u2014 the physician decides whether to accept', 'auto_awesome', 'cap-icon-ai'),
      },
      {
        time: 37500,
        action: () => {
          const ft1 = $('findingText1');
          if (!ft1) return;
          const badges = ft1.querySelectorAll('.ai-badge');
          const targetBadge = badges[3];
          if (!targetBadge) return;
          const parentChip = targetBadge.nextElementSibling;

          showAction(targetBadge, 'auto_awesome', 'AI suggests correction', 'ai-action');
          setTimeout(() => { if (parentChip) parentChip.classList.add('chip-highlight'); }, 600);

          setTimeout(() => {
            hideAction();
            if (!parentChip) return;
            const protoUI = document.querySelector('.proto-ui');
            const chipRect = parentChip.getBoundingClientRect();
            const protoRect = protoUI.getBoundingClientRect();
            const tooltip = document.createElement('div');
            tooltip.className = 'suggestion-tooltip';
            tooltip.style.left = (chipRect.left - protoRect.left) + 'px';
            tooltip.style.top = (chipRect.bottom - protoRect.top + 6) + 'px';
            tooltip.innerHTML = '<div class="suggestion-label">Suggested: <strong>moderate</strong></div><div class="suggestion-actions"><button class="suggestion-btn accept">Accept</button><button class="suggestion-btn dismiss">Dismiss</button></div>';
            protoUI.appendChild(tooltip);
            requestAnimationFrame(() => requestAnimationFrame(() => tooltip.classList.add('show')));
          }, 1500);

          setTimeout(() => {
            if (!parentChip) return;
            const tooltip = document.querySelector('.suggestion-tooltip');
            if (tooltip) {
              const acceptBtn = tooltip.querySelector('.suggestion-btn.accept');
              if (acceptBtn) { acceptBtn.style.transform = 'scale(0.95)'; setTimeout(() => { if (acceptBtn) acceptBtn.style.transform = ''; }, 200); }
            }
            const textNode = parentChip.childNodes[0];
            if (textNode && textNode.nodeType === Node.TEXT_NODE) textNode.textContent = 'moderate ';
            parentChip.classList.add('confirmed');
            if (targetBadge) { targetBadge.classList.add('flash-yellow'); anime({ targets: targetBadge, scale: [1, 1.15, 1], duration: NORMAL, easing: EASE_OUT }); }
            setTimeout(() => {
              if (tooltip) { tooltip.classList.remove('show'); setTimeout(() => tooltip.remove(), 500); }
              if (parentChip) parentChip.classList.remove('chip-highlight', 'confirmed');
            }, 600);
          }, 3200);
        }
      },
      {
        time: 41000,
        caption: () => NovaMed.Timeline.setCap('The physician approves each finding \u2014 AI assists, but the doctor is the final authority', 'verified_user', 'cap-icon-physician'),
        action: () => {
          const f1 = $('finding1');
          const rb1 = $('reviewBanner1');
          showAction(f1, 'verified_user', 'Physician approves', 'physician-action');
          if (f1) { f1.classList.remove('active'); f1.classList.add('review'); }
          if (rb1) rb1.classList.add('vis');
        }
      },
      {
        time: 44000,
        action: () => {
          hideAction();
          const f2 = $('finding2');
          const rb2 = $('reviewBanner2');
          showAction(f2, 'verified_user', 'Physician approves', 'physician-action');
          if (f2) { f2.classList.remove('active'); f2.classList.add('review'); }
          if (rb2) rb2.classList.add('vis');
          setTimeout(() => hideAction(), 1500);
        }
      },

      // Scene 6: Stats (48-55s)
      {
        time: 48000,
        caption: () => NovaMed.Timeline.setCap('A structured report, documented in seconds', 'timer', 'cap-icon-default'),
        action: () => { $('statsFootnote').classList.add('vis'); }
      }
    ];
  }

  // Preview: last-frame state
  function showPreviewState() {
    reset();
    hide($('voiceHeader'));
    hide($('transcriptArea'));

    const f1 = $('finding1');
    const ft1 = $('findingText1');
    show(f1); f1.classList.add('review'); f1.style.opacity = '1';
    if (ft1) ft1.innerHTML = buildPlainChipText(FINDING1_TEXT, FINDING1_TERMS);

    const f2 = $('finding2');
    const ft2 = $('findingText2');
    show(f2); f2.classList.add('review'); f2.style.opacity = '1';
    if (ft2) ft2.innerHTML = buildPlainChipText(FINDING2_TEXT, FINDING2_TERMS);

    $('reviewBanner1').classList.add('vis');
    $('reviewBanner2').classList.add('vis');
    $('statsFootnote').classList.add('vis');
  }

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    NovaMed.Timeline.init({
      progEl: $('progressFill'),
      capEl: $('sceneCaption'),
      playEl: $('playOverlay')
    });
    NovaMed.AIIcon.initGlobalClose();
    NovaMed.Timeline.setPreview(showPreviewState);

    $('playOverlay').addEventListener('click', () => {
      NovaMed.Timeline.run(buildScenes(), DUR, { onReset: reset });
    });

    $('replayBtn').addEventListener('click', () => {
      NovaMed.Timeline.stop();
      reset();
      setTimeout(() => NovaMed.Timeline.run(buildScenes(), DUR, { onReset: reset }), NORMAL);
    });

    let paused = false;
    const pauseBtn = $('pauseBtn');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        paused = !paused;
        const icon = pauseBtn.querySelector('.material-symbols-outlined');
        if (paused) {
          NovaMed.Timeline.pause();
          if (icon) icon.textContent = 'play_arrow';
          pauseBtn.title = 'Resume'; pauseBtn.classList.add('on');
        } else {
          NovaMed.Timeline.resume();
          if (icon) icon.textContent = 'pause';
          pauseBtn.title = 'Pause'; pauseBtn.classList.remove('on');
        }
      });
    }
  });
})();
