import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '../../prototypes/alert/alert.proto.js';
import { Button } from '../../prototypes/button/button.proto.js';
import { defineComponent } from '../../workbench/types.js';
const {
  ActionStateExamples,
  AnatomyExamples,
  CloseStates,
  ContextExamples,
  ContextStateExamples,
  ContextBoundaryExamples,
  ContextOverlayExamples,
  OverflowExamples,
  OverlayExample,
  RecoveryExample,
  SizeExamples,
  StatusExamples,
} = await import('../../prototypes/alert/alert.examples.js');

export default defineComponent({
  id: 'alert',
  title: 'Alert',
  category: 'Feedback & Status',
  status: 'Proto',
  summary: 'Persistent, in-flow feedback. Five meanings, three densities, one calm surface.',
  props: {
    size: {
      kind: 'enum',
      group: 'Layout',
      default: 'm',
      description: 'Alert density.',
      choices: [{ value: 's' }, { value: 'm' }, { value: 'l' }],
    },
    status: {
      kind: 'enum',
      group: 'Status',
      default: 'neutral',
      description: 'Meaning of the status glyph and signal.',
      choices: [
        { value: 'neutral' },
        { value: 'info' },
        { value: 'success' },
        { value: 'warning' },
        { value: 'danger' },
      ],
    },
    title: {
      kind: 'string',
      group: 'AlertTitle',
      default: 'Review requested',
      description: 'Heading of the message.',
      demo: true,
    },
    close: {
      kind: 'boolean',
      group: 'Example',
      default: true,
      description: 'Connect a dismiss action.',
      demo: true,
    },
    onClose: {
      kind: 'action',
      group: 'Events',
      description: 'Reports the dismiss action.',
      code: 'handleClose',
    },
  },
  code: (
    values,
  ) => `<Alert${values.size === 'm' ? '' : ` size="${values.size}"`}${values.status === 'neutral' ? '' : ` status="${values.status}"`}${values.close ? ' onClose={handleClose}' : ''}>
  <AlertTitle>{${JSON.stringify(values.title)}}</AlertTitle>
  <AlertDescription>You can leave feedback before publishing.</AlertDescription>
</Alert>`,
  render: function AlertSubject({ values, ctx }) {
    const [dismissed, setDismissed] = useState(false);
    if (dismissed) {
      return (
        <Button variant="secondary" autoFocus onClick={() => setDismissed(false)}>
          Restore alert
        </Button>
      );
    }
    return (
      <Alert
        {...ctx.subject}
        size={values.size}
        status={values.status}
        {...(values.close
          ? {
              onClose: () => {
                setDismissed(true);
                ctx.action('onClose')();
              },
            }
          : {})}
      >
        <AlertTitle>{values.title}</AlertTitle>
        <AlertDescription>You can leave feedback before publishing.</AlertDescription>
      </Alert>
    );
  },
  matrixViews: [
    {
      id: 'status',
      title: 'Status & material',
      rows: 'status',
      reference: () => <StatusExamples />,
    },
    {
      id: 'sizes',
      title: 'Five statuses × S / M / L',
      rows: 'size',
      reference: () => <SizeExamples />,
    },
  ],
  cases: [
    {
      id: 'context-states',
      title: 'Contextual action states',
      kind: 'behavior',
      render: () => <ContextStateExamples />,
    },
    {
      id: 'context-boundaries',
      title: 'Color boundaries & explicit tones',
      kind: 'content',
      render: () => <ContextBoundaryExamples />,
    },
    {
      id: 'context-overlay',
      title: 'Context inside an overlay',
      surface: 'overlay',
      overlayStage: true,
      kind: 'surface',
      render: () => <ContextOverlayExamples />,
    },
    {
      id: 'anatomy',
      title: 'Anatomy & content',
      kind: 'behavior',
      render: () => <AnatomyExamples />,
    },
    {
      id: 'close',
      title: 'Close states & focus',
      kind: 'behavior',
      render: () => <CloseStates />,
    },
    {
      id: 'actions',
      title: 'Action availability & emphasis',
      kind: 'behavior',
      render: () => <ActionStateExamples />,
    },
    {
      id: 'recovery',
      title: 'Recovery & action states',
      kind: 'behavior',
      render: () => <RecoveryExample />,
    },
    {
      id: 'overflow',
      title: 'Narrow, rich & long content',
      kind: 'content',
      render: () => <OverflowExamples />,
    },
    {
      id: 'overlay',
      title: 'Inside a floating surface',
      surface: 'overlay',
      overlayStage: true,
      kind: 'surface',
      render: () => <OverlayExample />,
    },
  ],
  usage: [
    {
      id: 'context',
      title: 'Contextual content & actions',
      code: `<Alert status={status} onClose={dismiss}>
  <AlertTitle>{message.title}</AlertTitle>
  <AlertDescription>Reference <Code>{message.reference}</Code></AlertDescription>
  <AlertActions><Button variant="secondary" onClick={acknowledge}>Acknowledge</Button></AlertActions>
</Alert>`,
      render: () => <ContextExamples />,
    },
  ],
});
