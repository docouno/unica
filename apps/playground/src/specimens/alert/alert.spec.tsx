import { defineComponent } from '../../workbench/types.js';
import type { ComponentValues, PropSchema } from '../../workbench/types.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { alertCode } from './alert-code.js';
import noticeSource from './alert-notices.ts?raw';
import { AlertPlayground } from './alert-playground.js';
import {
  ActionStateExamples,
  AnatomyExamples,
  CloseStates,
  OverflowExamples,
  OverlayExample,
  RecoveryExample,
  StatusExamples,
} from './alert.examples.js';
import {
  ContextStateExamples,
  ContextBoundaryExamples,
  ContextOverlayExamples,
} from './alert.context.examples.js';
import { ContextExamples } from './alert-context-composition.examples.js';
import contextSource from './alert-context-composition.examples.tsx?raw';

const props = {
  size: {
    kind: 'enum',
    group: 'Geometry',
    default: 'm',
    description: 'Alert.size controls the spacing and typography of the message.',
    choices: [{ value: 's' }, { value: 'm' }, { value: 'l' }],
  },
  status: {
    kind: 'enum',
    group: 'Role',
    default: 'neutral',
    description:
      'Alert.status supplies the message color, built-in glyph and default announcement urgency.',
    choices: [
      { value: 'neutral' },
      { value: 'info' },
      { value: 'success' },
      { value: 'warning' },
      { value: 'danger' },
    ],
  },
  icon: {
    kind: 'slot',
    group: 'Content',
    publicType: 'GlyphSource | null | false',
    default: 'default',
    description:
      'Pass a GlyphSource. Chromatic statuses keep their built-in sign when the slot is empty.',
    choices: [
      { value: 'default', label: 'Status glyph' },
      { value: 'editorial', label: 'Lightbulb' },
      { value: 'none', label: 'No custom glyph' },
    ],
  },
  role: {
    kind: 'enum',
    group: 'Semantics',
    default: 'auto',
    description:
      'The initial preview is quiet. Show feedback publishes a message with automatic or explicit urgency. Static content and named regions stay in document order.',
    choices: [
      { value: 'auto', label: 'Automatic', omit: true },
      { value: 'none', label: 'Static' },
      { value: 'region', label: 'Named region' },
      { value: 'status', label: 'Polite status' },
      { value: 'alert', label: 'Assertive alert' },
    ],
  },
  'aria-label': {
    kind: 'string',
    group: 'Semantics',
    default: 'Review announcement',
    description: 'Accessible landmark name for the named region in this example.',
  },
  title: {
    kind: 'string',
    group: 'Content',
    default: 'Draft review',
    description: 'Text supplied to AlertTitle.',
    demo: true,
  },
  as: {
    kind: 'enum',
    group: 'Semantics',
    label: 'AlertTitle.as',
    default: 'div',
    description: 'AlertTitle.as sets the native heading level for the surrounding page.',
    choices: [
      { value: 'div' },
      { value: 'h2' },
      { value: 'h3' },
      { value: 'h4' },
      { value: 'h5' },
      { value: 'h6' },
    ],
  },
  description: {
    kind: 'string',
    group: 'Content',
    default: 'Add notes before you publish.',
    description: 'Text supplied to AlertDescription.',
    demo: true,
  },
  actionLabel: {
    kind: 'string',
    group: 'Interaction',
    default: '',
    description:
      'Label for an optional acknowledgment button in AlertActions that dismisses the notice.',
    demo: true,
  },
  close: {
    kind: 'boolean',
    group: 'Interaction',
    default: true,
    description: 'Place an AlertClose in the close slot.',
    demo: true,
  },
  closeLabel: {
    kind: 'string',
    group: 'Interaction',
    default: 'Dismiss review notice',
    description: 'Supplies the accessible name of AlertClose.',
    demo: true,
  },
  onClose: {
    kind: 'action',
    group: 'Interaction',
    publicType: 'MouseEventHandler<HTMLButtonElement>',
    description:
      'AlertClose requires a handler. It receives the button event and this example uses it to dismiss the notice.',
    code: 'handleClose',
  },
} as const satisfies PropSchema;

export type AlertValues = ComponentValues<typeof props>;

const messageType = {
  kind: 'enum',
  label: 'Message type',
  default: 'danger',
  choices: ['neutral', 'info', 'success', 'warning', 'danger'],
} as const;

export default defineComponent({
  id: 'alert',
  title: 'Alert',
  componentName: 'Alert',
  category: 'Feedback & Status',
  status: 'UI',
  summary: 'Persistent in-flow feedback for a section, page, or form.',
  props,
  constraints: [
    {
      kind: 'forbidden',
      when: { role: 'region' },
      affects: [{ key: 'aria-label', value: '' }],
      reason:
        'Give the region a landmark name. The package also accepts a heading through aria-labelledby.',
    },
    {
      kind: 'ignored',
      when: { close: false },
      affects: ['closeLabel'],
      reason: 'The close label and callback belong to the AlertClose in the close slot.',
    },
    {
      kind: 'forbidden',
      when: { close: true },
      affects: [{ key: 'closeLabel', value: '' }],
      reason: 'A visible close button requires an accessible name.',
    },
    ...(['info', 'success', 'warning', 'danger'] as const).map((status) => ({
      kind: 'precedence' as const,
      when: { status, icon: 'none' },
      affects: ['icon'],
      reason: 'A chromatic status uses its built-in sign when the custom slot is empty.',
    })),
    ...(['none', 'region', 'status', 'alert'] as const).map((role) => ({
      kind: 'precedence' as const,
      when: { role },
      affects: ['role'],
      reason: 'An explicit role controls announcement behavior independently of the status color.',
    })),
  ],
  code: alertCode,
  render: withOverlaySurface(AlertPlayground, 'border-box'),
  states: [
    {
      id: 'status',
      title: 'Status & material',
      rows: 'status',
      cols: 'icon',
      caption:
        'Compare each status with its default glyph, an editorial glyph and an empty custom slot.',
    },
    {
      id: 'sizes',
      title: 'Five statuses × S / M / L',
      rows: 'size',
      cols: 'status',
      fixed: { close: false, role: 'none', title: 'Notice', description: '' },
      caption: 'The same message shows how density changes across all five statuses.',
    },
  ],
  cases: [
    {
      id: 'status-messages',
      title: 'Writing for each status',
      kind: 'content',
      mode: 'pinned',
      caption:
        'Each message names the event and its consequence. Neutral has no built-in status glyph.',
      render: withOverlaySurface(StatusExamples, 'border-box'),
    },
    {
      id: 'context-states',
      title: 'Contextual action states',
      kind: 'behavior',
      mode: 'pinned',
      caption:
        'Choose the message type and link underline, then compare resting, pending, disabled, expanded and selected controls.',
      controls: {
        status: messageType,
        underline: {
          kind: 'enum',
          label: 'Link underline',
          default: 'always',
          choices: ['always', 'hover', 'none'],
        },
      },
      render: withOverlaySurface(ContextStateExamples, 'border-box'),
    },
    {
      id: 'context-boundaries',
      title: 'Color boundaries & explicit tones',
      kind: 'content',
      mode: 'pinned',
      caption:
        'Follow the color of code and actions through transparent text, a Card and a floating panel. Explicit tones keep their own colors.',
      render: withOverlaySurface(ContextBoundaryExamples, 'border-box'),
    },
    {
      id: 'context-overlay',
      title: 'Context inside an overlay',
      surface: 'overlay',
      overlayStage: true,
      kind: 'surface',
      mode: 'live',
      caption:
        'The panel supplies the surface. Change the message type and inspect the actions and reference inside the notice.',
      controls: { status: messageType },
      render: ContextOverlayExamples,
    },
    {
      id: 'anatomy',
      title: 'Anatomy & content',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'Compare bare text, title and description slots with a rich notice and a dismissible tip.',
      render: withOverlaySurface(AnatomyExamples, 'border-box'),
    },
    {
      id: 'close',
      title: 'Close states & focus',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Dismiss a tip with its close button or Got it. Keyboard dismissal returns focus to Source page and preserves its draft.',
      render: withOverlaySurface(CloseStates, 'border-box'),
    },
    {
      id: 'actions',
      title: 'Action availability & emphasis',
      kind: 'behavior',
      mode: 'pinned',
      caption:
        'Compare a disabled publish action with the emphasis of reconnecting and discarding a draft. These examples keep their action states fixed.',
      render: withOverlaySurface(ActionStateExamples, 'border-box'),
    },
    {
      id: 'recovery',
      title: 'Recovery & action states',
      kind: 'behavior',
      mode: 'live',
      actions: [
        { id: 'failure', label: 'Simulate failure' },
        { id: 'success', label: 'Simulate success' },
      ],
      reset: true,
      caption:
        'Start a retry in one or more previews, then choose an outcome. Only pending requests receive it.',
      render: withOverlaySurface(RecoveryExample, 'border-box'),
    },
    {
      id: 'overflow',
      title: 'Narrow, rich & long content',
      kind: 'content',
      mode: 'pinned',
      caption:
        'Compare wrapped actions, a long report link and identifier, and an Arabic message with a left-to-right release number.',
      render: withOverlaySurface(OverflowExamples, 'border-box'),
    },
    {
      id: 'overlay',
      title: 'Inside a floating surface',
      surface: 'overlay',
      overlayStage: true,
      kind: 'surface',
      mode: 'live',
      caption:
        'Choose owner focuses the required field. Enter a name to clear the error or remove it to see the requirement again.',
      render: OverlayExample,
    },
  ],
  compositions: [
    {
      id: 'context',
      title: 'Contextual content & actions',
      mode: 'live',
      caption:
        'Open guidance or details, acknowledge a notice or dismiss it. Neutral controls and inline code follow the message color.',
      code: contextSource.replace(
        "import { notices } from './alert-notices.js';",
        noticeSource.trimEnd(),
      ),
      render: withOverlaySurface(
        ({ ctx }) => <ContextExamples alertProps={ctx.subject} />,
        'border-box',
      ),
    },
  ],
});
