/**
 * NovaMed Demo 1: Ambient Voice Capture
 * Scripted ~55s animation
 *
 * Story: Ambient mic captures physician narration during procedure.
 * After procedure ends, report compiles structured findings for review.
 *
 * Timing constants:
 *   FAST   = 300ms  (micro-interactions, badge removal)
 *   NORMAL = 500ms  (panel transitions, element reveals)
 *   SLOW   = 800ms  (major state changes like editor appearing)
 *   STAGGER = 120ms (per-item delay)
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

  // Timing constants
  const FAST   = 300;
  const NORMAL = 500;
  const SLOW   = 800;
  const STAGGER = 120;

  // Helpers
  const $ = id => {
    const el = document.getElementById(id);
    if (!el) console.warn(`[scenes.js] Element #${id} not found`);
    return el;
  };

  const hide = el => { if (el) el.classList.add('hidden'); };
  const show = el => { if (el) el.classList.remove('hidden'); };

  const esc = s => NovaMed.Chips.esc(s);

  // Action indicator helpers
  function showAction(targetEl, icon, text, variant) {
    const indicator = document.getElementById('actionIndicator');
    if (!indicator || !targetEl) return;
    const rect = targetEl.getBoundingClientRect();
    const protoRect = document.querySelector('.proto-ui').getBoundingClientRect();
    // Position above the target element, centered horizontally
    indicator.style.left = (rect.left - protoRect.left + rect.width / 2 - 60) + 'px';
    indicator.style.top = (rect.top - protoRect.top - 36) + 'px';
    indicator.innerHTML = '<span class="material-symbols-outlined">' + icon + '</span>' + text;
    indicator.className = 'action-indicator visible' + (variant ? ' ' + variant : '');
  }

  function hideAction() {
    const indicator = document.getElementById('actionIndicator');
    if (indicator) {
      indicator.classList.remove('visible');
    }
  }

  // Use shared chip builders from novamed-core/chips.js
  function buildAIChipText(text, terms) {
    return NovaMed.Chips.buildAIChipsFromText(text, terms, 'voice');
  }

  function buildPlainChipText(text, terms) {
    return NovaMed.Chips.buildChipsFromText(text, terms);
  }

  let timerId = null;

  function reset() {
    // Hide all major panels
    hide($('voicePanel'));
    hide($('processingState'));
    hide($('editor'));

    // Hide action indicator
    hideAction();

    // Clear transcript
    const transcript = $('transcript');
    if (transcript) transcript.textContent = '';

    // Reset stats visibility
    const stats = $('statsFootnote');
    if (stats) stats.classList.remove('vis');

    // Reset finding 1
    const f1 = $('finding1');
    if (f1) f1.classList.remove('active', 'review');
    const rb1 = $('reviewBanner1');
    if (rb1) rb1.classList.remove('vis');
    const ft1 = $('findingText1');
    if (ft1) ft1.innerHTML = '';

    // Reset finding 2
    const f2 = $('finding2');
    if (f2) {
      f2.classList.remove('active', 'review');
      f2.classList.add('hidden');
    }
    const rb2 = $('reviewBanner2');
    if (rb2) rb2.classList.remove('vis');
    const ft2 = $('findingText2');
    if (ft2) ft2.innerHTML = '';

    // Reset recording time
    const recTime = $('recTime');
    if (recTime) recTime.textContent = '03:42';

    // Restore waveform active state for next play
    const waveform = $('waveform');
    if (waveform) waveform.classList.add('active');

    // Clear any inline opacity/transform left by anime
    const voicePanel = $('voicePanel');
    if (voicePanel) { voicePanel.style.opacity = ''; voicePanel.style.transform = ''; }
    const processingState = $('processingState');
    if (processingState) { processingState.style.opacity = ''; processingState.style.transform = ''; }
    const editor = $('editor');
    if (editor) { editor.style.opacity = ''; editor.style.transform = ''; }
    if (f2) { f2.style.opacity = ''; f2.style.transform = ''; }

    // Remove any tooltips (including suggestion tooltips)
    document.querySelectorAll('.ai-tooltip').forEach(t => t.remove());
    document.querySelectorAll('.suggestion-tooltip').forEach(t => t.remove());

    // Remove chip highlights
    document.querySelectorAll('.chip-highlight').forEach(c => {
      c.classList.remove('chip-highlight', 'confirmed');
    });

    // Remove any leftover outline styles on AI badges
    document.querySelectorAll('.ai-badge').forEach(b => {
      b.style.outline = '';
      b.style.outlineOffset = '';
      b.style.position = '';
    });

    // Clear timer
    if (timerId) { clearInterval(timerId); timerId = null; }

    // Reset pause button state
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
      // Scene 1: Voice recording (0-10s)
      {
        time: 0,
        caption: () => NovaMed.Timeline.setCap('Ambient microphone captures the physician\u2019s narration during the procedure', 'mic', 'cap-icon-default'),
        action: () => {
          const panel = $('voicePanel');
          show(panel);
          anime({
            targets: panel,
            opacity: [0, 1],
            translateY: [8, 0],
            duration: NORMAL,
            easing: 'cubicBezier(.39, .575, .565, 1)'
          });
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
        time: 1000,
        action: () => {
          const el = $('transcript');
          if (el) NovaMed.Voice.streamTranscript(el, TRANSCRIPT_TEXT, 45);
        }
      },

      // Scene 2: Processing (10-14s)
      {
        time: 10000,
        caption: () => NovaMed.Timeline.setCap('Voice recording is compiled into structured clinical data', 'auto_awesome', 'cap-icon-ai'),
        action: () => {
          if (timerId) { clearInterval(timerId); timerId = null; }
          // Stop waveform
          const wf = $('waveform');
          if (wf) wf.classList.remove('active');
          // Fade out voice panel, pause, then show processing
          const vp = $('voicePanel');
          anime({
            targets: vp,
            opacity: 0,
            duration: NORMAL,
            easing: 'cubicBezier(.4, 0, .1, 1)',
            complete: () => {
              hide(vp);
              setTimeout(() => {
                const ps = $('processingState');
                show(ps);
                anime({
                  targets: ps,
                  opacity: [0, 1],
                  duration: NORMAL,
                  easing: 'cubicBezier(.39, .575, .565, 1)'
                });
              }, FAST); // 200ms pause between hide and show
            }
          });
        }
      },

      // Scene 3: Report populates (14-28s)
      {
        time: 14000,
        caption: () => NovaMed.Timeline.setCap('Findings populate automatically \u2014 each term classified by AI', 'clinical_notes', 'cap-icon-ai'),
        action: () => {
          const ps = $('processingState');
          // Fade out processing, pause, then show editor
          anime({
            targets: ps,
            opacity: 0,
            duration: NORMAL,
            easing: 'cubicBezier(.4, 0, .1, 1)',
            complete: () => {
              hide(ps);
              setTimeout(() => {
                const ed = $('editor');
                show(ed);
                anime({
                  targets: ed,
                  opacity: [0, 1],
                  translateY: [12, 0],
                  duration: SLOW,
                  easing: 'cubicBezier(.39, .575, .565, 1)'
                });
              }, FAST); // 200ms pause between hide and show
            }
          });
        }
      },
      {
        time: 16000,
        action: () => {
          // Populate finding 1 with AI chips
          const f1 = $('finding1');
          const ft1 = $('findingText1');
          if (f1) f1.classList.add('active');
          if (ft1) ft1.innerHTML = buildAIChipText(FINDING1_TEXT, FINDING1_TERMS);
          anime({
            targets: '#findingText1 .c',
            opacity: [0, 1],
            scale: [0.85, 1],
            delay: anime.stagger(STAGGER),
            duration: NORMAL,
            easing: 'cubicBezier(.39, .575, .565, 1)'
          });
        }
      },
      {
        time: 21000,
        action: () => {
          // Show finding 2
          const f2 = $('finding2');
          const ft2 = $('findingText2');
          if (f2) {
            show(f2);
            f2.classList.add('active');
          }
          if (ft2) ft2.innerHTML = buildAIChipText(FINDING2_TEXT, FINDING2_TERMS);
          anime({
            targets: f2,
            opacity: [0, 1],
            translateY: [6, 0],
            duration: NORMAL,
            easing: 'cubicBezier(.39, .575, .565, 1)'
          });
          anime({
            targets: '#findingText2 .c',
            opacity: [0, 1],
            scale: [0.85, 1],
            delay: anime.stagger(STAGGER, { start: FAST }),
            duration: NORMAL,
            easing: 'cubicBezier(.39, .575, .565, 1)'
          });
        }
      },

      // Scene 4: Source attribution (28-36s) — action indicator on AI badge
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

            // Highlight the badge
            badge.style.outline = '2px solid var(--accent)';
            badge.style.outlineOffset = '2px';
            badge.style.borderRadius = '3px';

            setTimeout(() => {
              hideAction();

              // Position tooltip in .proto-ui to avoid overflow clipping
              const protoUI = document.querySelector('.proto-ui');
              const badgeRect = badge.getBoundingClientRect();
              const protoRect = protoUI.getBoundingClientRect();

              const tooltip = document.createElement('div');
              tooltip.className = 'ai-tooltip open';
              tooltip.style.position = 'absolute';
              tooltip.style.left = (badgeRect.left - protoRect.left) + 'px';
              tooltip.style.top = (badgeRect.bottom - protoRect.top + 6) + 'px';
              tooltip.style.zIndex = '10001';
              tooltip.innerHTML = `
                <div class="ai-tooltip-source">Source: EndoVoice Scribe</div>
                <div class="ai-tooltip-text">${NovaMed.AIIcon.DISCLAIMER}</div>
              `;
              protoUI.appendChild(tooltip);
            }, 1000);
          }
        }
      },
      {
        time: 34000,
        action: () => {
          // Close tooltip
          document.querySelectorAll('.ai-tooltip').forEach(t => {
            anime({
              targets: t,
              opacity: 0,
              duration: NORMAL,
              easing: 'cubicBezier(.4, 0, .1, 1)',
              complete: () => t.remove()
            });
          });
          // Remove outline
          const ft1 = $('findingText1');
          if (ft1) {
            const badges = ft1.querySelectorAll('.ai-badge');
            if (badges[0]) {
              badges[0].style.outline = '';
              badges[0].style.outlineOffset = '';
            }
          }
        }
      },

      // Scene 5: Physician reviews (36-48s) — AI suggestion + physician accept + review
      {
        time: 36000,
        caption: () => NovaMed.Timeline.setCap('AI suggests a correction \u2014 the physician decides whether to accept', 'auto_awesome', 'cap-icon-ai'),
      },
      {
        time: 37500,
        action: () => {
          // AI suggestion flow for the severity chip ("mild" → "moderate")
          const ft1 = $('findingText1');
          if (!ft1) return;
          const badges = ft1.querySelectorAll('.ai-badge');
          const targetBadge = badges[3]; // mild is 4th badge (index 3): 5mm=0, sessile=1, polyp=2, mild=3
          if (!targetBadge) return;
          const parentChip = targetBadge.nextElementSibling; // the .c.fill chip next to the badge

          // Step 1: Action indicator — "AI suggests correction"
          showAction(targetBadge, 'auto_awesome', 'AI suggests correction', 'ai-action');

          // Step 2: Amber highlight on the chip to draw attention
          setTimeout(() => {
            if (parentChip) {
              parentChip.classList.add('chip-highlight');
            }
          }, 600);

          // Step 3: Suggestion tooltip — positioned in .proto-ui to avoid overflow clipping
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
            tooltip.innerHTML = `
              <div class="suggestion-label">Suggested: <strong>moderate</strong></div>
              <div class="suggestion-actions">
                <button class="suggestion-btn accept">Accept</button>
                <button class="suggestion-btn dismiss">Dismiss</button>
              </div>
            `;
            protoUI.appendChild(tooltip);

            // Trigger show transition
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                tooltip.classList.add('show');
              });
            });
          }, 1500);

          // Step 4: Physician "accepts" the suggestion after reading it
          setTimeout(() => {
            if (!parentChip) return;

            // Highlight the Accept button briefly before clicking
            const tooltip = document.querySelector('.suggestion-tooltip');
            if (tooltip) {
              const acceptBtn = tooltip.querySelector('.suggestion-btn.accept');
              if (acceptBtn) {
                acceptBtn.style.transform = 'scale(0.95)';
                setTimeout(() => { if (acceptBtn) acceptBtn.style.transform = ''; }, 200);
              }
            }

            // Change chip text to "moderate"
            const textNode = parentChip.childNodes[0];
            if (textNode && textNode.nodeType === Node.TEXT_NODE) {
              textNode.textContent = 'moderate ';
            }

            // Update highlight to confirmed (blue)
            parentChip.classList.add('confirmed');

            // Flash the AI badge briefly to show it's still AI-assisted
            if (targetBadge) {
              targetBadge.classList.add('flash-yellow');
              anime({
                targets: targetBadge,
                scale: [1, 1.15, 1],
                duration: NORMAL,
                easing: 'cubicBezier(.4, 0, .1, 1)'
              });
            }

            // Fade out the suggestion tooltip
            setTimeout(() => {
              if (tooltip) {
                tooltip.classList.remove('show');
                setTimeout(() => tooltip.remove(), 500);
              }
              // Remove chip highlight
              if (parentChip) {
                parentChip.classList.remove('chip-highlight', 'confirmed');
              }
            }, 600);
          }, 3200);
        }
      },
      {
        time: 41000,
        caption: () => NovaMed.Timeline.setCap('The physician approves each finding \u2014 AI assists, but the doctor is the final authority', 'verified_user', 'cap-icon-physician'),
        action: () => {
          // Confirm finding 1 — review state
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
          // Confirm finding 2
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
        action: () => {
          const stats = $('statsFootnote');
          if (stats) stats.classList.add('vis');
        }
      }
    ];
  }

  // Preview: show last-frame state (reviewed findings + stats)
  function showPreviewState() {
    reset();
    // Show editor with both findings in review state
    const ed = $('editor');
    show(ed);
    ed.style.opacity = '1';

    const f1 = $('finding1');
    const ft1 = $('findingText1');
    if (f1) { f1.classList.add('review'); }
    if (ft1) ft1.innerHTML = buildPlainChipText(FINDING1_TEXT, FINDING1_TERMS);

    const f2 = $('finding2');
    const ft2 = $('findingText2');
    if (f2) { show(f2); f2.classList.add('review'); f2.style.opacity = '1'; }
    if (ft2) ft2.innerHTML = buildPlainChipText(FINDING2_TEXT, FINDING2_TERMS);

    const rb1 = $('reviewBanner1');
    const rb2 = $('reviewBanner2');
    if (rb1) rb1.classList.add('vis');
    if (rb2) rb2.classList.add('vis');

    const stats = $('statsFootnote');
    if (stats) stats.classList.add('vis');
  }

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    NovaMed.Timeline.init({
      progEl: $('progressFill'),
      capEl: $('sceneCaption'),
      playEl: $('playOverlay')
    });
    NovaMed.AIIcon.initGlobalClose();

    // Set initial preview state
    NovaMed.Timeline.setPreview(showPreviewState);

    const playOverlay = $('playOverlay');
    if (playOverlay) {
      playOverlay.addEventListener('click', () => {
        NovaMed.Timeline.run(buildScenes(), DUR, { onReset: reset });
      });
    }

    const replayBtn = $('replayBtn');
    if (replayBtn) {
      replayBtn.addEventListener('click', () => {
        NovaMed.Timeline.stop();
        reset();
        setTimeout(() => {
          NovaMed.Timeline.run(buildScenes(), DUR, { onReset: reset });
        }, NORMAL);
      });
    }

    let paused = false;
    const pauseBtn = $('pauseBtn');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        paused = !paused;
        const icon = pauseBtn.querySelector('.material-symbols-outlined');
        if (paused) {
          NovaMed.Timeline.pause();
          if (icon) icon.textContent = 'play_arrow';
          pauseBtn.title = 'Resume';
          pauseBtn.classList.add('on');
        } else {
          NovaMed.Timeline.resume();
          if (icon) icon.textContent = 'pause';
          pauseBtn.title = 'Pause';
          pauseBtn.classList.remove('on');
        }
      });
    }
  });
})();
