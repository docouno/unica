import { useState } from 'react';
import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import './tabs.css';

export interface TabItem {
  readonly value: string;
  readonly label: ReactNode;
  readonly count?: number;
  readonly icon?: ReactNode;
  readonly disabled?: boolean;
}
export interface TabsProps extends Omit<ComponentPropsWithRef<'div'>, 'defaultValue' | 'onChange'> {
  readonly items: readonly TabItem[];
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onValueChange?: (value: string) => void;
}

// Visual view selector. Panel associations and composite keyboard behavior ship in Wave 2.
export function Tabs({
  items,
  value,
  defaultValue,
  onValueChange,
  className = '',
  ...props
}: TabsProps): ReactElement {
  const [localValue, setLocalValue] = useState(defaultValue ?? items[0]?.value ?? '');
  const selected = value ?? localValue;
  return (
    <div role="group" aria-label="View" {...props} className={`tabs-proto ${className}`}>
      {items.map((item) => (
        <button
          type="button"
          className="tab-proto"
          key={item.value}
          disabled={item.disabled}
          aria-pressed={item.value === selected}
          onClick={() => {
            if (value === undefined) {
              setLocalValue(item.value);
            }
            onValueChange?.(item.value);
          }}
        >
          {item.icon && (
            <span className="tab-icon-proto" aria-hidden="true">
              {item.icon}
            </span>
          )}
          <span className="tab-label-proto">{item.label}</span>
          {item.count !== undefined && <span className="tab-count-proto">{item.count}</span>}
        </button>
      ))}
    </div>
  );
}
