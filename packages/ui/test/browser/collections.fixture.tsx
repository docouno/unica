import { useId, useRef, useState } from 'react';
import type { JSX } from 'react';
import { FormSelect } from '../../src/core/forms/carriers.js';
import { useActiveDescendant } from '../../src/core/collections/useActiveDescendant.js';
import { useRovingFocus } from '../../src/core/collections/useRovingFocus.js';
import { useFixtureSelect } from './form-fixture-helpers.js';

const tabs = ['A', 'B', 'C'];
const commands = ['Beta', 'Bravo', 'Blue', 'Cedar', 'Disabled command'];

function RovingFixture(): JSX.Element {
  const [items, setItems] = useState(tabs);
  const [disabled, setDisabled] = useState<string | null>(null);
  const [selected, setSelected] = useState('A');
  const [policy, setPolicy] = useState<'tabs' | 'position'>('tabs');
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical' | 'both'>('horizontal');
  const [wrap, setWrap] = useState(false);
  const [rtl, setRtl] = useState(false);
  const [link, setLink] = useState(false);
  const roving = useRovingFocus<HTMLElement>({
    items: items.map((key) => ({ key, label: key, navigable: key !== disabled })),
    entryKey: selected,
    recoveryKey: policy === 'tabs' ? selected : null,
    orientation,
    wrap,
    typeahead: false,
  });
  return (
    <section aria-label="Roving focus">
      <button type="button">Before tabs</button>
      <div
        role="tablist"
        aria-label="Tabs"
        style={{ direction: rtl ? 'rtl' : 'ltr' }}
        onKeyDown={roving.onKeyDown}
        onBlur={roving.onBlur}
      >
        {items.map((item) => {
          const itemProps = roving.getItemProps(item);
          if (link && item === 'B') {
            return (
              <a
                {...itemProps}
                key={item}
                role="tab"
                href="#tabs"
                aria-selected={item === selected}
              >
                {item}
              </a>
            );
          }
          return (
            <button
              {...itemProps}
              key={item}
              role="tab"
              type="button"
              aria-selected={item === selected}
              disabled={item === disabled}
              onClick={() => setSelected(item)}
            >
              {item}
            </button>
          );
        })}
      </div>
      <input aria-label="After tabs" />
      <output data-testid="selected-tab">{selected}</output>
      <button type="button" onClick={() => setDisabled('B')}>
        Disable B
      </button>
      <button type="button" onClick={() => setItems(items.filter((item) => item !== 'B'))}>
        Remove B
      </button>
      <button type="button" onClick={() => setItems(items.filter((item) => item !== 'C'))}>
        Remove C
      </button>
      <button type="button" onClick={() => setItems(['C', 'B', 'A'])}>
        Reorder tabs
      </button>
      <button type="button" onClick={() => setLink(true)}>
        Replace B node
      </button>
      <button type="button" onClick={() => setItems([])}>
        Remove all
      </button>
      <button type="button" onClick={() => setPolicy('position')}>
        Position recovery
      </button>
      <button type="button" onClick={() => setOrientation('vertical')}>
        Vertical tabs
      </button>
      <button type="button" onClick={() => setOrientation('both')}>
        Both axes
      </button>
      <button type="button" onClick={() => setWrap(!wrap)}>
        Toggle wrap
      </button>
      <button type="button" onClick={() => setRtl(!rtl)}>
        Toggle local RTL
      </button>
    </section>
  );
}

function MenuFixture(): JSX.Element {
  const [action, setAction] = useState('');
  const roving = useRovingFocus<HTMLButtonElement>({
    items: commands.map((key) => ({ key, label: key })),
    orientation: 'vertical',
    wrap: true,
    typeahead: true,
  });
  return (
    <section aria-label="Menu navigation">
      <div role="menu" aria-label="Commands" onKeyDown={roving.onKeyDown} onBlur={roving.onBlur}>
        {commands.map((command, index) => (
          <div key={command} role="presentation">
            {index === 4 && <hr role="separator" />}
            <button
              {...roving.getItemProps(command)}
              role="menuitem"
              type="button"
              aria-disabled={index === 4}
              onClick={() => {
                if (index !== 4) {
                  setAction(command);
                }
              }}
            >
              {command}
            </button>
          </div>
        ))}
      </div>
      <button type="button">After menu</button>
      <output data-testid="menu-action">{action}</output>
    </section>
  );
}

const results = [
  { key: 'a', label: 'Alpha document' },
  { key: 'b', label: 'Beta document' },
  { key: 'c', label: 'Unavailable document', navigable: false },
  ...Array.from({ length: 12 }, (_, index) => ({
    key: 'document-' + index,
    label: 'Document ' + index,
  })),
];

function VirtualFixture(): JSX.Element {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const [activeKey, setActiveKey] = useState<string | null>('a');
  const [open, setOpen] = useState(true);
  const [query, setQuery] = useState('');
  const [removed, setRemoved] = useState<string | null>(null);
  const [submitCount, setSubmitCount] = useState(0);
  const acceptedCarrier = useRef<HTMLSelectElement>(null);
  const accepted = useFixtureSelect<string | null>(acceptedCarrier, {
    defaultValue: 'a',
    catalog: results.map(({ key, label }) => ({ value: key, label })),
  });
  const items = results
    .filter(
      ({ key, label }) => key !== removed && label.toLowerCase().includes(query.toLowerCase()),
    )
    .map((item) => ({ ...item, id: id + '-' + item.key }));

  function activate(key: string): void {
    setActiveKey(key);
    const viewport = list.current;
    const row = viewport?.ownerDocument.getElementById(id + '-' + key);
    if (!viewport || !row) {
      return;
    }
    const listRect = viewport.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    if (rowRect.top < listRect.top) {
      viewport.scrollTop -= listRect.top - rowRect.top;
    }
    if (rowRect.bottom > listRect.bottom) {
      viewport.scrollTop += rowRect.bottom - listRect.bottom;
    }
  }

  const virtual = useActiveDescendant({
    items,
    activeKey,
    entryKey: accepted.value,
    orientation: 'vertical',
    wrap: false,
    typeahead: false,
    open,
    onActiveChange: activate,
  });
  return (
    <form
      id="virtual-form"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitCount(submitCount + 1);
      }}
    >
      <input
        ref={input}
        role="combobox"
        aria-label="Search documents"
        aria-controls={open ? id : undefined}
        aria-expanded={open}
        aria-activedescendant={virtual['aria-activedescendant']}
        onBlur={virtual.onBlur}
        value={query}
        onChange={(event) => {
          setQuery(event.currentTarget.value);
          setActiveKey(null);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            virtual.onKeyDown(event);
          }
          if (
            event.key === 'Enter' &&
            open &&
            virtual['aria-activedescendant'] &&
            !event.nativeEvent.isComposing
          ) {
            event.preventDefault();
            accepted.propose(activeKey);
          }
          if (event.key === 'Escape') {
            setOpen(false);
            setActiveKey(null);
            virtual.clearTypeahead();
          }
        }}
      />
      <FormSelect
        ref={acceptedCarrier}
        name="document"
        initialValue={accepted.value}
        getFocusTarget={() => input.current}
      />
      {open && (
        <div
          id={id}
          ref={list}
          role="listbox"
          aria-label="Document results"
          style={{ height: 75, overflow: 'auto' }}
        >
          {items.map(({ key, label, id, ...item }) => (
            <div
              key={key}
              id={id}
              role="option"
              aria-selected={accepted.value === key}
              aria-disabled={item.navigable === false}
              style={{ height: 25 }}
              onPointerEnter={() => {
                if (item.navigable !== false) {
                  setActiveKey(key);
                }
              }}
            >
              {label}
            </div>
          ))}
        </div>
      )}
      <button type="submit">Submit document</button>
      <button type="button" onClick={() => setRemoved(activeKey)}>
        Remove active result
      </button>
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          setActiveKey(null);
          virtual.clearTypeahead();
        }}
      >
        Toggle document list
      </button>
      <button
        type="button"
        onClick={() => {
          accepted.propose(null);
          setActiveKey(null);
        }}
      >
        Clear accepted document
      </button>
      <button type="button" onClick={() => setActiveKey(null)}>
        Clear active document
      </button>
      <output data-testid="submitted-count">{submitCount}</output>
    </form>
  );
}

export default function CollectionsFixture(): JSX.Element {
  return (
    <>
      <RovingFixture />
      <MenuFixture />
      <VirtualFixture />
    </>
  );
}
