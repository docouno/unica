import { defineSpecimen } from '../../workbench/types.js';

const {
  TooltipContentExamples,
  TooltipContextExamples,
  TooltipLiveExamples,
  TooltipOverflowExamples,
  TooltipPlacementExamples,
  TooltipStateExamples,
} = await import('./tooltip.examples.js');

export default defineSpecimen({
  id: 'tooltip',
  title: 'Tooltip',
  group: 'Overlays',
  summary: 'A quiet label or short explanation. No arrow, no actions, no interruption.',
  defaultSurface: 'overlay',
  sections: [
    {
      id: 'content',
      title: 'Label · Shortcut · Explanation',
      kind: 'matrix',
      caption:
        'Pinned in flow for comparison. One compact size, 20rem ceiling, shared surface radius. Shortcuts are passive.',
      overlayStage: true,
      render: () => <TooltipContentExamples />,
    },
    {
      id: 'interaction',
      title: 'Hover · Focus · Dismiss',
      kind: 'states',
      caption:
        'Live: first hover 600ms, nearby hints warm for 300ms. Keyboard focus opens immediately. Escape or activation hides the hint; touch activates directly.',
      overlayStage: true,
      render: () => <TooltipLiveExamples />,
    },
    {
      id: 'placement',
      title: 'Twelve logical placements',
      kind: 'matrix',
      caption:
        'Live native top layer in a bounded frame. Start/end mirror in RTL. Hover the source to inspect the selected placement.',
      overlayStage: true,
      render: () => <TooltipPlacementExamples />,
    },
    {
      id: 'states',
      title: 'Focus · Selection · Availability',
      kind: 'states',
      caption:
        'Pinned focus and selection belong to the source. A disabled control has no hover hint; its explanation remains visible.',
      overlayStage: true,
      render: () => <TooltipStateExamples />,
    },
    {
      id: 'overflow',
      title: 'Long content · Narrow space',
      kind: 'states',
      caption:
        'Text wraps without truncation. A chord moves below the label when needed. Empty labels produce no panel.',
      overlayStage: true,
      render: () => <TooltipOverflowExamples />,
    },
    {
      id: 'context',
      title: 'Beside compact navigation',
      kind: 'context',
      caption:
        'Pinned source and hint show their relationship. The floating label adds no extra focus target.',
      overlayStage: true,
      render: () => <TooltipContextExamples />,
    },
  ],
});
