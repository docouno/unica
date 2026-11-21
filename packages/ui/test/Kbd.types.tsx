import { createRef } from 'react';
import type { ReactElement } from 'react';
import { Kbd, KbdGroup } from '../src/index.js';
import type { KbdGroupProps, KbdProps, KbdSize } from '../src/index.js';
import type {
  KbdGroupProps as ServerKbdGroupProps,
  KbdProps as ServerKbdProps,
  KbdSize as ServerKbdSize,
} from '../src/server.js';

const size: KbdSize = 's';
const key: KbdProps = { size, ref: createRef<HTMLElement>(), label: 'Commande' };
const group: KbdGroupProps = { size, ref: createRef<HTMLSpanElement>() };

const serverSize: ServerKbdSize = 'm';
const serverKey: ServerKbdProps = { size: serverSize };
const serverGroup: ServerKbdGroupProps = { size: serverSize, separator: 'then' };

export function KbdExamples(): ReactElement {
  return (
    <KbdGroup {...group} id="shortcut" separator="" data-shortcut="search">
      <Kbd {...key}>⌘</Kbd>
      <Kbd aria-hidden="true">K</Kbd>
      <KbdGroup {...serverGroup}>
        <Kbd {...serverKey}>Enter</Kbd>
        <Kbd>Tab</Kbd>
      </KbdGroup>
    </KbdGroup>
  );
}

// @ts-expect-error Kbd labels its contents without setting aria-label on the generic native root.
export const invalidAriaLabel = <Kbd aria-label="Commande">⌘</Kbd>;
// @ts-expect-error Key sizes are a finite structural scale.
export const invalidSize = <Kbd size="xl">K</Kbd>;
// @ts-expect-error Keycaps do not expose material variants.
export const invalidVariant = <Kbd variant="ghost">K</Kbd>;
// @ts-expect-error Separators are text so that visual and spoken notation stay consistent.
export const invalidSeparator = <KbdGroup separator={<b>+</b>}>K</KbdGroup>;
