import { createContext, useCallback, useContext, useId, useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { cx, dataFlag } from '../../core/cx.js';
import { mergeRefs } from '../../core/mergeRefs.js';
import { useStateAuthority } from '../../core/useControllableState.js';
import { DisclosureContext, useDisclosure } from '../../internal/disclosure/context.js';
import type { PanelPolicy } from '../../internal/disclosure/context.js';
import { Panel } from '../../internal/disclosure/Panel.js';
import { Trigger } from '../../internal/disclosure/Trigger.js';
import { useExclusiveActivation } from './activation.js';
import type {
  AccordionContentProps,
  AccordionItemProps,
  AccordionProps,
  AccordionTriggerProps,
} from './types.js';
import '../Collapsible/collapsible.css';
import './accordion.css';

const empty: readonly string[] = [];

interface GroupState extends PanelPolicy {
  readonly headingLevel: AccordionProps['headingLevel'];
  readonly panels: Map<string, HTMLDivElement>;
  readonly values: readonly string[];
  readonly toggle: (key: string, trigger: HTMLButtonElement) => void;
  readonly preferredTrigger: ReturnType<typeof useExclusiveActivation>['preferredTrigger'];
}

const AccordionContext = createContext<GroupState | null>(null);

function useAccordion(): GroupState {
  const group = useContext(AccordionContext);
  if (!group) {
    throw new Error('Accordion parts need an Accordion.');
  }
  return group;
}

function normalize(values: readonly string[], exclusive: boolean): readonly string[] {
  return exclusive ? values.slice(0, 1) : [...new Set(values)];
}

function equalValues(first: readonly string[], second: readonly string[]): boolean {
  return first.length === second.length && first.every((value, index) => value === second[index]);
}

/** Groups independent or mutually exclusive inline sections under native headings. */
export function Accordion({
  headingLevel,
  size = 'm',
  exclusive = false,
  dividers = true,
  value,
  defaultValue = empty,
  onValueChange,
  lazyMount,
  unmountOnExit,
  children,
  className,
  ref,
  ...props
}: AccordionProps): ReactElement {
  const [selected, authority] = useStateAuthority({
    value,
    defaultValue,
    onChange: onValueChange,
    isEqual: equalValues,
  });
  const values = normalize(selected, exclusive);
  const [panels] = useState(() => new Map<string, HTMLDivElement>());
  const activation = useExclusiveActivation(panels, exclusive ? values[0] : undefined);

  function toggle(key: string, trigger: HTMLButtonElement): void {
    const current = normalize(authority.read(), exclusive);
    if (!exclusive) {
      authority.propose(
        current.includes(key) ? current.filter((value) => value !== key) : [...current, key],
      );
      return;
    }
    const next = current[0] === key ? empty : [key];
    activation.request(current[0], next[0], trigger, () => authority.propose(next));
  }

  return (
    <AccordionContext
      value={{
        headingLevel,
        panels,
        values,
        toggle,
        preferredTrigger: activation.preferredTrigger,
        lazyMount,
        unmountOnExit,
      }}
    >
      <div
        {...props}
        ref={ref}
        className={cx('unica-accordion', className)}
        data-unica-disclosure-size={size}
        data-unica-accordion-dividers={dataFlag(dividers)}
      >
        {children}
      </div>
    </AccordionContext>
  );
}

/** Associates an accordion heading and panel with a stable section value. */
export function AccordionItem({
  value,
  disabled = false,
  children,
  className,
  ref,
  tabIndex = -1,
  ...props
}: AccordionItemProps): ReactElement {
  const accordion = useAccordion();
  const { panels } = accordion;
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const itemRef = useMemo(() => mergeRefs(root, ref), [ref]);
  const [triggers] = useState(() => new Set<HTMLButtonElement>());
  const registerPanel = useCallback(
    (panel: HTMLDivElement | null) => {
      if (panel) {
        panels.set(value, panel);
        return () => {
          if (panels.get(value) === panel) {
            panels.delete(value);
          }
        };
      }
    },
    [panels, value],
  );

  return (
    <DisclosureContext
      value={{
        family: 'Accordion',
        open: accordion.values.includes(value),
        panelId: `${id}-content`,
        panel: registerPanel,
        triggerId: `${id}-trigger`,
        disabled,
        root,
        triggers,
        toggle: (trigger) => accordion.toggle(value, trigger),
        preferredTrigger: (panel) => accordion.preferredTrigger(value, panel),
        lazyMount: accordion.lazyMount,
        unmountOnExit: accordion.unmountOnExit,
      }}
    >
      <div
        {...props}
        ref={itemRef}
        tabIndex={tabIndex}
        className={cx('unica-accordion-item', className)}
      >
        {children}
      </div>
    </DisclosureContext>
  );
}

/** Renders a disclosure button in a native heading beside an optional independent action. */
export function AccordionTrigger({ action, ...props }: AccordionTriggerProps): ReactElement {
  const { headingLevel } = useAccordion();
  const state = useDisclosure('Accordion');
  const Heading = `h${headingLevel}` as const;
  return (
    <div className="unica-accordion-header">
      <Heading className="unica-accordion-heading">
        <Trigger {...props} state={state} asChild={false} indicator="end" />
      </Heading>
      {action !== undefined && action !== null && action !== false && (
        <div className="unica-accordion-action">{action}</div>
      )}
    </div>
  );
}

/** Holds the section body and optionally names its region from the heading button. */
export function AccordionContent(props: AccordionContentProps): ReactElement {
  return <Panel {...props} state={useDisclosure('Accordion')} />;
}
