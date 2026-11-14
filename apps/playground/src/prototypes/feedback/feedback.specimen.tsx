import { useState } from 'react';
import type { ReactElement } from 'react';
import { defineSpecimen } from '../../workbench/types.js';
import {
  Alert,
  Toast,
  Indicator,
  Spinner,
  Progress,
  Skeleton,
  SkeletonText,
} from './feedback.proto.js';
import { Card, CardHeader } from '../card/card.proto.js';
import { Button } from '../button/button.proto.js';
import { Text } from '../text/text.proto.js';
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
  title: 'Feedback & Progress',
  group: 'Status',
  summary: 'Status callouts, arrival messages, and honest pending-work indicators.',
  sections: [
    {
      id: 'status',
      title: 'Callouts & signals',
      kind: 'matrix',
      render: () => (
        <div className="display-example-stack">
          <Alert status="info" title="Knowledge stays connected">
            Reference verified revisions from the shared corpus.
          </Alert>
          <Alert status="warning" title="Review recommended">
            This runbook has not been exercised in the last 90 days.
          </Alert>
          <Alert status="danger" title="Import validation failed">
            Two documents contain unresolved parent references.
          </Alert>
          <div className="display-example-row">
            <Indicator status="success" label="Healthy" />
            <Indicator status="warning" label="Needs attention" />
            <Spinner size="s" />
            <Spinner size="m" />
            <Spinner size="l" />
          </div>
        </div>
      ),
    },
    {
      id: 'pending',
      title: 'Progress, indeterminate work & placeholders',
      kind: 'states',
      render: () => (
        <div className="display-example-stack display-example-measure">
          <Progress value={0} label="Preparing archive" />
          <Progress value={65} label="Indexing documents" />
          <Progress value={100} status="success" label="Validation complete" />
          <Progress label="Resolving relations" />
          <Skeleton style={{ blockSize: 100 }} />
          <SkeletonText lines={3} />
        </div>
      ),
    },
    {
      id: 'context',
      title: 'Folio · Live indexing',
      kind: 'context',
      render: () => (
        <Card>
          <CardHeader>
            <Text size="body-s" weight="semibold">
              Live indexing
            </Text>
            <Spinner size="s" />
          </CardHeader>
          <Progress value={84} label="Architecture corpus" />
          <Text size="caption-l" color="muted">
            1,284 of 1,528 documents indexed
          </Text>
        </Card>
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
