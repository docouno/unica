import { Tabs, TabsList, TabsPanel, TabsTrigger, UnicaProvider } from '@docouno/unica';
import type {
  TabsActivationMode,
  TabsDistribution,
  TabsMountStrategy,
  TabsOrientation,
} from '@docouno/unica';
import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import { useLayoutEffect, useRef, useState } from 'react';
import type { FocusEvent, JSX } from 'react';
import { flushSync } from 'react-dom';

interface Options {
  readonly order: readonly string[];
  readonly unavailable: readonly string[];
  readonly selected: string;
  readonly controlled: boolean;
  readonly reject: boolean;
  readonly activation: TabsActivationMode;
  readonly mount: TabsMountStrategy;
  readonly lastMount?: TabsMountStrategy;
  readonly direction?: 'ltr' | 'rtl';
  readonly orientation: TabsOrientation;
  readonly width: number;
  readonly distribution?: TabsDistribution;
  readonly long: boolean;
  readonly fieldsetDisabled: boolean;
  readonly inLegend: boolean;
  readonly replacement: number;
  readonly autoFocus?: string;
  readonly listInert?: boolean;
  readonly listAriaHidden?: boolean;
  readonly redirectFocus?: 'cancel-draft' | 'cancel-fallback';
  readonly redirectTriggerFocus?: 'allow' | 'cancel';
  readonly redirectOnBlur?: 'owner' | 'target' | 'outside';
  readonly commitOnBlur?: 'trigger' | 'panel' | 'field' | 'capture-trigger' | 'capture-panel';
  readonly removeDestinationOnBlur?: boolean;
  readonly returnOnBlurCapture?: boolean;
  readonly focusOutside: boolean;
  readonly nested: boolean;
  readonly nullAdapter: boolean;
}

declare global {
  interface Window {
    tabsProbe: { update: (patch: Partial<Options>) => void };
  }
}

const initial: Options = {
  order: ['A', 'B', 'C'],
  unavailable: [],
  selected: 'A',
  controlled: false,
  reject: false,
  activation: 'automatic',
  mount: 'eager',
  orientation: 'horizontal',
  width: 400,
  long: false,
  fieldsetDisabled: false,
  inLegend: false,
  replacement: 0,
  focusOutside: false,
  nested: false,
  nullAdapter: false,
};

function NestedViews(): JSX.Element {
  return (
    <Tabs defaultValue="C">
      <TabsList aria-label="Nested views">
        <TabsTrigger value="B">Nested B</TabsTrigger>
        <TabsTrigger value="C">Nested C</TabsTrigger>
      </TabsList>
      <TabsPanel value="B">Nested B panel</TabsPanel>
      <TabsPanel value="C">
        <input aria-label="Nested draft" defaultValue="Nested" />
      </TabsPanel>
    </Tabs>
  );
}

function ExternalFocus({ active }: { readonly active: boolean }): null {
  useLayoutEffect(() => {
    if (active) {
      document
        .querySelector('[data-testid="external-shadow"]')
        ?.shadowRoot?.querySelector('input')
        ?.focus();
    }
  }, [active]);
  return null;
}

function refocusOnBlur(event: FocusEvent<HTMLElement>): void {
  const { relatedTarget } = event;
  if (relatedTarget && relatedTarget.getAttribute('aria-label') !== 'After') {
    return;
  }
  const owner = event.currentTarget.closest('[role="tablist"], [role="tabpanel"]');
  const selector =
    owner?.getAttribute('role') === 'tablist'
      ? '[data-tabs-test-key="B"]'
      : '[data-tabs-test-fallback]';
  owner?.querySelector<HTMLElement>(selector)?.focus();
}

function focusOutsideOnBlur(event: FocusEvent<HTMLElement>): void {
  if (event.relatedTarget?.matches('[data-tabs-test-fallback], [data-tabs-test-key="C"]')) {
    event.currentTarget
      .closest('form')
      ?.querySelector<HTMLInputElement>('input[aria-label="Before"]')
      ?.focus();
  }
}

export default function TabsFixture(): JSX.Element {
  const [options, setOptions] = useState(initial);
  const [proposals, setProposals] = useState<string[]>([]);
  const [submits, setSubmits] = useState(0);
  const external = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (external.current && !external.current.shadowRoot) {
      const shadow = external.current.attachShadow({ mode: 'open' });
      const input = document.createElement('input');
      input.id = 'shadow-target';
      input.tabIndex = -1;
      shadow.append(input);
    }
    window.tabsProbe = {
      update: (patch) => flushSync(() => setOptions((state) => ({ ...state, ...patch }))),
    };
  }, []);

  const selectNextOnBlur = (): void => {
    flushSync(() => setOptions((state) => ({ ...state, selected: 'B' })));
  };
  const removeBOnBlur = (): void => {
    flushSync(() =>
      setOptions((state) => ({
        ...state,
        order: state.order.filter(
          (key) => key !== 'B' && !(state.removeDestinationOnBlur && key === 'C'),
        ),
      })),
    );
  };

  const strip = (
    <TabsList
      aria-label="Views"
      messages={{ scrollBack: 'Previous views', scrollForward: 'More views' }}
      dir={options.direction}
      inert={options.listInert}
      aria-hidden={options.listAriaHidden}
      onBlur={options.redirectOnBlur === 'owner' ? refocusOnBlur : undefined}
      style={{ inlineSize: options.width, maxInlineSize: '100%' }}
      distribution={
        options.distribution ?? {
          mobile: 'equal',
          tablet: 'content',
          desktop: 'equal',
          wide: 'content',
        }
      }
    >
      {options.order.map((key) =>
        options.long && key === 'H' ? (
          <TabsTrigger
            key={key}
            value={key}
            iconLeft={MagnifyingGlassIcon}
            aria-label="Search views"
          />
        ) : (
          <TabsTrigger
            key={key === 'B' ? `${key}-${options.replacement}` : key}
            value={key}
            disabled={options.unavailable.includes(key)}
            autoFocus={options.autoFocus === key}
            data-tabs-test-key={key}
            onBlur={
              options.commitOnBlur === 'trigger' && key === 'B'
                ? removeBOnBlur
                : options.redirectOnBlur === 'target' && key === 'A'
                  ? refocusOnBlur
                  : options.redirectOnBlur === 'outside' && key === 'B'
                    ? focusOutsideOnBlur
                    : undefined
            }
            onFocus={
              options.redirectTriggerFocus
                ? (event) => {
                    if (key === 'A') {
                      event.currentTarget
                        .closest('[role="tablist"]')
                        ?.querySelector<HTMLButtonElement>('[data-tabs-test-key="B"]')
                        ?.focus();
                    } else if (key === 'B' && options.redirectTriggerFocus === 'cancel') {
                      event.preventDefault();
                    }
                  }
                : undefined
            }
            iconLeft={
              options.long && (key === 'A' || key === 'D') ? MagnifyingGlassIcon : undefined
            }
            count={options.long && key === 'D' ? '99+' : undefined}
            countLabel={options.long && key === 'D' ? '104 reviews' : undefined}
          >
            {options.long ? `${key} Quarterly workspace review agenda` : key}
          </TabsTrigger>
        ),
      )}
    </TabsList>
  );

  return (
    <form
      data-testid="form"
      onBlurCapture={(event) => {
        if (
          options.returnOnBlurCapture &&
          event.relatedTarget?.getAttribute('aria-label') === 'After' &&
          event.target instanceof HTMLElement
        ) {
          event.target.focus();
        }
        if (
          options.commitOnBlur === 'capture-trigger' &&
          event.target.matches('[data-tabs-test-key="B"]')
        ) {
          removeBOnBlur();
        }
        if (
          options.commitOnBlur === 'capture-panel' &&
          event.target.matches('[aria-label="A draft"]')
        ) {
          selectNextOnBlur();
        }
      }}
      onSubmit={(event) => {
        event.preventDefault();
        setSubmits(submits + 1);
      }}
    >
      <input aria-label="Before" />
      <UnicaProvider iconAdapter={options.nullAdapter ? () => null : undefined}>
        <Tabs
          key={String(options.controlled)}
          defaultValue={options.selected}
          value={options.controlled ? options.selected : undefined}
          onValueChange={(next) => {
            setProposals((history) => [...history, next]);
            if (options.controlled && !options.reject) {
              setOptions((state) => ({ ...state, selected: next }));
            }
          }}
          activationMode={options.activation}
          mountStrategy={options.mount}
          orientation={options.orientation}
        >
          <fieldset
            disabled={options.fieldsetDisabled}
            style={{ padding: 0, border: 0, margin: 0, minInlineSize: 0 }}
          >
            {options.inLegend ? <legend style={{ padding: 0 }}>{strip}</legend> : strip}
          </fieldset>
          <input aria-label="After" />
          <ExternalFocus active={options.focusOutside} />
          {options.order.map((key) => (
            <TabsPanel
              key={key}
              value={key}
              mountStrategy={key === 'C' ? options.lastMount : undefined}
              tabIndex={-1}
              onBlur={
                options.commitOnBlur === 'panel' && key === 'A'
                  ? selectNextOnBlur
                  : options.redirectOnBlur === 'owner'
                    ? refocusOnBlur
                    : undefined
              }
              onFocusCapture={(event) => {
                const panel = event.currentTarget;
                const fixture = panel.closest('[data-cancel-panel-focus]');
                const fallback = panel.querySelector<HTMLInputElement>('[data-tabs-test-fallback]');
                if (event.target === panel.querySelector('[data-tabs-test-draft]')) {
                  if (
                    fixture?.getAttribute('data-cancel-panel-focus') === key ||
                    options.redirectFocus === 'cancel-draft'
                  ) {
                    event.preventDefault();
                    panel.dataset.focusCanceled = '';
                  }
                  if (options.redirectFocus) {
                    fallback?.focus();
                  }
                } else if (
                  event.target === fallback &&
                  options.redirectFocus === 'cancel-fallback'
                ) {
                  event.preventDefault();
                }
              }}
            >
              <input
                aria-label={`${key} draft`}
                data-tabs-test-draft=""
                name={key}
                defaultValue={`Draft ${key}`}
                required={key === 'A'}
                onBlur={
                  options.commitOnBlur === 'field' && key === 'A'
                    ? selectNextOnBlur
                    : options.redirectOnBlur === 'target'
                      ? refocusOnBlur
                      : options.redirectOnBlur === 'outside'
                        ? focusOutsideOnBlur
                        : undefined
                }
              />
              {key === 'A' &&
                (options.redirectFocus ||
                  options.redirectOnBlur ||
                  options.commitOnBlur === 'capture-panel') && (
                  <input aria-label="A fallback" data-tabs-test-fallback="" />
                )}
              {key === 'A' && options.nested && <NestedViews />}
            </TabsPanel>
          ))}
        </Tabs>
      </UnicaProvider>
      <div ref={external} data-testid="external-shadow" />
      <output data-testid="proposals">{proposals.join(',')}</output>
      <output data-testid="submits">{submits}</output>
    </form>
  );
}
