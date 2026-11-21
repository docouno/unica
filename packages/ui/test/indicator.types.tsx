import { createRef } from 'react';
import { Indicator } from '../src/index.js';
import type { IndicatorPosition, IndicatorProps, IndicatorStatus } from '../src/index.js';
import type { IndicatorProps as ServerIndicatorProps } from '../src/server.js';

const position: IndicatorPosition = 'bottom-start';
const status: IndicatorStatus = 'warning';
const ref = createRef<HTMLSpanElement>();
const host = <button type="button">Notifications</button>;

const numeric: IndicatorProps = { children: host, count: null, max: 9, showZero: true };
const dot: ServerIndicatorProps = { children: host, dot: true };

export const examples = (
  <>
    <Indicator {...numeric} ref={ref} position={position} status={status} hidden={false} />
    <Indicator {...dot} visible={false} width="full" withBorder={false} />
    {/* @ts-expect-error Dot and count are mutually exclusive. */}
    <Indicator dot count={1}>
      {host}
    </Indicator>
    {/* @ts-expect-error Dot does not accept a numeric cap. */}
    <Indicator dot max={9}>
      {host}
    </Indicator>
    {/* @ts-expect-error Dot has no zero policy. */}
    <Indicator dot showZero>
      {host}
    </Indicator>
    {/* @ts-expect-error Position is logical. */}
    <Indicator position="top-right">{host}</Indicator>
    {/* @ts-expect-error Until-found belongs to the DOM attribute, not React's boolean prop. */}
    <Indicator hidden="until-found">{host}</Indicator>
    {/* @ts-expect-error One React element supplies the host box. */}
    <Indicator>Notifications</Indicator>
    {/* @ts-expect-error Raw HTML would replace the slot and the marker. */}
    <Indicator dangerouslySetInnerHTML={{ __html: 'Notifications' }}>{host}</Indicator>
    {/* @ts-expect-error The ref belongs to the wrapper. */}
    <Indicator ref={createRef<SVGSVGElement>()}>{host}</Indicator>
  </>
);
