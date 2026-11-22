import '@fontsource-variable/inter/wght-italic.css';
import '@fontsource-variable/jetbrains-mono/wght-italic.css';
import type { JSX } from 'react';
import { unicaWorkbench } from '../../../src/unica.workbench.js';
import { WorkbenchApp } from '../../../src/workbench/WorkbenchApp.js';

export default function ButtonConsumersFixture(): JSX.Element {
  return <WorkbenchApp config={unicaWorkbench} />;
}
