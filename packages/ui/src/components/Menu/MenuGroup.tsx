import { createContext, useId, useMemo, useState } from 'react';
import type { Context, ReactElement } from 'react';
import { cx } from '../../core/cx.js';
import { mergeRefs } from '../../core/mergeRefs.js';
import { useStateAuthority } from '../../core/useControllableState.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import { Divider } from '../Divider/Divider.js';
import { useLevel, useMenu } from './menu-context.js';
import { liveMenuLabels, MenuRowFrame, ownedInvocationAttributes, ownedMenuAria } from './row.js';
import type {
  MenuGroupProps,
  MenuLabelProps,
  MenuRadioGroupProps,
  MenuSeparatorProps,
} from './types.js';
import './menu.css';

interface MenuRadioContextValue {
  readonly value: string | null;
  readonly read: () => string | null;
  readonly propose: (value: string) => void;
}

export const MenuRadioContext: Context<MenuRadioContextValue | null> =
  createContext<MenuRadioContextValue | null>(null);

/** Groups related commands and can derive its name from a MenuLabel. */
export function MenuGroup({
  children,
  className,
  ref,
  'aria-label': label,
  'aria-labelledby': labelledBy,
  ...props
}: MenuGroupProps): ReactElement {
  const { controller } = useMenu();
  const panel = useLevel();
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [labelId, setLabelId] = useState<string>();
  const visible = controller.visible;
  useIsoLayoutEffect(() => {
    const view = host?.ownerDocument.defaultView;
    if (!host || !view || !visible) {
      return;
    }
    const update = (): void => {
      const explicit = liveMenuLabels(host, labelledBy);
      const first = label?.trim()
        ? undefined
        : Array.from(host.querySelectorAll<HTMLElement>('.unica-menu-group-label')).find(
            (element) => element.closest('.unica-menu-group') === host,
          );
      setLabelId(explicit ?? (first?.id || undefined));
    };
    const observer = new view.MutationObserver(update);
    observer.observe(labelledBy ? host.getRootNode() : host, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['id'],
    });
    update();
    return () => observer.disconnect();
  }, [host, label, labelledBy, visible]);
  const attach = useMemo(() => mergeRefs(ref, setHost), [ref]);
  const inactive = Boolean(controller.inlineChild(panel));
  return (
    <div
      {...props}
      {...ownedInvocationAttributes()}
      {...ownedMenuAria()}
      tabIndex={undefined}
      ref={attach}
      className={cx('unica-menu-group', className)}
      role={inactive ? undefined : 'group'}
      aria-label={inactive || labelId ? undefined : label?.trim() || undefined}
      aria-labelledby={inactive ? undefined : labelId}
    >
      {children}
    </div>
  );
}

/** Gives a group of menu actions a visible heading. */
export function MenuLabel({ className, id, ...props }: MenuLabelProps): ReactElement {
  const { controller } = useMenu();
  const panel = useLevel();
  const uid = useId();
  return (
    <MenuRowFrame inactive={Boolean(controller.inlineChild(panel))}>
      <div
        {...props}
        {...ownedInvocationAttributes()}
        {...ownedMenuAria()}
        role={undefined}
        tabIndex={undefined}
        className={cx('unica-menu-group-label', className)}
        id={id ?? uid}
      />
    </MenuRowFrame>
  );
}

/** Separates adjacent groups of commands. */
export function MenuSeparator({ className, ...props }: MenuSeparatorProps): ReactElement {
  const { controller } = useMenu();
  const panel = useLevel();
  return (
    <MenuRowFrame inactive={Boolean(controller.inlineChild(panel))}>
      <Divider
        {...props}
        orientation="horizontal"
        decorative={false}
        className={cx('unica-menu-separator', className)}
      />
    </MenuRowFrame>
  );
}

/** Owns the selected value for a named group of radio commands. */
export function MenuRadioGroup({
  value,
  defaultValue = null,
  onValueChange,
  children,
  ...props
}: MenuRadioGroupProps): ReactElement {
  const [current, { read, propose }] = useStateAuthority<string | null>({
    value,
    defaultValue,
    onChange: (next) => {
      if (next !== null) {
        onValueChange?.(next);
      }
    },
  });
  return (
    <MenuRadioContext value={{ value: current, read, propose }}>
      <MenuGroup {...props}>{children}</MenuGroup>
    </MenuRadioContext>
  );
}
