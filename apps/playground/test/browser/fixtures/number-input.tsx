import { NumberInput } from '@docouno/unica';
import { useEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { flushSync } from 'react-dom';

interface Settings {
  readonly version?: number;
  readonly defaultValue?: number | '';
  readonly value?: number | '';
  readonly min?: number;
  readonly max?: number;
  readonly step?: number | 'any';
  readonly form?: 'other';
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly variant?: 'default' | 'ghost';
  readonly inert?: boolean;
  readonly required?: boolean;
  readonly fieldset?: boolean;
  readonly loading?: boolean;
  readonly danger?: boolean;
  readonly preventArrow?: boolean;
  readonly response?: 'accept' | 'refuse' | 'transform' | 'focus' | 'unmount' | 'disable';
  readonly mounted?: boolean;
}

export default function NumberInputFixture(): ReactElement {
  const host = useRef<HTMLDivElement>(null);
  const alternateFocus = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<Settings>({ defaultValue: 10 });
  const events = useRef<unknown[]>([]);

  function report(kind: string, node: HTMLInputElement, proposal?: number | ''): void {
    events.current.push([
      kind,
      node.value,
      node.validity.badInput,
      node.form ? new FormData(node.form).get('quantity') : null,
      ...(proposal === undefined ? [] : [proposal]),
    ]);
    host.current?.setAttribute('data-events', JSON.stringify(events.current));
  }

  useEffect(() => {
    const root = host.current;
    if (!root) {
      return;
    }
    function configure(event: Event): void {
      flushSync(() =>
        setSettings({ defaultValue: 10, ...(event as CustomEvent<Settings>).detail }),
      );
    }
    function clear(): void {
      events.current = [];
      root?.setAttribute('data-events', '[]');
    }
    function observe(event: Event): void {
      if (event.target === input.current && input.current) {
        report('dom.' + event.type, input.current);
      }
    }
    root.addEventListener('number-settings', configure);
    root.addEventListener('clear-events', clear);
    // Native target/ancestor listeners see the input before React invokes onInput.
    root.addEventListener('input', observe);
    root.addEventListener('change', observe);
    return () => {
      root.removeEventListener('number-settings', configure);
      root.removeEventListener('clear-events', clear);
      root.removeEventListener('input', observe);
      root.removeEventListener('change', observe);
    };
  }, []);

  return (
    <div ref={host} data-testid="fixture">
      <button id="previous" type="button">
        Before editor
      </button>
      <div data-testid="scroll" style={{ blockSize: 220, overflowY: 'auto', inlineSize: '100%' }}>
        <form
          id="local"
          onSubmit={(event) => {
            event.preventDefault();
            const quantity = new FormData(event.currentTarget).get('quantity');
            if (typeof quantity === 'string') {
              event.currentTarget.dataset.submitted = quantity;
            }
          }}
        >
          <fieldset disabled={settings.fieldset}>
            <legend>
              <NumberInput aria-label="Legend value" name="legend" defaultValue={3} />
            </legend>
            <label htmlFor="quantity">Quantity</label>
            {settings.mounted !== false && (
              <NumberInput
                key={settings.version}
                ref={input}
                id="quantity"
                name="quantity"
                value={settings.value}
                defaultValue={settings.defaultValue}
                min={settings.min}
                max={settings.max}
                step={settings.step}
                form={settings.form}
                disabled={settings.disabled}
                readOnly={settings.readOnly}
                variant={settings.variant}
                inert={settings.inert}
                required={settings.required}
                loading={settings.loading}
                status={settings.danger ? 'danger' : 'neutral'}
                aria-describedby="quantity-help"
                onInput={(event) => report('react.input', event.currentTarget)}
                onChange={(event) => report('react.change', event.currentTarget)}
                onKeyDown={(event) => {
                  if (settings.preventArrow && event.key === 'ArrowUp') {
                    event.preventDefault();
                  }
                }}
                onValueChange={(value) => {
                  const editor = input.current;
                  if (editor) {
                    report('value', editor, value);
                  }
                  if (settings.response === 'accept' || settings.response === 'transform') {
                    setSettings((current) => ({
                      ...current,
                      value: settings.response === 'transform' ? 42 : value,
                    }));
                  } else if (settings.response === 'focus') {
                    alternateFocus.current?.focus();
                  } else if (settings.response === 'disable' || settings.response === 'unmount') {
                    flushSync(() =>
                      setSettings((current) => ({
                        ...current,
                        ...(settings.response === 'disable'
                          ? { disabled: true }
                          : { mounted: false }),
                      })),
                    );
                  }
                }}
              />
            )}
            <p id="quantity-help">Use whole units unless the step permits decimals.</p>
          </fieldset>
          <button id="after" ref={alternateFocus} type="submit">
            Submit quantity
          </button>
          <button id="reset-quantity" type="reset">
            Reset quantity
          </button>
        </form>
        <form id="other" />
        <div style={{ blockSize: 600 }} />
      </div>
    </div>
  );
}
