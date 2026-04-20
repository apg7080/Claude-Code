/**
 * NovaMed Demo 4: Billing Codes
 * Scripted ~30s animation
 *
 * Story: AI generates billing codes from the completed report.
 * Physician reviews, corrects one inline, and adds a manual code.
 *
 * Timing constants:
 *   Fast: 200ms | Normal: 300ms | Slow: 500ms | Stagger: 100ms per row
 */

(() => {
  const FAST = 300;
  const NORMAL = 500;
  const SLOW = 800;
  const STAGGER = 150;

  /* Easing curves */
  const EASE_IN = 'cubicBezier(.39, .575, .565, 1)';
  const EASE_OUT = 'cubicBezier(.4, 0, .1, 1)';

  const CPT_CODES = [
    { type: 'CPT', code: '45378', desc: 'Flexible colonoscopy, diagnostic' }
  ];

  const ICD_CODES = [
    { type: 'ICD', code: 'R10.9', desc: 'Unspecified abdominal pain' },
    { type: 'ICD', code: 'F13.20', desc: 'Sedative, hypnotic, or anxiolytic dependence, uncomplicated' },
    { type: 'ICD', code: 'R53.83', desc: 'Other fatigue' },
    { type: 'ICD', code: 'E66.9', desc: 'Obesity, unspecified' },
    { type: 'ICD', code: 'F11.20', desc: 'Opioid dependence, uncomplicated' }
  ];

  // The row that gets corrected (index 2 in ICD_CODES = R53.83)
  const CORRECTED_IDX = 2;
  const CORRECTED_CODE = 'K21.0';
  const CORRECTED_DESC = 'Gastro-esophageal reflux disease';

  // Manual entry
  const MANUAL_CODE = 'G47.33';
  const MANUAL_DESC = 'Obstructive sleep apnea';

  const DUR = 50000;

  const $ = id => document.getElementById(id);
  const show = (el, on) => { el.style.display = on ? '' : 'none'; };

  let sectionEl = null;

  /* ── Action indicator helpers ── */

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

  /**
   * Full reset — returns all state for clean replay
   */
  function reset() {
    // Hide action indicator
    hideAction();

    // Hide stats
    $('statsFootnote').classList.remove('vis');

    // Reset pause button state
    const pauseBtn = $('pauseBtn');
    const pbIcon = pauseBtn.querySelector('.material-symbols-outlined');
    if (pbIcon) pbIcon.textContent = 'pause';
    pauseBtn.title = 'Pause';
    pauseBtn.classList.remove('on');

    // Remove old section and rebuild from scratch
    const mount = $('billingSectionMount');
    mount.innerHTML = '';
    sectionEl = NovaMed.Billing.createSection();
    sectionEl.style.opacity = '0';
    mount.appendChild(sectionEl);

    // Reset progress bar
    $('progressFill').style.width = '0%';

    // Clear caption
    const cap = $('sceneCaption');
    cap.classList.remove('show');
    cap.textContent = '';
  }

  /**
   * Simulate typing into an element with a blinking cursor
   */
  function typeText(el, text, speed, cb) {
    let i = 0;
    el.textContent = '';
    const cur = document.createElement('span');
    cur.className = 'cur';
    el.appendChild(cur);
    const iv = setInterval(() => {
      if (i < text.length) {
        el.insertBefore(document.createTextNode(text[i]), cur);
        i++;
      } else {
        clearInterval(iv);
        if (cb) cb();
      }
    }, speed);
    return iv;
  }

  function buildScenes() {
    return [
      // -- Scene 1: Empty state (0-5s) --
      {
        time: 0,
        action: () => {
          NovaMed.Timeline.setCap('The Medical Codes section \u2014 ready for input', 'receipt_long', 'cap-icon-default');
          anime({
            targets: sectionEl,
            opacity: [0, 1],
            translateY: [8, 0],
            duration: NORMAL,
            easing: EASE_IN
          });
        }
      },

      // -- Scene 2: Generate codes (5-14s) --
      {
        time: 5000,
        action: () => {
          NovaMed.Timeline.setCap('AI generates billing codes from the completed report', 'auto_awesome', 'cap-icon-ai');
          const btn = $('billingGenerateBtn');

          // Action indicator on generate button
          showAction(btn, 'auto_awesome', 'Generate from report', 'ai-action');

            // Press effect
            btn.classList.add('pressed');
            setTimeout(() => btn.classList.remove('pressed'), FAST);

            // After press, show shimmer loading
            setTimeout(() => {
              hideAction();

              const empty = $('billingEmpty');
              show(empty, false);

              const content = $('billingContent');
              show(content, true);
              content.style.opacity = '0';

              // Show shimmer placeholders
              const procList = $('billingProcedureList');
              const diagList = $('billingDiagnosisList');
              const addRow = $('billingAddRow');
              show(addRow, false);

              const shimmerCount = 6;
              const shimmers = [];
              for (let i = 0; i < shimmerCount; i++) {
                const s = NovaMed.Billing.createShimmerBlock(i);
                if (i === 0) procList.appendChild(s);
                else diagList.appendChild(s);
                shimmers.push(s);
              }

              anime({
                targets: content,
                opacity: [0, 1],
                duration: NORMAL,
                easing: EASE_IN
              });

              // After shimmer, populate real codes
              setTimeout(() => {
                // Clear shimmers
                shimmers.forEach(s => s.remove());

                // CPT codes — AI-generated
                CPT_CODES.forEach(c => {
                  const row = NovaMed.Billing.createCodeRow(c.type, c.code, c.desc, 'ai');
                  row.style.opacity = '0';
                  procList.appendChild(row);
                  anime({
                    targets: row,
                    opacity: [0, 1],
                    translateX: [-8, 0],
                    duration: NORMAL,
                    easing: EASE_IN
                  });
                });

                // ICD codes staggered — all AI-generated
                ICD_CODES.forEach((c, i) => {
                  const row = NovaMed.Billing.createCodeRow(c.type, c.code, c.desc, 'ai');
                  row.style.opacity = '0';
                  row.dataset.icdIdx = i;
                  diagList.appendChild(row);
                  anime({
                    targets: row,
                    opacity: [0, 1],
                    translateX: [-8, 0],
                    duration: NORMAL,
                    delay: STAGGER + i * STAGGER,
                    easing: EASE_IN
                  });
                });

                // Show add row after codes settle
                setTimeout(() => {
                  show(addRow, true);
                  anime({
                    targets: addRow,
                    opacity: [0, 1],
                    duration: NORMAL,
                    easing: EASE_IN
                  });
                }, STAGGER + ICD_CODES.length * STAGGER);

              }, 2200);
            }, NORMAL);
        }
      },

      // -- Scene 3: Physician reviews (14-20s) --
      {
        time: 14000,
        action: () => {
          NovaMed.Timeline.setCap('The physician reviews each code against clinical documentation', 'fact_check', 'cap-icon-physician');
          // Subtle highlight scanning down the list
          const allRows = sectionEl.querySelectorAll('.billing-row');
          allRows.forEach((row, i) => {
            setTimeout(() => {
              row.classList.add('highlight');
              setTimeout(() => row.classList.remove('highlight'), SLOW + FAST);
            }, i * SLOW);
          });
        }
      },

      // -- Scene 4: Inline correction (20-30s) --
      {
        time: 20000,
        action: () => {
          NovaMed.Timeline.setCap('Any code can be corrected with inline editing', 'edit', 'cap-icon-physician');
          // Find the target row
          const diagRows = $('billingDiagnosisList').querySelectorAll('.billing-row');
          const targetRow = diagRows[CORRECTED_IDX];
          if (!targetRow) return;

          // Action indicator on the row
          showAction(targetRow, 'edit', 'Physician corrects code', 'physician-action');

          setTimeout(() => {
            hideAction();
            NovaMed.Billing.setEditable(targetRow);

            // After a beat, simulate correction typing
            setTimeout(() => {
              const codeEl = targetRow.querySelector('.billing-code');
              const descEl = targetRow.querySelector('.billing-desc');

              // Clear existing text with cursor
              descEl.innerHTML = '';
              codeEl.textContent = '';

              // Type new code
              const cur = document.createElement('span');
              cur.className = 'cur';
              codeEl.appendChild(cur);

              let codeText = CORRECTED_CODE;
              let ci = 0;
              const codeIv = setInterval(() => {
                if (ci < codeText.length) {
                  codeEl.insertBefore(document.createTextNode(codeText[ci]), cur);
                  ci++;
                } else {
                  clearInterval(codeIv);
                  cur.remove();

                  // Now type description
                  setTimeout(() => {
                    typeText(descEl, CORRECTED_DESC, 40, () => {
                      // Remove cursor and deactivate
                      const c = descEl.querySelector('.cur');
                      if (c) c.remove();
                      setTimeout(() => {
                        targetRow.classList.remove('active');
                        targetRow.dataset.code = CORRECTED_CODE;
                        // Keep data-source="ai" — it was originally AI-generated
                      }, NORMAL);
                    });
                  }, STAGGER);
                }
              }, 70);
            }, 800);
          }, 700);
        }
      },

      // -- Scene 5: Manual code entry (30-38s) --
      {
        time: 30000,
        action: () => {
          NovaMed.Timeline.setCap('Manual codes added alongside AI-generated ones', 'add_circle', 'cap-icon-default');
          const addRow = $('billingAddRow');

          // Action indicator on add row
          showAction(addRow, 'add_circle', 'Add code manually', '');

          setTimeout(() => {
            hideAction();
            addRow.classList.add('active');
            const textEl = addRow.querySelector('.billing-add-text');
            textEl.textContent = '';

            // Type "G47" first
            const partialText = 'G47';
            let pi = 0;
            const cur = document.createElement('span');
            cur.className = 'cur';
            textEl.appendChild(cur);

            const partIv = setInterval(() => {
              if (pi < partialText.length) {
                textEl.insertBefore(document.createTextNode(partialText[pi]), cur);
                pi++;
              } else {
                clearInterval(partIv);

                // Autocomplete after brief pause
                setTimeout(() => {
                  cur.remove();
                  textEl.textContent = '';

                  // Convert add row to a real code row — manual source
                  const newRow = NovaMed.Billing.createCodeRow('ICD', MANUAL_CODE, MANUAL_DESC, 'manual');
                  newRow.style.opacity = '0';

                  // Insert into diagnosis list
                  const diagList = $('billingDiagnosisList');
                  diagList.appendChild(newRow);

                  // Reset add row
                  addRow.classList.remove('active');
                  textEl.textContent = '+ Write something or hit \'/\'';

                  anime({
                    targets: newRow,
                    opacity: [0, 1],
                    translateX: [-6, 0],
                    duration: NORMAL,
                    easing: EASE_IN
                  });
                }, 1000);
              }
            }, STAGGER);
          }, 700);
        }
      },

      // -- Scene 5.5: Source distinction callout (38-42s) --
      {
        time: 38000,
        action: () => {
          NovaMed.Timeline.setCap('AI-generated codes shown in blue \u2014 manually added codes are distinct', 'compare', 'cap-icon-ai');
          showAction(sectionEl, 'compare', 'AI vs manual codes', 'active');
          setTimeout(() => hideAction(), 2500);
        }
      },

      // -- Scene 6: Verification (42-46s) --
      {
        time: 42000,
        action: () => {
          NovaMed.Timeline.setCap('The physician approves all billing codes \u2014 AI-assisted, physician-verified', 'verified_user', 'cap-icon-physician');
          // Settle all rows — clear any lingering states
          const allRows = sectionEl.querySelectorAll('.billing-row');
          allRows.forEach(row => {
            row.classList.remove('active', 'highlight');
          });

          // Clear add row state
          const addRow = $('billingAddRow');
          if (addRow) addRow.classList.remove('active');

          // Action indicator for verification
          showAction(sectionEl, 'verified_user', 'Physician approves', 'physician-action');

          // Mark the section as verified (state flag, not the banner element class)
          sectionEl.classList.add('is-verified');

          // Subtle completion pulse
          anime({
            targets: sectionEl,
            boxShadow: [
              '0 1px 2px rgba(0,0,0,0.04)',
              '0 2px 12px rgba(74,68,89,0.18)',
              '0 1px 2px rgba(0,0,0,0.04)'
            ],
            duration: 1500,
            easing: EASE_OUT
          });

          setTimeout(() => hideAction(), 2500);
        }
      },

      // -- Scene 7: Stats (46-50s) --
      {
        time: 46000,
        action: () => {
          $('statsFootnote').classList.add('vis');
        }
      }
    ];
  }

  // Preview: last-frame state (populated + verified codes)
  function showPreviewState() {
    reset();
    sectionEl.style.opacity = '1';
    // Hide empty state, show content
    const empty = $('billingEmpty');
    const content = $('billingContent');
    if (empty) show(empty, false);
    if (content) { show(content, true); content.style.opacity = '1'; }

    // Populate codes
    const procList = $('billingProcedureList');
    const diagList = $('billingDiagnosisList');
    CPT_CODES.forEach(c => {
      procList.appendChild(NovaMed.Billing.createCodeRow(c.type, c.code, c.desc, 'ai'));
    });
    ICD_CODES.forEach((c, i) => {
      if (i === CORRECTED_IDX) {
        diagList.appendChild(NovaMed.Billing.createCodeRow('ICD', CORRECTED_CODE, CORRECTED_DESC, 'ai'));
      } else {
        diagList.appendChild(NovaMed.Billing.createCodeRow(c.type, c.code, c.desc, 'ai'));
      }
    });
    diagList.appendChild(NovaMed.Billing.createCodeRow('ICD', MANUAL_CODE, MANUAL_DESC, 'manual'));

    // Show add row
    const addRow = $('billingAddRow');
    if (addRow) show(addRow, true);

    // Verified state
    sectionEl.classList.add('is-verified');

    // Stats
    $('statsFootnote').classList.add('vis');
  }

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    // Build initial section
    sectionEl = NovaMed.Billing.createSection();
    $('billingSectionMount').appendChild(sectionEl);

    NovaMed.Timeline.init({
      progEl: $('progressFill'),
      capEl: $('sceneCaption'),
      playEl: $('playOverlay')
    });

    // Set initial preview state
    NovaMed.Timeline.setPreview(showPreviewState);

    $('playOverlay').addEventListener('click', () => {
      NovaMed.Timeline.run(buildScenes(), DUR, { onReset: reset });
    });

    $('replayBtn').addEventListener('click', () => {
      NovaMed.Timeline.stop();
      reset();
      setTimeout(() => {
        NovaMed.Timeline.run(buildScenes(), DUR, { onReset: reset });
      }, NORMAL);
    });

    let paused = false;
    const pauseBtn = $('pauseBtn');
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
  });
})();
