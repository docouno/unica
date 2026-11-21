import '@fontsource-variable/inter/wght-italic.css';
import '@fontsource-variable/jetbrains-mono/wght-italic.css';
import type { JSX } from 'react';
import empty from '../../../src/specimens/empty/empty.spec.js';
import text from '../../../src/specimens/text/text.spec.js';
import title from '../../../src/specimens/title/title.spec.js';
import { unicaWorkbenchBase } from '../../../src/unica.workbench.shared.js';
import { WorkbenchApp } from '../../../src/workbench/WorkbenchApp.js';

const catalog = { ...unicaWorkbenchBase, components: [text, title, empty], scenes: [] };

export default function TypographyWorkbenchFixture(): JSX.Element {
  return <WorkbenchApp config={catalog} />;
}
