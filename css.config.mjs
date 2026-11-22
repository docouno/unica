// Exact Baseline tier from docs/concepts/support-and-accessibility.md:
// Chrome/Edge 114+, Firefox 125+, Safari/iOS 17.0+
export const BASELINE_TARGETS = Object.freeze({
  chrome: 114 << 16,
  edge: 114 << 16,
  firefox: 125 << 16,
  safari: 17 << 16,
  ios_saf: 17 << 16,
});

export const VITE_CSS_TARGET = Object.freeze([
  'chrome114',
  'edge114',
  'firefox125',
  'safari17',
  'ios17',
]);

export function createLightningCssOptions(Features) {
  return {
    targets: BASELINE_TARGETS,
    include: Features.Nesting,
    exclude: Features.DirSelector,
  };
}
