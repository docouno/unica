import { useId, useState } from 'react';
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import type { ControlSize } from '../input/input.proto.js';
import './segmented-control.css';

export interface SegmentItem {
  readonly value: string;
  readonly label: ReactNode;
  readonly disabled?: boolean | undefined;
}

export interface SegmentedControlProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'defaultValue' | 'onChange'
> {
  readonly items: readonly SegmentItem[];
  readonly value?: string | undefined;
  readonly defaultValue?: string | undefined;
  readonly onValueChange?: ((value: string) => void) | undefined;
  readonly size?: ControlSize | undefined;
  readonly disabled?: boolean | undefined;
  readonly name?: string | undefined;
}

export function SegmentedControl({
  items,
  value,
  defaultValue,
  onValueChange,
  size = 'm',
  disabled,
  name,
  className = '',
  ...props
}: SegmentedControlProps): ReactElement {
  const generatedName = useId();
  const [localValue, setLocalValue] = useState(defaultValue ?? items[0]?.value ?? '');
  const selected = value ?? localValue;
  return (
    <div {...props} className={`segmented-control-proto ${className}`} data-size={size}>
      {items.map((item) => (
        <label className="segment-proto" key={item.value}>
          <input
            type="radio"
            name={name ?? generatedName}
            value={item.value}
            checked={selected === item.value}
            disabled={disabled || item.disabled}
            onChange={() => {
              setLocalValue(item.value);
              onValueChange?.(item.value);
            }}
          />
          <span>{item.label}</span>
        </label>
      ))}
    </div>
  );
}
