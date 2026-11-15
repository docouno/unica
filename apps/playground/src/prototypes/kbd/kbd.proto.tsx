import { Children, Fragment } from 'react';
import type { ComponentPropsWithRef, ReactElement } from 'react';
import {
  ArrowDownIcon,
  ArrowElbowDownLeftIcon,
  ArrowFatUpIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  BackspaceIcon,
  CaretUpIcon,
  CommandIcon,
  OptionIcon,
  ArrowLineRightIcon,
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import './kbd.css';

interface KeySymbol {
  readonly icon: Icon;
  readonly label: string;
}
const keySymbols: Readonly<Record<string, KeySymbol>> = {
  '⌘': { icon: CommandIcon, label: 'Command' },
  '⇧': { icon: ArrowFatUpIcon, label: 'Shift' },
  '⌥': { icon: OptionIcon, label: 'Option' },
  '⌃': { icon: CaretUpIcon, label: 'Control' },
  '↵': { icon: ArrowElbowDownLeftIcon, label: 'Enter' },
  '↩': { icon: ArrowElbowDownLeftIcon, label: 'Return' },
  '⌫': { icon: BackspaceIcon, label: 'Backspace' },
  '⇥': { icon: ArrowLineRightIcon, label: 'Tab' },
  '↑': { icon: ArrowUpIcon, label: 'Arrow up' },
  '↓': { icon: ArrowDownIcon, label: 'Arrow down' },
  '←': { icon: ArrowLeftIcon, label: 'Arrow left' },
  '→': { icon: ArrowRightIcon, label: 'Arrow right' },
};
export type KbdSize = 'inherit' | 's' | 'm' | 'l';
export interface KbdProps extends Omit<ComponentPropsWithRef<'kbd'>, 'aria-label'> {
  readonly size?: KbdSize;
  /** Spoken text for a custom glyph or a localized key name. */
  readonly label?: string;
}

// Visual reference only; the package API is designed during library implementation.
export function Kbd({
  size = 'inherit',
  label,
  className = '',
  children,
  ...props
}: KbdProps): ReactElement | null {
  if (children === undefined || children === null || children === false || children === '') {
    return null;
  }
  const parts =
    typeof children === 'string' ? children.split(/([⌘⇧⌥⌃↵↩⌫⇥↑↓←→])/u).filter(Boolean) : undefined;
  const spokenLabel =
    label ??
    (parts?.some((part) => keySymbols[part])
      ? parts.map((part) => keySymbols[part]?.label ?? part).join(' + ')
      : undefined);
  return (
    <kbd {...props} className={`kbd-proto ${className}`} data-size={size} dir="ltr">
      {spokenLabel && <span className="kbd-spoken-proto">{spokenLabel}</span>}
      <span className="kbd-face-proto" aria-hidden={spokenLabel ? true : undefined}>
        {parts
          ? parts.map((part, index) => {
              const Glyph = keySymbols[part]?.icon;
              return Glyph ? (
                <Glyph
                  key={index}
                  className="kbd-symbol-proto"
                  size="1em"
                  weight="regular"
                  aria-hidden="true"
                  focusable="false"
                />
              ) : (
                <span key={index}>{part}</span>
              );
            })
          : children}
      </span>
    </kbd>
  );
}

export interface KbdGroupProps extends ComponentPropsWithRef<'span'> {
  readonly size?: KbdSize;
  /** Empty separators retain an audible “plus” for compact chords. */
  readonly separator?: string;
}
export function KbdGroup({
  size = 'inherit',
  separator = '+',
  className = '',
  children,
  ...props
}: KbdGroupProps): ReactElement {
  return (
    <span {...props} className={`kbd-group-proto ${className}`} data-size={size} dir="ltr">
      {Children.toArray(children).map((child, index) => (
        <Fragment key={index}>
          {index > 0 && (
            <span className={separator ? 'kbd-separator-proto' : 'kbd-spoken-proto'}>
              {separator ? ` ${separator} ` : ' + '}
            </span>
          )}
          {child}
        </Fragment>
      ))}
    </span>
  );
}
