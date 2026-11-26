import type { ReactElement } from 'react';
import { Avatar, AvatarGroup } from '@docouno/unica';

const groupSizes = ['xs', 's', 'm', 'l'] as const;
const three = [
  { id: 'a', name: 'Alex Rivera' },
  { id: 'b', name: 'Sam Chen' },
  { id: 'c', name: 'Jo Martin' },
] as const;
const many = Array.from({ length: 1202 }, (_, index) => ({
  id: String(index),
  name: 'Alex Rivera',
}));

function Samples(): ReactElement {
  return (
    <>
      {groupSizes.map((size) => (
        <AvatarGroup key={size} label={size} members={three} size={size} showNames />
      ))}
      <AvatarGroup label="Wide remainder" members={many} size="xs" max={2} showNames />
      <Avatar alt="Portrait" src="/assets/avatar-person-light.png" />
    </>
  );
}

export default function AvatarMaterialFixture(): ReactElement {
  const bands = 'repeating-linear-gradient(90deg, rgb(36 156 67) 0 40px, rgb(153 65 17) 40px 80px)';
  const column = {
    display: 'grid',
    justifyItems: 'start',
    gap: 12,
    padding: 12,
    minInlineSize: 156,
  } as const;
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
        padding: 16,
        backgroundImage: bands,
      }}
    >
      <section data-surface="base" style={column}>
        <Samples />
      </section>
      <section className="unica-overlay-surface" data-surface="overlay" style={column}>
        <Samples />
      </section>
    </div>
  );
}
