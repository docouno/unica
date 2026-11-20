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

function isUnsupportedSlotType(type: unknown): boolean {
  if (typeof type === 'symbol') {
    return true;
  }
  if (typeof type !== 'object' || type === null || !('$$typeof' in type)) {
    return false;
  }

  // React 19 identifies Context and memo objects with shared type tags.
  switch (type.$$typeof) {
    case Symbol.for('react.context'):
    case Symbol.for('react.consumer'):
      return true;
    case Symbol.for('react.memo'):
      return 'type' in type && isUnsupportedSlotType(type.type);
    default:
      return false;
  }
}

function requireChild<T extends Element>(children: ReactNode): ReactElement<SlotProps<T>> {
  if (!isValidElement<SlotProps<T>>(children) || isUnsupportedSlotType(children.type)) {
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
