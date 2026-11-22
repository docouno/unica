import { useState } from 'react';
import { Button } from '@docouno/unica';
import { ToastCard } from '../../prototypes/toast/toast.proto.js';
import { defineComponent } from '../../workbench/types.js';
const {
  ToastAnatomy,
  ToastControlStates,
  ToastLifetime,
  ToastModal,
  ToastOperation,
  ToastOverflow,
  ToastQueueExample,
  ToastRoles,
} = await import('../../prototypes/toast/toast.examples.js');

export default defineComponent({
  id: 'toast',
  title: 'Toast',
  category: 'Feedback & Status',
  status: 'Proto',
  summary: 'Quiet feedback, recoverable actions, and a stable notification stack.',
  defaultSurface: 'overlay',
  componentName: 'ToastCard',
  props: {
    status: {
      kind: 'enum',
      group: 'Status',
      default: 'neutral',
      description: 'Meaning of the status signal and glyph.',
      choices: [
        { value: 'neutral' },
        { value: 'info' },
        { value: 'success' },
        { value: 'warning' },
        { value: 'danger' },
      ],
    },
    loading: {
      kind: 'boolean',
      group: 'Status',
      default: false,
      description: 'Show the waiting indicator in place of the semantic glyph.',
    },
    title: {
      kind: 'string',
      group: 'Content',
      default: 'Changes saved',
      description: 'Short visible notification title.',
    },
    layout: {
      kind: 'enum',
      group: 'Action',
      default: 'auto',
      description: 'Let the action fit inline or put it below the title.',
      choices: [{ value: 'auto' }, { value: 'below' }],
    },
    undo: {
      kind: 'boolean',
      group: 'Example',
      default: true,
      description: 'Include a real Undo control in the example.',
      demo: true,
    },
    onUndo: {
      kind: 'action',
      group: 'Events',
      description: 'Reports activation of Undo.',
      code: 'handleUndo',
    },
    onDismiss: {
      kind: 'action',
      group: 'Events',
      description: 'Reports dismissal of the notification.',
      code: 'handleDismiss',
    },
  },
  constraints: [
    {
      kind: 'ignored',
      when: { undo: false },
      affects: ['layout'],
      reason: 'Action placement has no effect when the example has no Undo action.',
    },
  ],
  code: (values) =>
    `<ToastCard title={${JSON.stringify(values.title)}}${values.status === 'neutral' ? '' : ` status="${values.status}"`}${values.loading ? ' loading' : ''}${values.undo ? ' action={{ label: "Undo", onClick: handleUndo }}' : ''}${values.layout === 'below' ? ' actionLayout="below"' : ''} onDismiss={handleDismiss} />`,
  render: function ToastSubject({ values, ctx }) {
    const [dismissed, setDismissed] = useState(false);
    const [undone, setUndone] = useState(false);
    if (dismissed) {
      return (
        <Button
          tone="accent"
          variant="secondary"
          autoFocus
          onClick={() => {
            setDismissed(false);
            setUndone(false);
          }}
        >
          Restore toast
        </Button>
      );
    }
    return (
      <ToastCard
        {...ctx.subject}
        status={values.status}
        loading={values.loading}
        title={undone ? 'Changes reverted' : values.title}
        actionLayout={values.layout}
        action={
          values.undo && !undone
            ? {
                label: 'Undo',
                onClick: () => {
                  setUndone(true);
                  ctx.action('onUndo')();
                },
              }
            : undefined
        }
        onDismiss={() => {
          setDismissed(true);
          ctx.action('onDismiss')();
        }}
      />
    );
  },
  matrixViews: [
    {
      id: 'roles',
      title: 'Status & material',
      rows: 'status',
      cols: 'loading',
      overlayStage: true,
      caption:
        'Five semantic glyphs and one waiting state. The surface stays neutral. These cards are pinned visual references.',
      reference: () => <ToastRoles />,
    },
  ],
  cases: [
    {
      id: 'anatomy',
      title: 'Copy & action placement',
      overlayStage: true,
      caption:
        'One size. Brief confirmations stay compact; details and longer actions receive their own row. Undo is interactive.',
      kind: 'behavior',
      render: () => <ToastAnatomy />,
    },
    {
      id: 'states',
      title: 'Action & dismiss states',
      overlayStage: true,
      caption: 'Hover, hold, or Tab to the controls. Compare unavailable and pending actions.',
      kind: 'behavior',
      render: () => <ToastControlStates />,
    },
    {
      id: 'stack',
      title: 'Compact stack & placement',
      overlayStage: true,
      caption:
        'The action group sits at the right edge of the stack. The chevron toggles the queue from one fixed location. Cards remain selectable.',
      kind: 'behavior',
      render: () => <ToastQueueExample />,
    },
    {
      id: 'reading',
      title: 'Reading the queue',
      overlayStage: true,
      caption:
        'Scroll to see each card stop at the edge and the next slide over it. New notifications arrive immediately.',
      kind: 'behavior',
      render: () => <ToastQueueExample initialExpanded />,
    },
    {
      id: 'operation',
      title: 'One operation, changing result',
      overlayStage: true,
      caption:
        'Controlled loading → success / failure → retry. Resolve and Reject are preview controls; closing never cancels work.',
      kind: 'behavior',
      render: () => <ToastOperation />,
    },
    {
      id: 'overflow',
      title: 'Long copy & narrow layouts',
      overlayStage: true,
      caption:
        'Full text stays available. Long labels, file names, mixed-direction content, and recovery actions wrap without a clipped line.',
      kind: 'content',
      render: () => <ToastOverflow />,
    },
    {
      id: 'lifetime',
      title: 'Available reading time',
      overlayStage: true,
      caption:
        'Live 6 s confirmation and persistent Undo. Pointer, keyboard focus, inactive window, and the explicit preview pause combine independently.',
      kind: 'behavior',
      render: () => <ToastLifetime />,
    },
  ],
  usage: [
    {
      id: 'modal',
      title: 'Above a native modal',
      overlayStage: true,
      caption:
        'Scrim appearance plus a real dialog/manual-popover probe. The queue lives above the portal and survives opening and closing the dialog.',
      code: `<dialog ref={dialog}>
  {content}
  <div ref={popover} popover="manual">
    <ToastViewport items={items} onDismiss={dismiss} onDismissAll={dismissAll} />
  </div>
</dialog>`,
      render: () => <ToastModal />,
    },
  ],
});
