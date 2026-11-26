import { useCallback, useContext, useId, useMemo, useState } from 'react';
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { composeEventHandlers } from '../../core/composeEventHandlers.js';
import { cx, dataFlag } from '../../core/cx.js';
import { guardActivation } from '../../core/guardActivation.js';
import { isElementNode } from '../../core/dom.js';
import { mergeRefs } from '../../core/mergeRefs.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import { Icon } from '../Icon/Icon.js';
import { MenuLevelContext, MenuSubContext, useLevel, useMenu } from './menu-context.js';
import { menuPanel, nearestLevel } from './menu-controller.js';
import type { MenuBranch, MenuPanel } from './menu-controller.js';
import {
  liveMenuLabels,
  menuChevron,
  MenuRowFrame,
  ownedInvocationAttributes,
  ownedMenuAria,
  rowAttributes,
  RowContent,
} from './row.js';
import type {
  MenuContentProps,
  MenuSubContentProps,
  MenuSubProps,
  MenuSubTriggerProps,
} from './types.js';
import './menu.css';

type AccessibleName = Pick<HTMLAttributes<HTMLElement>, 'aria-label' | 'aria-labelledby'>;

function useMenuName(
  host: HTMLDivElement | null,
  trigger: HTMLButtonElement | null,
  label: string | undefined,
  labelledBy: string | undefined,
  visible: boolean,
): AccessibleName {
  const [name, setName] = useState<AccessibleName>();
  useIsoLayoutEffect(() => {
    const view = host?.ownerDocument.defaultView;
    if (!host || !view || !visible) {
      return;
    }
    const update = (): void => {
      const explicit = liveMenuLabels(host, labelledBy);
      const triggerLabels = liveMenuLabels(host, trigger?.getAttribute('aria-labelledby'));
      const triggerLabel = trigger?.getAttribute('aria-label')?.trim();
      const fallback = liveMenuLabels(host, trigger?.id);
      const next: AccessibleName = explicit
        ? { 'aria-labelledby': explicit }
        : label?.trim()
          ? { 'aria-label': label }
          : triggerLabels
            ? { 'aria-labelledby': triggerLabels }
            : triggerLabel
              ? { 'aria-label': triggerLabel }
              : { 'aria-labelledby': fallback };
      setName((previous) =>
        previous?.['aria-label'] === next['aria-label'] &&
        previous?.['aria-labelledby'] === next['aria-labelledby']
          ? previous
          : next,
      );
    };
    update();
    const observer = new view.MutationObserver(update);
    observer.observe(host.getRootNode(), {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['id', 'aria-label', 'aria-labelledby'],
    });
    return () => observer.disconnect();
  }, [host, trigger, label, labelledBy, visible]);
  return name ?? { 'aria-label': label?.trim() || undefined };
}

interface LevelProps {
  readonly panel: MenuPanel;
  readonly children: ReactNode;
  readonly back?: { readonly label: string; readonly title: string } | undefined;
}

function MenuCarrierFrame({ children }: { readonly children: ReactNode }): ReactElement {
  return <div className="unica-menu-carrier-frame">{children}</div>;
}

function MenuLevel({ panel, children, back }: LevelProps): ReactElement {
  const { controller } = useMenu();
  const inactive = Boolean(controller.inlineChild(panel));
  const attach = useCallback(
    (node: HTMLDivElement | null) => {
      controller.setLevel(panel, node);
    },
    [controller, panel],
  );
  return (
    <MenuLevelContext value={panel}>
      <div
        ref={attach}
        className="unica-menu-level"
        data-unica-menu-level=""
        data-unica-menu-inactive={dataFlag(inactive)}
        onFocus={(event) => {
          const row = event.target.closest<HTMLElement>('[data-unica-menu-row]');
          if (row && nearestLevel(row) === event.currentTarget) {
            controller.rememberFocus(panel, row);
          }
        }}
        onPointerMove={(event) => {
          const target = event.nativeEvent.composedPath().find(isElementNode);
          if (target && nearestLevel(target) === event.currentTarget) {
            controller.hover(
              panel,
              target.closest<HTMLElement>('[data-unica-menu-row]'),
              event.nativeEvent,
            );
          }
        }}
      >
        {back && !inactive && (
          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            id={`${panel.host?.id ?? back.title}-back`}
            className="unica-menu-back"
            data-unica-menu-row=""
            data-unica-menu-back=""
            onClick={() => controller.back(panel)}
          >
            <Icon usage="slot" icon={menuChevron} className="unica-menu-chevron" />
            <span className="unica-menu-label">{back.label}</span>
            <span aria-hidden="true" className="unica-menu-back-title">
              {back.title}
            </span>
          </button>
        )}
        <div className="unica-menu-scroll unica-scrollbar unica-scrollbar--compact">{children}</div>
      </div>
    </MenuLevelContext>
  );
}

/** Hosts the named root menu in a native in-place popover. */
export function MenuContent({
  align = 'start',
  children,
  ref,
  id,
  className,
  'aria-label': label,
  'aria-labelledby': labelledBy,
  onKeyDown,
  ...props
}: MenuContentProps): ReactElement {
  const { controller, size } = useMenu();
  const panel = controller.root;
  const derivedId = useId();
  const name = useMenuName(panel.host, controller.trigger, label, labelledBy, controller.visible);
  const activeLabel = controller.activeLabel(panel);
  const mergedRef = useMemo(() => mergeRefs(controller.setRoot, ref), [controller, ref]);
  useIsoLayoutEffect(() => {
    controller.setAlign(align);
  }, [align, controller, id, props.hidden]);
  return (
    <MenuCarrierFrame>
      <div
        {...props}
        {...ownedInvocationAttributes()}
        {...ownedMenuAria()}
        {...(activeLabel ? { 'aria-label': activeLabel, 'aria-labelledby': undefined } : name)}
        ref={mergedRef}
        id={id ?? derivedId}
        className={cx('unica-menu unica-overlay-surface', className)}
        role="menu"
        tabIndex={-1}
        popover="auto"
        data-surface="overlay"
        data-unica-menu-carrier=""
        data-unica-menu-size={size}
        onKeyDown={composeEventHandlers(onKeyDown, (event) => {
          const current = controller.currentLevel(panel);
          const target = event.nativeEvent.composedPath().find(isElementNode);
          if (target === panel.host || (target && nearestLevel(target) === current.level)) {
            controller.keydown(current, event.nativeEvent);
          }
        })}
      >
        <MenuLevel panel={panel}>{children}</MenuLevel>
      </div>
    </MenuCarrierFrame>
  );
}

/** Pairs a branch button with its nested menu without adding a wrapper node. */
export function MenuSub({ children, ref }: MenuSubProps): ReactElement {
  const parent = useLevel();
  const id = useId();
  const [branch] = useState<MenuBranch>(() => ({
    parent,
    panel: menuPanel(),
    row: null,
    id,
    labelId: `${id}-label`,
    label: '',
  }));
  return <MenuSubContext value={{ branch, ref }}>{children}</MenuSubContext>;
}

/** Opens its child menu as a cascade or as a level within the current panel. */
export function MenuSubTrigger({
  children,
  description,
  icon,
  disabled,
  className,
  ref,
  id,
  onClick,
  ...props
}: MenuSubTriggerProps): ReactElement {
  const { controller } = useMenu();
  const sub = useContext(MenuSubContext);
  if (!sub) {
    throw new Error('MenuSubTrigger requires MenuSub.');
  }
  const { branch, ref: subRef } = sub;
  const generatedId = useId();
  const attach = useCallback(
    (node: HTMLButtonElement | null) => {
      controller.setBranchRow(branch, node);
    },
    [controller, branch],
  );
  const mergedRef = useMemo(() => mergeRefs(attach, subRef, ref), [attach, subRef, ref]);
  useIsoLayoutEffect(() => {
    controller.setBranchLabel(branch, children);
  }, [branch, children, controller]);
  const entry = controller.stateFor(branch);
  const inactive = Boolean(controller.inlineChild(branch.parent));
  return (
    <MenuRowFrame inactive={inactive}>
      <button
        {...props}
        {...guardActivation(props, () => Boolean(disabled))}
        {...rowAttributes(
          id ?? generatedId,
          branch.labelId,
          description,
          props['aria-describedby'],
          disabled,
        )}
        ref={mergedRef}
        className={cx('unica-menu-row', className)}
        type="button"
        role="menuitem"
        aria-haspopup="menu"
        aria-expanded={Boolean(entry)}
        aria-controls={branch.panel.host?.id || undefined}
        data-unica-menu-expanded={dataFlag(Boolean(entry))}
        data-unica-menu-flipped={dataFlag(entry?.mode === 'start')}
        onClick={(event) => {
          if (disabled) {
            event.preventDefault();
            return;
          }
          onClick?.(event);
          if (!event.defaultPrevented) {
            event.preventDefault();
            controller.openBranch(branch, true);
          }
        }}
      >
        <RowContent
          label={children}
          labelId={branch.labelId}
          description={description}
          icon={icon}
          branch
        />
      </button>
    </MenuRowFrame>
  );
}

/** Contains one nested level and supplies the Back action when the level opens inline. */
export function MenuSubContent({
  children,
  ref,
  id,
  className,
  backLabel = 'Back',
  onKeyDown,
  ...props
}: MenuSubContentProps): ReactElement {
  const { controller, size } = useMenu();
  const sub = useContext(MenuSubContext);
  if (!sub) {
    throw new Error('MenuSubContent requires MenuSub.');
  }
  const { branch } = sub;
  const state = controller.stateFor(branch);
  const inline = state?.mode === 'inline';
  const name = controller.activeLabel(branch.panel);
  useIsoLayoutEffect(() => {
    controller.publish();
  }, [controller, id]);
  const attach = useCallback(
    (node: HTMLDivElement | null) => {
      controller.setBranchHost(branch, node);
    },
    [branch, controller],
  );
  const mergedRef = useMemo(() => mergeRefs(attach, ref), [attach, ref]);
  return (
    <MenuCarrierFrame>
      <div
        {...props}
        {...ownedInvocationAttributes()}
        {...ownedMenuAria()}
        ref={mergedRef}
        id={id ?? branch.id}
        className={cx('unica-menu', !inline && 'unica-overlay-surface', className)}
        popover={inline ? undefined : 'auto'}
        role={inline ? undefined : 'menu'}
        tabIndex={inline ? undefined : -1}
        aria-label={inline ? undefined : name}
        aria-labelledby={inline || name ? undefined : branch.labelId}
        data-surface={inline ? undefined : 'overlay'}
        data-unica-menu-carrier=""
        data-unica-menu-size={size}
        data-unica-menu-inline={dataFlag(inline)}
        onKeyDown={composeEventHandlers(onKeyDown, (event) => {
          if (!inline) {
            const current = controller.currentLevel(branch.panel);
            const target = event.nativeEvent.composedPath().find(isElementNode);
            if (
              target === branch.panel.host ||
              (target && nearestLevel(target) === current.level)
            ) {
              controller.keydown(current, event.nativeEvent);
            }
          }
        })}
      >
        <MenuLevel
          panel={branch.panel}
          back={inline ? { label: backLabel, title: branch.label } : undefined}
        >
          {children}
        </MenuLevel>
      </div>
    </MenuCarrierFrame>
  );
}
