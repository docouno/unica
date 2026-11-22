import { cloneElement, isValidElement, useMemo } from 'react';
import type { HTMLAttributes, ReactElement, ReactNode, Ref, RefCallback } from 'react';
import { composeEventHandlers } from './composeEventHandlers.js';
import { mergeRefs } from './mergeRefs.js';

export type SlotPropRecord = Record<string, unknown>;

export interface ResolveSlotPropsOptions {
  readonly slotProps?: SlotPropRecord | undefined;
  readonly childProps?: SlotPropRecord | undefined;
  readonly slotDefaults?: SlotPropRecord | undefined;
  readonly slotOwned?: SlotPropRecord | undefined;
}

export interface SlotProps<T extends Element = HTMLElement> extends HTMLAttributes<T> {
  children: ReactNode;
  ref?: Ref<T> | undefined;
  slotDefaults?: SlotPropRecord | undefined;
  slotOwned?: SlotPropRecord | undefined;
  slotContent?: ReactNode | undefined;
  [name: string]: unknown;
}

type EventHandler = (...args: unknown[]) => void;

function isEventHandler(value: unknown): value is EventHandler {
  return typeof value === 'function';
}

function isStyleObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function tokenizeIdList(value: unknown): string[] {
  return typeof value === 'string' ? value.split(/[\t\n\f\r ]+/).filter(Boolean) : [];
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

export function requireSlotChild<T extends Element>(
  children: ReactNode,
  owner = 'Slot',
): ReactElement<SlotProps<T>> {
  if (!isValidElement<SlotProps<T>>(children) || isUnsupportedSlotType(children.type)) {
    throw new Error(`${owner} requires exactly one React element that accepts props and a ref.`);
  }
  return children;
}

export function resolveSlotProps({
  slotProps,
  childProps,
  slotDefaults,
  slotOwned,
}: ResolveSlotPropsOptions): SlotPropRecord {
  const keys = new Set<string>();
  if (slotDefaults) {
    for (const key of Object.keys(slotDefaults)) {
      keys.add(key);
    }
  }
  if (slotProps) {
    for (const key of Object.keys(slotProps)) {
      keys.add(key);
    }
  }
  if (childProps) {
    for (const key of Object.keys(childProps)) {
      keys.add(key);
    }
  }
  if (slotOwned) {
    for (const key of Object.keys(slotOwned)) {
      keys.add(key);
    }
  }

  const merged: SlotPropRecord = {};
  for (const name of keys) {
    if (name === 'children' || name === 'ref') {
      continue;
    }

    if (slotOwned && Object.hasOwn(slotOwned, name)) {
      // Owned props always win; an explicit `undefined` strips the prop from the child.
      merged[name] = slotOwned[name];
      continue;
    }

    const slotValue = slotProps && Object.hasOwn(slotProps, name) ? slotProps[name] : undefined;
    const childValue = childProps && Object.hasOwn(childProps, name) ? childProps[name] : undefined;
    const defaultValue =
      slotDefaults && Object.hasOwn(slotDefaults, name) ? slotDefaults[name] : undefined;

    if (/^on[A-Z]/.test(name)) {
      const slotHandler = isEventHandler(slotValue) ? slotValue : undefined;
      const childHandler = isEventHandler(childValue) ? childValue : undefined;
      const defaultHandler = isEventHandler(defaultValue) ? defaultValue : undefined;
      if (slotHandler) {
        merged[name] = composeEventHandlers(childHandler, slotHandler);
      } else if (childHandler) {
        merged[name] = childHandler;
      } else if (defaultHandler) {
        merged[name] = defaultHandler;
      } else if (childValue !== undefined) {
        merged[name] = childValue;
      } else if (slotValue !== undefined) {
        merged[name] = slotValue;
      }
      continue;
    }

    if (name === 'className') {
      const combined = [
        typeof slotValue === 'string' ? slotValue : undefined,
        typeof childValue === 'string' ? childValue : undefined,
      ]
        .filter(Boolean)
        .join(' ');
      if (combined) {
        merged.className = combined;
      } else if (defaultValue !== undefined) {
        merged.className = defaultValue;
      }
      continue;
    }

    if (name === 'style') {
      if (isStyleObject(defaultValue) || isStyleObject(slotValue) || isStyleObject(childValue)) {
        merged.style = {
          ...(isStyleObject(defaultValue) ? defaultValue : undefined),
          ...(isStyleObject(slotValue) ? slotValue : undefined),
          ...(isStyleObject(childValue) ? childValue : undefined),
        };
      }
      continue;
    }

    if (name === 'aria-describedby') {
      // Additive deduplicated token merge (child -> outer) applies only to aria-describedby;
      // aria-labelledby is an accessible name and follows ordinary child-wins override below.
      const childTokens = tokenizeIdList(childValue);
      const slotTokens = tokenizeIdList(slotValue);
      if (childTokens.length > 0 || slotTokens.length > 0) {
        merged['aria-describedby'] = [...new Set([...childTokens, ...slotTokens])].join(' ');
      } else if (childValue !== undefined) {
        merged['aria-describedby'] = childValue;
      } else if (slotValue !== undefined) {
        merged['aria-describedby'] = slotValue;
      } else if (defaultValue !== undefined) {
        merged['aria-describedby'] = defaultValue;
      }
      continue;
    }

    if (childValue !== undefined) {
      merged[name] = childValue;
    } else if (slotValue !== undefined) {
      merged[name] = slotValue;
    } else if (defaultValue !== undefined) {
      merged[name] = defaultValue;
    }
  }

  return merged;
}

function useSlotRef<T>(
  outer: Ref<T> | undefined,
  inner: Ref<T> | undefined,
): RefCallback<T> | undefined {
  // Never bypass mergeRefs when outer is undefined: a single childRef still needs the
  // idempotent null <-> React 19 cleanup bridge for legacy router adapters.
  return useMemo(() => (outer || inner ? mergeRefs(outer, inner) : undefined), [outer, inner]);
}

export function Slot<T extends Element = HTMLElement>({
  children,
  ref,
  slotDefaults,
  slotOwned,
  slotContent,
  ...slotProps
}: SlotProps<T>): ReactElement {
  const child = requireSlotChild<T>(children);
  const childProps = child.props;
  const mergedRef = useSlotRef(ref, childProps.ref);
  const mergedProps = resolveSlotProps({
    slotProps,
    childProps,
    slotDefaults,
    slotOwned,
  });

  if (slotContent !== undefined) {
    return cloneElement(child, { ...mergedProps, ref: mergedRef }, slotContent);
  }
  return cloneElement(child, { ...mergedProps, ref: mergedRef });
}
