import { Tabs, TabsList, TabsPanel, TabsTrigger } from '@docouno/unica';
import { useLayoutEffect, useState } from 'react';
import type { JSX } from 'react';
import { flushSync } from 'react-dom';

interface Options {
  readonly order: readonly string[];
  readonly replacement: number;
  readonly disabled: boolean;
  readonly autoFocus?: boolean;
  readonly moveFocusOutside?: boolean;
  readonly removeOnAction?: 'click' | 'keydown' | 'blur' | 'panel-blur';
  readonly disableOnBlur?: boolean;
  readonly removeDestinationOnFocus?: boolean;
}

declare global {
  interface Window {
    tabsDynamic: (patch: Partial<Options>) => void;
  }
}

function DynamicParts(): JSX.Element {
  const [options, setOptions] = useState<Options>({
    order: ['A', 'B', 'C'],
    replacement: 0,
    disabled: false,
  });

  useLayoutEffect(() => {
    window.tabsDynamic = (patch) =>
      flushSync(() => setOptions((state) => ({ ...state, ...patch })));
  }, []);
  useLayoutEffect(() => {
    if (options.moveFocusOutside) {
      document.getElementById('dynamic-before')?.focus();
    }
  }, [options.moveFocusOutside]);

  const removeView = (removed: string): void => {
    flushSync(() =>
      setOptions((state) => ({
        ...state,
        order: state.order.filter((value) => value !== removed),
      })),
    );
  };

  return (
    <>
      <TabsList aria-label="Views">
        {options.order.map((key) => (
          <TabsTrigger
            key={key === 'B' ? `${key}-${options.replacement}` : key}
            value={key}
            disabled={key === 'B' && options.disabled}
            autoFocus={key === 'B' && options.autoFocus}
            onClick={
              key === 'B' && options.removeOnAction === 'click' ? () => removeView('B') : undefined
            }
            onBlur={
              key === 'B' && options.disableOnBlur
                ? () => flushSync(() => setOptions((state) => ({ ...state, disabled: true })))
                : key === 'B' && options.removeOnAction === 'blur'
                  ? () => removeView('B')
                  : undefined
            }
            onFocus={
              key === 'C' && options.removeDestinationOnFocus ? () => removeView('C') : undefined
            }
            onKeyDown={
              key === 'A' && options.removeOnAction === 'keydown'
                ? (event) => {
                    if (event.key === 'ArrowRight') {
                      removeView('B');
                    }
                  }
                : undefined
            }
          >
            {key}
          </TabsTrigger>
        ))}
      </TabsList>
      <input aria-label="After" />
      {options.order.map((key) => (
        <TabsPanel key={key} value={key}>
          {key === 'A' && options.removeOnAction === 'panel-blur' ? (
            <input aria-label="A draft" onBlur={() => removeView('A')} />
          ) : (
            `${key} panel`
          )}
        </TabsPanel>
      ))}
    </>
  );
}

export default function DynamicTabsFixture(): JSX.Element {
  const [proposals, setProposals] = useState<string[]>([]);
  return (
    <>
      <input id="dynamic-before" aria-label="Before" />
      <Tabs
        defaultValue="A"
        activationMode="manual"
        onValueChange={(value) => setProposals((current) => [...current, value])}
      >
        <DynamicParts />
      </Tabs>
      <output data-testid="proposals">{proposals.join(',')}</output>
    </>
  );
}
