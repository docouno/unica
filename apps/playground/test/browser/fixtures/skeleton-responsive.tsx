import { Skeleton } from '@docouno/unica';
import type { JSX } from 'react';

export default function ResponsiveSkeletonFixture(): JSX.Element {
  return (
    <div style={{ width: 650, containerType: 'inline-size' }}>
      <style>{`
        @media (max-width: 600px) { .viewport-wrapper { display: contents; } }
        @container (max-width: 400px) { .container-wrapper { display: contents; } }
      `}</style>
      {['viewport', 'container'].map((id) => (
        <div key={id} data-testid={id} style={{ display: 'flex', height: 40 }}>
          <span className={id + '-wrapper'} style={{ flex: 'none' }}>
            <span style={{ display: 'block', width: 20, height: 15 }} />
          </span>
          <Skeleton width={60} height={20} />
        </div>
      ))}
    </div>
  );
}
