import type { ComponentPropsWithRef, ReactElement } from 'react';
import {
  ArrowElbowDownLeftIcon,
  ArrowFatUpIcon,
  BackspaceIcon,
  CaretUpIcon,
  CommandIcon,
  OptionIcon,
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
  '↩': { icon: ArrowElbowDownLeftIcon, label: 'Enter' },
  '⌫': { icon: BackspaceIcon, label: 'Backspace' },
};

export function Kbd({
  className = '',
  children,
  'aria-label': label,
  ...props
}: ComponentPropsWithRef<'kbd'>): ReactElement {
  const parts = typeof children === 'string' ? children.split(/([⌘⇧⌥⌃↵↩⌫])/u) : undefined;
  const containsSymbols = parts?.some((part) => keySymbols[part]);
  const spokenLabel = containsSymbols
    ? parts
        ?.map((part) => keySymbols[part]?.label ?? part)
        .join(' ')
        .replace(/\s+/gu, ' ')
        .trim()
    : undefined;
  return (
    <kbd
      {...props}
      className={`kbd-proto ${className}`}
      dir="ltr"
      aria-label={label ?? spokenLabel}
    >
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
              part
            );
          })
        : children}
    </kbd>
  );
}

export function KbdGroup({
  className = '',
  ...props
}: ComponentPropsWithRef<'span'>): ReactElement {
  return <span {...props} className={`kbd-group-proto ${className}`} dir="ltr" />;
}
