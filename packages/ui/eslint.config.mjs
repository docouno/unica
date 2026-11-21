import { reactLibraryConfig } from '@docouno/env/eslint';

export default [
  ...reactLibraryConfig(import.meta.dirname),
  {
    files: ['src/core/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../components/*', '../../components/*'],
              message: 'Core modules must not import from component modules.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/components/Icon/Icon.tsx', 'src/components/Link/Link.tsx'],
    // These modules pass refs through opaque adapters, which the rule treats as
    // reads. Keep DOM ref reads in event handlers, effects, or other modules.
    rules: { 'react-hooks/refs': 'off' },
  },
];
