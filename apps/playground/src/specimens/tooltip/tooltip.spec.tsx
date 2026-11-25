import type { HoverPreviewChangeDetails } from '@docouno/unica';
import { placementAlignments, placementSides } from '../../examples/overlay-placement-options.js';
import { defineComponent } from '../../workbench/types.js';
import type { ComponentValues, PropSchema } from '../../workbench/types.js';
import { eventProp } from '../control-props.js';
import {
  TooltipContentExamples,
  TooltipContextExamples,
  TooltipLiveExamples,
  TooltipNestedExample,
  TooltipOverflowExamples,
  TooltipPlacementExamples,
  TooltipStateExamples,
} from './tooltip.examples.js';
import { CopyGuideLink } from './copy-guide-link.js';
import copySource from './copy-guide-link.tsx?raw';
import linkSource from './preferences-link.tsx?raw';

function select(label: string, values: readonly string[], initial: string) {
  return {
    kind: 'enum' as const,
    label,
    default: initial,
    choices: values.map((value) => ({ value })),
  };
}

const props = {
  label: {
    kind: 'string',
    group: 'Content',
    default: 'Copy link',
    examples: ['Copy link', 'Copy the link to the tooltip accessibility guide.', ''],
    description: 'Short text displayed in the tooltip.',
  },
  describe: {
    kind: 'boolean',
    group: 'Semantics',
    default: false,
    description: 'Adds the label as an accessible description of the source.',
  },
  shortcut: {
    kind: 'slot',
    group: 'Content',
    default: 'none',
    description:
      'A string or passive keycap element. With Ctrl+C selected, the focused Copy link button handles the shortcut.',
    publicType: 'string | ReactElement',
    choices: [
      { value: 'none', label: 'None' },
      { value: 'copy', label: 'Ctrl+C', code: '"Ctrl+C"' },
    ],
  },
  side: {
    kind: 'enum',
    group: 'Geometry',
    default: 'top',
    description: 'Preferred logical side relative to the source.',
    choices: placementSides.map((value) => ({ value })),
  },
  align: {
    kind: 'enum',
    group: 'Geometry',
    default: 'center',
    description: 'Alignment within the chosen side.',
    choices: placementAlignments.map((value) => ({ value })),
  },
  collisionPadding: {
    kind: 'number',
    group: 'Geometry',
    default: 16,
    examples: [0, 8, 16],
    description: 'Minimum distance from the viewport edges in CSS pixels.',
  },
  disabled: {
    kind: 'boolean',
    group: 'Availability',
    default: false,
    description: 'Prevents the tooltip from opening while the source remains usable.',
  },
  defaultOpen: {
    kind: 'boolean',
    group: 'Interaction',
    default: false,
    description: 'Starts the uncontrolled tooltip open.',
  },
  open: {
    kind: 'enum',
    group: 'Interaction',
    default: 'automatic',
    demo: true,
    description:
      'Chooses whether to pass a controlled open value. One preview is visible per document.',
    choices: [
      { value: 'automatic', label: 'Automatic' },
      { value: 'open', label: 'Controlled open' },
      { value: 'closed', label: 'Controlled closed' },
    ],
  },
  onOpenChange: eventProp(
    'Receives the requested visibility and the initiating event details. Events shows open and reason.',
    '(open, details) => console.log(open, details)',
    '(open: boolean, details: HoverPreviewChangeDetails) => void',
  ),
} as const satisfies PropSchema;

function tooltipProps(values: ComponentValues<typeof props>) {
  return {
    label: values.label,
    describe: values.describe,
    side: values.side,
    align: values.align,
    collisionPadding: values.collisionPadding,
    disabled: values.disabled,
    ...(values.open === 'automatic'
      ? { defaultOpen: values.defaultOpen }
      : { open: values.open === 'open' }),
  };
}

export default defineComponent({
  id: 'tooltip',
  title: 'Tooltip',
  category: 'Overlays',
  status: 'UI',
  summary: 'A quiet label or short explanation for an existing control.',
  defaultSurface: 'overlay',
  props,
  constraints: [
    {
      kind: 'ignored',
      when: { label: '' },
      affects: ['shortcut', 'describe', 'open', 'defaultOpen'],
      reason: 'An empty label produces no tooltip or accessible description.',
    },
    {
      kind: 'precedence',
      when: { disabled: true },
      affects: [
        { key: 'open', value: 'open' },
        { key: 'defaultOpen', value: true },
      ],
      reason: 'Disabling a tooltip suppresses its visual panel.',
    },
    {
      kind: 'precedence',
      when: { open: 'open' },
      affects: [{ key: 'defaultOpen', value: true }],
      reason: 'The controlled open value determines visibility.',
    },
    {
      kind: 'precedence',
      when: { open: 'closed' },
      affects: [{ key: 'defaultOpen', value: true }],
      reason: 'The controlled open value determines visibility.',
    },
  ],
  code: (
    values,
  ) => `${copySource.replace('export function CopyGuideLink', 'function CopyGuideLink')}

export function CopyTooltipGuide() {
  return <CopyGuideLink tooltipProps={${JSON.stringify(tooltipProps(values))}}${values.shortcut === 'copy' ? ' copyShortcut' : ''} />;
}`,
  render: ({ values, ctx }) => (
    <CopyGuideLink
      key={values.open === 'automatic' ? String(values.defaultOpen) : 'controlled'}
      copyShortcut={values.shortcut === 'copy'}
      tooltipProps={{
        ...tooltipProps(values),
        onOpenChange: (open: boolean, details: HoverPreviewChangeDetails) =>
          ctx.action('onOpenChange')({ open, reason: details.reason }),
      }}
      subject={ctx.subject}
    />
  ),
  states: [
    {
      id: 'placement',
      title: 'Logical placements',
      rows: 'side',
      cols: 'align',
      surface: 'base',
      caption:
        'Hover or focus a source to compare four logical sides and three alignments. In Viewport collisions, move the source to an edge and inspect the resulting placement.',
    },
  ],
  cases: [
    {
      id: 'placements',
      title: 'Viewport collisions',
      mode: 'live',
      kind: 'behavior',
      reset: true,
      surface: 'base',
      controls: {
        side: select('Side', placementSides, 'top'),
        align: select('Align', placementAlignments, 'center'),
        position: select('Source position', ['center', 'top-start', 'bottom-end'], 'center'),
      },
      caption:
        'Each new placement starts open in its own viewport. Move the source to either corner to see when the hint shifts or flips. Keyboard focus opens the hint and Escape dismisses it.',
      render: TooltipPlacementExamples,
    },
    {
      id: 'content',
      title: 'Label, shortcut and explanation',
      mode: 'live',
      kind: 'content',
      reset: true,
      controls: {
        content: {
          kind: 'enum',
          label: 'Tooltip content',
          default: 'shortcut',
          choices: [
            { value: 'label', label: 'Label' },
            { value: 'shortcut', label: 'Label and shortcut' },
            { value: 'description', label: 'Additional explanation' },
          ],
        },
      },
      caption:
        'Compare the label, a key hint, and an explanation. Pin inspector toggles the source. With the explanation selected, its description remains accessible while the hint is closed.',
      render: TooltipContentExamples,
    },
    {
      id: 'interaction',
      title: 'Hover, focus and dismissal',
      mode: 'live',
      kind: 'behavior',
      reset: true,
      caption:
        'Hover Search and move to Preferences. A cold hover waits 600 ms and nearby hints appear immediately while the group is warm. Tab opens a hint and Escape dismisses it. Activate a source to request its action or toggle the saved document.',
      render: TooltipLiveExamples,
    },
    {
      id: 'states',
      title: 'Source states',
      mode: 'live',
      overlayStage: true,
      kind: 'behavior',
      reset: true,
      controls: {
        source: {
          kind: 'enum',
          label: 'Source state',
          default: 'focus',
          choices: [
            { value: 'focus', label: 'Keyboard focus' },
            { value: 'selected', label: 'Selected' },
            { value: 'unavailable', label: 'Unavailable' },
          ],
        },
      },
      caption:
        'Tab to Preferences, toggle the saved document, or inspect the visible reason why Publish is unavailable.',
      render: TooltipStateExamples,
    },
    {
      id: 'overflow',
      title: 'Long content in narrow space',
      mode: 'live',
      kind: 'content',
      reset: true,
      caption:
        'The long search hint keeps its shortcut together. Hover or focus Full identifier to read the complete value, or activate it to show the value below. Empty label keeps its original button action.',
      render: TooltipOverflowExamples,
    },
    {
      id: 'nested',
      title: 'Inside a settings popover',
      mode: 'live',
      kind: 'behavior',
      reset: true,
      caption:
        'Edit the page name, then hover or Tab to Restore default settings. Activate it to restore Release notes. Escape dismisses an open hint before closing Page settings.',
      render: TooltipNestedExample,
    },
  ],
  compositions: [
    {
      id: 'context',
      title: 'Compact navigation',
      mode: 'live',
      reset: true,
      caption:
        'Follow Preferences to the settings screen. The hint displays the application shortcut. In the copy, pass your settings route as href (defaults to /preferences).',
      render: TooltipContextExamples,
      code: linkSource,
    },
  ],
});
