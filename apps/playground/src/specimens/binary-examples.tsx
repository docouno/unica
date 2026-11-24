import type { ReactElement, ReactNode } from 'react';
import { Text } from '@docouno/unica';
import './binary-examples.css';

export function Sample({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className="binary-demo-sample">
      <Text as="span" size="caption-l" color="muted">
        <bdi>{title}</bdi>
      </Text>
      {children}
    </div>
  );
}

export function SurfacePair({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <div className="binary-demo-grid">
      {(['base', 'overlay'] as const).map((surface) => (
        <div
          className="binary-demo-stage"
          key={surface}
          data-underlay={surface === 'overlay' || undefined}
        >
          <div className="binary-demo-plate" data-surface={surface} data-plate={surface}>
            <span className="binary-demo-caption">
              {surface === 'base' ? 'Base surface' : 'Overlay surface'}
            </span>
            {children}
          </div>
        </div>
      ))}
    </div>
  );
}
