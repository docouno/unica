import type { ReactElement } from 'react';
import type { CaseBlock, CompositionBlock, PreviewProps } from '../../workbench/types.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { LoadingSummary } from './loading-summary.js';
import summarySource from './loading-summary.tsx?raw';

export function motionStudy(Example: (props: PreviewProps) => ReactElement): CaseBlock {
  return {
    id: 'motion',
    mode: 'live',
    title: 'Activity and quiet rest',
    kind: 'behavior',
    caption:
      'A diagonal band sweeps across the live placeholders twice, then rests. RTL mirrors its direction. The static reference shows the fill under reduced motion.',
    actions: [{ id: 'replay', label: 'Replay motion' }],
    reset: true,
    render: withOverlaySurface(Example, 'border-box'),
  };
}

export function summaryComposition(subject: 'Skeleton' | 'SkeletonText'): CompositionBlock {
  const text = subject === 'SkeletonText';
  return {
    id: text ? 'summary' : 'typography',
    title: 'Reserve space for a loading summary',
    mode: 'live',
    caption:
      'A document icon and three lines reserve space for the summary. Its loading status stays outside the busy article.',
    controls: {
      loaded: { kind: 'boolean', label: 'Show loaded summary', default: false },
    },
    reset: true,
    code: summarySource,
    render: withOverlaySurface(
      ({ ctx }) => (
        <LoadingSummary
          loading={ctx.story?.controls.loaded !== true}
          announce={!ctx.comparing}
          skeletonProps={text ? undefined : ctx.subject}
          textProps={text ? ctx.subject : undefined}
        />
      ),
      'border-box',
    ),
  };
}
