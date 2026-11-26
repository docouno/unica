import { useCallback, useMemo } from 'react';
import type { JSX, RefCallback } from 'react';
import { composeEventHandlers } from '../../core/composeEventHandlers.js';
import { cx, dataFlag } from '../../core/cx.js';
import { warnOnce } from '../../core/devWarning.js';
import { mergeRefs } from '../../core/mergeRefs.js';
import { nonBlank } from '../../core/passiveRoot.js';
import { Badge } from '../Badge/index.js';
import { Icon } from '../Icon/index.js';
import { Tooltip } from '../Tooltip/index.js';
import { tabAttributes, tabPartIds, useTabs, useTabsList } from './context.js';
import type { TabsTriggerProps } from './types.js';

const triggerReserved = /* @__PURE__ */ new Set([
  'aria-controls',
  'aria-disabled',
  'aria-hidden',
  'aria-selected',
  'aschild',
  'command',
  'commandfor',
  'dangerouslysetinnerhtml',
  'hidden',
  'href',
  'id',
  'inert',
  'name',
  'popovertarget',
  'popovertargetaction',
  'role',
  'tabindex',
  'type',
]);

/** Renders a native tab button with an optional leading icon and count. */
export function TabsTrigger({
  value,
  children,
  iconLeft,
  count,
  countLabel,
  disabled,
  className,
  onFocus,
  onClick,
  onKeyDown,
  ref,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...props
}: TabsTriggerProps): JSX.Element {
  const tabs = useTabs();
  const list = useTabsList(tabs.collection);
  const { attachTrigger } = tabs.collection;
  const register = useCallback<RefCallback<HTMLButtonElement>>(
    (element) => {
      if (element) {
        return attachTrigger(element, value);
      }
    },
    [attachTrigger, value],
  );
  const { ref: focusRef, tabIndex, onFocus: focus } = list.getItemProps(value, { onFocus });
  const triggerRef = useMemo(() => mergeRefs(register, focusRef, ref), [register, focusRef, ref]);
  const text = typeof children === 'string' ? nonBlank(children) : undefined;
  const name = nonBlank(ariaLabel);
  const iconOnly = !text && Boolean(iconLeft);
  const labelledBy = iconOnly ? undefined : nonBlank(ariaLabelledBy);
  const spokenCount = count === undefined ? undefined : nonBlank(countLabel);
  const accessibleName =
    name ?? (!labelledBy && text && spokenCount ? `${text} ${spokenCount}` : undefined);
  const ids = tabPartIds(tabs.id, value);
  const selected = tabs.selected === value;
  if (!text && (!iconOnly || !name)) {
    warnOnce('TabsTrigger.name', 'TabsTrigger requires text or an icon with an aria-label.');
  }

  return (
    <Tooltip label={(iconOnly ? name : text) ?? ''} disabled={disabled || !list.hints.has(value)}>
      <button
        {...tabAttributes(props, triggerReserved)}
        ref={triggerRef}
        onFocus={focus}
        id={ids.trigger}
        className={cx('unica-tabs-trigger', className)}
        type="button"
        role="tab"
        aria-controls={ids.panel}
        aria-selected={selected}
        aria-label={accessibleName}
        aria-labelledby={labelledBy}
        tabIndex={tabs.items === null ? (selected && !disabled ? 0 : -1) : tabIndex}
        disabled={disabled}
        data-unica-tabs-icon-only={dataFlag(iconOnly)}
        onClick={composeEventHandlers(onClick, (event) => {
          list.reveal(event.currentTarget);
          tabs.select(value, event.currentTarget);
        })}
        onKeyDown={composeEventHandlers(onKeyDown, (event) => {
          if (event.repeat && event.key === 'Enter') {
            event.preventDefault();
          }
        })}
      >
        <span className="unica-tabs-body">
          {iconLeft && (
            <Icon className="unica-tabs-glyph" usage="slot" icon={iconLeft} size={tabs.size} />
          )}
          {text && <bdi className="unica-tabs-label">{text}</bdi>}
          {count !== undefined && (
            <Badge className="unica-tabs-count" size="s" aria-hidden="true">
              {count}
            </Badge>
          )}
        </span>
      </button>
    </Tooltip>
  );
}
