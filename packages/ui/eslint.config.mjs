import { reactLibraryConfig } from '@docouno/env/eslint';

export default [
  ...reactLibraryConfig(import.meta.dirname),
  {
    files: ['src/components/Icon/Icon.tsx'],
    // The adapter contract forwards the ref as a prop during render. The adapter
    // is opaque to the hooks rule, which treats passing it as a potential read.
    rules: { 'react-hooks/refs': 'off' },
  },
];
