import { SkeletonText } from '@docouno/unica';
import { useState } from 'react';
import type { ReactElement } from 'react';
import { textSizes } from '../../../src/specimens/skeleton/skeleton.controls.js';
import { MetricText } from '../../../src/specimens/skeleton/skeleton.examples.js';

export default function SkeletonMetricsFixture(): ReactElement {
  const [ready, setReady] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setReady(true)}>
        Show text
      </button>
      <section data-ready={ready}>
        {textSizes.flatMap((size) =>
          [1, 3].map((lines) => (
            <div
              key={`${size}/${lines}`}
              data-metric={`${size}/${lines}`}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 180px) auto',
                alignItems: 'start',
                gap: 8,
              }}
            >
              {ready ? (
                <MetricText size={size} lines={lines} />
              ) : (
                <SkeletonText size={size} lines={lines} />
              )}
              <span>Next beside</span>
              <span style={{ gridColumn: 1 }}>Next below</span>
            </div>
          )),
        )}
      </section>
    </>
  );
}
