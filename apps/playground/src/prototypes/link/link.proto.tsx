import { useId } from 'react';
import type { ComponentPropsWithRef, ReactElement } from 'react';
import { ArrowUpRightIcon } from '@phosphor-icons/react/ssr';
import { Icon, defineGlyph } from '@docouno/unica';
import type { TextSize } from '../text/text.proto.js';
import './link.css';

const ExternalGlyph = defineGlyph(ArrowUpRightIcon, 'phosphor');

export interface LinkProps extends ComponentPropsWithRef<'a'> {
  readonly tone?: 'accent' | 'neutral' | 'inherit';
  readonly size?: TextSize | 'inherit';
  readonly underline?: 'always' | 'hover' | 'none';
  readonly external?: boolean;
  readonly newTabHint?: string;
  readonly disabled?: boolean;
  /** Workbench pins, not proposed library props. */
  readonly previewState?: 'rest' | 'hover' | 'active';
  readonly previewFocus?: boolean;
}

// Native preview only. Router composition and the shipped API belong to Wave 2.
export function Link({
  tone = 'accent',
  size = 'inherit',
  underline = 'always',
  external = false,
  newTabHint = 'Opens in a new tab',
  disabled = false,
  previewState,
  previewFocus,
  className = '',
  children,
  href,
  target,
  rel,
  style,
  onClick,
  onAuxClick,
  'aria-describedby': describedBy,
  ...props
}: LinkProps): ReactElement {
  const hintId = useId();
  const newTab = target === '_blank';
  const showHint = newTab && !disabled && Boolean(newTabHint);
  const safeRel = newTab
    ? [...new Set(`${rel ?? ''} noopener noreferrer`.trim().split(/\s+/))].join(' ')
    : rel;
  return (
    <>
      <a
        {...props}
        href={disabled ? undefined : href}
        target={disabled ? undefined : target}
        rel={disabled ? undefined : safeRel}
        role={disabled ? 'link' : props.role}
        aria-disabled={disabled || undefined}
        aria-current={disabled ? undefined : props['aria-current']}
        aria-describedby={
          [describedBy, showHint ? hintId : undefined].filter(Boolean).join(' ') || undefined
        }
        tabIndex={disabled ? -1 : props.tabIndex}
        className={`link-proto ${className}`}
        data-tone={tone}
        data-underline={underline}
        data-preview-state={previewState}
        data-preview-focus={previewFocus || undefined}
        style={{
          ...(size !== 'inherit'
            ? { fontSize: `var(--text-size-${size})`, lineHeight: `var(--text-size-${size}-lh)` }
            : {}),
          ...style,
        }}
        onClick={(event) => {
          if (disabled) {
            event.preventDefault();
            event.stopPropagation();
          } else {
            onClick?.(event);
          }
        }}
        onAuxClick={(event) => {
          if (disabled) {
            event.preventDefault();
            event.stopPropagation();
          } else {
            onAuxClick?.(event);
          }
        }}
      >
        {children}
        {(external || newTab) && (
          <>
            {'\u2060'}
            <span className="link-proto-external">
              {'\u00a0'}
              <Icon icon={ExternalGlyph} usage="slot" />
            </span>
          </>
        )}
      </a>
      {showHint && (
        <span id={hintId} hidden>
          {newTabHint}
        </span>
      )}
    </>
  );
}
