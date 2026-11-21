import { reactLibraryConfig } from '@docouno/env/eslint';

export default [
  ...reactLibraryConfig(import.meta.dirname),
  {
    files: ['src/components/Icon/Icon.tsx'],
    // The adapter contract forwards the caller's ref prop during render. The
    // adapter is opaque to the hooks rule, which treats passing it as a read.
    // Keep Icon.tsx free of internal useRef calls while this override applies.
    rules: { 'react-hooks/refs': 'off' },
  },
];
