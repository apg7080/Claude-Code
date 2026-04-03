/**
 * NovaMed Demo 2: Active Dictation
 * Scripted ~48s animation
 *
 * Story: Post-procedure, physician uses voice to fill report fields
 * hands-free. Tab advances focus between fields. Voice and manual
 * input work together — complementary, not exclusive.
 *
 * Timing constants:
 *   Fast:    300ms  (micro-interactions)
 *   Normal:  500ms  (panel transitions)
 *   Slow:    800ms  (major reveals)
 *   Stagger: 120ms  per item
 */

(() => {
  const NARRATIVE_TEXT = 'Colonic mucosa was carefully examined using NBI. Polyp found in the ascending colon, approximately 5mm in size. Possibly traditional serrated adenoma, Paris classification 0-IIa.';

  const DUR = 48000;

  /* Standardized durations */
  const T_FAST   = 300;
  const T_NORMAL = 500;
  const T_SLOW   = 800;
  const T_STAGGER = 120;

  // Helpers
  const $ = id => document.getElementById(id);
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const EMPTY_CHIP = (label) =>
    `<span class="nm-field-value"><span class="c empty">${label} <span class="c-arr">&#9662;</span><span class="c-sep"></span><span class="c-x">&times;</span></span></span>`;

  let streamId = null;

  // ── Action indicator helpers ────────────────────────────

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

  // ── Reset ──────────────────────────────────────────────

  function reset() {
    // Mic button + waveform
    $('micBtn').classList.remove('active');
    $('waveform').classList.remove('active');
    $('voiceStatus').textContent = 'Voice input off';
    $('voiceStatus').classList.remove('active');

    // Fields — restore to empty chips
    ['locationField', 'sizeField', 'morphField'].forEach(id => {
      $(id).classList.remove('focused', 'ai-populated');
    });
    $('locationField').querySelector('.nm-field-input').innerHTML = EMPTY_CHIP('Location');
    $('sizeField').querySelector('.nm-field-input').innerHTML = EMPTY_CHIP('Size (mm)');
    $('morphField').querySelector('.nm-field-input').innerHTML = EMPTY_CHIP('Morphology');

    // Dropdown — reset class and inline styles from anime transitions
    $('morphDropdown').classList.remove('open');
    $('morphDropdown').style.opacity = '';
    $('morphDropdown').style.transform = '';
    // Reset dropdown hover states
    $('morphDropdown').querySelectorAll('.dd-item').forEach(it => it.classList.remove('hi'));
    $('morphDropdown').querySelector('[data-value="traditional serrated adenoma"]').classList.add('hi');

    // Narrative
    $('narrativeEditor').innerHTML = '<span class="ph">Dictate or type findings...</span>';
    $('narrativeEditor').classList.remove('focused');

    // Finding state
    $('finding1').classList.remove('active', 'review');

    // Review banner
    $('reviewBanner').classList.remove('vis');

    // Stats
    $('statsFootnote').classList.remove('vis');

    // Pause button state
    $('pauseBtn').textContent = 'Pause';
    $('pauseBtn').classList.remove('on');

    // Progress bar
    $('progressFill').style.width = '0%';

    // Caption
    $('sceneCaption').textContent = '';
    $('sceneCaption').classList.remove('show');

    // Remove any AI badges/tooltips added dynamically
    document.querySelectorAll('.ai-tooltip').forEach(t => t.remove());

    // Hide action indicator
    hideAction();

    // Clear streaming interval
    if (streamId) { clearInterval(streamId); streamId = null; }
  }

  // ── Field helpers ──────────────────────────────────────

  function focusField(fieldEl) {
    // Remove focus from all fields and narrative
    ['locationField', 'sizeField', 'morphField'].forEach(id => {
      $(id).classList.remove('focused');
    });
    $('narrativeEditor').classList.remove('focused');
    if (fieldEl) fieldEl.classList.add('focused');
  }

  function fillFieldWithVoice(fieldEl, value) {
    const inputEl = fieldEl.querySelector('.nm-field-input');

    // Step 1: Brief pause — viewer sees the unfilled amber chip
    // Step 2: Build the filled markup but start invisible
    inputEl.innerHTML = `
      <span class="ai-badge" data-source="voice" style="opacity:0;">AI</span>
      <span class="nm-field-value"><span class="c fill voice-enter" style="opacity:0; transform:scale(0.92);">${esc(value)} <span class="c-arr">&#9662;</span><span class="c-sep"></span><span class="c-x">&times;</span></span></span>
      <span class="nm-field-clear" style="opacity:0;">&times;</span>
    `;

    // Step 3: Smooth transition from amber to blue (not instant pop)
    setTimeout(() => {
      fieldEl.classList.add('ai-populated');
      const chip = inputEl.querySelector('.c.fill');
      const badge = inputEl.querySelector('.ai-badge');
      const clearBtn = inputEl.querySelector('.nm-field-clear');

      anime({
        targets: chip,
        opacity: [0, 1],
        scale: [0.92, 1],
        duration: 500,
        easing: 'cubicBezier(.39, .575, .565, 1)'
      });
      anime({
        targets: badge,
        opacity: [0, 1],
        duration: 400,
        delay: 150,
        easing: 'cubicBezier(.39, .575, .565, 1)'
      });
      anime({
        targets: clearBtn,
        opacity: [0, 1],
        duration: 400,
        delay: 250,
        easing: 'cubicBezier(.39, .575, .565, 1)'
      });

      // Wire AI badge tooltip
      if (badge) {
        badge.addEventListener('click', (e) => {
          e.stopPropagation();
          NovaMed.AIIcon.toggleTooltip(badge, 'voice');
        });
      }
    }, 300);
  }

  function setFieldManual(fieldEl, value) {
    fieldEl.classList.remove('ai-populated');
    const inputEl = fieldEl.querySelector('.nm-field-input');
    inputEl.innerHTML = `
      <span class="nm-field-value"><span class="c fill voice-enter" style="opacity:0; transform:scale(0.92);">${esc(value)} <span class="c-arr">&#9662;</span><span class="c-sep"></span><span class="c-x">&times;</span></span></span>
      <span class="nm-field-clear" style="opacity:0;">&times;</span>
    `;
    // Smooth fill transition
    anime({
      targets: inputEl.querySelector('.c.fill'),
      opacity: [0, 1],
      scale: [0.92, 1],
      duration: 500,
      easing: 'cubicBezier(.39, .575, .565, 1)'
    });
    anime({
      targets: inputEl.querySelector('.nm-field-clear'),
      opacity: [0, 1],
      duration: 400,
      delay: 150,
      easing: 'cubicBezier(.39, .575, .565, 1)'
    });
  }

  // ── Scenes ─────────────────────────────────────────────

  function buildScenes() {
    return [

      // ── Scene 1 (0-6s): Physician activates voice ──────
      {
        time: 0,
        caption: () => NovaMed.Timeline.setCap('The physician activates voice input to fill the report hands-free', 'mic', 'cap-icon-default'),
        action: () => {
          $('finding1').classList.add('active');
          focusField($('locationField'));
        }
      },
      {
        time: 2000,
        action: () => {
          // Action indicator on mic button
          showAction($('micBtn'), 'mic', 'Activate voice input', 'active');
            anime({
              targets: $('micBtn'),
              scale: [1, 1.15, 1],
              duration: T_NORMAL,
              easing: 'cubicBezier(.4, 0, .1, 1)',
              complete: () => {
                $('micBtn').classList.add('active');
                $('waveform').classList.add('active');
                $('voiceStatus').textContent = 'Listening...';
                $('voiceStatus').classList.add('active');
                hideAction();
              }
            });
        }
      },

      // ── Scene 2 (6-12s): Voice fills Location ──────────
      {
        time: 6000,
        caption: () => NovaMed.Timeline.setCap('Speaking naturally fills structured fields \u2014 no typing required', 'record_voice_over', 'cap-icon-ai'),
        action: () => {
          // Short pause then fill location
          setTimeout(() => {
            const locField = $('locationField');
            showAction(locField, 'record_voice_over', 'Voice input', 'ai-action');
            fillFieldWithVoice(locField, 'Cecum');
            setTimeout(() => hideAction(), 1200);
          }, 800);
        }
      },

      // ── Scene 3 (12-18s): Tab to Size, voice fills ─────
      {
        time: 12000,
        caption: () => NovaMed.Timeline.setCap('Focus advances automatically to the next field', 'arrow_forward', 'cap-icon-default'),
        action: () => {
          // Tab effect — focus moves to size with smooth transition
          focusField($('sizeField'));
        }
      },
      {
        time: 14000,
        action: () => {
          // Voice says "5 millimeters"
          const sizeField = $('sizeField');
          showAction(sizeField, 'record_voice_over', 'Voice input', 'ai-action');
          fillFieldWithVoice(sizeField, '5mm');
          setTimeout(() => hideAction(), 1200);
        }
      },

      // ── Scene 4 (18-30s): Focus to narrative, dictate ──
      {
        time: 18000,
        caption: () => NovaMed.Timeline.setCap('Voice input works for both structured fields and free text', 'record_voice_over', 'cap-icon-ai'),
        action: () => {
          // Move focus to narrative area
          focusField(null);
          $('narrativeEditor').classList.add('focused');

          // Clear placeholder
          $('narrativeEditor').innerHTML = '';

          // Add cursor
          const cur = document.createElement('span');
          cur.className = 'cur';
          $('narrativeEditor').appendChild(cur);
        }
      },
      {
        time: 19500,
        action: () => {
          // Stream the narrative text character by character
          $('narrativeEditor').innerHTML = '';
          const textNode = document.createElement('span');
          $('narrativeEditor').appendChild(textNode);
          const cur = document.createElement('span');
          cur.className = 'cur';
          $('narrativeEditor').appendChild(cur);

          let i = 0;
          streamId = setInterval(() => {
            if (i >= NARRATIVE_TEXT.length) {
              clearInterval(streamId);
              streamId = null;
              return;
            }
            textNode.textContent += NARRATIVE_TEXT[i];
            i++;
          }, 35);
        }
      },

      // ── Scene 5 (30-38s): Manual morphology selection ──
      {
        time: 30000,
        caption: () => NovaMed.Timeline.setCap('Manual and voice input work together seamlessly', 'touch_app', 'cap-icon-default'),
        action: () => {
          // Waveform pauses
          $('waveform').classList.remove('active');
          $('voiceStatus').textContent = 'Paused';
          $('voiceStatus').classList.remove('active');

          // Remove cursor from narrative
          const cur = $('narrativeEditor').querySelector('.cur');
          if (cur) cur.remove();
          $('narrativeEditor').classList.remove('focused');
        }
      },
      {
        time: 31500,
        action: () => {
          // Action indicator on morphology field
          focusField($('morphField'));
          const morphInput = $('morphField').querySelector('.nm-field-input');
          showAction(morphInput, 'touch_app', 'Manual selection', '');
            // Simulate click — subtle press
            anime({
              targets: morphInput,
              scale: [1, 0.98, 1],
              duration: T_NORMAL,
              easing: 'cubicBezier(.4, 0, .1, 1)'
            });
        }
      },
      {
        time: 32500,
        action: () => {
          // Open dropdown with standard transition (300ms ease-decel)
          hideAction();
          const dd = $('morphDropdown');
          dd.classList.add('open');
          anime({
            targets: dd,
            opacity: [0, 1],
            translateY: [-4, 0],
            duration: T_FAST,
            easing: 'cubicBezier(.39, .575, .565, 1)'
          });
        }
      },
      {
        time: 33500,
        action: () => {
          // Highlight first item
          const items = $('morphDropdown').querySelectorAll('.dd-item');
          items.forEach(it => it.classList.remove('hi'));
          items[0].classList.add('hi');
        }
      },
      {
        time: 34500,
        action: () => {
          // Move to second item
          const items = $('morphDropdown').querySelectorAll('.dd-item');
          items.forEach(it => it.classList.remove('hi'));
          items[1].classList.add('hi');
        }
      },
      {
        time: 35500,
        action: () => {
          // Move to target item — traditional serrated adenoma
          const items = $('morphDropdown').querySelectorAll('.dd-item');
          items.forEach(it => it.classList.remove('hi'));
          items[2].classList.add('hi');
        }
      },
      {
        time: 36500,
        action: () => {
          // Select "traditional serrated adenoma" — close dropdown with standard transition
          const ddClose = $('morphDropdown');
          anime({
            targets: ddClose,
            opacity: [1, 0],
            translateY: [0, -4],
            duration: T_FAST,
            easing: 'cubicBezier(.4, 0, .1, 1)',
            complete: () => {
              ddClose.classList.remove('open');
              ddClose.style.opacity = '';
              ddClose.style.transform = '';
            }
          });
          setFieldManual($('morphField'), 'Traditional serrated adenoma');
          $('morphField').classList.remove('focused');
        }
      },

      // ── Scene 6 (38-48s): Review state + stats ─────────
      {
        time: 38000,
        caption: () => NovaMed.Timeline.setCap('The physician approves the finding \u2014 AI assists, the doctor decides', 'verified_user', 'cap-icon-physician'),
        action: () => {
          // Deactivate mic
          $('micBtn').classList.remove('active');
          $('waveform').classList.remove('active');
          $('voiceStatus').textContent = 'Voice input off';
          $('voiceStatus').classList.remove('active');
        }
      },
      {
        time: 40000,
        action: () => {
          // Finding enters review state
          const finding = $('finding1');
          showAction(finding, 'verified_user', 'Physician approves', 'physician-action');
          finding.classList.remove('active');
          finding.classList.add('review');
          $('narrativeEditor').classList.remove('focused');
          focusField(null);

          // Review banner
          $('reviewBanner').classList.add('vis');
          setTimeout(() => hideAction(), 1500);
        }
      },
      {
        time: 43000,
        action: () => {
          // Stats appear
          $('statsFootnote').classList.add('vis');
        }
      }
    ];
  }

  // ── Init ───────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', () => {
    NovaMed.Timeline.init({
      progEl: $('progressFill'),
      capEl: $('sceneCaption'),
      playEl: $('playOverlay')
    });
    NovaMed.AIIcon.initGlobalClose();

    $('playOverlay').addEventListener('click', () => {
      NovaMed.Timeline.run(buildScenes(), DUR, { onReset: reset });
    });

    $('replayBtn').addEventListener('click', () => {
      NovaMed.Timeline.stop();
      reset();
      setTimeout(() => {
        NovaMed.Timeline.run(buildScenes(), DUR, { onReset: reset });
      }, T_NORMAL);
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
