import { browserConfig } from '@docouno/env/eslint';

export default [
  ...browserConfig(import.meta.dirname),
  {
    files: ['src/**/*.specimen.tsx', 'src/**/*.scene.tsx', 'src/unica.workbench.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['src/workbench/**/*.ts', 'src/workbench/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            '@docouno/*',
            '**/packages/**',
            '**/prototypes/**',
            '**/scenes/**',
            '**/unica*',
          ],
        },
      ],
    },
  },
];
