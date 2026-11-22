import type { ReactElement, ReactNode } from 'react';
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
      <span className="binary-demo-caption">{title}</span>
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
