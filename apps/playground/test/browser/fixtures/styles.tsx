import type { JSX } from 'react';

export default function StylesFixture(): JSX.Element {
  return (
    <>
      <div data-testid="theme" style={{ color: 'var(--fg-primary)' }}>
        Foreground
        <div data-testid="rectangle" style={{ borderRadius: 'var(--size-m-radius)' }} />
        <div data-testid="capsule" style={{ borderRadius: 'var(--radius-full)' }} />
        <div data-testid="circle" style={{ borderRadius: 'var(--radius-circular)' }} />
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        {[
          ['regular', 'unica-scrollbar'],
          ['compact', 'unica-scrollbar unica-scrollbar--compact'],
          ['native', undefined],
        ].map(([name, className]) => (
          <div
            key={name}
            data-testid={name}
            className={className}
            style={{ width: 120, height: 80, overflow: 'auto' }}
          >
            <div style={{ height: 400 }} />
          </div>
        ))}
      </div>
    </>
  );
}
