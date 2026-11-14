import { useState } from 'react';
import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import { XIcon } from '@phosphor-icons/react';
import type { DisplayStatus } from '../badge/badge.styles.js';
import { statusStyle } from '../badge/badge.styles.js';
import './tag.css';

export interface TagProps extends ComponentPropsWithRef<'span'> {
  readonly status?: DisplayStatus;
  readonly size?: 's' | 'm' | 'l';
  readonly icon?: ReactNode;
  readonly onRemove?: () => void;
  readonly removeLabel?: string;
  readonly disabled?: boolean;
}

export function Tag({
  status = 'neutral',
  size = 's',
  icon,
  onRemove,
  removeLabel,
  disabled = false,
  className = '',
  style,
  children,
  ...props
}: TagProps): ReactElement {
  return (
    <span
      {...props}
      className={`tag-proto ${className}`}
      data-size={size}
      data-disabled={disabled || undefined}
      style={{ ...statusStyle(status), ...style }}
    >
      {icon && (
        <span className="tag-icon-proto" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="tag-label-proto">{children}</span>
      {onRemove && (
        <button
          className="tag-remove-proto"
          type="button"
          disabled={disabled}
          aria-label={
            removeLabel ?? (typeof children === 'string' ? `Remove ${children}` : 'Remove tag')
          }
          onClick={onRemove}
        >
          <XIcon size="1em" aria-hidden="true" />
        </button>
      )}
    </span>
  );
}

export function TagGroup({ className = '', ...props }: ComponentPropsWithRef<'div'>): ReactElement {
  return <div {...props} className={`tag-group-proto ${className}`} />;
}

export interface ChipProps extends ComponentPropsWithRef<'span'> {
  readonly selected?: boolean;
  readonly defaultSelected?: boolean;
  readonly onSelectedChange?: (selected: boolean) => void;
  readonly onRemove?: () => void;
  readonly removeLabel?: string;
  readonly icon?: ReactNode;
  readonly disabled?: boolean;
}

export function Chip({
  selected,
  defaultSelected = false,
  onSelectedChange,
  onRemove,
  removeLabel,
  icon,
  disabled = false,
  className = '',
  children,
  ...props
}: ChipProps): ReactElement {
  const [localSelected, setLocalSelected] = useState(defaultSelected);
  const active = selected ?? localSelected;
  return (
    <span
      {...props}
      className={`chip-proto ${className}`}
      data-selected={active || undefined}
      data-disabled={disabled || undefined}
    >
      <button
        type="button"
        className="chip-main-proto"
        disabled={disabled}
        aria-pressed={active}
        onClick={() => {
          if (selected === undefined) {
            setLocalSelected(!active);
          }
          onSelectedChange?.(!active);
        }}
      >
        {icon && (
          <span className="tag-icon-proto" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className="tag-label-proto">{children}</span>
      </button>
      {onRemove && (
        <button
          type="button"
          className="tag-remove-proto"
          disabled={disabled}
          aria-label={
            removeLabel ??
            (typeof children === 'string' ? `Remove ${children} filter` : 'Remove filter')
          }
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
        >
          <XIcon size="1em" aria-hidden="true" />
        </button>
      )}
    </span>
  );
}
