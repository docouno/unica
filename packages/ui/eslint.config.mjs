import { reactLibraryConfig } from '@docouno/env/eslint';

export default [
  ...reactLibraryConfig(import.meta.dirname),
  {
    files: [
      'src/components/Icon/Icon.tsx',
      'src/components/Link/Link.tsx',
      'src/components/Link/RouterAnchor.tsx',
    ],
    // These modules pass refs through opaque adapters, which the rule treats as
    // reads. Keep DOM ref reads in event handlers, effects, or other modules.
    rules: { 'react-hooks/refs': 'off' },
  },
];
