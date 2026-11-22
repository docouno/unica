import { useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import type { TooltipProps } from '@docouno/unica';
import type { PreviewContext } from '../workbench/types.js';
import { OverlayExampleFrame } from './OverlayExampleFrame.js';
import { placementAlignments, placementSides } from './overlay-placement-options.js';
import './overlay-studies.css';

const positions = ['center', 'top-start', 'bottom-end'] as const;

type Side = NonNullable<TooltipProps['side']>;
type Align = NonNullable<TooltipProps['align']>;
type Position = (typeof positions)[number];

export function OverlayPlacementStudy({
  ctx,
  title,
  height,
  initialSide,
  initialAlign,
  children,
}: {
  readonly ctx: PreviewContext;
  readonly title: string;
  readonly height: number;
  readonly initialSide: Side;
  readonly initialAlign: Align;
  readonly children: (side: Side, align: Align) => ReactNode;
}): ReactElement {
  const [side, setSide] = useState(initialSide);
  const [align, setAlign] = useState(initialAlign);
  const [position, setPosition] = useState<Position>('center');
  return (
    <div className="hint-study-stack">
      <div className="hint-study-controls">
        <label>
          Side
          <select value={side} onChange={(event) => setSide(event.currentTarget.value as Side)}>
            {placementSides.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Align
          <select value={align} onChange={(event) => setAlign(event.currentTarget.value as Align)}>
            {placementAlignments.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Source position
          <select
            value={position}
            onChange={(event) => setPosition(event.currentTarget.value as Position)}
          >
            {positions.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      </div>
      <OverlayExampleFrame ctx={ctx} title={title} height={height}>
        <div className="hint-study-anchor" data-position={position}>
          {children(side, align)}
        </div>
      </OverlayExampleFrame>
    </div>
  );
}
