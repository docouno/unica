import {
  cloneElement,
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { ComponentPropsWithRef, MouseEvent, ReactElement, ReactNode, RefObject } from 'react';
import { CaretDownIcon } from '@phosphor-icons/react';
import './disclosure.css';

export type DisclosureSize = 's' | 'm' | 'l';
type HeadingLevel = 2 | 3 | 4 | 5 | 6;

interface DisclosureState {
  readonly panelId: string;
  readonly open: boolean;
  readonly disabled: boolean;
  readonly toggle: (trigger: HTMLButtonElement) => void;
  readonly root: RefObject<HTMLDivElement | null>;
  readonly lastTrigger: RefObject<HTMLButtonElement | null>;
}

const DisclosureContext = createContext<DisclosureState | null>(null);

function useDisclosure(): DisclosureState {
  const disclosure = useContext(DisclosureContext);
  if (!disclosure) {
    throw new Error('A disclosure part needs a Collapsible or AccordionItem.');
  }
  return disclosure;
}

export interface CollapsibleProps extends Omit<ComponentPropsWithRef<'div'>, 'ref'> {
  readonly size?: DisclosureSize;
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly disabled?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
}

export function Collapsible({
  size = 'm',
  open,
  defaultOpen = false,
  disabled = false,
  onOpenChange,
  className = '',
  children,
  ...props
}: CollapsibleProps): ReactElement {
  const panelId = useId();
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const expanded = open ?? localOpen;
  const root = useRef<HTMLDivElement>(null);
  const lastTrigger = useRef<HTMLButtonElement>(null);

  function toggle(trigger: HTMLButtonElement): void {
    lastTrigger.current = trigger;
    if (open === undefined) {
      setLocalOpen(!expanded);
    }
    onOpenChange?.(!expanded);
  }

  return (
    <DisclosureContext value={{ panelId, open: expanded, disabled, toggle, root, lastTrigger }}>
      <div
        {...props}
        className={`collapsible-proto ${className}`}
        data-size={size}
        tabIndex={-1}
        ref={root}
      >
        {children}
      </div>
    </DisclosureContext>
  );
}

type TriggerProps = ComponentPropsWithRef<'button'>;

interface DisclosureTriggerProps extends TriggerProps {
  readonly indicator?: 'start' | 'end';
  readonly asChild?: boolean;
}

function DisclosureTrigger({
  ref,
  children,
  className = '',
  disabled = false,
  onClick,
  indicator = 'start',
  asChild = false,
  ...props
}: DisclosureTriggerProps): ReactElement {
  const disclosure = useDisclosure();
  const child = asChild ? (children as ReactElement<ComponentPropsWithRef<'button'>>) : null;
  const unavailable = disclosure.disabled || disabled || child?.props.disabled;
  const triggerProps = {
    'data-disclosure-trigger': disclosure.panelId,
    'aria-expanded': disclosure.open,
    'aria-controls': disclosure.panelId,
    disabled: unavailable,
    onClick(event: MouseEvent<HTMLButtonElement>) {
      child?.props.onClick?.(event);
      onClick?.(event);
      if (!event.defaultPrevented && !unavailable) {
        disclosure.toggle(event.currentTarget);
      }
    },
  };

  if (child) {
    return cloneElement(child, { type: 'button', ...triggerProps });
  }

  const caret = (
    <CaretDownIcon className="disclosure-caret-proto" weight="bold" aria-hidden="true" />
  );
  return (
    <button
      {...props}
      {...triggerProps}
      ref={ref}
      type="button"
      className={`disclosure-trigger-proto ${className}`}
      data-indicator={indicator}
    >
      {indicator === 'start' && caret}
      <span className="disclosure-label-proto">{children}</span>
      {indicator === 'end' && caret}
    </button>
  );
}

export interface CollapsibleTriggerProps extends TriggerProps {
  readonly asChild?: boolean;
}

export function CollapsibleTrigger(props: CollapsibleTriggerProps): ReactElement {
  return <DisclosureTrigger {...props} />;
}

function returnPanelFocus(panel: HTMLElement, disclosure: DisclosureState): void {
  const root = disclosure.root.current;
  if (!root || !panel.contains(panel.ownerDocument.activeElement)) {
    return;
  }
  const available = (trigger: HTMLButtonElement): boolean =>
    !trigger.disabled && !panel.contains(trigger) && !trigger.closest('[hidden], [inert]');
  const lastTrigger = disclosure.lastTrigger.current;
  const target =
    lastTrigger && root.contains(lastTrigger) && available(lastTrigger)
      ? lastTrigger
      : Array.from(
          root.querySelectorAll<HTMLButtonElement>('button[data-disclosure-trigger]'),
        ).find(
          (trigger) =>
            trigger.dataset.disclosureTrigger === disclosure.panelId && available(trigger),
        );
  const focusTarget = target ?? root;
  focusTarget.focus({ preventScroll: true });
  focusTarget.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
}

export interface CollapsibleContentProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'id' | 'hidden' | 'ref'
> {
  readonly padded?: boolean;
}

export function CollapsibleContent({
  padded = true,
  className = '',
  children,
  ...props
}: CollapsibleContentProps): ReactElement {
  const disclosure = useDisclosure();
  const { open, panelId } = disclosure;
  const [initiallyHidden] = useState(!open);
  const previousOpen = useRef(open);
  const panelRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const motion = useRef<Animation | null>(null);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const body = bodyRef.current;
    if (!panel || !body || previousOpen.current === open) {
      return;
    }
    previousOpen.current = open;
    if (!open) {
      returnPanelFocus(panel, disclosure);
    }
    panel.inert = !open;

    const from = panel.getBoundingClientRect().height;
    motion.current?.cancel();
    panel.hidden = false;
    const to = open ? body.getBoundingClientRect().height : 0;
    const time = getComputedStyle(panel).getPropertyValue('--_disclosure-duration').trim();
    const duration = Number.parseFloat(time) * (time.endsWith('ms') ? 1 : 1000);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    const settle = (): void => {
      motion.current = null;
      panel.hidden = !open;
      delete panel.dataset.moving;
    };

    if (reduce || !duration || from === to) {
      settle();
      return;
    }

    panel.dataset.moving = '';
    const animation = panel.animate([{ height: `${from}px` }, { height: `${to}px` }], {
      duration: open ? duration : Math.round(duration * 0.8),
      easing: 'cubic-bezier(0.2, 0, 0, 1)',
    });
    motion.current = animation;
    animation.onfinish = settle;
  }, [disclosure, open]);

  return (
    <div
      {...props}
      className={`disclosure-panel-proto ${className}`}
      ref={panelRef}
      id={panelId}
      hidden={initiallyHidden}
    >
      <div ref={bodyRef} className="disclosure-body-proto" data-padded={padded}>
        {children}
      </div>
    </div>
  );
}

interface AccordionState {
  readonly size: DisclosureSize;
  readonly headingLevel: HeadingLevel;
  readonly value: readonly string[];
  readonly toggle: (key: string, open: boolean) => void;
}

const AccordionContext = createContext<AccordionState | null>(null);

function useAccordion(): AccordionState {
  const accordion = useContext(AccordionContext);
  if (!accordion) {
    throw new Error('Accordion parts need an Accordion.');
  }
  return accordion;
}

export interface AccordionProps extends ComponentPropsWithRef<'div'> {
  readonly headingLevel: HeadingLevel;
  readonly size?: DisclosureSize;
  readonly exclusive?: boolean;
  readonly dividers?: boolean;
  readonly value?: readonly string[];
  readonly defaultValue?: readonly string[];
  readonly onValueChange?: (value: readonly string[]) => void;
}

export function Accordion({
  headingLevel,
  size = 'm',
  exclusive = false,
  dividers = true,
  value,
  defaultValue = [],
  onValueChange,
  className = '',
  children,
  ...props
}: AccordionProps): ReactElement {
  const [localValue, setLocalValue] = useState(defaultValue);
  const selected = value ?? localValue;
  const expanded = exclusive ? selected.slice(0, 1) : selected;

  function toggle(key: string, open: boolean): void {
    const next = open
      ? [...(exclusive ? [] : expanded), key]
      : expanded.filter((item) => item !== key);
    if (value === undefined) {
      setLocalValue(next);
    }
    onValueChange?.(next);
  }

  return (
    <AccordionContext value={{ size, headingLevel, value: expanded, toggle }}>
      <div {...props} className={`accordion-proto ${className}`} data-dividers={dividers}>
        {children}
      </div>
    </AccordionContext>
  );
}

export interface AccordionItemProps extends Omit<ComponentPropsWithRef<'div'>, 'ref'> {
  readonly value: string;
  readonly disabled?: boolean;
}

export function AccordionItem({ value, ...props }: AccordionItemProps): ReactElement {
  const accordion = useAccordion();
  return (
    <Collapsible
      {...props}
      data-accordion-item=""
      size={accordion.size}
      open={accordion.value.includes(value)}
      onOpenChange={(open) => accordion.toggle(value, open)}
    />
  );
}

export interface AccordionTriggerProps extends TriggerProps {
  readonly action?: ReactNode;
}

export function AccordionTrigger({ action, ...props }: AccordionTriggerProps): ReactElement {
  const { headingLevel } = useAccordion();
  const Heading = `h${headingLevel}` as const;

  return (
    <div className="accordion-header-proto">
      <Heading className="accordion-heading-proto">
        <DisclosureTrigger {...props} indicator="end" />
      </Heading>
      {action ? <div className="accordion-action-proto">{action}</div> : null}
    </div>
  );
}

export function AccordionContent(props: CollapsibleContentProps): ReactElement {
  return <CollapsibleContent {...props} />;
}
