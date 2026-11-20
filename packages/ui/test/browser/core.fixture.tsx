import { useLayoutEffect, useRef } from 'react';
import type { JSX } from 'react';
import { subscribeFocusOrigin } from '../../src/core/focus-origin.js';
import { subscribePointerProximity } from '../../src/core/pointer-proximity.js';

export default function CoreFixture(): JSX.Element {
  const first = useRef<HTMLButtonElement>(null);
  const second = useRef<HTMLButtonElement>(null);
  const pointer = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const target = pointer.current;
    if (!target || !first.current || !second.current) {
      throw new Error('Core fixture elements did not mount');
    }

    const detachFocus = [first.current, second.current].map((owner) =>
      subscribeFocusOrigin(owner, (origin) => {
        owner.dataset.focusOrigin = origin ?? 'none';
      }),
    );

    let measurements = 0;
    const proximity = subscribePointerProximity(target, {
      measure: ({ x, y }) => {
        const count = ++measurements;
        // Observe delivery without writing to the DOM during the measurement phase.
        queueMicrotask(() => {
          target.dataset.measurements = String(count);
        });
        return () => {
          target.dataset.position = `${x},${y}`;
        };
      },
      reset: () => {
        target.dataset.position = 'none';
      },
    });

    return () => {
      detachFocus.forEach((detach) => detach());
      proximity.unsubscribe();
    };
  }, []);

  return (
    <>
      <button ref={first} type="button">
        First owner
      </button>
      <button ref={second} type="button">
        Second owner
      </button>
      <div
        ref={pointer}
        data-testid="pointer"
        data-position="none"
        data-measurements="0"
        style={{ width: 180, height: 100 }}
      />
    </>
  );
}
