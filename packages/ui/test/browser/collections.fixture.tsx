import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { FocusEvent, JSX, KeyboardEvent, RefCallback } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { subscribeFocusOrigin } from '../../src/core/focus-origin.js';
import type { FocusOrigin } from '../../src/core/focus-origin.js';
import { FormSelect } from '../../src/core/forms/carriers.js';
import { useActiveDescendant } from '../../src/core/collections/useActiveDescendant.js';
import { useRovingFocus } from '../../src/core/collections/useRovingFocus.js';
import { useFixtureSelect } from './form-fixture-helpers.js';

const tabs = ['A', 'B', 'C'];
const commands = ['Beta', 'Bravo', 'Blue', 'Cedar', 'New Document', 'New File', 'Disabled command'];

function RovingFixture(): JSX.Element {
  const [items, setItems] = useState(tabs);
  const [disabled, setDisabled] = useState<string | null>(null);
  const [ariaDisabledB, setAriaDisabledB] = useState(false);
  const [selected, setSelected] = useState('A');
  const [policy, setPolicy] = useState<'tabs' | 'position'>('tabs');
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical' | 'both'>('horizontal');
  const [wrap, setWrap] = useState(false);
  const [rtl, setRtl] = useState(false);
  const [link, setLink] = useState(false);
  const [autoFocusD, setAutoFocusD] = useState(false);
  const [navigates, setNavigates] = useState<string[]>([]);
  const [tick, setTick] = useState(0);
  const [removeOnBlur, setRemoveOnBlur] = useState(false);
  const handleItemARef = useCallback((node: HTMLElement | null) => {
    void node;
  }, []);
  const handleItemAFocus = useCallback(() => undefined, []);
  const refChanges = useRef(0);
  const handlerChanges = useRef(0);
  const refChangesOutput = useRef<HTMLOutputElement>(null);
  const handlerChangesOutput = useRef<HTMLOutputElement>(null);
  const firstRef = useRef<RefCallback<HTMLElement> | null>(null);
  const prevHandlers = useRef<{
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
    onBlur: (event: FocusEvent<HTMLElement>) => void;
    onFocus: (event: FocusEvent<HTMLElement>) => void;
  } | null>(null);

  const roving = useRovingFocus<HTMLElement>({
    items: items.map((key) => ({
      key,
      label: key,
      navigable: key !== disabled && !(ariaDisabledB && key === 'B'),
    })),
    entryKey: selected,
    recoveryKey: policy === 'tabs' ? selected : null,
    orientation,
    wrap,
    typeahead: false,
    onNavigate: (key) => setNavigates((prev) => [...prev, key]),
  });

  const itemAProps = roving.getItemProps('A', {
    ref: handleItemARef,
    onFocus: handleItemAFocus,
  });
  useEffect(() => {
    if (firstRef.current && firstRef.current !== itemAProps.ref) {
      refChanges.current += 1;
    }
    firstRef.current = itemAProps.ref;
    if (
      prevHandlers.current &&
      (prevHandlers.current.onKeyDown !== roving.onKeyDown ||
        prevHandlers.current.onBlur !== roving.onBlur ||
        prevHandlers.current.onFocus !== itemAProps.onFocus)
    ) {
      handlerChanges.current += 1;
    }
    prevHandlers.current = {
      onKeyDown: roving.onKeyDown,
      onBlur: roving.onBlur,
      onFocus: itemAProps.onFocus,
    };
    if (refChangesOutput.current) {
      refChangesOutput.current.textContent = String(refChanges.current);
    }
    if (handlerChangesOutput.current) {
      handlerChangesOutput.current.textContent = String(handlerChanges.current);
    }
  });

  return (
    <section aria-label="Roving focus">
      <button type="button">Before tabs</button>
      <div
        role="tablist"
        aria-label="Tabs"
        style={{ direction: rtl ? 'rtl' : 'ltr' }}
        onKeyDown={roving.onKeyDown}
        onBlur={(event) => {
          roving.onBlur(event);
          if (removeOnBlur && event.relatedTarget === null) {
            setItems((current) => current.filter((item) => item !== 'B'));
          }
        }}
      >
        {items.map((item) => {
          const itemProps = item === 'A' ? itemAProps : roving.getItemProps(item);
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
              autoFocus={autoFocusD && item === 'D'}
              aria-selected={item === selected}
              disabled={item === disabled}
              aria-disabled={ariaDisabledB && item === 'B' ? true : undefined}
              onClick={() => setSelected(item)}
            >
              {item}
            </button>
          );
        })}
        <input aria-label="Nested in tablist" />
      </div>
      <input aria-label="After tabs" />
      <output data-testid="selected-tab">{selected}</output>
      <output data-testid="roving-navigates">{navigates.join(',')}</output>
      <output data-testid="roving-ref-changes" ref={refChangesOutput}>
        0
      </output>
      <output data-testid="roving-handler-changes" ref={handlerChangesOutput}>
        0
      </output>
      <output data-testid="roving-tick">{tick}</output>
      <button type="button" onClick={() => setDisabled('B')}>
        Disable B
      </button>
      <button type="button" onClick={() => setAriaDisabledB(true)}>
        Aria disable B
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
      <button type="button" onClick={() => setTick((value) => value + 1)}>
        Rerender tabs
      </button>
      <button type="button" onClick={() => setRemoveOnBlur(true)}>
        Enable remove B on blur
      </button>
      <button
        type="button"
        onClick={() => {
          setAutoFocusD(true);
          setItems((current) => (current.includes('D') ? current : [...current, 'D']));
        }}
      >
        Add autoFocus tab D
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
      <div
        role="menu"
        aria-label="Commands"
        tabIndex={-1}
        onKeyDown={roving.onKeyDown}
        onBlur={roving.onBlur}
      >
        {commands.map((command, index) => (
          <div key={command} role="presentation">
            {index === commands.length - 1 && <hr role="separator" />}
            <button
              {...roving.getItemProps(command)}
              role="menuitem"
              type="button"
              aria-disabled={index === commands.length - 1}
              onClick={() => {
                if (index !== commands.length - 1) {
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
  const [disabledKey, setDisabledKey] = useState<string | null>(null);
  const [submitCount, setSubmitCount] = useState(0);
  const [focusOrigin, setFocusOrigin] = useState<FocusOrigin | null>(null);
  const acceptedCarrier = useRef<HTMLSelectElement>(null);
  const accepted = useFixtureSelect<string | null>(acceptedCarrier, {
    defaultValue: 'a',
    catalog: results.map(({ key, label }) => ({ value: key, label })),
  });
  const items = results
    .filter(
      ({ key, label }) => key !== removed && label.toLowerCase().includes(query.toLowerCase()),
    )
    .map((item) => ({
      ...item,
      navigable: item.navigable !== false && item.key !== disabledKey,
      id: id + '-' + item.key,
    }));

  useEffect(() => {
    const node = input.current;
    if (!node) {
      return;
    }
    return subscribeFocusOrigin(node, setFocusOrigin);
  }, []);

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
        data-focus-origin={focusOrigin ?? ''}
        onBlur={virtual.onBlur}
        value={query}
        onChange={(event) => {
          setQuery(event.currentTarget.value);
          setActiveKey(null);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          // Pass all keydowns straight to useActiveDescendant without fixture filtering.
          virtual.onKeyDown(event);
          if (
            event.key === 'Enter' &&
            open &&
            virtual['aria-activedescendant'] &&
            !event.nativeEvent.isComposing
          ) {
            event.preventDefault();
            accepted.propose(virtual.activeKey);
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
          {items.map(({ key, label, id: itemId, ...item }) => (
            <div
              key={key}
              id={itemId}
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
      <button type="button" onClick={() => setDisabledKey(activeKey)}>
        Disable active result
      </button>
      <button type="button" onClick={() => setOpen(!open)}>
        Toggle document list raw
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
      <output data-testid="virtual-active-key">{virtual.activeKey ?? ''}</output>
    </form>
  );
}

function ActiveTypeaheadFixture(): JSX.Element {
  const id = useId();
  const [open, setOpen] = useState(true);
  const [activeKey, setActiveKey] = useState<string | null>('a');
  const options = [
    { key: 'a', id: id + '-a', label: 'Alpha' },
    { key: 'b', id: id + '-b', label: 'Beta' },
    { key: 'c', id: id + '-c', label: 'Bravo' },
  ];
  const virtual = useActiveDescendant({
    items: options,
    activeKey,
    orientation: 'vertical',
    wrap: false,
    typeahead: true,
    homeEnd: true,
    open,
    onActiveChange: setActiveKey,
  });
  return (
    <section aria-label="Active descendant typeahead">
      <div
        role="listbox"
        aria-label="Typeahead listbox"
        tabIndex={0}
        aria-activedescendant={virtual['aria-activedescendant']}
        onKeyDown={virtual.onKeyDown}
        onBlur={virtual.onBlur}
      >
        {open &&
          options.map((opt) => (
            <div key={opt.key} id={opt.id} role="option" aria-selected={opt.key === activeKey}>
              {opt.label}
            </div>
          ))}
      </div>
      <button type="button" onClick={() => setOpen(!open)}>
        Toggle typeahead listbox
      </button>
      <output data-testid="typeahead-active">{virtual.activeKey ?? ''}</output>
    </section>
  );
}

function ShadowRovingInner({ focusOutside }: { focusOutside: () => void }): JSX.Element {
  const [items, setItems] = useState(['S1', 'S2']);
  const focusOutsideOnUnmount = useRef(false);
  const roving = useRovingFocus<HTMLButtonElement>({
    items: items.map((key) => ({ key, label: key })),
    orientation: 'horizontal',
    wrap: false,
    typeahead: false,
  });
  const s1UnmountRef = useCallback(
    (node: HTMLButtonElement | null) => {
      if (!node) {
        return;
      }
      return () => {
        if (focusOutsideOnUnmount.current) {
          focusOutsideOnUnmount.current = false;
          focusOutside();
        }
      };
    },
    [focusOutside],
  );
  return (
    <div>
      <div
        role="tablist"
        aria-label="Shadow tabs"
        onKeyDown={roving.onKeyDown}
        onBlur={roving.onBlur}
      >
        {items.map((item) => (
          <button
            key={item}
            role="tab"
            type="button"
            {...roving.getItemProps(item, item === 'S1' ? { ref: s1UnmountRef } : undefined)}
          >
            {item}
          </button>
        ))}
      </div>
      <button type="button" onClick={() => setItems(['S2'])}>
        Remove S1
      </button>
      <button type="button" onClick={() => setItems(['S1', 'S2'])}>
        Restore shadow items
      </button>
      <button
        type="button"
        onClick={() => {
          focusOutsideOnUnmount.current = true;
          setItems(['S2']);
        }}
      >
        Remove S1 and focus outside
      </button>
    </div>
  );
}

function ShadowRovingHost(): JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null);
  const outsideRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }
    const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
    const mount = document.createElement('div');
    shadow.replaceChildren(mount);
    const root: Root = createRoot(mount);
    root.render(<ShadowRovingInner focusOutside={() => outsideRef.current?.focus()} />);
    return () => {
      root.unmount();
    };
  }, []);
  return (
    <section aria-label="Shadow roving">
      <div id="shadow-roving-host" ref={hostRef} />
      <input ref={outsideRef} aria-label="Outside shadow input" />
    </section>
  );
}

export default function CollectionsFixture(): JSX.Element {
  return (
    <>
      <RovingFixture />
      <MenuFixture />
      <VirtualFixture />
      <ActiveTypeaheadFixture />
      <ShadowRovingHost />
    </>
  );
}
