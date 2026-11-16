import { useState } from 'react';
import type { ReactElement } from 'react';
import { defineSpecimen } from '../../workbench/types.js';
import { Toast, Indicator } from './feedback.proto.js';
import { Button } from '../button/button.proto.js';
import '../card/display.examples.css';

function ToastExample(): ReactElement {
  const [open, setOpen] = useState(true);
  return (
    <div className="display-example-stack">
      {open ? (
        <Toast status="success" title="Runbook published" onDismiss={() => setOpen(false)}>
          The verified revision is available to your workspace.
        </Toast>
      ) : (
        <Button size="s" variant="secondary" tone="neutral" onClick={() => setOpen(true)}>
          Show notification
        </Button>
      )}
    </div>
  );
}

export default defineSpecimen({
  id: 'feedback',
  title: 'Toast sketch',
  group: 'Status',
  summary: 'Early toast sketch. In-flow callouts live in Alert.',
  sections: [
    {
      id: 'status',
      title: 'Signals',
      kind: 'matrix',
      render: () => (
        <div className="display-example-stack">
          <div className="display-example-row">
            <Indicator status="success" label="Healthy" />
            <Indicator status="warning" label="Needs attention" />
          </div>
        </div>
      ),
    },
    {
      id: 'toast',
      title: 'Folio · Publication notification',
      kind: 'context',
      surface: 'overlay',
      overlayStage: true,
      render: () => <ToastExample />,
    },
  ],
});
