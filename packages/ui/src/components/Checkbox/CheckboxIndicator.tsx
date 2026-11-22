import type { ReactElement } from 'react';
import { cx, dataFlag } from '../../core/cx.js';
import { passiveIndicatorAttributes } from '../../core/passiveRoot.js';
import { CheckGlyph, MinusGlyph } from '../../internal/glyphs/index.js';
import type { CheckboxIndicatorProps } from './types.js';
import '../../internal/binary/binary.css';
import './checkbox.css';

/** Paints the decorative checkbox well and its check or mixed mark. */
export function CheckboxIndicator({
  size = 'm',
  checked,
  indeterminate,
  disabled,
  className,
  ...props
}: CheckboxIndicatorProps): ReactElement {
  return (
    <span
      {...passiveIndicatorAttributes(props)}
      aria-hidden="true"
      inert
      className={cx('unica-binary-indicator', 'unica-checkbox-indicator', className)}
      data-unica-checkbox-size={size}
      data-unica-checkbox-checked={dataFlag(checked)}
      data-unica-checkbox-indeterminate={dataFlag(indeterminate)}
      data-unica-checkbox-disabled={dataFlag(disabled)}
    >
      <CheckGlyph className="unica-checkbox-check" />
      <MinusGlyph className="unica-checkbox-minus" />
    </span>
  );
}
