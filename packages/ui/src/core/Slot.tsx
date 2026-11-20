import { cloneElement, isValidElement, useCallback } from 'react';
import type { HTMLAttributes, ReactElement, ReactNode, Ref, RefCallback } from 'react';
import { composeEventHandlers } from './composeEventHandlers.js';
import { mergeRefs } from './mergeRefs.js';

export interface SlotProps<T extends Element = HTMLElement> extends HTMLAttributes<T> {
  children: ReactNode;
  ref?: Ref<T> | undefined;
  [name: string]: unknown;
}

type EventHandler = (...args: unknown[]) => void;

function isEventHandler(value: unknown): value is EventHandler {
  return typeof value === 'function';
}

function requireChild<T extends Element>(children: ReactNode): ReactElement<SlotProps<T>> {
  // Built-ins such as Fragment, Suspense, and StrictMode use symbol types and
  // cannot receive Slot's props or ref. Custom components own that forwarding.
  if (!isValidElement<SlotProps<T>>(children) || typeof children.type === 'symbol') {
    throw new Error('Slot requires exactly one React element that accepts props and a ref.');
  }
  return children;
}

function useSlotRef<T>(
  outer: Ref<T> | undefined,
  inner: Ref<T> | undefined,
): RefCallback<T> | undefined {
  const merged = useCallback((node: T | null) => mergeRefs(outer, inner)(node), [outer, inner]);
  return outer || inner ? merged : undefined;
}

export function Slot<T extends Element = HTMLElement>({
  children,
  ref,
  ...slotProps
}: SlotProps<T>): ReactElement {
  const child = requireChild<T>(children);
  const childProps = child.props;
  const mergedRef = useSlotRef(ref, childProps.ref);

  const mergedProps: Partial<SlotProps<T>> = { ...slotProps };
  for (const name of Object.keys(slotProps)) {
    if (!Object.hasOwn(childProps, name)) {
      continue;
    }

    const slotValue = slotProps[name];
    const childValue = childProps[name];
    if (name === 'className') {
      mergedProps.className = [slotProps.className, childProps.className].filter(Boolean).join(' ');
    } else if (name === 'style') {
      mergedProps.style = { ...slotProps.style, ...childProps.style };
    } else if (/^on[A-Z]/.test(name) && isEventHandler(slotValue)) {
      mergedProps[name] = isEventHandler(childValue)
        ? composeEventHandlers(childValue, slotValue)
        : slotValue;
    } else {
      mergedProps[name] = childValue;
    }
  }

  return cloneElement(child, { ...mergedProps, ref: mergedRef });
}
