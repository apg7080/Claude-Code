/**
 * NovaMed Demo 3: AI-Generated Content
 * Scripted ~40s animation
 *
 * Story: AI synthesizes report sections (Summary, Recommendations) from
 * multiple inputs — findings, CAD images, and voice data. Each section
 * shows full source transparency. Physician edits retain AI attribution
 * on unchanged content.
 *
 * Round 2: right-side image via Images lib, fake cursor, verification state.
 */

(() => {
  /* ── Constants ── */

  const SUMMARY_TEXT = 'Two polyps found, one 8mm semi-pedunculated in the ascending colon and one hyperplastic in the sigmoid colon. Both removed with cold snare, en bloc. Both specimens sent to pathology.';
  const RECS_TEXT = 'Follow-up colonoscopy recommended in 3 years per ESGE guidelines. Histopathology results to be reviewed at next clinic appointment.';

  const DUR = 62000;

  /* Standardized durations */
  const T = {
    fast: 300,
    normal: 500,
    slow: 800,
    streamChar: 35,
    stagger: 120
  };

  /* Easing curves */
  const EASE_IN = 'cubicBezier(.39, .575, .565, 1)';
  const EASE_OUT = 'cubicBezier(.4, 0, .1, 1)';

  /* ── Helpers ── */

  const $ = id => document.getElementById(id);

  function showEl(el) {
    el.hidden = false;
    el.style.opacity = '';
    el.style.transform = '';
  }

  function hideEl(el) {
    el.hidden = true;
    el.style.opacity = '';
    el.style.transform = '';
  }

  /**
   * Stream text character by character into an element.
   * Prepends an AI badge before the text begins.
   * Returns the interval ID so it can be cancelled on reset.
   */
  function streamText(el, text, msPerChar, onDone) {
    const badge = NovaMed.AIIcon.createBadgeHTML('synthesis');
    el.innerHTML = badge + '<span class="cur"></span>';
    let i = 0;
    const cursor = el.querySelector('.cur');
    const iv = setInterval(() => {
      if (i < text.length) {
        cursor.insertAdjacentText('beforebegin', text[i]);
        i++;
      } else {
        clearInterval(iv);
        setTimeout(() => {
          if (cursor.parentNode) cursor.remove();
        }, 400);
        if (onDone) onDone();
      }
    }, msPerChar);
    return iv;
  }

  /**
   * Show shimmer loading lines inside an element.
   * Uses CSS classes instead of inline width styles.
   */
  function showShimmer(el) {
    el.innerHTML =
      '<div class="shimmer shimmer-line w-full"></div>' +
      '<div class="shimmer shimmer-line w-90"></div>' +
      '<div class="shimmer shimmer-line w-70"></div>';
  }

  /* ── Action Indicator ── */

  function showAction(targetEl, icon, text, variant) {
    const indicator = document.getElementById('actionIndicator');
    if (!indicator || !targetEl) return;
    const rect = targetEl.getBoundingClientRect();
    const protoRect = document.querySelector('.proto-ui').getBoundingClientRect();
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

  /* ── State tracking ── */

  let streamIv1 = null;
  let streamIv2 = null;
  let pendingTimeouts = [];

  /** Schedule a timeout that will be cancelled on reset */
  function later(fn, ms) {
    const id = setTimeout(fn, ms);
    pendingTimeouts.push(id);
    return id;
  }

  /* ── Reset ── */

  function reset() {
    // 1. Cancel all streaming intervals
    if (streamIv1) { clearInterval(streamIv1); streamIv1 = null; }
    if (streamIv2) { clearInterval(streamIv2); streamIv2 = null; }

    // 2. Cancel all pending local timeouts
    pendingTimeouts.forEach(clearTimeout);
    pendingTimeouts = [];

    // 3. Cancel all anime.js animations
    anime.remove('#editor');
    anime.remove('#chips1 .c, #chips2 .c');
    anime.remove('#summarySection');
    anime.remove('#recsSection');
    anime.remove('#summaryAIKey');
    anime.remove('#recsAIKey');
    anime.remove('#actionIndicator');

    // 4. Findings: visible, pre-populated (initial state)
    const editor = $('editor');
    editor.hidden = false;
    editor.style.opacity = '1';

    // Reset chip opacity/scale (anime may have left them mid-animation)
    document.querySelectorAll('#chips1 .c, #chips2 .c').forEach(c => {
      c.style.opacity = '';
      c.style.transform = '';
    });

    // 5. Remove dynamically added images from image slot
    const imageSlot = $('imageSlot1');
    if (imageSlot) imageSlot.innerHTML = '';

    // 6. Summary section: cleared and hidden
    const summSec = $('summarySection');
    hideEl(summSec);
    $('summaryText').innerHTML = '';

    // 7. Recommendations section: cleared and hidden
    const recsSec = $('recsSection');
    hideEl(recsSec);
    $('recsText').innerHTML = '';

    // 8. AI key buttons hidden
    $('summaryAIKey').classList.add('hidden');
    $('summaryAIKey').style.opacity = '';
    $('recsAIKey').classList.add('hidden');
    $('recsAIKey').style.opacity = '';

    // 9. Source panel closed
    $('sourcesPanel').classList.remove('open');

    // 10. Stats hidden
    $('statsFootnote').classList.remove('vis');

    // 11. Remove any edit highlights
    document.querySelectorAll('.edit-flash').forEach(el => {
      el.classList.remove('edit-flash', 'done');
    });

    // 12. Remove active state and verified state from sections
    $('summarySection').classList.remove('active');
    $('summarySection').classList.remove('verified');
    $('recsSection').classList.remove('verified');
    document.querySelectorAll('.finding.verified').forEach(f => f.classList.remove('verified'));

    // 13. Remove tooltips
    document.querySelectorAll('.ai-tooltip').forEach(t => t.remove());

    // 14. Hide action indicator
    hideAction();
    const actionInd = document.getElementById('actionIndicator');
    if (actionInd) { actionInd.style.left = ''; actionInd.style.top = ''; }

    // 15. Remove verified-ban elements
    document.querySelectorAll('.verified-ban').forEach(b => b.remove());

    // 16. Remove verify action buttons
    document.querySelectorAll('.verify-action-btn').forEach(b => b.remove());
  }

  /* ── Scene definitions ── */

  function buildScenes() {
    return [
      // =============================================
      // Scene 1 (0-7s): Show pre-populated findings
      // =============================================
      {
        time: 0,
        action: () => {
          NovaMed.Timeline.setCap('Report findings are complete \u2014 two polyps documented with structured data', 'clinical_notes', 'cap-icon-default');
          anime({
            targets: '#editor',
            opacity: [0.6, 1],
            duration: T.slow,
            easing: EASE_IN
          });
          anime({
            targets: '#chips1 .c, #chips2 .c',
            opacity: [0, 1],
            scale: [0.9, 1],
            delay: anime.stagger(T.stagger),
            duration: T.normal,
            easing: EASE_IN
          });
        }
      },

      // =============================================
      // Scene 2 (7-14s): AI image import on right side
      // =============================================
      {
        time: 7000,
        action: () => {
          NovaMed.Timeline.setCap('Endoscopy images attach directly to findings as additional AI input', 'add_photo_alternate', 'cap-icon-ai');
          const slot = $('imageSlot1');

          // Action indicator on image slot
          showAction(slot, 'add_photo_alternate', 'AI imports image', 'ai-action');

          later(() => {
            // Use the Images library to animate AI import
            NovaMed.Images.animateAIImport(slot, {
              source: 'ai',
              label: '2A',
              caption: 'Add A Caption'
            });
          }, 800);

          // Hide action indicator after image appears
          later(() => {
            hideAction();
          }, 4000);
        }
      },

      // =============================================
      // Scene 3 (14-20s): Summary section appears
      // =============================================
      {
        time: 14000,
        action: () => {
          NovaMed.Timeline.setCap('AI synthesizes a clinical summary from all available sources', 'auto_awesome', 'cap-icon-ai');
          const sec = $('summarySection');
          sec.hidden = false;
          sec.style.opacity = '0';
          anime({
            targets: sec,
            opacity: [0, 1],
            translateY: [16, 0],
            duration: T.slow,
            easing: EASE_IN
          });

          later(() => {
            sec.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, T.fast);
        }
      },

      // =============================================
      // Scene 4 (20-32s): Shimmer then stream summary
      // =============================================
      {
        time: 20000,
        action: () => {
          const summaryText = $('summaryText');
          showAction(summaryText, 'auto_awesome', 'AI generates summary', 'ai-action');
          showShimmer(summaryText);
        }
      },
      {
        time: 22500,
        action: () => {
          hideAction();
          streamIv1 = streamText($('summaryText'), SUMMARY_TEXT, T.streamChar, () => {
            const btn = $('summaryAIKey');
            btn.classList.remove('hidden');
            btn.style.opacity = '0';
            anime({
              targets: btn,
              opacity: [0, 1],
              duration: T.normal,
              easing: EASE_IN
            });
          });
        }
      },

      // =============================================
      // Scene 5 (32-38s): Recommendations generate
      // =============================================
      {
        time: 32000,
        action: () => {
          NovaMed.Timeline.setCap('Recommendations generate from the same inputs \u2014 more sources, higher confidence', 'auto_awesome', 'cap-icon-ai');
          const sec = $('recsSection');
          sec.hidden = false;
          sec.style.opacity = '0';
          anime({
            targets: sec,
            opacity: [0, 1],
            translateY: [16, 0],
            duration: T.slow,
            easing: EASE_IN
          });
          later(() => {
            sec.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, T.fast);

          showShimmer($('recsText'));
        }
      },
      {
        time: 34500,
        action: () => {
          streamIv2 = streamText($('recsText'), RECS_TEXT, T.streamChar, () => {
            const btn = $('recsAIKey');
            btn.classList.remove('hidden');
            btn.style.opacity = '0';
            anime({
              targets: btn,
              opacity: [0, 1],
              duration: T.normal,
              easing: EASE_IN
            });
          });
        }
      },

      // =============================================
      // Scene 5.5 (38-44s): Physician verifies AI content
      // =============================================
      {
        time: 38000,
        action: () => {
          NovaMed.Timeline.setCap('The physician reviews and approves AI-generated content', 'verified_user', 'cap-icon-physician');
          const summSec = $('summarySection');

          // 1. Action indicator appears — viewer sees intent
          showAction(summSec, 'verified_user', 'Physician approves', 'physician-action');

          // 2. Brief pause so viewer reads indicator, then verify button appears
          later(() => {
            // Create a verify button the physician "clicks"
            const verifyBtn = document.createElement('button');
            verifyBtn.className = 'verify-action-btn';
            verifyBtn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> Approve';
            summSec.querySelector('.section-header').appendChild(verifyBtn);

            anime({
              targets: verifyBtn,
              opacity: [0, 1],
              scale: [0.9, 1],
              duration: T.normal,
              easing: EASE_IN
            });
          }, 1000);

          // 3. Button gets "pressed" — then section becomes verified
          later(() => {
            const verifyBtn = summSec.querySelector('.verify-action-btn');
            if (verifyBtn) {
              verifyBtn.classList.add('pressed');
              anime({
                targets: verifyBtn,
                scale: [1, 0.95, 1],
                duration: T.normal,
                easing: EASE_OUT
              });
            }
          }, 2000);

          // 4. Section gets verified state (purple border)
          later(() => {
            summSec.classList.add('verified');
            const verifyBtn = summSec.querySelector('.verify-action-btn');
            if (verifyBtn) {
              anime({
                targets: verifyBtn,
                opacity: [1, 0],
                duration: T.normal,
                easing: EASE_OUT,
                complete: () => verifyBtn.remove()
              });
            }
            hideAction();
          }, 2800);

          // 5. Now do recommendations
          later(() => {
            const recsSec = $('recsSection');
            showAction(recsSec, 'verified_user', 'Physician approves', 'physician-action');

            later(() => {
              recsSec.classList.add('verified');
              hideAction();
            }, 1000);
          }, 3800);
        }
      },

      // =============================================
      // Scene 6 (44-52s): Source transparency
      // =============================================
      {
        time: 44000,
        action: () => {
          NovaMed.Timeline.setCap('Full source transparency \u2014 every AI contribution is traceable', 'visibility', 'cap-icon-ai');
          $('summarySection').scrollIntoView({ behavior: 'smooth', block: 'center' });

          const btn = $('summaryAIKey');

          // Action indicator on AI Key button
          showAction(btn, 'touch_app', 'View sources', 'active');

          later(() => {
            anime({
              targets: btn,
              scale: [1, 1.08, 1],
              duration: T.slow,
              easing: EASE_OUT
            });
          }, 400);

          later(() => {
            hideAction();
            $('sourcesPanel').classList.add('open');
          }, 1000);
        }
      },
      {
        time: 50000,
        action: () => {
          $('sourcesPanel').classList.remove('open');
        }
      },

      // =============================================
      // Scene 7 (52-58s): Physician edit
      // =============================================
      {
        time: 52000,
        action: () => {
          NovaMed.Timeline.setCap('Physician edits are preserved alongside AI attribution', 'edit', 'cap-icon-physician');
          $('summarySection').scrollIntoView({ behavior: 'smooth', block: 'center' });

          const textEl = $('summaryText');

          // Action indicator for physician edit
          showAction(textEl, 'edit', 'Physician edits', 'physician-action');

          later(() => {
            // Show active editing state
            $('summarySection').classList.add('active');

            // Simulate a cursor appearing briefly before the edit
            const current = textEl.innerHTML;
            const updated = current.replace(
              'Both removed',
              '<span class="edit-flash">All</span> removed'
            );
            textEl.innerHTML = updated;

            // Flash fades after a moment
            later(() => {
              const flash = textEl.querySelector('.edit-flash');
              if (flash) flash.classList.add('done');
            }, 1200);

            // Remove active state and hide action indicator
            later(() => {
              $('summarySection').classList.remove('active');
              hideAction();
            }, 1800);
          }, 500);
        }
      },

      // =============================================
      // End: Stats (58-62s)
      // =============================================
      {
        time: 58000,
        action: () => {
          $('statsFootnote').classList.add('vis');
        }
      }
    ];
  }

  /* ── Init ── */

  document.addEventListener('DOMContentLoaded', () => {
    NovaMed.Timeline.init({
      progEl: $('progressFill'),
      capEl: $('sceneCaption'),
      playEl: $('playOverlay')
    });
    NovaMed.AIIcon.initGlobalClose();

    // Close sources panel on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#summaryAIKey') && !e.target.closest('#sourcesPanel')) {
        $('sourcesPanel').classList.remove('open');
      }
    });

    $('playOverlay').addEventListener('click', () => {
      NovaMed.Timeline.run(buildScenes(), DUR, { onReset: reset });
    });

    $('replayBtn').addEventListener('click', () => {
      NovaMed.Timeline.stop();
      reset();
      setTimeout(() => {
        NovaMed.Timeline.run(buildScenes(), DUR, { onReset: reset });
      }, T.normal);
    });

    let paused = false;
    $('pauseBtn').addEventListener('click', (e) => {
      paused = !paused;
      if (paused) {
        NovaMed.Timeline.pause();
        e.target.textContent = 'Resume';
        e.target.classList.add('on');
      } else {
        NovaMed.Timeline.resume();
        e.target.textContent = 'Pause';
        e.target.classList.remove('on');
      }
    });
  });
})();
