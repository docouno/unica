import { useCallback, useLayoutEffect, useRef } from 'react';
import type { ButtonHTMLAttributes, ReactElement, Ref } from 'react';
import { Icon } from '@docouno/unica';
import type { GlyphSource } from '@docouno/unica';
import { bindButtonPointerLight } from './button-light.proto.js';
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
  readonly iconLeft?: GlyphSource;
  readonly iconRight?: GlyphSource;
  readonly loading?: boolean;
  readonly pressed?: boolean | undefined;
  readonly onPressedChange?: (pressed: boolean) => void;
  /** Pins a visual state for comparison in the specimen only. */
  readonly previewState?: 'rest' | 'near' | 'hover' | 'active' | 'focus' | undefined;
  /** Adds focus to a pinned hover, press, or pending state in the specimen only. */
  readonly previewFocus?: boolean;
}

// Visual prototype. Polymorphism and the full form/focus contract belong to Wave 2.
export function Button({
  ref,
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
  previewFocus,
  disabled,
  type = 'button',
  className = '',
  children,
  onClick,
  ...rest
}: ButtonProps): ReactElement {
  const elementRef = useRef<HTMLButtonElement | null>(null);
  const trackLight =
    variant === 'primary' &&
    tone === 'accent' &&
    !loading &&
    !disabled &&
    !pressed &&
    !previewState;
  const attach = useCallback(
    (element: HTMLButtonElement | null) => {
      if (!element) {
        return;
      }
      elementRef.current = element;
      const releaseRef = typeof ref === 'function' ? ref(element) : undefined;
      if (ref && typeof ref !== 'function') {
        ref.current = element;
      }
      return () => {
        elementRef.current = null;
        if (typeof releaseRef === 'function') {
          releaseRef();
        } else if (typeof ref === 'function') {
          ref(null);
        } else if (ref) {
          ref.current = null;
        }
      };
    },
    [ref],
  );
  useLayoutEffect(() => {
    const element = elementRef.current;
    if (trackLight && element) {
      return bindButtonPointerLight(element);
    }
  }, [trackLight]);
  return (
    <button
      {...rest}
      ref={attach}
      type={type}
      className={`button-proto ${className}`}
      data-variant={variant}
      data-tone={tone}
      data-size={size}
      data-width={width}
      data-icon-left={iconLeft ? true : undefined}
      data-icon-right={iconRight ? true : undefined}
      data-loading={loading || undefined}
      data-preview={previewState}
      data-preview-focus={previewFocus || undefined}
      disabled={disabled}
      aria-busy={(loading && !disabled) || undefined}
      aria-disabled={disabled || loading || undefined}
      aria-pressed={pressed}
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
        {iconLeft && (
          <Icon className="button-leading-glyph" usage="slot" icon={iconLeft} size={size} />
        )}
        {children !== undefined && children !== null && (
          <span className="button-proto-label">{children}</span>
        )}
        {iconRight && <Icon usage="slot" icon={iconRight} size={size} />}
      </span>
      {loading && <span className="button-proto-spinner" aria-hidden="true" />}
    </button>
  );
}

export interface IconButtonProps extends Omit<
  ButtonProps,
  'children' | 'iconLeft' | 'iconRight' | 'width'
> {
  readonly icon: GlyphSource;
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
