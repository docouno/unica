import { Skeleton, SkeletonText } from '@docouno/unica';
import { useState } from 'react';
import type { ReactElement } from 'react';
import { hydrateRoot } from 'react-dom/client';

export function SkeletonHydrationContent({
  onHydrate,
}: {
  readonly onHydrate?: () => void;
}): ReactElement {
  return (
    <>
      <Skeleton
        id="ssr-shape"
        shape="circle"
        width={32}
        ref={(element) => {
          if (element) {
            onHydrate?.();
          }
        }}
      />
      <SkeletonText id="ssr-text" lines={2} size="heading-s" />
    </>
  );
}

export default function SkeletonHydrationFixture(): ReactElement {
  const [complete, setComplete] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          const host = document.querySelector('[data-ssr-host]');
          if (host) {
            hydrateRoot(host, <SkeletonHydrationContent onHydrate={() => setComplete(true)} />);
          }
        }}
      >
        Hydrate placeholders
      </button>
      <output data-testid="hydration">{complete ? 'Hydrated' : 'Waiting'}</output>
    </>
  );
}
