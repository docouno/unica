import type { ReactElement } from 'react';
import { cx, dataFlag } from '../../core/cx.js';
import { passiveIndicatorAttributes } from '../../core/passiveRoot.js';
import { Glyph } from '../../internal/glyphs/index.js';
import type { SwitchIndicatorProps } from './types.js';
import '../../internal/binary/binary.css';
import './switch.css';

/** Paints a decorative switch track, thumb, and optional icon or pending mark. */
export function SwitchIndicator({
  size = 'm',
  checked,
  disabled,
  loading,
  thumbIcon,
  className,
  ...props
}: SwitchIndicatorProps): ReactElement {
  return (
    <span
      {...passiveIndicatorAttributes(props)}
      aria-hidden="true"
      inert
      className={cx('unica-switch-indicator', className)}
      data-unica-switch-size={size}
      data-unica-switch-checked={dataFlag(checked)}
      data-unica-switch-disabled={dataFlag(disabled)}
      data-unica-switch-loading={dataFlag(loading && !disabled)}
    >
      <span className="unica-switch-thumb">
        {!disabled && (loading || (thumbIcon !== undefined && thumbIcon !== null)) && (
          <span className="unica-switch-thumb-icon">
            {loading ? (
              // Phosphor CircleNotch, bold. See THIRD-PARTY-NOTICES.txt.
              <Glyph path="M236,128a108,108,0,0,1-216,0c0-42.52,24.73-81.34,63-98.9A12,12,0,1,1,93,50.91C63.24,64.57,44,94.83,44,128a84,84,0,0,0,168,0c0-33.17-19.24-63.43-49-77.09A12,12,0,1,1,173,29.1C211.27,46.66,236,85.48,236,128Z" />
            ) : (
              thumbIcon
            )}
          </span>
        )}
      </span>
    </span>
  );
}
