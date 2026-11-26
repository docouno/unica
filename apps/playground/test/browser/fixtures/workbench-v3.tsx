import type { JSX } from 'react';
import alertSpec from '../../../src/specimens/alert/alert.spec.js';
import appShellSpec from '../../../src/specimens/app-shell/app-shell.spec.js';
import avatarGroupSpec from '../../../src/specimens/avatar/avatar-group.spec.js';
import avatarSpec from '../../../src/specimens/avatar/avatar.spec.js';
import blockquoteSpec from '../../../src/specimens/blockquote/blockquote.spec.js';
import buttonSpec from '../../../src/specimens/button/button.spec.js';
import accordionSpec from '../../../src/specimens/accordion/accordion.spec.js';
import collapsibleSpec from '../../../src/specimens/collapsible/collapsible.spec.js';
import containerSpec from '../../../src/specimens/layout/container.spec.js';
import linkSpec from '../../../src/specimens/link/link.spec.js';
import progressSpec from '../../../src/specimens/progress/progress.spec.js';
import tagSpec from '../../../src/specimens/tag/tag.spec.js';
import toastSpec from '../../../src/specimens/toast/toast.spec.js';
import { unicaWorkbenchBase } from '../../../src/unica.workbench.shared.js';
import { WorkbenchApp } from '../../../src/workbench/WorkbenchApp.js';
import type { WorkbenchConfig } from '../../../src/workbench/types.js';
import avatarDoc from '../../../../../docs/components/avatar.md?raw';
import buttonDoc from '../../../../../docs/components/button.md?raw';
import progressDoc from '../../../../../docs/components/progress.md?raw';

const avatarDocs = { markdown: avatarDoc, sourceLabel: 'docs/components/avatar.md' };
const docsById: Readonly<
  Record<string, { readonly markdown: string; readonly sourceLabel: string }>
> = {
  avatar: avatarDocs,
  'avatar-group': avatarDocs,
  button: { markdown: buttonDoc, sourceLabel: 'docs/components/button.md' },
  progress: { markdown: progressDoc, sourceLabel: 'docs/components/progress.md' },
};

const config: WorkbenchConfig = {
  ...unicaWorkbenchBase,
  components: [
    buttonSpec,
    progressSpec,
    appShellSpec,
    alertSpec,
    avatarSpec,
    avatarGroupSpec,
    blockquoteSpec,
    accordionSpec,
    collapsibleSpec,
    containerSpec,
    linkSpec,
    tagSpec,
    toastSpec,
  ],
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
