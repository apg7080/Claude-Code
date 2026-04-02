/**
 * NovaMed Animation Timeline
 * Scripted walkthrough: 7 scenes, ~58s
 */

const Animation = (() => {
  let tids = [];
  let paused = false;
  let running = false;
  const DUR = 58000;

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

  function sched(fn, ms) {
    const id = setTimeout(() => { if (!paused) fn(); }, ms);
    tids.push(id);
  }

  function prog(t0) {
    if (!running || paused) return;
    Editor.setProg(Math.min(((Date.now() - t0) / DUR) * 100, 100));
    if (Date.now() - t0 < DUR) requestAnimationFrame(() => prog(t0));
  }

  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function chipH(term) {
    return `<span class="c fill">${term} <span class="c-arr">&#9662;</span><span class="c-sep"></span><span class="c-x">&times;</span></span>`;
  }
  function emptyH(label) {
    return `<span class="c empty">${label} <span class="c-arr">&#9662;</span><span class="c-sep"></span><span class="c-x">&times;</span></span>`;
  }

  function typeText(el, text, terms, t0, cMs, onDone) {
    const locs = [];
    for (const t of terms) {
      const i = text.toLowerCase().indexOf(t.term.toLowerCase());
      if (i !== -1) locs.push({ ...t, s: i, e: i + t.term.length });
    }
    locs.sort((a, b) => a.s - b.s);
    const found = [];

    for (let i = 0; i <= text.length; i++) {
      sched(() => {
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
        if (i === text.length && onDone) sched(onDone, 400);
      }, t0 + i * cMs);
    }
  }

  function buildChips(text, terms) {
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

  // === Main timeline ===

  function run() {
    if (running) return;
    running = true; paused = false;
    Editor.reset();
    Editor.hidePlay();
    const t0 = Date.now();
    requestAnimationFrame(() => prog(t0));

    const E = Editor.el();

    // Scene 1: Empty editor (0-3s)
    sched(() => Editor.setCap('Clinician opens a new finding section'), 200);
    sched(() => { Editor.actF(E.f1); Editor.showAdd(true); }, 1000);
    sched(() => { E.ft1.innerHTML = '<span class="cur"></span>'; }, 2000);

    // Scene 2: Typing + recognition (3-14s)
    sched(() => { Editor.setCap('Terms are recognized as the clinician types'); Editor.scanOn(true); }, 3000);
    typeText(E.ft1, S2, S2T, 3500, 65, () => Editor.scanOn(false));

    // Scene 3: AI review (14-20s)
    sched(() => { Editor.setCap('Recognized terms are classified for review'); Editor.hideCur(E.ft1); }, 14000);
    sched(() => { Editor.aiPopulate(S2T); Editor.aiShow(true); }, 14500);
    sched(() => Editor.aiReveal(() => {}), 15000);
    sched(() => Editor.setCap('Physician confirms classifications'), 17000);
    sched(() => Editor.aiConfirm(() => {}), 17500);
    sched(() => { Editor.aiShow(false); E.fh1.textContent = 'Polyp — Ascending Colon'; }, 19500);

    // Scene 4: Slash command (20-28s)
    sched(() => Editor.setCap('Slash command triggers text block menu'), 20000);
    sched(() => {
      const ex = E.ft1.innerHTML.replace(/<span class="cur"><\/span>/g, '');
      E.ft1.innerHTML = ex + '<br><br><span style="color:var(--text-softest)">/</span><span class="cur"></span>';
    }, 20500);
    sched(() => { Editor.slShow(true); Editor.slSearch('/'); }, 21000);
    sched(() => { Editor.slSearch('/<strong>b</strong>'); Editor.slFilter('b'); }, 22000);
    sched(() => { Editor.slSearch('/<strong>bi</strong>'); Editor.slFilter('bi'); }, 22500);
    sched(() => Editor.slHi('biopsy-protocol'), 23000);
    sched(() => Editor.setCap('Pre-built text block populates with smart chips'), 23500);
    sched(() => {
      Editor.slShow(false);
      const tpl = 'Biopsies were obtained from the {anatomy} using {equipment}. Specimens were sent to pathology for histological evaluation.';
      E.ft1.innerHTML = buildChips(S2, S2T) + '<br><br>' + buildBlock(tpl);
    }, 24000);

    // Scene 5: Chip cascade (28-36s)
    sched(() => Editor.setCap('Dropdown chips cascade — select one, next auto-focuses'), 28000);
    sched(() => {
      const u = E.ft1.querySelectorAll('.c.empty');
      if (u[0]) ChipSystem.fillChip(u[0], 'ascending colon');
    }, 29000);
    sched(() => {
      const u = E.ft1.querySelectorAll('.c.empty');
      if (u[0]) ChipSystem.fillChip(u[0], 'biopsy forceps');
    }, 30500);
    sched(() => Editor.deactF(E.f1), 32000);

    // Scene 6: Finding 2 (33-46s)
    sched(() => Editor.setCap('Adding a second finding'), 33000);
    sched(() => { Editor.showF2(); Editor.actF(E.f2); }, 34000);
    sched(() => { E.ft2.innerHTML = '<span class="cur"></span>'; }, 35000);
    typeText(E.ft2, S6, S6T, 35500, 60, () => {
      E.fh2.textContent = 'Polyps — Sigmoid Colon';
      Editor.deactF(E.f2);
    });

    // Scene 7: Review + stats (46-58s)
    sched(() => Editor.setCap('Physician marks section as reviewed'), 46000);
    sched(() => Editor.setReview(E.f1, 'reviewBanner1'), 47000);
    sched(() => Editor.setCap('Structured report documented in under a minute'), 49000);
    sched(() => Editor.showStats(true), 51000);
    sched(() => { running = false; Editor.setProg(100); }, DUR);
  }

  function pause() { paused = true; }
  function resume() { paused = false; }
  function stop() { tids.forEach(clearTimeout); tids = []; running = false; paused = false; }

  return { run, pause, resume, stop };
})();

// Init
document.addEventListener('DOMContentLoaded', async () => {
  Editor.init();
  await AIEngine.loadTerms();

  document.getElementById('playOverlay').addEventListener('click', () => Animation.run());
  document.getElementById('replayBtn').addEventListener('click', () => {
    Animation.stop(); Editor.reset();
    setTimeout(() => Animation.run(), 300);
  });

  let p = false;
  document.getElementById('pauseBtn').addEventListener('click', e => {
    p = !p;
    if (p) { Animation.pause(); e.target.textContent = 'Resume'; e.target.classList.add('on'); }
    else { Animation.resume(); e.target.textContent = 'Pause'; e.target.classList.remove('on'); }
  });
});
