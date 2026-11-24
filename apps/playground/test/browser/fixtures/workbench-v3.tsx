import type { JSX } from 'react';
import appShellSpec from '../../../src/specimens/app-shell/app-shell.spec.js';
import buttonSpec from '../../../src/specimens/button/button.spec.js';
import progressSpec from '../../../src/specimens/progress/progress.spec.js';
import { unicaWorkbenchBase } from '../../../src/unica.workbench.shared.js';
import { WorkbenchApp } from '../../../src/workbench/WorkbenchApp.js';
import type { WorkbenchConfig } from '../../../src/workbench/types.js';
import buttonDoc from '../../../../../docs/components/button.md?raw';
import progressDoc from '../../../../../docs/components/progress.md?raw';

const docsById: Readonly<
  Record<string, { readonly markdown: string; readonly sourceLabel: string }>
> = {
  button: { markdown: buttonDoc, sourceLabel: 'docs/components/button.md' },
  progress: { markdown: progressDoc, sourceLabel: 'docs/components/progress.md' },
};

const config: WorkbenchConfig = {
  ...unicaWorkbenchBase,
  components: [buttonSpec, progressSpec, appShellSpec],
  scenes: [],
  docs: {
    defaultImportFrom: '@docouno/unica',
    resolve: (component) => {
      const entry = docsById[component.id];
      return entry
        ? {
            importFrom: '@docouno/unica',
            markdown: () => Promise.resolve(entry.markdown),
            sourceLabel: entry.sourceLabel,
          }
        : undefined;
    },
  },
};

export default function WorkbenchV3Fixture(): JSX.Element {
  return <WorkbenchApp config={config} />;
}
