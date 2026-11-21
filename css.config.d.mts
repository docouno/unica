export declare const BASELINE_TARGETS: Readonly<{
  chrome: number;
  edge: number;
  firefox: number;
  safari: number;
  ios_saf: number;
}>;

export declare const VITE_CSS_TARGET: readonly string[];

export declare function createLightningCssOptions(features: {
  readonly Nesting: number;
  readonly DirSelector: number;
}): {
  targets: typeof BASELINE_TARGETS;
  include: number;
  exclude: number;
};
