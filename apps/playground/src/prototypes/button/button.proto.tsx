import type { ButtonHTMLAttributes, ReactElement, Ref } from 'react';
import { Icon } from '../icon/icon.proto.js';
import type { GlyphComponent } from '../icon/icon.proto.js';
import './button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonTone = 'accent' | 'neutral' | 'danger';
export type ButtonSize = 's' | 'm' | 'l';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly ref?: Ref<HTMLButtonElement>;
  readonly variant?: ButtonVariant;
  readonly tone?: ButtonTone;
  readonly size?: ButtonSize;
  readonly width?: 'auto' | 'full';
  readonly iconLeft?: GlyphComponent;
  readonly iconRight?: GlyphComponent;
  readonly loading?: boolean;
  readonly pressed?: boolean | undefined;
  readonly onPressedChange?: (pressed: boolean) => void;
  /** Pins a visual state for comparison in the specimen only. */
  readonly previewState?: 'hover' | 'active' | 'focus' | undefined;
}

// Visual prototype. Polymorphism and the full form/focus contract belong to Wave 2.
export function Button({
  variant = 'primary',
  tone = 'accent',
  size = 'm',
  width = 'auto',
  iconLeft,
  iconRight,
  loading = false,
  pressed,
  onPressedChange,
  previewState,
  disabled,
  type = 'button',
  className = '',
  children,
  onClick,
  onPointerMove,
  ...rest
}: ButtonProps): ReactElement {
  return (
    <button
      {...rest}
      type={type}
      className={`button-proto ${className}`}
      data-variant={variant}
      data-tone={tone}
      data-size={size}
      data-width={width}
      data-loading={loading || undefined}
      data-preview={previewState}
      disabled={disabled}
      aria-busy={loading || undefined}
      aria-disabled={disabled || loading || undefined}
      aria-pressed={pressed}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        if (
          event.defaultPrevented ||
          loading ||
          disabled ||
          variant !== 'primary' ||
          tone !== 'accent'
        ) {
          return;
        }
        const box = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty('--button-light-x', `${event.clientX - box.left}px`);
        event.currentTarget.style.setProperty('--button-light-y', `${event.clientY - box.top}px`);
      }}
      onClick={(event) => {
        if (loading) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
        if (!event.defaultPrevented && pressed !== undefined) {
          onPressedChange?.(!pressed);
        }
      }}
    >
      <span className="button-proto-content">
        {iconLeft && <Icon icon={iconLeft} size={size} />}
        {children !== undefined && children !== null && (
          <span className="button-proto-label">{children}</span>
        )}
        {iconRight && <Icon icon={iconRight} size={size} />}
      </span>
      {loading && <span className="button-proto-spinner" aria-hidden="true" />}
    </button>
  );
}

export interface IconButtonProps extends Omit<
  ButtonProps,
  'children' | 'iconLeft' | 'iconRight' | 'width'
> {
  readonly icon: GlyphComponent;
  readonly 'aria-label': string;
}

export function IconButton({
  icon,
  variant = 'secondary',
  tone = 'neutral',
  className = '',
  ...rest
}: IconButtonProps): ReactElement {
  return (
    <Button
      {...rest}
      variant={variant}
      tone={tone}
      iconLeft={icon}
      className={`button-proto-icon ${className}`}
    />
  );
}
