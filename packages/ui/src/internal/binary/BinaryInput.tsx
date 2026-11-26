import type { JSX, ReactNode } from 'react';
import { cx, dataFlag } from '../../core/cx.js';
import type { BinaryGroupContext } from './BinaryGroup.js';
import type { BinaryIndicatorProps, BinaryKind, BinaryStatus, ToggleProps } from './types.js';
import { useBinaryInput } from './useBinaryInput.js';
import './binary.css';

interface BinaryInputOptions extends ToggleProps {
  readonly kind: BinaryKind;
  readonly group: BinaryGroupContext | null;
  readonly indicator: (state: BinaryIndicatorProps) => ReactNode;
  readonly status?: BinaryStatus | undefined;
  readonly indeterminate?: boolean | undefined;
  readonly loading?: boolean | undefined;
}

export function BinaryInput({
  indicator,
  className,
  style,
  hidden,
  ...props
}: BinaryInputOptions): JSX.Element {
  const { row, carrier, labelId, descriptionId, size, status, locked, selected, unavailable } =
    useBinaryInput<HTMLLabelElement>(props);

  return (
    <label
      ref={row}
      className={cx('unica-binary-control', className)}
      data-unica-binary-kind={props.kind}
      data-unica-binary-size={size}
      data-unica-binary-status={status}
      data-unica-binary-readonly={dataFlag(locked)}
      data-unica-binary-standalone={dataFlag(!labelId && !descriptionId)}
      style={style}
      hidden={hidden}
    >
      <span className="unica-binary-target">
        {carrier}
        {indicator({ size, checked: selected, disabled: unavailable })}
      </span>
      {(labelId || descriptionId) && (
        <span className="unica-binary-copy">
          {labelId && (
            <span className="unica-binary-label" id={labelId}>
              {props.label}
            </span>
          )}
          {descriptionId && (
            <span
              className="unica-binary-description"
              id={descriptionId}
              aria-hidden={!labelId || undefined}
            >
              {props.description}
            </span>
          )}
        </span>
      )}
    </label>
  );
}
