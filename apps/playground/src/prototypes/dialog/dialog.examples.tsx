import type { CSSProperties, ReactElement, ReactNode } from 'react';
import './dialog.examples.css';

export function DialogStudy({
  height = 520,
  children,
}: {
  readonly height?: number;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className="dialog-study">
      <div
        className="dialog-study-stage"
        style={{ '--study-height': `${height}px` } as CSSProperties}
      >
        {children}
      </div>
    </div>
  );
}
