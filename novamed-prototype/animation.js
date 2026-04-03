/**
 * NovaMed Editor Prototype — Animation
 * Now uses shared NovaMed.Timeline engine for consistency with other demos.
 * Scripted walkthrough: 7 scenes, ~58s
 */

(() => {
  const DUR = 58000;

  /* Standardized timing constants */
  const FAST   = 300;
  const NORMAL = 500;
  const SLOW   = 800;
  const STAGGER = 120;

  /* Easing curves */
  const EASE_IN  = 'cubicBezier(.39, .575, .565, 1)';
  const EASE_OUT = 'cubicBezier(.4, 0, .1, 1)';

  const S2 = 'Examined the ascending colon and identified a 5mm sessile polyp with mild erythema';
  const S2T = [
    { term: 'ascending colon', category: 'anatomy', label: 'Location', confidence: 97 },
    { term: '5mm', category: 'size', label: 'Size', confidence: 99 },
    { term: 'sessile', category: 'morphology', label: 'Morphology', confidence: 91 },
    { term: 'polyp', category: 'finding', label: 'Finding', confidence: 94 },
    { term: 'mild', category: 'severity', label: 'Severity', confidence: 87 },
    { term: 'erythema', category: 'tissue', label: 'Tissue Quality', confidence: 89 }
  ];

  const S6 = 'Two 3mm hyperplastic polyps noted in the sigmoid colon. No biopsy taken.';
  const S6T = [
    { term: '3mm', category: 'size', label: 'Size', confidence: 99 },
    { term: 'hyperplastic', category: 'pathology', label: 'Pathology', confidence: 88 },
    { term: 'sigmoid colon', category: 'anatomy', label: 'Location', confidence: 96 },
    { term: 'biopsy', category: 'action', label: 'Action', confidence: 93 }
  ];

  const esc = s => NovaMed.Chips ? NovaMed.Chips.esc(s) : s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  function chipH(term) {
    return NovaMed.Chips ? NovaMed.Chips.filledHTML(term)
      : `<span class="c fill">${esc(term)} <span class="c-arr">&#9662;</span><span class="c-sep"></span><span class="c-x">&times;</span></span>`;
  }
  function emptyH(label) {
    return NovaMed.Chips ? NovaMed.Chips.unfilledHTML(label)
      : `<span class="c empty">${label} <span class="c-arr">&#9662;</span><span class="c-sep"></span><span class="c-x">&times;</span></span>`;
  }

  /**
   * Type text character by character, recognizing terms as chips.
   * Uses NovaMed.Timeline.sched for pause-aware scheduling.
   */
  function typeText(el, text, terms, t0, cMs, onDone) {
    const TL = NovaMed.Timeline;
    const locs = [];
    for (const t of terms) {
      const i = text.toLowerCase().indexOf(t.term.toLowerCase());
      if (i !== -1) locs.push({ ...t, s: i, e: i + t.term.length });
    }
    locs.sort((a, b) => a.s - b.s);
    const found = [];

    for (let i = 0; i <= text.length; i++) {
      TL.sched(() => {
        const cur = text.substring(0, i);
        let html = '', last = 0;

        const done = locs.filter(t => found.includes(t.s) && t.e <= cur.length).sort((a, b) => a.s - b.s);
        for (const t of done) {
          if (t.s > last) html += esc(cur.substring(last, t.s));
          html += chipH(t.term);
          last = t.e;
        }

        if (last < cur.length) {
          let partial = false;
          for (const tl of locs) {
            if (!found.includes(tl.s) && cur.length > tl.s && cur.length <= tl.e) {
              html += esc(cur.substring(last, tl.s));
              html += `<span class="hl">${esc(cur.substring(tl.s))}</span>`;
              last = cur.length;
              partial = true;
              break;
            }
          }
          if (!partial) html += esc(cur.substring(last));
        }
        html += '<span class="cur"></span>';
        el.innerHTML = html;

        for (const tl of locs) {
          if (i === tl.e && !found.includes(tl.s)) found.push(tl.s);
        }
        if (i === text.length && onDone) TL.sched(onDone, 400);
      }, t0 + i * cMs);
    }
  }

  function buildChips(text, terms) {
    return NovaMed.Chips ? NovaMed.Chips.buildChipsFromText(text, terms)
      : (() => {
          const pos = [];
          for (const t of terms) {
            const i = text.toLowerCase().indexOf(t.term.toLowerCase());
            if (i !== -1) pos.push({ ...t, s: i, e: i + t.term.length });
          }
          pos.sort((a, b) => a.s - b.s);
          let html = '', last = 0;
          for (const p of pos) {
            if (p.s > last) html += esc(text.substring(last, p.s));
            html += chipH(p.term);
            last = p.e;
          }
          if (last < text.length) html += esc(text.substring(last));
          return html;
        })();
  }

  function buildBlock(tpl) {
    const parts = tpl.split(/\{(\w+)\}/g);
    let html = '';
    const labels = { anatomy: 'Location', equipment: 'Equipment', size: 'Size (mm)', morphology: 'Morphology', action: 'Action', finding: 'Finding', tissue: 'Tissue', severity: 'Severity' };
    for (let i = 0; i < parts.length; i++) {
      html += i % 2 === 0 ? esc(parts[i]) : emptyH(labels[parts[i]] || parts[i]);
    }
    return html;
  }

  // === Scene definitions ===

  function buildScenes() {
    const E = Editor.el();
    const TL = NovaMed.Timeline;

    return [
      // Scene 1: Empty editor (0-3s)
      {
        time: 200,
        caption: () => TL.setCap('Clinician opens a new finding section', 'edit_note', 'cap-icon-default'),
        action: () => {
          Editor.actF(E.f1);
          Editor.showAdd(true);
        }
      },
      { time: 2000, action: () => { E.ft1.innerHTML = '<span class="cur"></span>'; } },

      // Scene 2: Typing + recognition (3-14s)
      {
        time: 3000,
        caption: () => TL.setCap('Terms are recognized as the clinician types', 'auto_awesome', 'cap-icon-ai'),
        action: () => {
          Editor.scanOn(true);
          typeText(E.ft1, S2, S2T, 500, 65, () => Editor.scanOn(false));
        }
      },

      // Scene 3: AI review (14-20s)
      {
        time: 14000,
        caption: () => TL.setCap('Recognized terms are classified for review', 'sell', 'cap-icon-ai'),
        action: () => {
          Editor.hideCur(E.ft1);
        }
      },
      { time: 14500, action: () => { Editor.aiPopulate(S2T); Editor.aiShow(true); } },
      { time: 15000, action: () => Editor.aiReveal(() => {}) },
      {
        time: 17000,
        caption: () => TL.setCap('Physician confirms classifications', 'verified_user', 'cap-icon-physician'),
        action: () => Editor.aiConfirm(() => {})
      },
      { time: 19500, action: () => { Editor.aiShow(false); E.fh1.textContent = 'Polyp — Ascending Colon'; } },

      // Scene 4: Slash command (20-28s)
      {
        time: 20000,
        caption: () => TL.setCap('Slash command triggers text block menu', 'terminal', 'cap-icon-default'),
        action: () => {
          const ex = E.ft1.innerHTML.replace(/<span class="cur"><\/span>/g, '');
          E.ft1.innerHTML = ex + '<br><br><span style="color:var(--text-softest)">/</span><span class="cur"></span>';
        }
      },
      { time: 21000, action: () => { Editor.slShow(true); Editor.slSearch('/'); } },
      { time: 22000, action: () => { Editor.slSearch('/<strong>b</strong>'); Editor.slFilter('b'); } },
      { time: 22500, action: () => { Editor.slSearch('/<strong>bi</strong>'); Editor.slFilter('bi'); } },
      { time: 23000, action: () => Editor.slHi('biopsy-protocol') },
      {
        time: 23500,
        caption: () => TL.setCap('Pre-built text block populates with smart chips', 'sell', 'cap-icon-ai')
      },
      {
        time: 24000,
        action: () => {
          Editor.slShow(false);
          const tpl = 'Biopsies were obtained from the {anatomy} using {equipment}. Specimens were sent to pathology for histological evaluation.';
          E.ft1.innerHTML = buildChips(S2, S2T) + '<br><br>' + buildBlock(tpl);
        }
      },

      // Scene 5: Chip cascade (28-36s)
      {
        time: 28000,
        caption: () => TL.setCap('Dropdown chips cascade \u2014 select one, next auto-focuses', 'sell', 'cap-icon-ai'),
      },
      {
        time: 29000,
        action: () => {
          const u = E.ft1.querySelectorAll('.c.empty');
          if (u[0]) ChipSystem.fillChip(u[0], 'ascending colon');
        }
      },
      {
        time: 30500,
        action: () => {
          const u = E.ft1.querySelectorAll('.c.empty');
          if (u[0]) ChipSystem.fillChip(u[0], 'biopsy forceps');
        }
      },
      { time: 32000, action: () => Editor.deactF(E.f1) },

      // Scene 6: Finding 2 (33-46s)
      {
        time: 33000,
        caption: () => TL.setCap('Adding a second finding', 'edit_note', 'cap-icon-default'),
        action: () => {
          Editor.showF2();
          Editor.actF(E.f2);
        }
      },
      {
        time: 35000,
        action: () => {
          E.ft2.innerHTML = '<span class="cur"></span>';
          typeText(E.ft2, S6, S6T, 500, 60, () => {
            E.fh2.textContent = 'Polyps \u2014 Sigmoid Colon';
            Editor.deactF(E.f2);
          });
        }
      },

      // Scene 7: Review + stats (46-58s)
      {
        time: 46000,
        caption: () => TL.setCap('Physician marks section as reviewed', 'verified_user', 'cap-icon-physician'),
      },
      { time: 47000, action: () => Editor.setReview(E.f1, 'reviewBanner1') },
      {
        time: 49000,
        caption: () => TL.setCap('Structured report documented in under a minute', 'timer', 'cap-icon-default'),
      },
      { time: 51000, action: () => Editor.showStats(true) }
    ];
  }

  // Preview: show last-frame state behind play overlay
  function showPreviewState() {
    Editor.reset();
    const E = Editor.el();

    // Show both findings with content and review state
    E.ft1.innerHTML = buildChips(S2, S2T);
    E.fh1.textContent = 'Polyp \u2014 Ascending Colon';
    E.f1.classList.add('review');
    document.getElementById('reviewBanner1')?.classList.add('vis');

    E.f2.style.display = '';
    E.f2.style.opacity = '1';
    E.f2.style.transform = '';
    E.ft2.innerHTML = buildChips(S6, S6T);
    E.fh2.textContent = 'Polyps \u2014 Sigmoid Colon';

    Editor.showStats(true);
  }

  // Init
  document.addEventListener('DOMContentLoaded', async () => {
    Editor.init();
    try { await AIEngine.loadTerms(); } catch (e) { console.warn('[Animation] Terms load failed, continuing:', e); }

    NovaMed.Timeline.init({
      progEl: document.getElementById('progressFill'),
      capEl: document.getElementById('sceneCaption'),
      playEl: document.getElementById('playOverlay')
    });

    // Set initial preview
    NovaMed.Timeline.setPreview(showPreviewState);

    document.getElementById('playOverlay').addEventListener('click', () => {
      NovaMed.Timeline.run(buildScenes(), DUR, { onReset: () => Editor.reset() });
    });

    document.getElementById('replayBtn').addEventListener('click', () => {
      NovaMed.Timeline.stop();
      Editor.reset();
      setTimeout(() => {
        NovaMed.Timeline.run(buildScenes(), DUR, { onReset: () => Editor.reset() });
      }, NORMAL);
    });

    let paused = false;
    const pauseBtn = document.getElementById('pauseBtn');
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
