import { useId, useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { cx } from '../../core/cx.js';
import { composedContains } from '../../core/dom.js';
import { mergeRefs } from '../../core/mergeRefs.js';
import { useStateAuthority } from '../../core/useControllableState.js';
import { DisclosureContext, useDisclosure } from '../../internal/disclosure/context.js';
import { Panel } from '../../internal/disclosure/Panel.js';
import { Trigger } from '../../internal/disclosure/Trigger.js';
import type {
  CollapsibleContentProps,
  CollapsibleProps,
  CollapsibleTriggerProps,
} from './types.js';
import './collapsible.css';

/** Reveals a single inline section from one or more buttons. */
export function Collapsible({
  open,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  size = 'm',
  contentId,
  lazyMount,
  unmountOnExit,
  children,
  className,
  tabIndex = -1,
  ref,
  ...props
}: CollapsibleProps): ReactElement {
  const generatedId = useId();
  const panelId = contentId ?? generatedId;
  const [expanded, authority] = useStateAuthority({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const lastTrigger = useRef<HTMLButtonElement>(null);
  const [triggers] = useState(() => new Set<HTMLButtonElement>());
  const rootRef = useMemo(() => mergeRefs(root, ref), [ref]);

  function toggle(trigger: HTMLButtonElement): void {
    const body = panel.current;
    if (!body || !composedContains(body, trigger)) {
      lastTrigger.current = trigger;
    }
    authority.propose(!authority.read());
  }

  return (
    <DisclosureContext
      value={{
        family: 'Collapsible',
        open: expanded,
        panelId,
        panel,
        disabled,
        root,
        triggers,
        lastTrigger,
        toggle,
        lazyMount,
        unmountOnExit,
      }}
    >
      <div
        {...props}
        ref={rootRef}
        tabIndex={tabIndex}
        className={cx('unica-collapsible', className)}
        data-unica-disclosure-size={size}
      >
        {children}
      </div>
    </DisclosureContext>
  );
}

/** Toggles the section using a disclosure row or an existing button. */
export function CollapsibleTrigger(props: CollapsibleTriggerProps): ReactElement {
  return <Trigger {...props} state={useDisclosure('Collapsible')} />;
}

/** Holds the section body and its stable accessible target. */
export function CollapsibleContent(props: CollapsibleContentProps): ReactElement {
  return <Panel {...props} state={useDisclosure('Collapsible')} />;
}
