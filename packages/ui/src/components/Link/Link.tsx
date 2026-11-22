import { useContext, useId } from 'react';
import type { ComponentPropsWithRef, MouseEvent, ReactElement, ReactNode } from 'react';
import { Slot, requireSlotChild, resolveSlotProps } from '../../core/Slot.js';
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

type AnchorProps = ComponentPropsWithRef<'a'>;

function requireAnchorChild(children: ReactNode, disabled: boolean): ReactElement<AnchorProps> {
  const child: ReactElement<AnchorProps> = requireSlotChild<HTMLAnchorElement>(
    children,
    'Link asChild',
  );
  if (typeof child.type === 'string' && child.type !== 'a') {
    throw new Error('Link asChild requires one anchor or one component that renders an anchor.');
  }
  if (child.type === 'a' && !disabled && typeof child.props.href !== 'string') {
    throw new Error('An enabled Link asChild anchor requires a string href.');
  }
  if (
    child.props.dangerouslySetInnerHTML !== undefined ||
    typeof child.props.children === 'function' ||
    (typeof child.type !== 'string' && child.props.children === undefined)
  ) {
    throw new Error('Link asChild requires its label to be supplied as ordinary children.');
  }
  return child;
}

function tokens(value?: string): string[] {
  return value?.split(/[\t\n\f\r ]+/).filter(Boolean) ?? [];
}

function secureRel(rel?: string): string {
  const words = new Map<string, string>();
  for (const token of tokens(rel)) {
    const key = token.toLowerCase();
    if (key !== 'opener' && !words.has(key)) {
      words.set(key, token);
    }
  }
  words.set('noopener', 'noopener');
  words.set('noreferrer', 'noreferrer');
  return [...words.values()].join(' ');
}

// Router-specific props never cross into the native disabled fallback.
const fallbackKeys = /* @__PURE__ */ new Set([
  'id',
  'className',
  'style',
  'title',
  'lang',
  'dir',
  'hidden',
  'inert',
  'translate',
  'slot',
  'draggable',
  'spellCheck',
  'itemID',
  'itemProp',
  'itemRef',
  'itemScope',
  'itemType',
]);

function fallbackAttributes(props: AnchorProps): AnchorProps {
  return Object.fromEntries(
    Object.entries(props).filter(
      ([name]) => fallbackKeys.has(name) || name.startsWith('aria-') || name.startsWith('data-'),
    ),
  );
}

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
  const child = asChild ? requireAnchorChild(children, disabled) : undefined;
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
          <a {...fallbackAttributes(child.props)} ref={child.props.ref} />
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
