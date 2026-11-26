import { ToastProvider, ToastViewport, UnicaProvider, useToast } from '@docouno/unica';
import type { ToastPlacement } from '@docouno/unica';
import { useLayoutEffect, useState } from 'react';
import type { JSX } from 'react';

const placements = ['top-start', 'top-end', 'bottom-start', 'bottom-end'] as const;

function Messages({
  count,
  placement,
}: {
  readonly count: number;
  readonly placement: ToastPlacement;
}): JSX.Element {
  const queue = useToast();
  useLayoutEffect(() => {
    for (let index = 1; index <= count; index += 1) {
      queue.show(
        {
          operationKey: String(index),
          title: `Activity update ${index}`,
          description: 'The workspace changes are ready for review.',
          action: { label: 'Review', onClick: () => undefined },
        },
        { announce: false },
      );
    }
  }, [count, queue]);
  return <ToastViewport placement={placement} />;
}

export default function ScrollbarToastFixture(): JSX.Element {
  const [placement, setPlacement] = useState<ToastPlacement>('bottom-end');
  const [count, setCount] = useState(12);
  const [host, setHost] = useState<HTMLDivElement | null>(null);

  return (
    <div ref={setHost} style={{ position: 'relative', blockSize: '100dvh', overflow: 'clip' }}>
      <label>
        Placement
        <select
          value={placement}
          onChange={(event) => setPlacement(event.target.value as ToastPlacement)}
        >
          {placements.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <label>
        Messages
        <select value={count} onChange={(event) => setCount(Number(event.target.value))}>
          <option>12</option>
          <option>2</option>
          <option>1</option>
        </select>
      </label>
      <UnicaProvider portalContainer={host}>
        <ToastProvider key={count}>
          <Messages count={count} placement={placement} />
        </ToastProvider>
      </UnicaProvider>
    </div>
  );
}
