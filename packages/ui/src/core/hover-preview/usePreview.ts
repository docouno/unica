import { useCallback, useContext, useRef, useState } from 'react';
import type { HTMLAttributes, RefCallback, RefObject } from 'react';
import {
  composedContains,
  getLiveView,
  getOwnerDocument,
  getRootActiveElement,
  getRootNodeSafe,
  isElementNode,
} from '../dom.js';
import type { Align, Side } from '../overlay/positioning.js';
import { useStateAuthority } from '../useControllableState.js';
import { useIsoLayoutEffect } from '../useIsoLayoutEffect.js';
import { PreviewController } from './controller.js';
import { PreviewDomainContext } from './domain.js';
import type { PreviewFamily } from './registry.js';
import type { PreviewOpenProps } from './types.js';

interface PreviewProps extends PreviewOpenProps {
  readonly family: PreviewFamily;
  readonly external: boolean;
  readonly anchor: HTMLElement | null;
  readonly carrier: HTMLElement | null;
  readonly carrierNode: RefObject<HTMLElement | null>;
  readonly avoid: HTMLElement | null;
  readonly side: Side;
  readonly align: Align;
  readonly padding: number;
  readonly disabled: boolean;
  readonly focusOnAriaDisabled?: boolean | undefined;
}

export interface PreviewBindings {
  readonly trigger: Pick<
    HTMLAttributes<HTMLElement>,
    | 'onFocus'
    | 'onBlur'
    | 'onPointerEnter'
    | 'onPointerLeave'
    | 'onClick'
    | 'onAuxClick'
    | 'onKeyUp'
  >;
  readonly carrier: Pick<HTMLAttributes<HTMLElement>, 'onPointerEnter' | 'onPointerLeave'>;
}

export function usePreview({
  family,
  external,
  anchor,
  carrier,
  carrierNode,
  avoid,
  side,
  align,
  padding,
  disabled,
  focusOnAriaDisabled,
  open,
  defaultOpen,
  onOpenChange,
}: PreviewProps): PreviewBindings {
  const domain = useContext(PreviewDomainContext);
  const [, authority] = useStateAuthority({ value: open, defaultValue: defaultOpen ?? false });
  const controller = useRef<PreviewController | null>(null);
  const pendingFocus = useRef<{ event: FocusEvent; target: Element } | null>(null);
  const admission = useRef({ blocked: false, externalAnchor: null as HTMLElement | null });

  useIsoLayoutEffect(() => {
    return () => {
      controller.current?.dispose();
      controller.current = null;
    };
  }, []);

  useIsoLayoutEffect(() => {
    const document = carrier && getOwnerDocument(carrier);
    const view = getLiveView(document);
    if (open !== true || (external && anchor !== admission.current.externalAnchor)) {
      admission.current.blocked = false;
    }
    admission.current.externalAnchor = external ? anchor : null;
    if (
      controller.current &&
      (carrier !== controller.current.carrier || document !== controller.current.document || !view)
    ) {
      controller.current.dispose();
      controller.current = null;
      if (!carrier && !external && open === undefined) {
        // A remounted carrier must acquire new hover or focus intent.
        authority.propose(false);
      }
    }
    if (!carrier || !document || !view) {
      return;
    }
    controller.current ??= new PreviewController(family, carrier, document, view);
    controller.current.update({
      anchor,
      avoid,
      domain: domain?.scope ?? null,
      delay: domain?.delay,
      side,
      align,
      padding,
      external,
      disabled,
      focusOnAriaDisabled,
      controlled: open !== undefined,
      open: authority.read(),
      admission: admission.current,
      isMounted: () => carrierNode.current === carrier,
      write: authority.propose,
      notify: onOpenChange,
    });
    const focus = pendingFocus.current;
    if (focus && anchor) {
      pendingFocus.current = null;
      if (
        composedContains(anchor, focus.target) &&
        getRootActiveElement(getRootNodeSafe(focus.target), document) === focus.target
      ) {
        controller.current.focusTrigger(focus.event, focus.target);
      }
    }
  });

  return {
    trigger: {
      onFocus: (event) => {
        if (!isElementNode(event.target)) {
          return;
        }
        if (controller.current && anchor && composedContains(anchor, event.target)) {
          controller.current.focusTrigger(event.nativeEvent, event.target);
        } else {
          // A parent can restore focus before the anchor and carrier refs settle.
          pendingFocus.current = { event: event.nativeEvent, target: event.target };
        }
      },
      onBlur: (event) => {
        pendingFocus.current = null;
        controller.current?.blurTrigger(event.nativeEvent);
      },
      onPointerEnter: (event) => controller.current?.enterTrigger(event.nativeEvent),
      onPointerLeave: (event) => controller.current?.leaveTrigger(event.nativeEvent),
      onClick: (event) => controller.current?.activate(event.nativeEvent),
      onAuxClick: (event) => controller.current?.activate(event.nativeEvent),
      onKeyUp: (event) => controller.current?.releaseActivationKey(event.nativeEvent, event.target),
    },
    carrier: {
      onPointerEnter: (event) => controller.current?.enterCarrier(event.nativeEvent),
      onPointerLeave: (event) => controller.current?.leaveCarrier(event.nativeEvent),
    },
  };
}

export function usePreviewElement<T extends HTMLElement>(): [
  T | null,
  RefCallback<T>,
  RefObject<T | null>,
] {
  const [element, setElement] = useState<T | null>(null);
  const node = useRef<T | null>(null);
  const attach = useCallback((next: T | null): void => {
    node.current = next;
    setElement(next);
  }, []);
  return [element, attach, node];
}
