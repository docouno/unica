import { Tooltip } from '@docouno/unica';
import { CopyIcon } from '@phosphor-icons/react';
import { placementAlignments, placementSides } from '../../examples/overlay-placement-options.js';
import { IconButton } from '@docouno/unica';
import { defineComponent } from '../../workbench/types.js';
import {
  TooltipContentExamples,
  TooltipContextExamples,
  TooltipLiveExamples,
  TooltipNestedExample,
  TooltipOverflowExamples,
  TooltipPlacementExamples,
  TooltipStateExamples,
} from './tooltip.examples.js';

export default defineComponent({
  id: 'tooltip',
  title: 'Tooltip',
  category: 'Overlays',
  status: 'UI',
  summary: 'A quiet label or short explanation for an existing control.',
  defaultSurface: 'overlay',
  props: {
    label: {
      kind: 'string',
      group: 'Content',
      default: 'Copy link',
      examples: ['Copy link', 'Copy the public link so anyone with access can open it.', ''],
      description: 'Short text displayed in the tooltip.',
    },
    describe: {
      kind: 'boolean',
      group: 'Content',
      default: false,
      description: 'Adds the label as an accessible description of the source.',
    },
    shortcut: {
      kind: 'slot',
      group: 'Content',
      default: 'none',
      description: 'Passive keyboard shortcut shown beside the label.',
      choices: [
        { value: 'none', label: 'None' },
        { value: 'copy', label: 'Ctrl+C', code: '"Ctrl+C"' },
      ],
    },
    side: {
      kind: 'enum',
      group: 'Placement',
      default: 'top',
      description: 'Preferred logical side relative to the source.',
      choices: placementSides.map((value) => ({ value })),
    },
    align: {
      kind: 'enum',
      group: 'Placement',
      default: 'center',
      description: 'Alignment within the chosen side.',
      choices: placementAlignments.map((value) => ({ value })),
    },
    collisionPadding: {
      kind: 'number',
      group: 'Placement',
      default: 16,
      examples: [0, 8, 16],
      description: 'Minimum distance from the viewport edges in CSS pixels.',
    },
    disabled: {
      kind: 'boolean',
      group: 'State',
      default: false,
      description: 'Prevents the tooltip from opening while the source remains usable.',
    },
    defaultOpen: {
      kind: 'boolean',
      group: 'State',
      default: false,
      description: 'Starts the uncontrolled tooltip open.',
    },
    open: {
      kind: 'enum',
      group: 'State',
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
    onOpenChange: {
      kind: 'action',
      group: 'Events',
      description: 'Reports requested visibility and the reason for the change.',
      code: 'handleOpenChange',
    },
  },
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
  code: (values, attributes) => {
    const label = values.label === 'Copy link' ? ' label="Copy link"' : '';
    const open = values.open === 'automatic' ? '' : ` open={${values.open === 'open'}}`;
    return `<Tooltip${label}${attributes}${open}>
  <button type="button" aria-label="Copy link"><CopyIcon aria-hidden="true" /></button>
</Tooltip>`;
  },
  render: ({ values, ctx }) => (
    <Tooltip
      {...ctx.subject}
      key={values.open === 'automatic' ? String(values.defaultOpen) : 'controlled'}
      label={values.label}
      describe={values.describe}
      {...(values.shortcut === 'copy' ? { shortcut: 'Ctrl+C' } : {})}
      side={values.side}
      align={values.align}
      collisionPadding={values.collisionPadding}
      disabled={values.disabled}
      defaultOpen={values.defaultOpen}
      {...(values.open === 'automatic' ? {} : { open: values.open === 'open' })}
      onOpenChange={(open, details) => ctx.action('onOpenChange')({ open, reason: details.reason })}
    >
      <IconButton {...ctx.subject} aria-label="Copy link" icon={CopyIcon} />
    </Tooltip>
  ),
  matrixViews: [
    {
      id: 'placement',
      title: 'Logical placements',
      rows: 'side',
      cols: 'align',
      surface: 'base',
      caption:
        'Hover a source to inspect its placement. The frame starts open so you can try collisions at the viewport edges.',
      reference: TooltipPlacementExamples,
    },
  ],
  cases: [
    {
      id: 'content',
      title: 'Label, shortcut and explanation',
      caption:
        'Change the visible content. Additional explanations are available to assistive technology while the tooltip is closed.',
      mode: 'pinned',
      kind: 'content',
      render: TooltipContentExamples,
    },
    {
      id: 'interaction',
      title: 'Hover, focus and dismissal',
      caption:
        'Start with Search, then move to Preferences. The first hover waits 600 ms and nearby hints appear immediately while the group is warm. Tab opens immediately. Escape dismisses the hint and activation runs the original action.',
      mode: 'live',
      kind: 'behavior',
      render: TooltipLiveExamples,
    },
    {
      id: 'states',
      title: 'Source states',
      caption:
        'Tab to Preferences to see focus and the hint. A disabled source shows its explanation in the page.',
      mode: 'live',
      overlayStage: true,
      kind: 'behavior',
      render: TooltipStateExamples,
    },
    {
      id: 'overflow',
      title: 'Long content in narrow space',
      caption:
        'The shortcut wraps as a unit. Try the full identifier and the source with an empty tooltip label.',
      mode: 'pinned',
      kind: 'content',
      render: TooltipOverflowExamples,
    },
    {
      id: 'nested',
      title: 'Inside a settings popover',
      caption:
        'Open settings and hover or Tab to Restore default settings. Escape closes the tooltip first and settings on the next press.',
      mode: 'live',
      kind: 'behavior',
      render: TooltipNestedExample,
    },
  ],
  usage: [
    {
      id: 'context',
      title: 'Compact navigation',
      caption: 'The tooltip labels a real link and shows its shortcut.',
      mode: 'pinned',
      code: `<Tooltip label="Preferences & shortcuts" shortcut="⌘," side="end">
  <Link href="/preferences" aria-label="Preferences"><GearIcon aria-hidden="true" /></Link>
</Tooltip>`,
      render: TooltipContextExamples,
    },
  ],
});
