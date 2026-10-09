/** @param {import('../types/domain').AnalysisResult | null} result
 * @param {string | null} selectedId
 * @returns {import('../types/domain').Architecture | undefined}
 */
export function selectedArchitecture(result, selectedId) {
  return (
    result?.architectures.find((a) => a.id === selectedId) ||
    result?.recommendation
  );
}

/** Canonical display order; never mutate the ranked analysis. */
export function architectureOrder(architectures) {
  return [...architectures].sort((a, b) => a.id.localeCompare(b.id));
}

/** Compare values, not JSON key order (AI and manual responses may order keys differently). */
export function workloadChanged(draft, snapshot) {
  return Object.entries(snapshot).some(([key, value]) => draft[key] !== value);
}
