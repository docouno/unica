import { createElement } from 'react';
import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import { requireSlotChild } from './Slot.js';

export type AnchorProps = ComponentPropsWithRef<'a'>;

export function requireAnchorChild(
  children: ReactNode,
  disabled: boolean,
  owner: string,
): ReactElement<AnchorProps> {
  const child: ReactElement<AnchorProps> = requireSlotChild<HTMLAnchorElement>(
    children,
    `${owner} asChild`,
  );
  if (typeof child.type === 'string' && child.type !== 'a') {
    throw new Error(
      `${owner} asChild requires one anchor or one component that renders an anchor.`,
    );
  }
  if (child.type === 'a' && !disabled && typeof child.props.href !== 'string') {
    throw new Error(`An enabled ${owner} asChild anchor requires a string href.`);
  }
  if (
    child.props.dangerouslySetInnerHTML !== undefined ||
    typeof child.props.children === 'function' ||
    (typeof child.type !== 'string' && child.props.children === undefined)
  ) {
    throw new Error(`${owner} asChild requires its label to be supplied as ordinary children.`);
  }
  return child;
}

function tokens(value?: string): string[] {
  return value?.split(/[\t\n\f\r ]+/).filter(Boolean) ?? [];
}

export function secureRel(rel?: string): string {
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

export function fallbackAnchorAttributes(props: AnchorProps): AnchorProps {
  return Object.fromEntries(
    Object.entries(props).filter(
      ([name]) => fallbackKeys.has(name) || name.startsWith('aria-') || name.startsWith('data-'),
    ),
  );
}

export function fallbackAnchorChild(child: ReactElement<AnchorProps>): ReactElement {
  return createElement('a', { ...fallbackAnchorAttributes(child.props), ref: child.props.ref });
}

export type AnchorDestination =
  | {
      readonly asChild: true;
      readonly href?: never;
      readonly disabled?: boolean | undefined;
      readonly children: ReactElement;
    }
  | {
      readonly asChild?: false | undefined;
      readonly href: string;
      readonly disabled?: boolean | undefined;
      readonly children?: ReactNode;
    }
  | {
      readonly asChild?: false | undefined;
      readonly href?: string | undefined;
      readonly disabled: true;
      readonly children?: ReactNode;
    };
