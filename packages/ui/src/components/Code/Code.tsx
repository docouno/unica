import type { ReactElement } from 'react';
import { passiveRootAttributes } from '../../core/passiveRoot.js';
import type { PassiveRootProps } from '../../core/passiveRoot.js';
import './code.css';

export type CodeTone = 'inherit' | 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface CodeProps extends Omit<PassiveRootProps, 'aria-label' | 'aria-labelledby'> {
  readonly size?: 'inherit' | 's' | 'm' | 'l' | undefined;
  readonly tone?: CodeTone | undefined;
  readonly plate?: boolean | undefined;
  readonly 'aria-label'?: never;
  readonly 'aria-labelledby'?: never;
}

export function Code({
  size = 'inherit',
  tone = 'inherit',
  plate = true,
  dir = 'ltr',
  className,
  ...props
}: CodeProps): ReactElement {
  return (
    <code
      {...passiveRootAttributes(props, true)}
      className={className ? `unica-code ${className}` : 'unica-code'}
      dir={dir}
      data-unica-code-size={size}
      data-unica-code-tone={tone}
      data-unica-code-plate={plate}
    />
  );
}
