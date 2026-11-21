import { browserConfig } from '@docouno/env/eslint';

export default [
  ...browserConfig(import.meta.dirname),
  {
    files: [
      'src/specimens/**/*.spec.tsx',
      'src/scenes/**/*.scene.tsx',
      'src/unica.workbench.tsx',
      'src/unica.workbench.shared.tsx',
    ],
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
            '**/specimens/**',
            '**/scenes/**',
            '**/unica*',
          ],
        },
      ],
    },
  },
];
