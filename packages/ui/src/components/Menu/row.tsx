import { useRef } from 'react';
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { dataFlag } from '../../core/cx.js';
import { defineGlyph } from '../../core/glyph.js';
import type { GlyphDefinition, GlyphSource, GlyphSvgProps } from '../../core/glyph.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import { CaretGlyph, CheckGlyph } from '../../internal/glyphs/index.js';
import { Icon } from '../Icon/Icon.js';
import { Kbd } from '../Kbd/Kbd.js';

const menuCheck = /* @__PURE__ */ defineGlyph(CheckGlyph);

export const menuChevron: GlyphDefinition = /* @__PURE__ */ defineGlyph(
  ({ className }: GlyphSvgProps): ReactElement => (
    <CaretGlyph className={className} direction="right" />
  ),
);

const nonInvoking = {
  popover: undefined,
  popoverTarget: undefined,
  popoverTargetAction: undefined,
  command: undefined,
  commandfor: undefined,
  autoFocus: undefined,
} as const;

export function ownedInvocationAttributes(): typeof nonInvoking {
  return nonInvoking;
}

const closedAria = {
  'aria-haspopup': undefined,
  'aria-expanded': undefined,
  'aria-controls': undefined,
  'aria-checked': undefined,
  'aria-disabled': undefined,
} as const;

export function ownedMenuAria(): typeof closedAria {
  return closedAria;
}

export function liveMenuLabels(
  host: Element,
  input: string | undefined | null,
): string | undefined {
  const root = host.getRootNode() as Document | ShadowRoot;
  const ids = input
    ?.trim()
    .split(/\s+/u)
    .filter((id) => id && root.getElementById?.(id));
  return ids?.length ? ids.join(' ') : undefined;
}

type OwnedRow = Pick<
  HTMLAttributes<HTMLElement>,
  'id' | 'tabIndex' | 'aria-labelledby' | 'aria-describedby' | 'aria-disabled'
> &
  typeof nonInvoking &
  Omit<typeof closedAria, 'aria-disabled'> & { 'data-unica-menu-row': string };

export function rowAttributes(
  id: string,
  labelId: string,
  description: string | undefined,
  describedBy: string | undefined,
  disabled: boolean | undefined,
): OwnedRow {
  const descriptions = [description && `${labelId}-description`, describedBy]
    .filter(Boolean)
    .join(' ');
  return {
    ...nonInvoking,
    ...closedAria,
    id,
    tabIndex: -1,
    'aria-labelledby': labelId,
    'aria-describedby': descriptions || undefined,
    'aria-disabled': disabled || undefined,
    'data-unica-menu-row': '',
  };
}

export function MenuRowFrame({
  inactive,
  children,
}: {
  readonly inactive: boolean;
  readonly children: ReactNode;
}): ReactElement {
  // Inline levels keep item state mounted while removing the previous level
  // from layout, focus and the accessibility tree.
  return (
    <div className="unica-menu-row-frame" hidden={inactive} inert={inactive || undefined}>
      {children}
    </div>
  );
}

function MenuShortcut({ keys }: { readonly keys: string }): ReactElement {
  const ref = useRef<HTMLSpanElement>(null);
  useIsoLayoutEffect(() => {
    const slot = ref.current;
    const cap = slot?.firstElementChild as HTMLElement | null;
    const row = slot?.closest<HTMLElement>('.unica-menu-row');
    const view = row?.ownerDocument.defaultView;
    if (!slot || !cap || !row || !view) {
      return;
    }
    const update = (): void => {
      const style = view.getComputedStyle(row);
      const available =
        row.clientWidth -
        Number.parseFloat(style.paddingLeft) -
        Number.parseFloat(style.paddingRight);
      slot.toggleAttribute(
        'data-unica-menu-overflow',
        available > 0 && cap.offsetWidth > available + 0.5,
      );
    };
    const observer = new view.ResizeObserver(update);
    observer.observe(row);
    observer.observe(cap);
    update();
    return () => observer.disconnect();
  }, [keys]);
  return (
    <span ref={ref} className="unica-menu-shortcut" aria-hidden="true">
      <Kbd>{keys}</Kbd>
    </span>
  );
}

interface RowContentProps {
  readonly label: string;
  readonly labelId: string;
  readonly description?: string | undefined;
  readonly icon?: GlyphSource | undefined;
  readonly shortcut?: string | undefined;
  readonly checked?: boolean | undefined;
  readonly radio?: boolean | undefined;
  readonly branch?: boolean | undefined;
}

export function RowContent({
  label,
  labelId,
  description,
  icon,
  shortcut,
  checked,
  radio,
  branch,
}: RowContentProps): ReactElement {
  return (
    <>
      <span
        className="unica-menu-mark"
        aria-hidden="true"
        data-unica-menu-mark={dataFlag(checked !== undefined)}
      >
        {checked &&
          (radio ? (
            <span className="unica-menu-dot" />
          ) : (
            <Icon usage="slot" icon={menuCheck} className="unica-menu-glyph" />
          ))}
      </span>
      <span
        className="unica-menu-icon"
        aria-hidden="true"
        data-unica-menu-icon={dataFlag(Boolean(icon))}
      >
        {icon && <Icon usage="slot" icon={icon} className="unica-menu-glyph" />}
      </span>
      <span className="unica-menu-copy">
        <span id={labelId} className="unica-menu-label">
          {label}
        </span>
        {description && (
          <span id={`${labelId}-description`} className="unica-menu-description">
            {description}
          </span>
        )}
      </span>
      {shortcut && <MenuShortcut keys={shortcut} />}
      {branch && <Icon usage="slot" icon={menuChevron} className="unica-menu-chevron" />}
    </>
  );
}
