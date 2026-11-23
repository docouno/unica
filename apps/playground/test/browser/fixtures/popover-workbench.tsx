import type { JSX } from 'react';
import popoverSpec from '../../../src/specimens/popover/popover.spec.js';
import { unicaWorkbenchBase } from '../../../src/unica.workbench.shared.js';
import { WorkbenchApp } from '../../../src/workbench/WorkbenchApp.js';

const config = { ...unicaWorkbenchBase, components: [popoverSpec], scenes: [] };

export default function PopoverWorkbenchFixture(): JSX.Element {
  return <WorkbenchApp config={config} />;
}
