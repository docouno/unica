import { Children, Fragment, isValidElement, useMemo, useRef } from 'react';
import type { PointerEvent, ReactElement, ReactNode } from 'react';
import { cx } from '../../core/cx.js';
import {
  composedContains,
  getDeepActiveElement,
  getRootNodeSafe,
  isContentEditableSafe,
} from '../../core/dom.js';
import { mergeRefs } from '../../core/mergeRefs.js';
import { pickConsumerDataAttributes } from '../../core/passiveRoot.js';
import {
  AlertDangerGlyph,
  AlertInfoGlyph,
  AlertSuccessGlyph,
  AlertWarningGlyph,
  CloseGlyph,
} from '../../internal/glyphs/index.js';
import { Icon } from '../Icon/Icon.js';
import { AlertAnnouncement } from './AlertAnnouncement.js';
import { plainName, useRegionName } from './regionName.js';
import type {
  AlertActionsProps,
  AlertCloseProps,
  AlertDescriptionProps,
  AlertProps,
  AlertStatus,
  AlertTitleProps,
} from './types.js';
import './alert.css';

const liveAttributes = /* @__PURE__ */ new Set([
  'role',
  'aria-live',
  'aria-atomic',
  'aria-relevant',
  'dangerouslysetinnerhtml',
]);

const rootAttributes = /* @__PURE__ */ new Set([
  ...liveAttributes,
  'aria-label',
  'aria-labelledby',
  'accesskey',
  'autofocus',
  'contenteditable',
  'focusable',
  'is',
  'popover',
  'tabindex',
  'title',
  'onclose',
  'data-unica-alert-size',
  'data-unica-mark-status',
]);

const glyphs: Readonly<Record<Exclude<AlertStatus, 'neutral'>, typeof AlertInfoGlyph>> = {
  info: AlertInfoGlyph,
  success: AlertSuccessGlyph,
  warning: AlertWarningGlyph,
  danger: AlertDangerGlyph,
};

function filterAttributes<Props extends object>(props: Props, reserved = liveAttributes): Props {
  return Object.fromEntries(
    Object.entries(props).filter(([name]) => !reserved.has(name.toLowerCase())),
  ) as Props;
}

function hasContent(children: ReactNode): boolean {
  return Children.toArray(children).some((child) => {
    if (typeof child === 'string') {
      return Boolean(child.trim());
    }
    if (isValidElement<{ children?: ReactNode }>(child)) {
      if (child.type === AlertClose) {
        return false;
      }
      if (
        child.type === Fragment ||
        child.type === AlertTitle ||
        child.type === AlertDescription ||
        child.type === AlertActions
      ) {
        return hasContent(child.props.children);
      }
    }
    return true;
  });
}

function liveRole(role: AlertProps['role'], status: AlertStatus): 'alert' | 'status' | undefined {
  switch (role) {
    case 'alert':
    case 'status':
      return role;
    case 'region':
    case 'none':
      return undefined;
    default:
      return status === 'warning' || status === 'danger' ? 'alert' : 'status';
  }
}

/** Persistent in-flow feedback with an optional local announcement and dismiss action. */
export function Alert({
  children,
  status = 'neutral',
  size = 'm',
  icon,
  role,
  close,
  className,
  ref,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...props
}: AlertProps): ReactElement | null {
  const root = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const rootRef = useMemo(() => mergeRefs(root, ref), [ref]);
  const present = hasContent(children);
  const region = role === 'region';
  const label = plainName(ariaLabel);
  const labelledBy = useRegionName(root, present && region, label, plainName(ariaLabelledBy));
  const urgency = liveRole(role, status);

  if (!present) {
    return null;
  }

  const Fallback = status === 'neutral' ? undefined : glyphs[status];

  return (
    <div
      {...filterAttributes(props, rootAttributes)}
      ref={rootRef}
      className={cx('unica-alert', className)}
      role={region && (label || labelledBy) ? 'region' : undefined}
      aria-label={region ? label : ariaLabel}
      aria-labelledby={region ? labelledBy : ariaLabelledBy}
      data-unica-mark-status={status}
      data-unica-alert-size={size}
    >
      {(icon || Fallback) && (
        <span className="unica-alert-glyph" aria-hidden="true">
          {icon && <Icon icon={icon} usage="slot" size={size} />}
          {Fallback && <Fallback className="unica-alert-glyph-fallback" />}
        </span>
      )}
      <div className="unica-alert-content" ref={content}>
        {children}
      </div>
      {isValidElement(close) && close.type === AlertClose ? close : null}
      {urgency && <AlertAnnouncement key={urgency} role={urgency} content={content} />}
    </div>
  );
}

/** Renders the visible title, optionally using a native heading. */
export function AlertTitle({
  as = 'div',
  className,
  children,
  ...props
}: AlertTitleProps): ReactElement | null {
  if (!hasContent(children)) {
    return null;
  }
  const Element = /^h[2-6]$/u.test(as) ? as : 'div';
  return (
    <Element {...filterAttributes(props)} className={cx('unica-alert-title', className)}>
      {children}
    </Element>
  );
}

/** Renders the message details, including rich content. */
export function AlertDescription({
  className,
  children,
  ...props
}: AlertDescriptionProps): ReactElement | null {
  if (!hasContent(children)) {
    return null;
  }
  return (
    <div {...filterAttributes(props)} className={cx('unica-alert-description', className)}>
      {children}
    </div>
  );
}

/** Groups recovery controls below the message. */
export function AlertActions({
  className,
  children,
  ...props
}: AlertActionsProps): ReactElement | null {
  if (!hasContent(children)) {
    return null;
  }
  return (
    <div {...filterAttributes(props)} className={cx('unica-alert-actions', className)}>
      {children}
    </div>
  );
}

const editableInputTypes = /* @__PURE__ */ new Set([
  'date',
  'datetime-local',
  'email',
  'month',
  'number',
  'password',
  'search',
  'tel',
  'text',
  'time',
  'url',
  'week',
]);

function isEditableField(element: Element): boolean {
  return (
    element.localName === 'textarea' ||
    (element.localName === 'input' && editableInputTypes.has((element as HTMLInputElement).type)) ||
    isContentEditableSafe(element)
  );
}

function keepExternalInputFocus(event: PointerEvent<HTMLButtonElement>): void {
  if (event.pointerType !== 'mouse' || event.button !== 0) {
    return;
  }
  const button = event.currentTarget;
  const doc = button.ownerDocument;
  const tree = getRootNodeSafe(button);
  const active = getDeepActiveElement(doc, tree) ?? getDeepActiveElement(doc);
  const alert = button.closest('.unica-alert');
  if (active && (!alert || !composedContains(alert, active)) && isEditableField(active)) {
    event.preventDefault();
  }
}

/** Requests dismissal through a named native button. */
export function AlertClose({
  id,
  className,
  style,
  ref,
  'aria-label': ariaLabel,
  onClose,
  ...data
}: AlertCloseProps): ReactElement | null {
  const label = plainName(ariaLabel);
  if (!label || typeof onClose !== 'function') {
    return null;
  }

  return (
    <button
      {...pickConsumerDataAttributes(data, 'data-unica-alert-')}
      ref={ref}
      id={id}
      className={cx('unica-alert-close', className)}
      style={style}
      type="button"
      aria-label={label}
      onPointerDown={keepExternalInputFocus}
      onClick={onClose}
    >
      <CloseGlyph />
    </button>
  );
}
