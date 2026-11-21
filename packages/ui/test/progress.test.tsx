import { cleanup, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { Progress, ProgressCircle, Spinner } from '../src/index.js';

afterEach(cleanup);

describe('progress indicators', () => {
  it.each([
    [42, 80, 42, '52%'],
    [29, 100, 29, '29%'],
    [99.6, 100, 99.6, '99%'],
    [0, 80, 0, '0%'],
    [100, 80, 80, '100%'],
    [-5, 80, 0, '0%'],
    [1e308, Number.MAX_VALUE, 1e308, '55%'],
  ])('keeps the source scale for %s of %s and displays %s as %s', (value, max, now, display) => {
    render(
      <>
        <Progress label="Archive transfer" value={value} max={max} />
        <ProgressCircle aria-label="Compact archive transfer" value={value} max={max} />
      </>,
    );
    expect(screen.getByText(display)).toBeTruthy();
    for (const indicator of screen.getAllByRole('progressbar')) {
      expect(indicator.getAttribute('aria-valuemin')).toBe('0');
      expect(indicator.getAttribute('aria-valuemax')).toBe(String(max));
      expect(indicator.getAttribute('aria-valuenow')).toBe(String(now));
    }
  });

  it.each([
    [null, 80],
    [NaN, 80],
    [Infinity, 80],
    [-Infinity, 80],
    [42, 0],
    [42, -80],
    [42, NaN],
    [42, Infinity],
  ])('clears stale values from both semantic nodes for %s of %s', (value, max) => {
    const view = (value: number | null, max: number) => (
      <>
        <Progress aria-label="Archive transfer" value={value} max={max} valueLabel="42 of 80 MB" />
        <ProgressCircle
          aria-label="Compact archive transfer"
          value={value}
          max={max}
          aria-valuetext="42 of 80 MB"
        />
      </>
    );
    const { rerender } = render(view(42, 80));
    const nodes = screen.getAllByRole('progressbar');
    expect(nodes.map((node) => node.getAttribute('aria-valuetext'))).toEqual([
      '42 of 80 MB',
      '42 of 80 MB',
    ]);

    rerender(view(value, max));
    expect(screen.getAllByRole('progressbar')).toEqual(nodes);
    for (const node of nodes) {
      for (const attr of ['aria-valuemin', 'aria-valuemax', 'aria-valuenow', 'aria-valuetext']) {
        expect(node.hasAttribute(attr)).toBe(false);
      }
    }
    expect(screen.getByText('42 of 80 MB').parentElement?.getAttribute('aria-hidden')).toBe('true');
  });

  it('uses the caller name, description and unit precedence on the semantic track', () => {
    const { rerender } = render(
      <>
        <span id="author-name">Named elsewhere</span>
        <span id="details">Sends an archive</span>
        <Progress
          value={42}
          max={80}
          label="Visible task"
          aria-label="Fallback"
          aria-labelledby="author-name"
          aria-describedby="details"
          aria-valuetext="42 of 80 megabytes"
          valueLabel="42 MB"
        />
      </>,
    );
    const track = screen.getByRole('progressbar', {
      name: 'Named elsewhere',
      description: 'Sends an archive',
    });
    expect(track.getAttribute('aria-valuetext')).toBe('42 of 80 megabytes');
    expect(track.parentElement?.hasAttribute('aria-describedby')).toBe(false);
    expect(screen.getByText('Visible task')).not.toBe(track);
    expect(screen.getByText('42 MB')).toBeTruthy();

    rerender(
      <Progress
        label="   "
        aria-labelledby=" "
        aria-label="Transfer"
        value={42}
        valueLabel="42 records"
        aria-valuetext=" "
        showValue={false}
      />,
    );
    expect(screen.getByRole('progressbar', { name: 'Transfer' })).not.toBeNull();
    expect(screen.queryByText('42 records')).toBeNull();
    expect(screen.getByRole('progressbar').getAttribute('aria-valuetext')).toBe('42 records');

    rerender(<Progress value={10} label="Visible name" aria-label=" " />);
    expect(screen.getByRole('progressbar', { name: 'Visible name' })).toBeTruthy();
  });

  it('keeps Spinner decorative unless named and honours explicit hiding', () => {
    render(
      <>
        <span id="operation">Synchronizing history</span>
        <Spinner aria-label="  " aria-hidden={false} data-testid="decorative" />
        <Spinner aria-labelledby="operation" aria-label="Fallback" />
        <Spinner aria-label="Exporting archive" />
        <Spinner aria-label="Saving changes" aria-hidden="true" />
      </>,
    );

    expect(screen.getByTestId('decorative').getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByRole('img', { name: 'Synchronizing history' }).tagName).toBe('svg');
    expect(screen.getByRole('img', { name: 'Exporting archive' })).toBeTruthy();
    expect(screen.queryByRole('img', { name: 'Saving changes' })).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('forwards native placement attributes and ref lifetimes, protecting passive semantics', () => {
    const progressRef = createRef<HTMLDivElement>();
    const circleRef = createRef<SVGSVGElement>();
    const spinnerNodes: (SVGSVGElement | null)[] = [];
    const spinnerRef = (node: SVGSVGElement | null): void => {
      spinnerNodes.push(node);
    };
    const overrides = JSON.parse(
      '{"autoFocus":true,"contentEditable":true,"tabIndex":0,"role":"button","focusable":true,"aria-valuenow":73,"aria-live":"assertive","children":"unexpected","dangerouslySetInnerHTML":{"__html":"unexpected"}}',
    ) as Record<string, unknown>;
    const { unmount } = render(
      <>
        <button type="button" autoFocus>
          Keep focus
        </button>
        <span id="details">Sends an archive</span>
        <Progress
          {...overrides}
          ref={progressRef}
          id="transfer"
          className="placement"
          style={{ marginTop: 10 }}
          data-owner="transfer"
          label="Archive transfer"
          value={10}
        />
        <ProgressCircle {...overrides} ref={circleRef} aria-label="Compact transfer" value={10} />
        <Spinner {...overrides} ref={spinnerRef} data-testid="spinner" aria-describedby="details" />
      </>,
    );
    const track = screen.getByRole('progressbar', { name: 'Archive transfer' });
    const { current: outer } = progressRef;
    const { current: circle } = circleRef;
    const spinner = screen.getByTestId('spinner');
    expect(outer?.tagName).toBe('DIV');
    expect(outer?.contains(track)).toBe(true);
    expect(outer?.getAttribute('data-owner')).toBe('transfer');
    expect(outer?.id).toBe('transfer');
    expect(outer?.classList.contains('placement')).toBe(true);
    expect(outer?.style.marginTop).toBe('10px');
    expect(circle).toBe(screen.getByRole('progressbar', { name: 'Compact transfer' }));
    expect(circle?.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(spinner.getAttribute('aria-describedby')).toBe('details');
    expect(spinnerNodes).toEqual([spinner]);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Keep focus' }));
    expect(screen.queryByText('unexpected')).toBeNull();

    for (const node of [outer, track, circle, spinner]) {
      for (const attr of ['autofocus', 'contenteditable', 'tabindex', 'aria-live']) {
        expect(node?.hasAttribute(attr)).toBe(false);
      }
    }
    expect(outer?.hasAttribute('role')).toBe(false);
    expect(outer?.hasAttribute('aria-valuenow')).toBe(false);
    expect(track.getAttribute('aria-valuenow')).toBe('10');
    expect(circle?.getAttribute('aria-valuenow')).toBe('10');
    expect(circle?.getAttribute('focusable')).toBe('false');
    expect(spinner.getAttribute('focusable')).toBe('false');
    expect(spinner.hasAttribute('aria-valuenow')).toBe(false);

    unmount();
    expect(progressRef.current).toBeNull();
    expect(circleRef.current).toBeNull();
    expect(spinnerNodes).toEqual([spinner, null]);
  });
});
