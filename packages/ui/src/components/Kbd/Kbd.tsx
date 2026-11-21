import { Children, Fragment, isValidElement } from 'react';
import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import { Glyph } from '../../internal/glyphs/index.js';
import { keySymbolPattern, keySymbols } from './key-symbols.js';
import './kbd.css';

export type KbdSize = 'inherit' | 's' | 'm' | 'l';

export interface KbdProps extends Omit<
  ComponentPropsWithRef<'kbd'>,
  'aria-label' | 'dangerouslySetInnerHTML'
> {
  readonly size?: KbdSize | undefined;
  /** Replaces the key's spoken text, for example to localize a built-in symbol. */
  readonly label?: string | undefined;
  readonly 'aria-label'?: never;
}

export interface KbdGroupProps extends Omit<
  ComponentPropsWithRef<'span'>,
  'dangerouslySetInnerHTML'
> {
  readonly size?: KbdSize | undefined;
  /** Empty strings leave a compact gap and preserve a spoken “plus”. */
  readonly separator?: string | undefined;
}

function isFragment(
  node: ReactNode,
): node is ReactElement<{ children?: ReactNode }, typeof Fragment> {
  return isValidElement(node) && node.type === Fragment;
}

function hasContent(children: ReactNode): boolean {
  return Children.toArray(children).some((child) =>
    isFragment(child) ? hasContent(child.props.children) : child !== '',
  );
}

interface KeyEntry {
  readonly key: string;
  readonly child: ReactNode;
  readonly hidden: boolean;
}

function isHiddenKey(child: ReactNode): boolean {
  return (
    isValidElement<KbdProps | KbdGroupProps>(child) &&
    (child.type === Kbd || child.type === KbdGroup) &&
    Boolean(child.props.hidden)
  );
}

function collectKeys(
  children: ReactNode,
  ancestors: readonly (string | number)[] = [],
): KeyEntry[] {
  return Children.toArray(children).flatMap((child, index) => {
    // Retain the fragment's identity when lifting its keys into the group.
    const path = [...ancestors, isValidElement(child) ? (child.key ?? index) : index];
    if (isFragment(child)) {
      return collectKeys(child.props.children, path);
    }
    return child === '' ? [] : [{ key: JSON.stringify(path), child, hidden: isHiddenKey(child) }];
  });
}

export function Kbd({
  children,
  className,
  size = 'inherit',
  label,
  ...props
}: KbdProps): ReactElement | null {
  if (!hasContent(children)) {
    return null;
  }

  const parts =
    typeof children === 'string' && keySymbolPattern.test(children)
      ? children.split(keySymbolPattern).filter(Boolean)
      : undefined;
  const spoken =
    label?.trim() || parts?.map((part) => keySymbols.get(part)?.label ?? part).join(' + ');

  return (
    <kbd
      {...props}
      aria-label={undefined}
      className={className ? `unica-kbd ${className}` : 'unica-kbd'}
      dangerouslySetInnerHTML={undefined}
      data-size={size}
      dir="ltr"
    >
      {spoken && <span className="unica-visually-hidden">{spoken}</span>}
      <span className="unica-kbd-face" aria-hidden={spoken ? true : undefined}>
        {parts
          ? parts.map((part, index) => {
              const symbol = keySymbols.get(part);
              return symbol ? (
                <Glyph key={index} className="unica-kbd-symbol" path={symbol.path} />
              ) : (
                <span key={index}>{part}</span>
              );
            })
          : children}
      </span>
    </kbd>
  );
}

export function KbdGroup({
  children,
  className,
  size = 'inherit',
  separator = '+',
  ...props
}: KbdGroupProps): ReactElement {
  const keys = collectKeys(children);
  const firstVisibleKey = keys.findIndex(({ hidden }) => !hidden);
  const delimiter = separator ? (
    <span className="unica-kbd-separator">{` ${separator} `}</span>
  ) : (
    <span className="unica-visually-hidden"> plus </span>
  );

  return (
    <span
      {...props}
      className={className ? `unica-kbd-group ${className}` : 'unica-kbd-group'}
      dangerouslySetInnerHTML={undefined}
      data-size={size}
      dir="ltr"
    >
      {keys.map(({ key, child, hidden }, index) => (
        <Fragment key={key}>
          {!hidden && index > firstVisibleKey && delimiter}
          {child}
        </Fragment>
      ))}
    </span>
  );
}
