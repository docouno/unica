import { defineComponent } from '../../workbench/types.js';
import type { ComponentValues, PropSchema } from '../../workbench/types.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { badgeCode } from './badge-code.js';
import { InlineExample } from './badge-inline.examples.js';
import inlineSource from './badge-inline.examples.tsx?raw';
import { BadgePlayground } from './badge-playground.js';
import {
  ChangesExample,
  CountsExample,
  InteractionExample,
  OverflowExample,
  PaletteExample,
  PinnedInteractionExample,
} from './badge.examples.js';

const props = {
  status: {
    kind: 'enum',
    group: 'Role',
    default: 'neutral',
    description: 'Meaning of the label and its leading cue.',
    choices: [
      { value: 'neutral' },
      { value: 'accent' },
      { value: 'info' },
      { value: 'success' },
      { value: 'warning' },
      { value: 'danger' },
    ],
  },
  size: {
    kind: 'enum',
    group: 'Geometry',
    default: 'm',
    description: 'Minimum badge height, label size and leading cue size.',
    choices: [{ value: 's' }, { value: 'm' }, { value: 'l' }],
  },
  dot: {
    kind: 'boolean',
    group: 'Content',
    default: false,
    description: 'Add a leading status indicator.',
  },
  iconLeft: {
    kind: 'slot',
    group: 'Content',
    default: 'none',
    publicType: 'GlyphSource',
    description: 'A decorative GlyphSource in the leading slot.',
    choices: [
      { value: 'none', label: 'None' },
      { value: 'InfoIcon', label: 'Info', code: 'InfoIcon' },
      { value: 'CheckCircleIcon', label: 'Check', code: 'CheckCircleIcon' },
    ],
  },
  children: {
    kind: 'string',
    group: 'Content',
    default: 'Review',
    examples: ['Review', '0', '99+', ''],
    publicType: 'ReactNode',
    description:
      'Required. This example starts with “Review”. With asChild, put the label inside one native link or button.',
  },
  element: {
    kind: 'enum',
    group: 'Host',
    demo: true,
    default: 'span',
    description: 'Choose a passive span or supply a native link or button through Badge.asChild.',
    choices: [
      { value: 'span', label: 'Passive' },
      { value: 'a', label: 'Link' },
      { value: 'button', label: 'Button' },
    ],
  },
  href: {
    kind: 'enum',
    group: 'Host',
    demo: true,
    default: 'none',
    description: 'Add a fragment destination to the anchor.',
    choices: [
      { value: 'none', label: 'No destination' },
      { value: 'details', label: 'Details' },
    ],
  },
  disabled: {
    kind: 'boolean',
    group: 'Host',
    demo: true,
    default: false,
    description: 'Disable the native button.',
  },
  onClick: {
    kind: 'action',
    group: 'Host',
    demo: true,
    code: 'handleClick',
    description:
      'The sample records activation of a link with a destination or an enabled details button.',
  },
} as const satisfies PropSchema;

export type BadgeValues = ComponentValues<typeof props>;

export default defineComponent({
  id: 'badge',
  title: 'Badge',
  category: 'Feedback & Status',
  status: 'UI',
  summary: 'Compact inline labels for an object’s status, category, version or count.',
  componentName: 'Badge',
  props,
  constraints: [
    ...(['InfoIcon', 'CheckCircleIcon'] as const).map((iconLeft) => ({
      kind: 'precedence' as const,
      when: { iconLeft },
      affects: [{ key: 'dot', value: true }],
      reason: 'A leading glyph takes precedence over the dot.',
    })),
    ...(['span', 'button'] as const).map((element) => ({
      kind: 'ignored' as const,
      when: { element },
      affects: [{ key: 'href', value: 'details' }],
      reason: 'A destination only applies to an anchor.',
    })),
    ...(['span', 'a'] as const).map((element) => ({
      kind: 'ignored' as const,
      when: { element },
      affects: [{ key: 'disabled', value: true }],
      reason: 'Only the button supports native disabled state.',
    })),
    {
      kind: 'ignored',
      when: { children: '' },
      affects: ['element', 'dot', 'iconLeft'],
      reason: 'An empty label renders no badge.',
    },
  ],
  render: withOverlaySurface(BadgePlayground, 'border-box'),
  code: badgeCode,
  states: [
    {
      id: 'palette',
      rows: 'status',
      cols: 'dot',
      title: 'Status and leading dot',
      caption: 'Compare the same label in six statuses, with and without its decorative dot.',
    },
    {
      id: 'scale',
      rows: 'size',
      cols: 'dot',
      title: 'Label and cue sizes',
      fixed: { status: 'info', children: 'Review' },
      caption: 'Compare the minimum height, text and leading dot at each of the three sizes.',
    },
  ],
  cases: [
    {
      id: 'counts',
      title: 'Counts in context',
      kind: 'content',
      mode: 'pinned',
      caption:
        'A count shares the surrounding baseline. Zero is a value, and the application chooses whether to cap large quantities.',
      render: withOverlaySurface(CountsExample, 'border-box'),
    },
    {
      id: 'overflow',
      title: 'Long labels and narrow spaces',
      kind: 'content',
      mode: 'pinned',
      caption:
        'The leading cue keeps its size while a long label shortens. Read the full labels next to each example and compare where a group wraps.',
      render: withOverlaySurface(OverflowExample, 'border-box'),
    },
    {
      id: 'button-states',
      title: 'Native button states',
      kind: 'behavior',
      mode: 'pinned',
      caption:
        'Compare the resting, hovered, pressed, focused and disabled appearances of the same native button.',
      render: withOverlaySurface(PinnedInteractionExample, 'border-box'),
    },
    {
      id: 'interaction',
      title: 'Inspectable metadata',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Tab reaches the version link and the review button. Follow the version to its notes, or open and close review details with Enter or Space.',
      render: withOverlaySurface(InteractionExample, 'border-box'),
    },
    {
      id: 'changes',
      title: 'Changing status',
      kind: 'behavior',
      mode: 'live',
      controls: {
        outcome: {
          kind: 'enum',
          label: 'Check result',
          default: 'verified',
          choices: [
            { value: 'verified', label: 'Verified' },
            { value: 'review', label: 'Needs review' },
            { value: 'blocked', label: 'Blocked' },
          ],
        },
      },
      actions: [{ id: 'complete', label: 'Complete pending checks' }],
      reset: true,
      caption:
        'Check a document, choose the result, then complete the pending checks. Each document announces its own progress and result.',
      render: withOverlaySurface(ChangesExample, 'border-box'),
    },
    {
      id: 'surfaces',
      title: 'Status cues on Base and Overlay',
      kind: 'surface',
      mode: 'pinned',
      compareSurfaces: true,
      caption:
        'Compare each status as text, with a dot and with a glyph. The fill, rim and dot follow the active material.',
      render: withOverlaySurface(PaletteExample, 'border-box'),
    },
  ],
  compositions: [
    {
      id: 'inline',
      title: 'In the reading flow',
      mode: 'pinned',
      caption:
        'Small badges align with body text and dense rows. A medium badge marks the heading while keeping its own type size.',
      code: inlineSource,
      render: withOverlaySurface(
        ({ ctx }) => <InlineExample badgeProps={ctx.subject} />,
        'border-box',
      ),
    },
  ],
});
