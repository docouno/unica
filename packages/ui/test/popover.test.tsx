import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef, StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import {
  Popover,
  PopoverBody,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverFooter,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '../src/index.js';

afterEach(cleanup);

it('renders a closed SSR carrier without a dangling relationship to an authored id', () => {
  const markup = renderToString(
    <Popover defaultOpen>
      <PopoverTrigger>Details</PopoverTrigger>
      <PopoverContent id="report-details">
        <PopoverHeader>
          <PopoverTitle>Report</PopoverTitle>
          <PopoverDescription>Summary</PopoverDescription>
          <PopoverClose />
        </PopoverHeader>
        <PopoverBody>
          <input name="draft" />
        </PopoverBody>
        <PopoverFooter>Actions</PopoverFooter>
      </PopoverContent>
    </Popover>,
  );
  const template = document.createElement('template');
  template.innerHTML = markup;
  const trigger = template.content.querySelector('button')!;
  const panel = template.content.querySelector('[popover]')!;
  expect(panel.id).toBe('report-details');
  expect(trigger.hasAttribute('aria-controls')).toBe(false);
  expect(trigger.getAttribute('aria-expanded')).toBe('false');
  expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
  expect(panel.getAttribute('popover')).toBe('auto');
  expect(panel.getAttribute('role')).toBe('dialog');
  expect(panel.childElementCount).toBe(0);
});

it('binds an explicit carrier id, both panel refs, and multiple sources through Strict Mode', () => {
  const rootRef = createRef<HTMLDivElement>();
  const contentRef = createRef<HTMLDivElement>();
  const sourceRef = createRef<HTMLAnchorElement>();
  const cleanupSource = vi.fn();
  const attachSource = vi.fn(() => cleanupSource);
  function Example({ id }: { id: string }) {
    return (
      <StrictMode>
        <Popover ref={rootRef}>
          <PopoverTrigger>Toolbar</PopoverTrigger>
          <PopoverTrigger asChild ref={sourceRef}>
            <a href="#report" ref={attachSource}>
              Report
            </a>
          </PopoverTrigger>
          <PopoverContent id={id} ref={contentRef} aria-label="Report details" />
        </Popover>
      </StrictMode>
    );
  }
  const { rerender, unmount } = render(<Example id="report-details" />);
  const toolbar = screen.getByRole('button', { name: 'Toolbar' });
  const link = screen.getByRole('link', { name: 'Report' });
  const panel = contentRef.current;
  expect(panel).toBe(rootRef.current);
  expect(sourceRef.current).toBe(link);
  expect(attachSource).toHaveBeenCalledWith(link);
  expect(toolbar.getAttribute('aria-controls')).toBe('report-details');
  expect(link.getAttribute('aria-controls')).toBe('report-details');

  rerender(<Example id="updated-details" />);
  expect(contentRef.current).toBe(panel);
  expect(toolbar.getAttribute('aria-controls')).toBe('updated-details');
  expect(link.getAttribute('aria-controls')).toBe('updated-details');
  unmount();
  expect(rootRef.current).toBeNull();
  expect(contentRef.current).toBeNull();
  expect(sourceRef.current).toBeNull();
  expect(cleanupSource).toHaveBeenCalled();
});

it('honors child and trigger cancellation, preserves modified navigation, and proposes once after stopPropagation', () => {
  const calls: string[] = [];
  let childCancels = true;
  let triggerCancels = false;
  const onOpenChange = vi.fn((value: boolean) => calls.push(String(value)));
  render(
    <Popover open={false} defaultOpen onOpenChange={onOpenChange}>
      <PopoverTrigger
        asChild
        onClick={(event) => {
          calls.push('trigger');
          if (triggerCancels) {
            event.preventDefault();
          }
        }}
      >
        <a
          href="#report"
          onClick={(event) => {
            calls.push('child');
            if (childCancels) {
              event.preventDefault();
            }
            event.stopPropagation();
          }}
        >
          Report
        </a>
      </PopoverTrigger>
      <PopoverContent aria-label="Report details" />
    </Popover>,
  );
  const source = screen.getByRole('link', { name: 'Report' });
  expect(fireEvent.click(source)).toBe(false);
  expect(calls.splice(0)).toEqual(['child']);
  childCancels = false;
  triggerCancels = true;
  expect(fireEvent.click(source)).toBe(false);
  expect(calls.splice(0)).toEqual(['child', 'trigger']);

  triggerCancels = false;
  expect(fireEvent.click(source, { ctrlKey: true })).toBe(true);
  expect(calls.splice(0)).toEqual(['child', 'trigger']);
  expect(fireEvent.click(source)).toBe(false);
  expect(calls).toEqual(['child', 'trigger', 'true']);
  expect(onOpenChange).toHaveBeenCalledTimes(1);
  expect(source.getAttribute('aria-expanded')).toBe('false');
});

it('rejects disabled sources including inherited fieldset and slotted aria-disabled', () => {
  const change = vi.fn();
  render(
    <Popover open={false} onOpenChange={change}>
      <fieldset disabled>
        <PopoverTrigger>Fieldset</PopoverTrigger>
      </fieldset>
      <PopoverTrigger disabled asChild>
        <a href="#report">Unavailable</a>
      </PopoverTrigger>
      <PopoverContent aria-label="Details" />
    </Popover>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Fieldset' }));
  expect(fireEvent.click(screen.getByRole('link', { name: 'Unavailable' }))).toBe(false);
  expect(change).not.toHaveBeenCalled();
});
