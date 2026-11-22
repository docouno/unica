import type { ReactElement } from 'react';
import input from '../../../src/specimens/input/input.spec.js';
import formField from '../../../src/specimens/form-field/form-field.spec.js';
import contextMenu from '../../../src/specimens/menu/context-menu.spec.js';
import { WorkbenchApp } from '../../../src/workbench/WorkbenchApp.js';
import { unicaWorkbenchBase } from '../../../src/unica.workbench.shared.js';

const config = { ...unicaWorkbenchBase, components: [input, formField, contextMenu], scenes: [] };

export default function InputWorkbench(): ReactElement {
  return <WorkbenchApp config={config} />;
}
