import { CopyIcon } from '@phosphor-icons/react';
import { IconButton } from '../../prototypes/button/button.proto.js';
import { HintPreview } from '../../prototypes/tooltip/tooltip.preview.js';
import { defineComponent } from '../../workbench/types.js';

const {
  TooltipContentExamples,
  TooltipContextExamples,
  TooltipLiveExamples,
  TooltipOverflowExamples,
  TooltipPlacementExamples,
  TooltipStateExamples,
} = await import('../../prototypes/tooltip/tooltip.examples.js');

export default defineComponent({
  id: 'tooltip',
  title: 'Tooltip',
  category: 'Overlays',
  status: 'Proto',
  summary: 'A quiet label or short explanation. No arrow, no actions, no interruption.',
  defaultSurface: 'overlay',
  props: {
    side: {
      kind: 'enum',
      group: 'Placement',
      default: 'top',
      description: 'Preferred placement relative to the trigger.',
      choices: [{ value: 'top' }, { value: 'bottom' }, { value: 'start' }, { value: 'end' }],
    },
    align: {
      kind: 'enum',
      group: 'Placement',
      default: 'center',
      description: 'Alignment within the chosen side.',
      choices: [{ value: 'start' }, { value: 'center' }, { value: 'end' }],
    },
    label: {
      kind: 'string',
      group: 'Example',
      default: 'Copy link to this example',
      description: 'Short tooltip text.',
      demo: true,
    },
    shortcut: {
      kind: 'slot',
      group: 'Content',
      default: 'none',
      description: 'Optional keyboard shortcut shown beside the label.',
      choices: [
        { value: 'none', label: 'None' },
        { value: 'copy', label: 'Ctrl+C', code: '"Ctrl+C"' },
      ],
    },
    onOpenChange: {
      kind: 'action',
      group: 'Events',
      description: 'Reports panel opening and dismissal.',
      code: 'handleOpenChange',
    },
  },
  code: (
    values,
  ) => `<HintPreview${values.side === 'top' ? '' : ` side="${values.side}"`}${values.align === 'center' ? '' : ` align="${values.align}"`}${values.shortcut === 'copy' ? ' shortcut="Ctrl+C"' : ''} onOpenChange={handleOpenChange}
  description={${JSON.stringify(values.label)}}
  trigger={(bindings) => <IconButton {...bindings} aria-label="Copy link" icon={CopyIcon} />}
>
  {${JSON.stringify(values.label)}}
</HintPreview>`,
  render: ({ values, ctx }) => (
    <HintPreview
      side={values.side}
      align={values.align}
      description={values.label}
      shortcut={values.shortcut === 'copy' ? 'Ctrl+C' : null}
      panelAttributes={ctx.subject}
      onOpenChange={ctx.action('onOpenChange')}
      trigger={(bindings) => (
        <IconButton {...bindings} {...ctx.subject} aria-label="Copy link" icon={CopyIcon} />
      )}
    >
      {values.label}
    </HintPreview>
  ),
  matrixViews: [
    {
      id: 'placement',
      title: 'Twelve logical placements',
      rows: 'side',
      cols: 'align',
      caption:
        'Live native top layer in a bounded frame. Start/end mirror in RTL. Hover the source to inspect the selected placement.',
      overlayStage: true,
      reference: () => <TooltipPlacementExamples />,
    },
  ],
  cases: [
    {
      id: 'content',
      title: 'Label · Shortcut · Explanation',
      caption:
        'Pinned in flow for comparison. One compact size, 20rem ceiling, shared surface radius. Shortcuts are passive.',
      overlayStage: true,
      kind: 'behavior',
      render: () => <TooltipContentExamples />,
    },
    {
      id: 'interaction',
      title: 'Hover · Focus · Dismiss',
      caption:
        'Live: first hover 600ms, nearby hints warm for 300ms. Keyboard focus opens immediately. Escape or activation hides the hint; touch activates directly.',
      overlayStage: true,
      kind: 'behavior',
      render: () => <TooltipLiveExamples />,
    },
    {
      id: 'states',
      title: 'Focus · Selection · Availability',
      caption:
        'Pinned focus and selection belong to the source. A disabled control has no hover hint; its explanation remains visible.',
      overlayStage: true,
      kind: 'behavior',
      render: () => <TooltipStateExamples />,
    },
    {
      id: 'overflow',
      title: 'Long content · Narrow space',
      caption:
        'Text wraps without truncation. A chord moves below the label when needed. Empty labels produce no panel.',
      overlayStage: true,
      kind: 'content',
      render: () => <TooltipOverflowExamples />,
    },
  ],
  usage: [
    {
      id: 'context',
      title: 'Beside compact navigation',
      caption:
        'Pinned source and hint show their relationship. The floating label adds no extra focus target.',
      overlayStage: true,
      mode: 'pinned',
      code: `<IconButton icon={GearIcon} aria-label="Preferences" variant="ghost" tone="neutral" />
<Tooltip shortcut="⌘,">Preferences</Tooltip>`,
      render: () => <TooltipContextExamples />,
    },
  ],
});
