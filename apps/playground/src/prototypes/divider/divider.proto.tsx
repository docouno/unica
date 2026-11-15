import type { ComponentPropsWithRef, ReactElement } from 'react';
import './divider.css';

export interface DividerProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  readonly orientation?: 'horizontal' | 'vertical';
  readonly label?: string;
  readonly labelPosition?: 'start' | 'center' | 'end';
  readonly decorative?: boolean;
}

// Visual reference; the shipped API will enforce the mutually exclusive branches.
export function Divider({
  orientation = 'horizontal',
  label,
  labelPosition = 'center',
  decorative = true,
  className = '',
  ...props
}: DividerProps): ReactElement {
  const hasLabel = orientation === 'horizontal' && Boolean(label?.trim());
  return (
    <div
      {...props}
      role={hasLabel ? 'presentation' : decorative ? undefined : 'separator'}
      aria-hidden={!hasLabel && decorative ? true : undefined}
      aria-orientation={!hasLabel && !decorative ? orientation : undefined}
      className={`divider-proto ${className}`}
      data-orientation={orientation}
      data-labeled={hasLabel || undefined}
      data-label-position={hasLabel ? labelPosition : undefined}
    >
      {hasLabel ? (
        <>
          {labelPosition !== 'start' && <span className="divider-line-proto" aria-hidden="true" />}
          <span className="divider-label-proto">{label}</span>
          {labelPosition !== 'end' && <span className="divider-line-proto" aria-hidden="true" />}
        </>
      ) : (
        <span className="divider-line-proto" aria-hidden="true" />
      )}
    </div>
  );
}
