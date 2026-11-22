import type { ReactElement } from 'react';
import { cx, dataFlag } from '../../core/cx.js';
import { passiveRootAttributes } from '../../core/passiveRoot.js';
import type { CodeProps } from './types.js';
import './code.css';

export type { CodeProps, CodeStatus } from './types.js';

/**
 * Inline technical literal on a native `<code>` element. Defaults to `status="inherit"` to follow
 * painted surface context (`--code-context-*`) without live-region announcements.
 */
export function Code({
  size = 'inherit',
  status = 'inherit',
  plate = true,
  dir = 'ltr',
  className,
  ...props
}: CodeProps): ReactElement {
  return (
    <code
      {...passiveRootAttributes<'code'>(props, true)}
      className={cx('unica-code', className)}
      dir={dir}
      data-unica-code-size={size}
      data-unica-code-status={status}
      data-unica-code-plate={dataFlag(plate)}
    />
  );
}
