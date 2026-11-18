import { defineSpecimen } from '../../workbench/types.js';
const {
  ToastAnatomy,
  ToastControlStates,
  ToastLifetime,
  ToastModal,
  ToastOperation,
  ToastOverflow,
  ToastQueueExample,
  ToastRoles,
} = await import('./toast.examples.js');

export default defineSpecimen({
  id: 'toast',
  title: 'Toast',
  group: 'Overlays',
  summary: 'Quiet feedback, recoverable actions, and a stable notification stack.',
  defaultSurface: 'overlay',
  sections: [
    {
      id: 'roles',
      title: 'Status & material',
      kind: 'matrix',
      overlayStage: true,
      caption:
        'Five semantic glyphs and one waiting state. The surface stays neutral. These cards are pinned visual references.',
      render: () => <ToastRoles />,
    },
    {
      id: 'anatomy',
      title: 'Copy & action placement',
      kind: 'matrix',
      overlayStage: true,
      caption:
        'One size. Brief confirmations stay compact; details and longer actions receive their own row. Undo is interactive.',
      render: () => <ToastAnatomy />,
    },
    {
      id: 'states',
      title: 'Action & dismiss states',
      kind: 'states',
      overlayStage: true,
      caption:
        'Explicitly pinned rest, hover, press + focus, focus, unavailable, and pending comparisons. Only the targeted control responds.',
      render: () => <ToastControlStates />,
    },
    {
      id: 'stack',
      title: 'Compact stack & placement',
      kind: 'states',
      overlayStage: true,
      caption:
        'The action group sits at the right edge of the stack. The chevron toggles the queue from one fixed location. Cards remain selectable.',
      render: () => <ToastQueueExample />,
    },
    {
      id: 'reading',
      title: 'Reading the queue',
      kind: 'states',
      overlayStage: true,
      caption:
        'Scroll to see each card stop at the edge and the next slide over it. New notifications arrive immediately.',
      render: () => <ToastQueueExample initialExpanded />,
    },
    {
      id: 'operation',
      title: 'One operation, changing result',
      kind: 'states',
      overlayStage: true,
      caption:
        'Controlled loading → success / failure → retry. Resolve and Reject are preview controls; closing never cancels work.',
      render: () => <ToastOperation />,
    },
    {
      id: 'overflow',
      title: 'Long copy & narrow layouts',
      kind: 'states',
      overlayStage: true,
      caption:
        'Full text stays available. Long labels, file names, mixed-direction content, and recovery actions wrap without a clipped line.',
      render: () => <ToastOverflow />,
    },
    {
      id: 'lifetime',
      title: 'Available reading time',
      kind: 'context',
      overlayStage: true,
      caption:
        'Live 6 s confirmation and persistent Undo. Pointer, keyboard focus, inactive window, and the explicit preview pause combine independently.',
      render: () => <ToastLifetime />,
    },
    {
      id: 'modal',
      title: 'Above a native modal',
      kind: 'context',
      overlayStage: true,
      caption:
        'Scrim appearance plus a real dialog/manual-popover probe. The queue lives above the portal and survives opening and closing the dialog.',
      render: () => <ToastModal />,
    },
  ],
});
