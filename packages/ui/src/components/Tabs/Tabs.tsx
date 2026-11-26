import {
  useCallback,
  useId,
  useInsertionEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { FocusEvent, FocusEventHandler, JSX } from 'react';
import { cx } from '../../core/cx.js';
import { warnOnce } from '../../core/devWarning.js';
import {
  composedContains,
  documentHasFocusSafe,
  getDeepActiveElement,
  getDocumentBody,
  getRootNodeSafe,
  isConnectedNode,
  isElementNode,
  matchesSafe,
} from '../../core/dom.js';
import {
  isExplicitBlurInProgress,
  isLiveFocusElement,
  observeFocusTransfer,
  recoverAfterFocusTransfer,
} from '../../core/focus-transfer.js';
import type { FocusTransfer } from '../../core/focus-transfer.js';
import { mergeRefs } from '../../core/mergeRefs.js';
import { useStateAuthority } from '../../core/useControllableState.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import { createTabCollection, getEntryItem, resolveTabSelection } from './collection.js';
import { tabAttributes, tabFocusOptions, TabsContext } from './context.js';
import type { TabsProps } from './types.js';
import './tabs.css';

interface PanelFocus {
  readonly key: string;
  readonly panel: HTMLDivElement;
  readonly target: Element;
  readonly root: Node;
  departure: FocusTransfer | undefined;
}

const rootReserved = /* @__PURE__ */ new Set(['dangerouslysetinnerhtml']);
const readServerCollection = (): null => null;

function readPanelFocus(key: string, panel: HTMLDivElement, target: Element): PanelFocus | null {
  const root = getRootNodeSafe(panel);
  const active = getDeepActiveElement(panel.ownerDocument, root);
  return active && composedContains(target, active)
    ? { key, panel, target: active, root, departure: undefined }
    : null;
}

function isLivePanelTarget({ panel, target }: PanelFocus): boolean {
  return !panel.hidden && isConnectedNode(target) && !matchesSafe(target, ':disabled');
}

/** Groups a tab list and its peer panels, and owns their selection. */
export function Tabs({
  value,
  defaultValue,
  onValueChange,
  size = 'm',
  orientation = 'horizontal',
  activationMode = 'automatic',
  mountStrategy = 'eager',
  children,
  className,
  ref,
  ...props
}: TabsProps): JSX.Element {
  const id = useId();
  const [collection] = useState(createTabCollection);
  const [confirmed, setConfirmed] = useState<{ readonly key: string | null } | null>(null);
  const observed = useSyncExternalStore(
    collection.subscribe,
    collection.read,
    readServerCollection,
  );
  const snapshot = confirmed ? observed : null;
  const [current, { propose, read, restore }] = useStateAuthority<string | null>({
    value,
    defaultValue: defaultValue ?? null,
    onChange: onValueChange
      ? (next) => {
          if (next !== null) {
            onValueChange(next);
          }
        }
      : undefined,
  });
  const controlled = value !== undefined;
  const selected = resolveTabSelection(snapshot, current, controlled);
  const panelFocus = useRef<PanelFocus | null>(null);
  const panelCaptureSequence = useRef(0);
  const committing = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMemo(() => mergeRefs(rootRef, ref), [ref]);

  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    if (root) {
      return observeFocusTransfer(root, (target, transfer) => {
        const origin = panelFocus.current;
        if (
          origin &&
          composedContains(target, origin.target) &&
          (transfer.destination !== null || (!committing.current && isLivePanelTarget(origin)))
        ) {
          origin.departure = transfer;
          return true;
        }
        return false;
      });
    }
  }, []);

  const select = useCallback(
    (key: string, node: HTMLButtonElement): void => {
      // A consumer event handler can commit a different set of pairs before
      // activation runs. Validate the proposal against that live collection.
      collection.publish();
      if (
        read() !== key &&
        collection
          .read()
          ?.items.some((item) => item.node === node && item.key === key && item.navigable)
      ) {
        propose(key);
      }
    },
    [collection, propose, read],
  );

  const trackPanelFocus = useCallback((key: string, panel: HTMLDivElement): void => {
    const origin = readPanelFocus(key, panel, panel);
    if (origin) {
      panelFocus.current = origin;
    }
  }, []);

  const attachPanel = useCallback(
    (panel: HTMLDivElement, key: string): (() => void) => {
      const detach = collection.attachPanel(panel, key);
      return () => {
        const origin = panelFocus.current;
        if (origin?.panel === panel && isExplicitBlurInProgress(origin.departure)) {
          panelFocus.current = null;
        }
        detach();
      };
    },
    [collection],
  );

  const onPanelFocusCapture = useCallback(
    (
      key: string,
      event: FocusEvent<HTMLDivElement>,
      onFocusCapture: FocusEventHandler<HTMLDivElement> | undefined,
    ): void => {
      const panel = event.currentTarget;
      const origin = panelFocus.current;
      const capture = ++panelCaptureSequence.current;
      onFocusCapture?.(event);
      // A handler can move focus synchronously, causing a new capture to run.
      if (panelCaptureSequence.current !== capture || !isElementNode(event.target)) {
        return;
      }
      const active = readPanelFocus(key, panel, event.target);
      if (!active) {
        return;
      }
      if (!event.defaultPrevented) {
        panelFocus.current = active;
        return;
      }
      // Hydration may have recorded focus before replaying this event. Revoke
      // that origin only if the handler did not establish a new one.
      if (origin?.panel === panel && origin.key === key && panelFocus.current === origin) {
        panelFocus.current = null;
      }
    },
    [],
  );

  const releasePanelFocus = useCallback((event: FocusEvent<HTMLDivElement>): void => {
    const origin = panelFocus.current;
    if (origin?.panel !== event.currentTarget || !composedContains(event.target, origin.target)) {
      return;
    }
    const { panel, root, target } = origin;
    const doc = panel.ownerDocument;
    const active = getDeepActiveElement(doc, root) ?? getDeepActiveElement(doc);
    const live = active === getDocumentBody(doc) ? null : active;
    const leftLiveTarget =
      !live && event.relatedTarget === null && !committing.current && isLivePanelTarget(origin);
    if (leftLiveTarget || (live && !composedContains(panel, live))) {
      panelFocus.current = null;
      return;
    }
    // Verify uncertain destinations after the browser finishes moving focus.
    // Leave the origin available for layout recovery after a DOM mutation.
    queueMicrotask(() => {
      if (
        panelFocus.current === origin &&
        isConnectedNode(panel) &&
        !panel.hidden &&
        !composedContains(target, getDeepActiveElement(doc, root))
      ) {
        panelFocus.current = null;
      }
    });
  }, []);

  useInsertionEffect(() => {
    committing.current = true;
  });
  useIsoLayoutEffect(() => {
    committing.current = false;
    // All sibling refs have attached by the root layout phase, including panels in separate slots.
    collection.publish();
    const committed = collection.read();
    const verifiedKey = resolveTabSelection(committed, current, controlled);
    if (!confirmed || confirmed.key !== verifiedKey) {
      // The same layout update admits the initial committed snapshot and each
      // later selection whose trigger is still available after mutations.
      setConfirmed({ key: verifiedKey });
    }
    if (!snapshot || snapshot !== committed) {
      return;
    }
    if (!controlled && current !== selected) {
      restore(selected);
    }
    if (controlled && selected === null) {
      warnOnce(
        `Tabs.invalidValue.${id}`,
        'Tabs value must match an enabled trigger and its panel.',
      );
    }

    const origin = panelFocus.current;
    if (
      !origin ||
      (origin.key === selected && !origin.panel.hidden && isConnectedNode(origin.panel))
    ) {
      return;
    }
    panelFocus.current = null;
    recoverAfterFocusTransfer(origin.departure, (unavailable) => {
      const root = rootRef.current;
      const latest = collection.read();
      if (!root || !isConnectedNode(root) || !latest) {
        return;
      }
      const doc = origin.panel.ownerDocument;
      // Start from the captured root, which can be a closed ShadowRoot.
      const active = getDeepActiveElement(doc, origin.root) ?? getDeepActiveElement(doc);
      if (
        documentHasFocusSafe(doc) &&
        (composedContains(origin.panel, active) ||
          active === null ||
          active === getDocumentBody(doc) ||
          active === unavailable ||
          !isLiveFocusElement(active))
      ) {
        const selection = resolveTabSelection(latest, read(), controlled);
        getEntryItem(latest.items, selection)?.node.focus(tabFocusOptions);
      }
    });
  });

  return (
    <TabsContext
      value={{
        id,
        size,
        orientation,
        activationMode,
        mountStrategy,
        collection,
        items: snapshot?.items ?? null,
        selected,
        confirmedSelection: confirmed?.key ?? null,
        select,
        attachPanel,
        trackPanelFocus,
        onPanelFocusCapture,
        releasePanelFocus,
      }}
    >
      <div
        {...tabAttributes(props, rootReserved)}
        ref={mergedRef}
        className={cx('unica-tabs', className)}
      >
        {children}
      </div>
    </TabsContext>
  );
}
