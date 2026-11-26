import type { JSX } from 'react';
import chipDoc from '../../../../../docs/components/chip.md?raw';
import collection from '../../../src/scenes/03-document-collection.scene.js';
import chipGroup from '../../../src/specimens/chip/chip-group.spec.js';
import chip from '../../../src/specimens/chip/chip.spec.js';
import { unicaWorkbenchBase } from '../../../src/unica.workbench.shared.js';
import { WorkbenchApp } from '../../../src/workbench/WorkbenchApp.js';
import type { WorkbenchConfig } from '../../../src/workbench/types.js';

const config: WorkbenchConfig = {
  ...unicaWorkbenchBase,
  components: [chip, chipGroup],
  scenes: [collection],
  docs: {
    defaultImportFrom: '@docouno/unica',
    resolve: () => ({
      importFrom: '@docouno/unica',
      markdown: () => Promise.resolve(chipDoc),
      sourceLabel: 'docs/components/chip.md',
    }),
  },
};

export default function ChipWorkbenchFixture(): JSX.Element {
  return <WorkbenchApp config={config} />;
}
