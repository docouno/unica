import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';
import type { ComponentPropsWithRef, ReactElement, ReactNode, RefCallback, RefObject } from 'react';
import { requireSlotChild, resolveSlotProps, Slot } from '../../core/Slot.js';
import { composeEventHandlers } from '../../core/composeEventHandlers.js';
import { cx, dataFlag } from '../../core/cx.js';
import {
  getDocumentActiveElement,
  getDocumentBody,
  getLiveView,
  getLocalName,
  getOwnerDocument,
  getParentElementSafe,
  getRootActiveElement,
  getRootNodeSafe,
  hasAttributeSafe,
  matchesSafe,
  removeAttributeSafe,
  setAttributeSafe,
} from '../../core/dom.js';
import type { GlyphSource } from '../../core/glyph.js';
import { mergeRefs } from '../../core/mergeRefs.js';
import { nonBlank } from '../../core/passiveRoot.js';
import { useStateAuthority } from '../../core/useControllableState.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import { Icon } from '../Icon/Icon.js';
import { Spinner } from '../Progress/Spinner.js';
import { guardActivation } from './availability.js';
import type { ButtonProps, ButtonSize, IconButtonProps, NativeInvokerAttributes } from './types.js';
import { useButtonLight } from './useButtonLight.js';

type ActionProps =
  | (ButtonProps & { readonly square: false; readonly icon?: never })
  | (IconButtonProps & { readonly square: true });

type NativeProps = ComponentPropsWithRef<'button'> & NativeInvokerAttributes;
type AnchorProps = ComponentPropsWithRef<'a'>;

function hostAttributes<Props extends { asChild?: boolean | undefined }>(
  props: Props,
): Omit<Props, 'asChild'> {
  const attributes = { ...props };
  delete attributes.asChild;
  return attributes;
}

function requireAnchor(child: ReactNode, unavailable: boolean): ReactElement<AnchorProps> {
  const anchor = requireSlotChild<HTMLAnchorElement>(child, 'Button asChild');
  if (typeof anchor.type === 'string' && anchor.type !== 'a') {
    throw new Error('Button asChild requires one anchor or one component that renders an anchor.');
  }
  if (anchor.type === 'a' && !unavailable && typeof anchor.props.href !== 'string') {
    throw new Error('An available Button asChild anchor requires a string href.');
  }
  if (
    anchor.props.dangerouslySetInnerHTML !== undefined ||
    typeof anchor.props.children === 'function'
  ) {
    throw new Error('Button asChild requires its label to be supplied as ordinary children.');
  }
  return anchor;
}

const fallbackAttributes = /* @__PURE__ */ new Set([
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
  'onFocus',
  'onFocusCapture',
  'onBlur',
  'onBlurCapture',
  'onPointerEnter',
  'onPointerLeave',
  'onMouseEnter',
  'onMouseLeave',
]);

function anchorFallback(child: ReactElement<AnchorProps>): ReactElement {
  const attributes = Object.fromEntries(
    Object.entries(child.props).filter(
      ([name]) =>
        fallbackAttributes.has(name) || name.startsWith('aria-') || name.startsWith('data-'),
    ),
  );
  return <a {...attributes} ref={child.props.ref} />;
}

interface DetachedAnchor {
  readonly node: HTMLElement;
  readonly root: Node;
}

function useActionHost(
  rootRef: RefObject<HTMLElement | null>,
  pending: boolean,
  disabled: boolean,
  observeLightHost: (node: HTMLElement | null) => void,
): RefCallback<HTMLElement> {
  const detached = useRef<DetachedAnchor | null>(null);
  const wasPending = useRef(pending);
  const attach = useCallback(
    (node: HTMLElement | null) => {
      rootRef.current = node;
      observeLightHost(node);
      if (!node) {
        return;
      }
      return () => {
        if (rootRef.current !== node) {
          return;
        }
        detached.current = null;
        if (getLocalName(node) === 'a') {
          const root = getRootNodeSafe(node);
          const doc = getOwnerDocument(node);
          if (doc && getRootActiveElement(root, doc) === node) {
            detached.current = { node, root };
          }
        }
        rootRef.current = null;
        observeLightHost(null);
      };
    },
    [rootRef, observeLightHost],
  );

  useIsoLayoutEffect(() => {
    const previous = detached.current;
    detached.current = null;
    const changed = pending !== wasPending.current;
    wasPending.current = pending;
    const node = rootRef.current;
    if (
      !changed ||
      !previous ||
      !node ||
      disabled ||
      node === previous.node ||
      getLocalName(node) !== 'a'
    ) {
      return;
    }
    const doc = getOwnerDocument(node);
    const root = getRootNodeSafe(node);
    if (doc && root === previous.root) {
      const active = getDocumentActiveElement(doc);
      if (active === null || active === getDocumentBody(doc)) {
        node.focus({ preventScroll: true });
      }
    }
  });
  return attach;
}

const subscribeToHydration = (): (() => void) => () => {};
const liveSnapshot = (): boolean => true;
const coldSnapshot = (): boolean => false;

function useNativePending(
  rootRef: RefObject<HTMLButtonElement | null>,
  pending: boolean,
  coldDisabled: boolean,
): void {
  useIsoLayoutEffect(() => {
    const node = rootRef.current;
    if (!node || !pending || coldDisabled) {
      return;
    }

    const sync = () => {
      const available = !matchesSafe(node, ':disabled');
      for (const name of ['aria-busy', 'aria-disabled']) {
        if (available) {
          setAttributeSafe(node, name, 'true');
        } else if (hasAttributeSafe(node, name)) {
          removeAttributeSafe(node, name);
        }
      }
    };
    sync();

    const Observer = getLiveView(getOwnerDocument(node))?.MutationObserver;
    if (!Observer) {
      return;
    }

    const observe = () => {
      observer.disconnect();
      observer.observe(node, { attributes: true, attributeFilter: ['disabled'] });
      for (let parent = getParentElementSafe(node); parent; parent = getParentElementSafe(parent)) {
        // Reparenting and changes to the first legend can alter native :disabled.
        const fieldset = getLocalName(parent) === 'fieldset';
        observer.observe(
          parent,
          fieldset ? { childList: true, attributeFilter: ['disabled'] } : { childList: true },
        );
      }
    };
    const observer = new Observer(() => {
      sync();
      observe();
    });
    observe();
    return () => observer.disconnect();
  }, [rootRef, pending, coldDisabled]);
}

interface NativeActionProps {
  readonly props: NativeProps;
  readonly attach: RefCallback<HTMLElement>;
  readonly pending: boolean;
  readonly disabled: boolean;
}

function NativeAction({
  props: { ref, type = 'button', children, command, commandFor, ...props },
  attach,
  pending,
  disabled,
}: NativeActionProps): ReactElement {
  const ownRef = useRef<HTMLButtonElement | null>(null);
  const mergedRef = useMemo(() => mergeRefs<HTMLButtonElement>(ownRef, attach, ref), [attach, ref]);
  const nativeEffect =
    type !== 'button' || props.popoverTarget !== undefined || commandFor !== undefined;
  const live = useSyncExternalStore(
    subscribeToHydration,
    liveSnapshot,
    pending && nativeEffect ? coldSnapshot : liveSnapshot,
  );
  const coldDisabled = pending && nativeEffect && !live;
  const busy = pending && !coldDisabled;
  useNativePending(ownRef, pending, coldDisabled);

  // React's DOM attribute aliases do not yet include the Invoker Commands target.
  const commands = { command, commandfor: commandFor };
  return (
    <button
      {...props}
      {...commands}
      {...guardActivation(props, (host) => pending || disabled || matchesSafe(host, ':disabled'))}
      ref={mergedRef}
      type={type}
      disabled={disabled || coldDisabled}
      data-unica-button-ssr-disabled={dataFlag(coldDisabled)}
      aria-busy={busy || undefined}
      aria-disabled={busy || undefined}
    >
      {children}
    </button>
  );
}

interface AnchorActionProps {
  readonly props: AnchorProps;
  readonly anchor: ReactElement<AnchorProps>;
  readonly attach: RefCallback<HTMLElement>;
  readonly pending: boolean;
  readonly disabled: boolean;
  readonly owned: Record<string, unknown>;
}

function AnchorAction({
  props: { ref, children, ...props },
  anchor,
  attach,
  pending,
  disabled,
  owned,
}: AnchorActionProps): ReactElement {
  const mergedRef = useMemo(() => mergeRefs<HTMLAnchorElement>(attach, ref), [attach, ref]);
  const unavailable = disabled || pending;
  const merged = unavailable
    ? (resolveSlotProps({ slotProps: props, childProps: { ...anchor.props } }) as AnchorProps)
    : undefined;

  return (
    <Slot<HTMLAnchorElement>
      {...props}
      ref={mergedRef}
      slotContent={children}
      slotOwned={{
        ...owned,
        'aria-pressed': undefined,
        'aria-busy': pending || undefined,
        'aria-disabled': unavailable || undefined,
        ...(merged && {
          href: undefined,
          target: undefined,
          download: undefined,
          rel: undefined,
          ping: undefined,
          hrefLang: undefined,
          referrerPolicy: undefined,
          role: 'link',
          tabIndex: disabled ? -1 : 0,
          ...guardActivation(merged, () => true),
        }),
      }}
    >
      {unavailable && anchor.type !== 'a' ? anchorFallback(anchor) : anchor}
    </Slot>
  );
}

function ActionContent({
  label,
  iconLeft,
  iconRight,
  size,
  pending,
}: {
  readonly label: ReactNode;
  readonly iconLeft: GlyphSource | undefined;
  readonly iconRight: GlyphSource | undefined;
  readonly size: ButtonSize;
  readonly pending: boolean;
}): ReactElement {
  return (
    <>
      <span className="unica-button-face" aria-hidden="true" />
      <span className="unica-button-content">
        {iconLeft && (
          <span className="unica-button-icon" aria-hidden="true">
            <Icon icon={iconLeft} usage="slot" size={size} />
          </span>
        )}
        {label !== undefined && label !== null && (
          <span className="unica-button-label">{label}</span>
        )}
        {iconRight && (
          <span className="unica-button-icon" aria-hidden="true">
            <Icon icon={iconRight} usage="slot" size={size} />
          </span>
        )}
      </span>
      {pending && (
        <span className="unica-button-spinner" aria-hidden="true">
          <Spinner size={size} tone="inherit" />
        </span>
      )}
    </>
  );
}

export function Action({
  square,
  icon,
  iconLeft,
  iconRight,
  variant = square ? 'secondary' : 'primary',
  tone = variant === 'primary' ? 'accent' : 'neutral',
  size = 'm',
  width = 'auto',
  disabled = false,
  loading = false,
  pressed,
  defaultPressed,
  onPressedChange,
  className,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  dangerouslySetInnerHTML,
  ...host
}: ActionProps): ReactElement {
  const root = useRef<HTMLElement | null>(null);
  const pending = loading && !disabled;
  const toggle =
    !host.asChild &&
    (pressed !== undefined || defaultPressed !== undefined || onPressedChange !== undefined);
  const [selected, authority] = useStateAuthority({
    value: pressed,
    defaultValue: defaultPressed ?? false,
    onChange: onPressedChange,
  });
  const observeLightHost = useButtonLight();
  const attach = useActionHost(root, pending, disabled, observeLightHost);

  if (dangerouslySetInnerHTML !== undefined) {
    throw new Error('Button requires its label to be supplied as ordinary children.');
  }

  const family = {
    'data-unica-button-variant': variant,
    'data-unica-button-tone': tone,
    'data-unica-button-size': size,
    'data-unica-button-width': square ? undefined : width,
    'data-unica-button-square': dataFlag(square),
    'data-unica-button-icon-left': dataFlag(!square && Boolean(iconLeft)),
    'data-unica-button-icon-right': dataFlag(!square && Boolean(iconRight)),
    'data-unica-button-disabled': dataFlag(disabled),
    'data-unica-button-loading': dataFlag(pending),
  };
  const classNames = cx('unica-button', className);
  const name = {
    'aria-label': square ? nonBlank(ariaLabel) : ariaLabel,
    'aria-labelledby': square ? nonBlank(ariaLabelledBy) : ariaLabelledBy,
  };
  const renderContent = (label: ReactNode): ReactElement => (
    <ActionContent
      label={square ? undefined : label}
      iconLeft={square ? icon : iconLeft}
      iconRight={square ? undefined : iconRight}
      size={size}
      pending={pending}
    />
  );

  if (host.asChild) {
    const { children, ...props } = hostAttributes(host);
    const anchor = requireAnchor(children, disabled || pending);
    return (
      <AnchorAction
        props={{
          ...props,
          ...name,
          className: classNames,
          children: renderContent(anchor.props.children),
        }}
        anchor={anchor}
        attach={attach}
        pending={pending}
        disabled={disabled}
        owned={{ ...family, ...(square && name) }}
      />
    );
  }

  const { children, onClick, ...props } = hostAttributes(host);
  const onAcceptedClick = composeEventHandlers(
    onClick,
    toggle ? () => authority.propose(!authority.read()) : undefined,
  );
  return (
    <NativeAction
      props={{
        ...props,
        ...name,
        ...family,
        className: classNames,
        'aria-pressed': toggle ? selected : undefined,
        children: renderContent(children),
        onClick: onAcceptedClick,
      }}
      attach={attach}
      pending={pending}
      disabled={disabled}
    />
  );
}
