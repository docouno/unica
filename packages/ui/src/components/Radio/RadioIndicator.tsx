import type { ReactElement } from 'react';
import { cx, dataFlag } from '../../core/cx.js';
import { passiveIndicatorAttributes } from '../../core/passiveRoot.js';
import type { RadioIndicatorProps } from './types.js';
import '../../internal/binary/binary.css';
import './radio.css';

/** Paints the decorative radio well and its selected dot. */
export function RadioIndicator({
  size = 'm',
  checked,
  disabled,
  className,
  ...props
}: RadioIndicatorProps): ReactElement {
  return (
    <span
      {...passiveIndicatorAttributes(props)}
      aria-hidden="true"
      inert
      className={cx('unica-binary-indicator', 'unica-radio-indicator', className)}
      data-unica-radio-size={size}
      data-unica-radio-checked={dataFlag(checked)}
      data-unica-radio-disabled={dataFlag(disabled)}
    >
      <span className="unica-radio-dot" />
    </span>
  );
}
