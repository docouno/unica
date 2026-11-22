import type { ReactElement } from 'react';
import card from '../../../src/specimens/card/card.spec.js';
import contextMenu from '../../../src/specimens/menu/context-menu.spec.js';
import { unicaWorkbenchBase } from '../../../src/unica.workbench.shared.js';
import { WorkbenchApp } from '../../../src/workbench/WorkbenchApp.js';

const catalog = {
  ...unicaWorkbenchBase,
  components: [card, contextMenu],
  scenes: [],
};

export default function CardWorkbenchFixture(): ReactElement {
  return <WorkbenchApp config={catalog} />;
}
