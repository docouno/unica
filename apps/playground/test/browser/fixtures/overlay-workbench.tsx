import type { JSX } from 'react';
import {
  OverlayScene,
  PortaledDialogFormProbe,
  PortalProbe,
  ToastQueue,
} from '../../../../../packages/ui/test/browser/overlay-workbench.fixture.js';
import { unicaWorkbenchBase } from '../../../src/unica.workbench.shared.js';
import { WorkbenchApp } from '../../../src/workbench/WorkbenchApp.js';
import { defineComponent, defineScene } from '../../../src/workbench/types.js';

const config = {
  ...unicaWorkbenchBase,
  components: [
    defineComponent({
      id: 'portal-probe',
      title: 'Portal probe',
      category: 'Overlays',
      status: 'UI',
      props: {},
      render: ({ ctx }) => <PortalProbe subject={ctx.subject} />,
      cases: [
        {
          id: 'both-surfaces',
          title: 'Both surfaces',
          kind: 'surface',
          compareSurfaces: true,
          render: () => <PortalProbe />,
        },
      ],
    }),
    defineComponent({
      id: 'portal-dialog-probe',
      title: 'Portal dialog probe',
      category: 'Overlays',
      status: 'UI',
      form: 'owned',
      props: {},
      render: ({ ctx }) => <PortaledDialogFormProbe subject={ctx.subject} form={ctx.form} />,
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
