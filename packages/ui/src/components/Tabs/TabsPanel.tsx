import { useMemo, useRef, useState } from 'react';
import type { JSX, ReactNode, RefCallback } from 'react';
import { composeEventHandlers } from '../../core/composeEventHandlers.js';
import { cx } from '../../core/cx.js';
import { mergeRefs } from '../../core/mergeRefs.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import { tabAttributes, tabPartIds, useTabs } from './context.js';
import type { TabsMountStrategy, TabsPanelProps } from './types.js';

const panelReserved = /* @__PURE__ */ new Set([
  'aria-hidden',
  'aria-label',
  'aria-labelledby',
  'dangerouslysetinnerhtml',
  'hidden',
  'id',
  'role',
  'tabindex',
]);

function PanelContents({
  children,
  selected,
  confirmed,
  strategy,
}: {
  readonly children: ReactNode;
  readonly selected: boolean;
  readonly confirmed: boolean;
  readonly strategy: TabsMountStrategy;
}): ReactNode {
  const [visited, setVisited] = useState(false);
  useIsoLayoutEffect(() => {
    if (selected && confirmed && strategy === 'lazy') {
      setVisited(true);
    }
  }, [confirmed, selected, strategy]);

  return strategy === 'eager' || selected || (strategy === 'lazy' && visited) ? children : null;
}

/** Keeps a labelled panel shell and applies its content mounting strategy. */
export function TabsPanel({
  value,
  mountStrategy,
  children,
  tabIndex = 0,
  className,
  onFocusCapture,
  onBlur,
  style,
  ref,
  ...props
}: TabsPanelProps): JSX.Element {
  const tabs = useTabs();
  const { attachPanel, trackPanelFocus } = tabs;
  const capturedFocus = useRef(false);
  const panelRef = useMemo(() => {
    const register: RefCallback<HTMLDivElement> = (node) => {
      if (node) {
        if (!capturedFocus.current) {
          trackPanelFocus(value, node);
        }
        return attachPanel(node, value);
      }
    };
    return mergeRefs(register, ref);
  }, [attachPanel, ref, trackPanelFocus, value]);
  const selected = tabs.selected === value;
  const ids = tabPartIds(tabs.id, value);

  return (
    <div
      {...tabAttributes(props, panelReserved)}
      ref={panelRef}
      className={cx('unica-tabs-panel', className)}
      id={ids.panel}
      role="tabpanel"
      aria-labelledby={ids.trigger}
      tabIndex={tabIndex}
      hidden={!selected}
      style={selected ? style : { ...style, display: 'none' }}
      onFocusCapture={(event) => {
        capturedFocus.current = true;
        tabs.onPanelFocusCapture(value, event, onFocusCapture);
      }}
      onBlur={composeEventHandlers(onBlur, tabs.releasePanelFocus)}
    >
      <PanelContents
        key={value}
        selected={selected && (tabs.items === null || tabs.confirmedSelection === value)}
        confirmed={tabs.confirmedSelection === value}
        strategy={mountStrategy ?? tabs.mountStrategy}
      >
        {children}
      </PanelContents>
    </div>
  );
}
