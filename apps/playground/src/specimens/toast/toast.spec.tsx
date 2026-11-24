import { defineComponent } from '../../workbench/types.js';
import type { ComponentValues, PropSchema } from '../../workbench/types.js';
import { toastCode } from './toast-code.js';
import { ToastPlayground } from './toast-playground.js';
import {
  ToastAnatomy,
  ToastControlStates,
  ToastOverflow,
  ToastRoles,
} from './toast-cards.examples.js';
import { ToastOperation, ToastLifetime } from './toast-activity.examples.js';
import { ToastReading, ToastStack } from './toast-queue.examples.js';
import { ToastModalExample } from './toast-modal.example.js';
import modalSource from './toast-modal.example.tsx?raw';

const props = {
  status: {
    kind: 'enum',
    group: 'Role',
    default: 'neutral',
    description:
      'Select the glyph and its semantic color. The card and its actions keep their surface material.',
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
    group: 'Role',
    default: false,
    description:
      'Show the neutral waiting indicator in place of the status glyph while the operation runs.',
  },
  title: {
    kind: 'string',
    group: 'Content',
    default: 'Changes saved',
    examples: ['Changes saved', 'Export'],
    description:
      'Required. Name the operation or its outcome. The example supplies a readable title when the field is blank.',
  },
  action: {
    kind: 'slot',
    group: 'Interaction',
    default: 'undo',
    publicType: 'ToastAction',
    description:
      'Optional action with a label and click handler. This example starts with an Undo action that reverts the change.',
    choices: [
      { value: 'none', label: 'None' },
      { value: 'undo', label: 'Undo' },
    ],
  },
  actionLayout: {
    kind: 'enum',
    group: 'Geometry',
    default: 'auto',
    choices: [{ value: 'auto' }, { value: 'below' }],
    description:
      'With auto, the action fits beside a short title and moves below wrapping copy or details. Below always puts it on the next row.',
  },
  onDismiss: {
    kind: 'action',
    group: 'Interaction',
    publicType: '() => void',
    description:
      'Supply a handler to show the close button and let the owner remove the notification.',
    code: 'handleDismiss',
  },
  onUndo: {
    kind: 'action',
    group: 'Interaction',
    demo: true,
    label: 'Undo action',
    description: 'The example reports the Undo command from action.onClick.',
    code: 'handleUndo',
  },
} as const satisfies PropSchema;
export type ToastValues = ComponentValues<typeof props>;

const queueControls = {
  placement: {
    kind: 'enum',
    label: 'Position',
    default: 'bottom-end',
    choices: ['bottom-start', 'bottom-center', 'bottom-end', 'top-start', 'top-center', 'top-end'],
  },
} as const;
const queueActions = [{ id: 'add', label: 'Add notification' }] as const;

export default defineComponent({
  id: 'toast',
  title: 'Toast',
  componentName: 'ToastCard',
  category: 'Feedback & Status',
  status: 'Proto',
  defaultSurface: 'overlay',
  summary:
    'Notifications for background work, reversible actions, and outcomes that remain available while the user continues working.',
  props,
  constraints: [
    {
      kind: 'ignored',
      when: { action: 'none', actionLayout: 'below' },
      affects: ['actionLayout'],
      reason: 'Action placement applies when the card has an action.',
    },
    {
      kind: 'precedence',
      when: { loading: true },
      affects: ['status'],
      reason: 'The loading indicator replaces the status glyph and uses the neutral foreground.',
    },
  ],
  code: toastCode,
  render: ToastPlayground,
  states: [
    {
      id: 'roles',
      title: 'Status glyphs on the notification surface',
      rows: 'status',
      fixed: { title: 'Export', loading: false, action: 'none' },
      overlayStage: true,
      caption:
        'Compare the five status glyphs on the same notification. The message, controls, and surface retain their normal color.',
    },
  ],
  cases: [
    {
      id: 'meaning',
      title: 'Messages and their outcomes',
      kind: 'content',
      mode: 'pinned',
      overlayStage: true,
      caption:
        'Compare a copied link, an update, a save, a partial import, a failed save, and an export in progress.',
      render: ToastRoles,
    },
    {
      id: 'anatomy',
      title: 'Copy and action placement',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      overlayStage: true,
      caption:
        'Dismiss a short confirmation, undo an archive, or retry an upload. Compare where each action fits.',
      render: ToastAnatomy,
    },
    {
      id: 'states',
      title: 'Action and close controls',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      overlayStage: true,
      caption:
        'Try Undo, dismiss the unavailable download, or retry the failed save to see the action stay focused while pending.',
      render: ToastControlStates,
    },
    {
      id: 'stack',
      title: 'Compact queue and placement',
      kind: 'behavior',
      mode: 'live',
      overlayStage: true,
      controls: queueControls,
      actions: queueActions,
      reset: true,
      caption:
        'Choose a position and add a notification. The newest message sits beside the dock, which opens the complete queue.',
      render: ToastStack,
    },
    {
      id: 'reading',
      title: 'Reading the queue',
      kind: 'behavior',
      mode: 'live',
      overlayStage: true,
      controls: queueControls,
      actions: queueActions,
      reset: true,
      caption:
        'Scroll away from the newest message, then add another. Inspect your reading position, the dock, and the controls in each visible notification.',
      render: ToastReading,
    },
    {
      id: 'operation',
      title: 'One operation, changing result',
      kind: 'behavior',
      mode: 'live',
      overlayStage: true,
      actions: [
        { id: 'resolve', label: 'Resolve' },
        { id: 'reject', label: 'Reject' },
      ],
      reset: true,
      caption:
        'Resolve or reject an export, then retry a failure. Follow the same operation while its outcome changes or its notification is hidden.',
      render: ToastOperation,
    },
    {
      id: 'overflow',
      title: 'Long copy and narrow layouts',
      kind: 'content',
      mode: 'pinned',
      overlayStage: true,
      caption:
        'Read the full titles, file name, and long action labels at a narrow width or larger text size.',
      render: ToastOverflow,
    },
    {
      id: 'lifetime',
      title: 'Available reading time',
      kind: 'behavior',
      mode: 'live',
      overlayStage: true,
      controls: { paused: { kind: 'boolean', label: 'Pause timer', default: false } },
      reset: true,
      caption:
        'Save a version and compare its six-second confirmation with a persistent Undo. Pointer, focus, inactive window, and the preview pause each hold the remaining time.',
      render: ToastLifetime,
    },
  ],
  compositions: [
    {
      id: 'modal',
      title: 'Notifications inside a native dialog',
      mode: 'live',
      overlayStage: true,
      reset: true,
      caption:
        'Choose a file name and prepare an export in the dialog. Inspect its notification, close the dialog, and return to the same queue.',
      render: ({ ctx }) => <ToastModalExample subject={ctx.subject} />,
      code: modalSource.replaceAll('../../prototypes/', './prototypes/'),
    },
  ],
});
