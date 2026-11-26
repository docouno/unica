import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef, StrictMode } from 'react';
import type { JSX } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { Tabs, TabsList, TabsPanel, TabsTrigger } from '../src/index.js';
import type { TabsProps, TabsTriggerProps } from '../src/index.js';

afterEach(cleanup);

function Views({
  order = ['A', 'B', 'C'],
  unavailable = [],
  ...props
}: Omit<TabsProps, 'children'> & {
  readonly order?: readonly string[];
  readonly unavailable?: readonly string[];
}): JSX.Element {
  return (
    <Tabs {...props}>
      <section>
        <TabsList aria-label="Views">
          {order.map((key) => (
            <TabsTrigger key={key} value={key} disabled={unavailable.includes(key)}>
              {key}
            </TabsTrigger>
          ))}
        </TabsList>
      </section>
      <section>
        {order.map((key) => (
          <TabsPanel key={key} value={key}>
            <input name={key} defaultValue={key} aria-label={`${key} field`} />
          </TabsPanel>
        ))}
      </section>
    </Tabs>
  );
}

function selected(): string | null {
  return screen.queryByRole('tab', { selected: true })?.textContent ?? null;
}

it('repairs uncontrolled selection using the previous order without emitting proposals', () => {
  const onChange = vi.fn();
  const { rerender } = render(<Views defaultValue="B" onValueChange={onChange} />);
  expect(selected()).toBe('B');
  rerender(<Views order={['D', 'A', 'C']} onValueChange={onChange} />);
  expect(selected()).toBe('C');
  rerender(<Views order={['D', 'A', 'C']} unavailable={['C']} onValueChange={onChange} />);
  expect(selected()).toBe('A');
  rerender(<Views order={['E', 'F', 'G']} onValueChange={onChange} />);
  expect(selected()).toBe('E');
  rerender(<Views order={[]} onValueChange={onChange} />);
  expect(selected()).toBeNull();
  rerender(<Views order={['H', 'I']} unavailable={['H']} onValueChange={onChange} />);
  expect(selected()).toBe('I');
  expect(onChange).not.toHaveBeenCalled();
});

it('keeps the controlled owner authoritative and skips repeat or cancelled activation', () => {
  const onChange = vi.fn();
  const { rerender } = render(<Views value="B" onValueChange={onChange} />);
  const current = screen.getByRole('tab', { name: 'B' });
  const next = screen.getByRole('tab', { name: 'C' });
  act(() => current.focus());
  fireEvent.keyDown(current, { key: 'ArrowRight' });
  expect(document.activeElement).toBe(next);
  expect(selected()).toBe('B');
  expect(onChange).toHaveBeenCalledExactlyOnceWith('C');

  rerender(<Views value="C" onValueChange={onChange} />);
  fireEvent.click(next);
  expect(selected()).toBe('C');
  expect(onChange).toHaveBeenCalledTimes(1);

  const cancel = vi.fn((event: React.MouseEvent) => event.preventDefault());
  const injected = {
    hidden: true,
    inert: true,
    'aria-hidden': true,
    'ARIA-SELECTED': true,
    type: 'submit',
  } as unknown as Partial<TabsTriggerProps>;
  rerender(
    <Tabs defaultValue="A" onValueChange={onChange} key="new-owner">
      <TabsList aria-label="Views">
        <TabsTrigger value="A">A</TabsTrigger>
        <TabsTrigger {...injected} onClick={cancel} value="B">
          B
        </TabsTrigger>
      </TabsList>
      <TabsPanel value="A">First</TabsPanel>
      <TabsPanel value="B">Second</TabsPanel>
    </Tabs>,
  );
  const cancelled = screen.getByRole('tab', { name: 'B' });
  expect(cancelled).toMatchObject({ hidden: false, type: 'button' });
  expect(cancelled.hasAttribute('inert')).toBe(false);
  fireEvent.click(cancelled);
  expect(cancel).toHaveBeenCalledTimes(1);
  expect(selected()).toBe('A');
  expect(onChange).toHaveBeenCalledTimes(1);
});

it('forwards native refs and event targets, and names a counted trigger once', () => {
  const root = createRef<HTMLDivElement>();
  const list = createRef<HTMLDivElement>();
  const panel = createRef<HTMLDivElement>();
  const detach = vi.fn();
  const trigger = vi.fn((node: HTMLButtonElement | null) => (node ? detach : undefined));
  const listClick = vi.fn((event: React.MouseEvent) =>
    expect(event.currentTarget).toBe(list.current),
  );
  const { unmount } = render(
    <Tabs ref={root} defaultValue="inbox">
      <TabsList
        id="list"
        aria-label="Messages"
        ref={list}
        className="frame"
        dir="rtl"
        style={{ inlineSize: 144 }}
        onClick={listClick}
      >
        <TabsTrigger ref={trigger} value="inbox" count={0} countLabel="0 unread messages">
          Inbox
        </TabsTrigger>
        <TabsTrigger
          value="done"
          aria-label="Done, 104 messages"
          count="99+"
          countLabel="104 messages"
        >
          Done
        </TabsTrigger>
      </TabsList>
      <TabsPanel ref={panel} value="inbox">
        No new messages
      </TabsPanel>
      <TabsPanel value="done">Completed messages</TabsPanel>
    </Tabs>,
  );
  const inbox = screen.getByRole('tab', { name: 'Inbox 0 unread messages' });
  expect(trigger).toHaveBeenCalledExactlyOnceWith(inbox);
  expect(screen.getByRole('tab', { name: 'Done, 104 messages' })).toBeTruthy();
  expect(list.current).toBe(screen.getByRole('tablist'));
  expect(list.current?.id).toBe('list');
  expect(list.current?.tabIndex).toBe(-1);
  expect(list.current?.parentElement).toMatchObject({
    dir: 'rtl',
    className: 'unica-tabs-frame frame',
  });
  expect(list.current?.parentElement?.style.inlineSize).toBe('144px');
  expect(root.current?.contains(list.current)).toBe(true);
  expect(panel.current).toBe(screen.getByRole('tabpanel', { name: 'Inbox 0 unread messages' }));
  fireEvent.click(inbox);
  expect(listClick).toHaveBeenCalledTimes(1);
  unmount();
  expect(detach).toHaveBeenCalledTimes(1);
});

it('admits new lazy content only after its controlled selection is confirmed', () => {
  const attached = vi.fn();
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  function FormViews({
    selected,
    blocked,
  }: {
    readonly selected: string;
    readonly blocked?: boolean;
  }): JSX.Element {
    return (
      <form>
        <Tabs value={selected} mountStrategy="lazy">
          <TabsList aria-label="Views">
            <TabsTrigger value="A">A</TabsTrigger>
            <TabsTrigger value="B" disabled={blocked}>
              B
            </TabsTrigger>
          </TabsList>
          <TabsPanel value="A">
            <input name="a" defaultValue="A" />
          </TabsPanel>
          <TabsPanel value="B">
            <input name="b" defaultValue="B" ref={attached} />
          </TabsPanel>
        </Tabs>
      </form>
    );
  }
  const { container, rerender } = render(<FormViews selected="A" />);
  const fields = (): FormData => new FormData(container.querySelector('form')!);
  try {
    rerender(<FormViews selected="B" blocked />);
    expect(selected()).toBeNull();
    expect(fields().has('b')).toBe(false);
    expect(attached).not.toHaveBeenCalled();

    rerender(<FormViews selected="B" />);
    expect(selected()).toBe('B');
    expect(fields().get('b')).toBe('B');
    expect(attached).toHaveBeenCalledTimes(1);
  } finally {
    warn.mockRestore();
  }
});

it('gives a reused panel shell fresh content when its key changes', () => {
  function Pair({
    panel,
    selected,
  }: {
    readonly panel: string;
    readonly selected: string;
  }): JSX.Element {
    return (
      <Tabs value={selected} mountStrategy="lazy">
        <TabsList aria-label="Views">
          <TabsTrigger value={panel}>{panel}</TabsTrigger>
          <TabsTrigger value="B">B</TabsTrigger>
        </TabsList>
        <TabsPanel value={panel}>
          <input defaultValue={panel} aria-label="Draft" />
        </TabsPanel>
        <TabsPanel value="B">Summary</TabsPanel>
      </Tabs>
    );
  }
  const { rerender } = render(<Pair panel="A" selected="A" />);
  const shell = screen.getByRole('tabpanel', { name: 'A' });
  fireEvent.change(screen.getByRole('textbox', { name: 'Draft' }), {
    target: { value: 'Old draft' },
  });
  rerender(<Pair panel="A" selected="B" />);
  expect(shell.querySelector('input')?.value).toBe('Old draft');
  rerender(<Pair panel="C" selected="B" />);
  expect(shell.querySelector('input')).toBeNull();
  rerender(<Pair panel="C" selected="C" />);
  expect(screen.getByRole('tabpanel', { name: 'C' })).toBe(shell);
  expect(screen.getByRole('textbox', { name: 'Draft' })).toMatchObject({ value: 'C' });
});

it('hydrates stable ID pairs and retains only confirmed lazy visits', async () => {
  const key = 'B: 分析 🚀';
  const view = (
    <StrictMode>
      <form>
        <Views defaultValue={key} order={['A', key]} mountStrategy="lazy" />
        <Views value="A" order={['A', key]} unavailable={['A']} mountStrategy="lazy" />
        <Views defaultValue="A" order={['A', key]} unavailable={['A']} mountStrategy="lazy" />
        <Views order={['A', key]} unavailable={['A']} mountStrategy="unmount" />
      </form>
    </StrictMode>
  );
  const host = document.createElement('div');
  document.body.append(host);
  host.innerHTML = renderToString(view);
  const tabs = Array.from(host.querySelectorAll('[role="tab"]'));
  function verifyPairs(): void {
    const ids = tabs.map((tab) => tab.id);
    expect(new Set(ids).size).toBe(8);
    for (const tab of tabs) {
      const pair = document.getElementById(tab.getAttribute('aria-controls')!);
      expect(pair?.getAttribute('aria-labelledby')).toBe(tab.id);
      expect(pair?.getAttribute('role')).toBe('tabpanel');
    }
  }
  const selecteds = (): string[] =>
    Array.from(
      host.querySelectorAll('[role="tab"][aria-selected="true"]'),
      (tab) => tab.textContent ?? '',
    );
  const names = (): FormDataEntryValue[] =>
    Array.from(new FormData(host.querySelector('form')!).values());
  verifyPairs();
  expect(selecteds()).toEqual([key, 'A', 'A']);
  expect(names()).toEqual([key, 'A', 'A']);
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const errors = vi.fn();
  const root = hydrateRoot(host, view, { onRecoverableError: errors });
  try {
    await act(async () => {});
    expect(errors).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Tabs value'));
    expect(Array.from(host.querySelectorAll('[role="tab"]'))).toEqual(tabs);
    verifyPairs();
    expect(selecteds()).toEqual([key, key, key]);
    expect(names()).toEqual([key, key, key]);
  } finally {
    act(() => root.unmount());
    host.remove();
    warn.mockRestore();
  }
});
