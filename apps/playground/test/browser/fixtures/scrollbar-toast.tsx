import { useState } from 'react';
import type { JSX } from 'react';
import { ToastViewport } from '../../../src/prototypes/toast/toast.proto.js';
import type { ToastItem, ToastPlacement } from '../../../src/prototypes/toast/toast.proto.js';

const messages: readonly ToastItem[] = Array.from({ length: 12 }, (_, index) => ({
  id: String(index + 1),
  title: `Activity update ${index + 1}`,
  children: 'The workspace changes are ready for review.',
  action: { label: 'Review' },
}));

const placements = ['top-start', 'top-end', 'bottom-start', 'bottom-end'] as const;

export default function ScrollbarToastFixture(): JSX.Element {
  const [placement, setPlacement] = useState<ToastPlacement>('bottom-end');
  const [count, setCount] = useState(12);
  const [dismissed, setDismissed] = useState<readonly string[]>([]);
  const items = messages.slice(0, count).filter(({ id }) => !dismissed.includes(id));

  return (
    <div style={{ position: 'relative', blockSize: '100dvh', overflow: 'clip' }}>
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
        <select
          value={count}
          onChange={(event) => {
            setDismissed([]);
            setCount(Number(event.target.value));
          }}
        >
          <option>12</option>
          <option>2</option>
          <option>1</option>
        </select>
      </label>
      <ToastViewport
        key={count}
        items={items}
        placement={placement}
        initialExpanded
        onDismiss={(id) => setDismissed((current) => [...current, id])}
        onDismissAll={() => setDismissed(items.map(({ id }) => id))}
      />
    </div>
  );
}
