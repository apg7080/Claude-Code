/**
 * NovaMed Editor Controller
 */

const Editor = (() => {
  const el = {};

  function init() {
    el.editor = document.getElementById('editor');
    el.editorBody = document.getElementById('editorBody');
    el.f1 = document.getElementById('finding1');
    el.f2 = document.getElementById('finding2');
    el.ft1 = document.getElementById('findingText1');
    el.ft2 = document.getElementById('findingText2');
    el.fb1 = document.getElementById('findingBody1');
    el.fh1 = document.getElementById('findingTitle1');
    el.fh2 = document.getElementById('findingTitle2');
    el.aiP = document.getElementById('aiPanel1');
    el.aiB = document.getElementById('aiPanelBody1');
    el.sl = document.getElementById('slashMenu');
    el.slS = document.getElementById('slashSearch');
    el.scan = document.getElementById('scanLine1');
    el.addBtn = document.getElementById('addFindingBtn');
    el.rev1 = document.getElementById('reviewBanner1');
    el.prog = document.getElementById('progressFill');
    el.cap = document.getElementById('sceneCaption');
    el.play = document.getElementById('playOverlay');
    el.stats = document.getElementById('statsFootnote');
  }

  const ph = txt => { txt.innerHTML = '<span class="ph">Begin writing or select from Text Blocks...</span>'; };
  const phAdd = txt => { txt.innerHTML = '<span class="ph">Add another finding, start typing, or hit "/" to add Text Blocks</span>'; };
  const actF = f => f.classList.add('active');
  const deactF = f => f.classList.remove('active');
  const showCur = t => { hideCur(t); const c = document.createElement('span'); c.className = 'cur'; t.appendChild(c); };
  const hideCur = t => { const c = t.querySelector('.cur'); if (c) c.remove(); };
  const scanOn = on => el.scan.classList.toggle('on', on);

  const slShow = on => el.sl.classList.toggle('open', on);
  const slSearch = txt => { el.slS.innerHTML = txt; };
  function slFilter(q) {
    const items = el.sl.querySelectorAll('.sl-item');
    let first = null;
    items.forEach(i => {
      const t = i.querySelector('.sl-txt').textContent.toLowerCase();
      const m = !q || t.includes(q.toLowerCase());
      i.classList.toggle('hid', !m);
      i.classList.remove('hi');
      if (m && !first) first = i;
    });
    if (first) first.classList.add('hi');
  }
  function slHi(id) {
    el.sl.querySelectorAll('.sl-item').forEach(i => i.classList.toggle('hi', i.dataset.block === id));
  }

  const aiShow = on => el.aiP.classList.toggle('vis', on);
  function aiPopulate(terms) {
    el.aiB.innerHTML = '';
    terms.forEach(t => el.aiB.appendChild(ChipSystem.createAITermRow(t)));
  }
  function aiReveal(cb) {
    const rows = el.aiB.querySelectorAll('.ai-row');
    rows.forEach((r, i) => setTimeout(() => { r.classList.add('vis'); if (i === rows.length - 1 && cb) setTimeout(cb, 300); }, i * 150));
  }
  function aiConfirm(cb) {
    const rows = el.aiB.querySelectorAll('.ai-row');
    rows.forEach((r, i) => setTimeout(() => { ChipSystem.confirmTermRow(r); if (i === rows.length - 1 && cb) setTimeout(cb, 400); }, i * 100));
  }

  function showF2() {
    el.f2.style.display = '';
    el.f2.style.opacity = '0';
    el.f2.style.transform = 'translateY(6px)';
    anime({ targets: el.f2, opacity: 1, translateY: 0, duration: 350, easing: 'easeOutCubic' });
  }

  function setReview(f, banId) {
    f.classList.add('review');
    f.classList.remove('active');
    document.getElementById(banId)?.classList.add('vis');
  }

  // setProg, setCap, hidePlay, showPlay now handled by NovaMed.Timeline
  // Keep local stubs for backwards compatibility with Editor.reset()
  const setProg = p => { if (el.prog) el.prog.style.width = p + '%'; };
  const setCap = (text) => {
    if (el.cap) { el.cap.classList.remove('show'); el.cap.innerHTML = ''; }
  };
  const hidePlay = () => { if (el.play) el.play.classList.add('hidden'); };
  const showPlay = () => { if (el.play) el.play.classList.remove('hidden'); };
  const showStats = on => el.stats.classList.toggle('vis', on);
  const showAdd = on => el.addBtn.classList.toggle('vis', on);

  function reset() {
    ph(el.ft1);
    el.f1.classList.remove('active', 'review');
    el.f2.style.display = 'none';
    el.aiP.classList.remove('vis');
    el.aiB.innerHTML = '';
    el.sl.classList.remove('open');
    el.scan.classList.remove('on');
    el.addBtn.classList.remove('vis');
    el.rev1.classList.remove('vis');
    el.stats.classList.remove('vis');
    el.fh1.textContent = 'Finding';
    el.fh2.textContent = 'Finding';
    if (el.ft2) {
      el.ft2.innerHTML = '<span class="ph">Begin writing or select from Text Blocks...</span>';
    }
    setProg(0);
    setCap('');
    el.sl.querySelectorAll('.sl-item').forEach(i => { i.classList.remove('hid', 'hi'); });
    el.sl.querySelector('.sl-item').classList.add('hi');
    el.slS.innerHTML = '/';
  }

  return {
    init, el: () => el,
    ph, actF, deactF, showCur, hideCur, scanOn,
    slShow, slSearch, slFilter, slHi,
    aiShow, aiPopulate, aiReveal, aiConfirm,
    showF2, setReview, setProg, setCap,
    hidePlay, showPlay, showStats, showAdd, reset
  };
})();
