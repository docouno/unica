import type { JSX } from 'react';
import {
  OverlayScene,
  PortalProbe,
  ToastQueue,
} from '../../../../../packages/ui/test/browser/overlay-workbench.fixture.js';
import { unicaWorkbench } from '../../../src/unica.workbench.js';
import { WorkbenchApp } from '../../../src/workbench/WorkbenchApp.js';
import { defineComponent, defineScene } from '../../../src/workbench/types.js';

const config = {
  ...unicaWorkbench,
  components: [
    defineComponent({
      id: 'portal-probe',
      title: 'Portal probe',
      category: 'Overlays',
      status: 'UI',
      props: {},
      render: PortalProbe,
      cases: [
        {
          id: 'both-surfaces',
          title: 'Both surfaces',
          kind: 'surface',
          compareSurfaces: true,
          render: PortalProbe,
        },
      ],
    }),
  ],
  scenes: [
    defineScene({
      id: 'overlay-probe',
      title: 'Overlay probe',
      group: 'Fixtures',
      render: OverlayScene,
    }),
  ],
};

export default function OverlayWorkbenchFixture(): JSX.Element {
  return (
    <>
      <ToastQueue global />
      <WorkbenchApp config={config} />
    </>
  );
}
