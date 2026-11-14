import type { ComponentPropsWithRef, ReactElement } from 'react';
import './divider.css';

export interface DividerProps extends ComponentPropsWithRef<'div'> {
  readonly orientation?: 'horizontal' | 'vertical';
}

export function Divider({
  orientation = 'horizontal',
  className = '',
  children,
  ...props
}: DividerProps): ReactElement {
  return (
    <div
      role="separator"
      {...props}
      aria-orientation={orientation}
      className={`divider-proto ${className}`}
      data-orientation={orientation}
      data-labeled={children ? true : undefined}
    >
      {children && <span className="divider-label-proto">{children}</span>}
    </div>
  );
}
