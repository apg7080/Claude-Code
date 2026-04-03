/**
 * NovaMed Chip System — Prototype Compatibility Layer
 * Delegates to shared NovaMed.Chips from novamed-core/chips.js
 * Keeps the ChipSystem global name used by editor.js
 */

const ChipSystem = (() => {
  const C = () => NovaMed.Chips;

  function filledChip(term) {
    return C().createFilledEl(term.term);
  }

  function unfilledChip(catKey) {
    return C().createUnfilledEl(catKey);
  }

  function fillChip(el, value) {
    C().fillChipEl(el, value);
  }

  function createAITermRow(term) {
    return C().createAITermRow(term);
  }

  function confirmTermRow(row) {
    C().confirmTermRow(row);
  }

  return { filledChip, unfilledChip, fillChip, createAITermRow, confirmTermRow };
})();
