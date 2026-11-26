import { useId } from 'react';
import type { JSX } from 'react';
import { cx, dataFlag } from '../../core/cx.js';
import { guardActivation } from '../../core/guardActivation.js';
import { isInertElement } from '../../core/dom.js';
import { CheckGlyph } from '../../internal/glyphs/index.js';
import { Icon } from '../Icon/index.js';
import type { ListboxGroupProps, ListboxOptionProps } from './types.js';
import './listbox.css';

/** A visible option row with an independent accessible label and description. */
export function ListboxOption({
  label,
  description,
  iconLeft,
  disabled,
  selected = false,
  active = false,
  size = 'm',
  reserveIconSpace = Boolean(iconLeft),
  className,
  'aria-describedby': describedBy,
  ...props
}: ListboxOptionProps): JSX.Element {
  Reflect.deleteProperty(props, 'value');
  const id = useId();
  const labelId = `${id}-label`;
  const descriptionId = description ? `${id}-description` : undefined;
  return (
    <div
      {...props}
      {...guardActivation(props, (element) => disabled === true || isInertElement(element))}
      dangerouslySetInnerHTML={undefined}
      hidden={undefined}
      inert={undefined}
      aria-hidden={undefined}
      role="option"
      tabIndex={undefined}
      aria-label={undefined}
      aria-labelledby={labelId}
      aria-describedby={[describedBy, descriptionId].filter(Boolean).join(' ') || undefined}
      aria-selected={selected}
      aria-disabled={disabled || undefined}
      className={cx('unica-listbox-option', className)}
      data-unica-listbox-size={size}
      data-unica-listbox-active={dataFlag(active)}
      data-unica-listbox-reserve-icon={dataFlag(reserveIconSpace)}
    >
      {iconLeft && (
        <span className="unica-listbox-icon" aria-hidden="true">
          <Icon usage="slot" size={size} icon={iconLeft} />
        </span>
      )}
      <span className="unica-listbox-copy">
        <span id={labelId} dir="auto">
          {label}
        </span>
        {descriptionId && (
          <span id={descriptionId} className="unica-listbox-description" dir="auto">
            {description}
          </span>
        )}
      </span>
      <span className="unica-listbox-check" aria-hidden="true">
        <CheckGlyph />
      </span>
    </div>
  );
}

/** A named, one-level group of option rows. */
export function ListboxGroup({
  label,
  children,
  className,
  ...props
}: ListboxGroupProps): JSX.Element {
  const id = useId();
  return (
    <div
      {...props}
      dangerouslySetInnerHTML={undefined}
      hidden={undefined}
      inert={undefined}
      aria-hidden={undefined}
      role="group"
      tabIndex={undefined}
      aria-label={undefined}
      aria-labelledby={id}
      className={cx('unica-listbox-group', className)}
    >
      <div id={id} className="unica-listbox-heading" dir="auto">
        {label}
      </div>
      {children}
    </div>
  );
}
