import type { ReactElement, ReactNode } from 'react';

export function Study({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className="hint-demo-study">
      <span className="hint-demo-label">{label}</span>
      {children}
    </div>
  );
}
