/**
 * NovaMed AI Engine
 * Handles medical term recognition and classification.
 * Simulates the AI agent that identifies clinical terminology in free text.
 */

const AIEngine = (() => {
  let termsData = null;
  let flatTerms = []; // { term, category, label, color, bgColor, aliases }

  async function loadTerms() {
    const resp = await fetch('data/terms.json');
    termsData = await resp.json();
    buildFlatIndex();
  }

  function buildFlatIndex() {
    flatTerms = [];
    for (const [catKey, cat] of Object.entries(termsData.categories)) {
      for (const t of cat.terms) {
        const entry = {
          term: t.term.toLowerCase(),
          display: t.term,
          category: catKey,
          label: cat.label,
          color: cat.color,
          bgColor: cat.bgColor,
          aliases: (t.aliases || []).map(a => a.toLowerCase())
        };
        flatTerms.push(entry);
      }
    }
    // Sort by term length descending so longer matches take priority
    flatTerms.sort((a, b) => b.term.length - a.term.length);
  }

  /**
   * Scan a string of text and return all recognized medical terms
   * with their positions, categories, and confidence scores.
   */
  function recognizeTerms(text) {
    const lower = text.toLowerCase();
    const matches = [];
    const used = new Set(); // track character positions already matched

    for (const entry of flatTerms) {
      const searchTerms = [entry.term, ...entry.aliases];

      for (const st of searchTerms) {
        let startIdx = 0;
        while (true) {
          const idx = lower.indexOf(st, startIdx);
          if (idx === -1) break;

          // Check word boundary
          const before = idx === 0 || /\W/.test(lower[idx - 1]);
          const after = (idx + st.length >= lower.length) || /\W/.test(lower[idx + st.length]);

          if (before && after) {
            // Check no overlap with existing matches
            let overlaps = false;
            for (let i = idx; i < idx + st.length; i++) {
              if (used.has(i)) { overlaps = true; break; }
            }

            if (!overlaps) {
              for (let i = idx; i < idx + st.length; i++) used.add(i);
              matches.push({
                term: entry.display,
                matchedText: text.substring(idx, idx + st.length),
                start: idx,
                end: idx + st.length,
                category: entry.category,
                label: entry.label,
                color: entry.color,
                bgColor: entry.bgColor,
                confidence: generateConfidence(entry.category)
              });
              break; // Only match first occurrence per alias
            }
          }
          startIdx = idx + 1;
        }
      }
    }

    // Sort by position in text
    matches.sort((a, b) => a.start - b.start);
    return matches;
  }

  /**
   * Generate a realistic confidence score based on category.
   * Medical locations and sizes are highly confident.
   * Severity and tissue assessments have more variance.
   */
  function generateConfidence(category) {
    const ranges = {
      anatomy: [95, 99],
      size: [97, 99],
      finding: [88, 96],
      morphology: [85, 94],
      severity: [80, 92],
      action: [93, 99],
      tissue: [82, 93],
      vascular: [86, 95],
      pathology: [84, 93],
      equipment: [96, 99],
      medication: [95, 99],
      indication: [88, 96]
    };
    const [min, max] = ranges[category] || [85, 95];
    return Math.floor(min + Math.random() * (max - min));
  }

  /**
   * Get text blocks from the loaded data
   */
  function getTextBlocks() {
    return termsData ? termsData.textBlocks : [];
  }

  /**
   * Get a specific text block by ID
   */
  function getTextBlock(id) {
    return termsData ? termsData.textBlocks.find(b => b.id === id) : null;
  }

  /**
   * Get category info
   */
  function getCategory(key) {
    return termsData ? termsData.categories[key] : null;
  }

  return {
    loadTerms,
    recognizeTerms,
    getTextBlocks,
    getTextBlock,
    getCategory
  };
})();
