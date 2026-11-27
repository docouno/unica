import { useContext, useId } from 'react';
import type { MouseEvent, ReactElement } from 'react';
import { Slot, resolveSlotProps } from '../../core/Slot.js';
import { fallbackAnchorChild, requireAnchorChild, secureRel } from '../../core/anchor.js';
import type { AnchorProps } from '../../core/anchor.js';
import { useComponentDefaults } from '../../core/UnicaProvider.js';
import { cx } from '../../core/cx.js';
import { DescriptionFallback, DescriptionScope, descriptionIds } from '../../core/description.js';
import { ExternalLinkGlyph } from '../../internal/glyphs/index.js';
import { Icon } from '../Icon/Icon.js';
import { TrailingGlyph } from './TrailingGlyph.js';
import { markTerminalText } from './terminalText.js';
import type { LinkProps } from './types.js';
import './link.css';

export type { LinkProps, LinkSize } from './types.js';

function blockActivation(event: MouseEvent<HTMLAnchorElement>): void {
  event.preventDefault();
  event.stopPropagation();
}

/**
 * Inline navigational hyperlink supporting native `<a>` and router `asChild` composition,
 * safe `target="_blank"` handling, accessible new-tab hints, and disabled fallback semantics.
 */
export function Link({
  asChild,
  tone = 'accent',
  size,
  underline = 'always',
  iconLeft,
  iconRight,
  external = false,
  newTabHint,
  disabled = false,
  children,
  href,
  className,
  ref,
  dangerouslySetInnerHTML,
  ...props
}: LinkProps): ReactElement {
  const hintId = useId();
  const descriptionScope = useContext(DescriptionScope);
  const resolvedSize = useComponentDefaults('Link', 'size', { instance: size, builtIn: 'inherit' });
  const child = asChild ? requireAnchorChild(children, disabled, 'Link') : undefined;
  if (dangerouslySetInnerHTML !== undefined) {
    throw new Error('Link requires its label to be supplied as ordinary children.');
  }
  if (!disabled && !asChild && typeof href !== 'string') {
    throw new Error('An enabled Link requires a string href.');
  }

  // Resolve all 8 navigation/a11y fields once through resolveSlotProps so logic and Slot agree.
  const effective = (
    child
      ? resolveSlotProps({
          slotProps: props,
          childProps: child.props as Record<string, unknown>,
        })
      : props
  ) as AnchorProps;
  const label = child ? child.props.children : children;
  const blank = typeof effective.target === 'string' && effective.target.toLowerCase() === '_blank';
  const download = effective.download === true || typeof effective.download === 'string';
  const newTab = blank && !download;
  const showHint = newTab && !disabled;
  const showExternal = external || newTab;
  const incomingIds =
    showHint || descriptionScope ? descriptionIds(effective['aria-describedby']) : [];
  const contribution =
    descriptionScope && incomingIds.includes(descriptionScope.id) ? descriptionScope : null;
  const hasOwnedDescription = showHint || contribution !== null;
  const authorIds = contribution
    ? incomingIds.filter((id) => id !== contribution.id && id !== contribution.fallbackId)
    : incomingIds;
  const authorDescription = effective['aria-description']?.trim() || undefined;
  const title = effective.title?.trim() || undefined;
  const fallbackId =
    contribution && (authorDescription || title) ? `${hintId}-fallback` : undefined;
  const fallback = hasOwnedDescription && (authorDescription || title) && (
    <DescriptionFallback
      id={fallbackId}
      authorIds={authorIds}
      authorDescription={authorDescription}
      title={title}
      hasExplicitName={Boolean(effective['aria-label']?.trim())}
      label={label}
      nameIds={descriptionIds(effective['aria-labelledby'])}
    />
  );
  const hint = newTabHint?.trim() || 'Opens in a new tab';
  const terminal = showExternal || iconRight ? markTerminalText(label) : null;
  const content = (
    <>
      {iconLeft && (
        <span aria-hidden="true" className="unica-link-glyph unica-link-glyph-start">
          <Icon icon={iconLeft} usage="slot" />
        </span>
      )}
      {terminal ? terminal.content : label}
      {terminal && (
        <TrailingGlyph measureLine={terminal.end === 'text'}>
          {showExternal ? (
            <ExternalLinkGlyph />
          ) : (
            iconRight && <Icon icon={iconRight} usage="slot" />
          )}
        </TrailingGlyph>
      )}
      {contribution && fallback}
      {showHint && (
        <span id={hintId} hidden>
          {!contribution && <>{fallback} </>}
          {hint}
        </span>
      )}
    </>
  );

  const owned = {
    'data-unica-link-tone': tone,
    'data-unica-link-underline': underline,
    'data-unica-link-size': resolvedSize,
    'aria-disabled': disabled || undefined,
    'aria-describedby': hasOwnedDescription
      ? [...new Set([...authorIds, fallbackId, contribution?.id, showHint ? hintId : undefined])]
          .filter(Boolean)
          .join(' ')
      : effective['aria-describedby'],
    rel: blank ? secureRel(effective.rel) : effective.rel,
  } as const;
  const anchorClass = cx('unica-link', className);

  if (disabled) {
    const unavailable = {
      ...owned,
      href: undefined,
      target: undefined,
      rel: undefined,
      download: undefined,
      ping: undefined,
      role: 'link',
      'aria-current': undefined,
      tabIndex: -1,
      onClick: undefined,
      onAuxClick: undefined,
      onClickCapture: blockActivation,
      onAuxClickCapture: blockActivation,
    } as const;

    if (child) {
      return (
        <Slot<HTMLAnchorElement>
          {...props}
          className={anchorClass}
          ref={ref}
          slotOwned={unavailable}
          slotContent={content}
        >
          {fallbackAnchorChild(child)}
        </Slot>
      );
    }
    return (
      <a {...props} {...unavailable} className={anchorClass} ref={ref}>
        {content}
      </a>
    );
  }

  if (child) {
    return (
      <Slot<HTMLAnchorElement>
        {...props}
        className={anchorClass}
        ref={ref}
        slotOwned={owned}
        slotContent={content}
      >
        {child}
      </Slot>
    );
  }

  return (
    <a {...props} {...owned} href={href} className={anchorClass} ref={ref}>
      {content}
    </a>
  );
}
