import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import {
  CheckboxCard,
  CheckboxCardGroup,
  ChoiceCardContent,
  ChoiceCardDescription,
  ChoiceCardLabel,
  ChoiceCardSecondary,
  RadioCard,
  RadioCardGroup,
  RadioCardIndicator,
  SwitchCard,
} from '../src/index.js';

afterEach(cleanup);

function FormChoices(): React.JSX.Element {
  return (
    <>
      <p id="error">Confirm the export policy.</p>
      <CheckboxCardGroup disabled aria-label="Exports">
        <CheckboxCard
          name="export"
          value="pdf"
          label={
            <>
              Print <strong>PDF</strong>
            </>
          }
          description="Use the print layout."
          metadata="Included"
          aria-describedby="error error"
          defaultChecked
          secondary={<a href="/terms">Read terms</a>}
        />
      </CheckboxCardGroup>
      <RadioCardGroup aria-label="Visibility" defaultValue="">
        <RadioCard
          value=""
          indicatorPlacement="none"
          aria-labelledby="title"
          aria-describedby="detail error"
        >
          <ChoiceCardContent>
            <ChoiceCardLabel id="title">
              Private <RadioCardIndicator />
            </ChoiceCardLabel>
            <ChoiceCardDescription id="detail">Invitees can read this page.</ChoiceCardDescription>
            <ChoiceCardSecondary>
              <button type="button">Details</button>
            </ChoiceCardSecondary>
          </ChoiceCardContent>
        </RadioCard>
      </RadioCardGroup>
    </>
  );
}

it('renders server-ready labels, descriptions, and independent actions', () => {
  const { container: host } = render(
    <div dangerouslySetInnerHTML={{ __html: renderToString(<FormChoices />) }} />,
  );
  const view = within(host);
  const checkbox = view.getByRole('checkbox', {
    name: 'Print PDF',
    description: 'Confirm the export policy. Use the print layout.',
  });
  const radio = view.getByRole('radio', {
    name: 'Private',
    description: 'Invitees can read this page. Confirm the export policy.',
  });
  expect(host.querySelectorAll('input')).toHaveLength(2);
  expect(checkbox).toMatchObject({ type: 'checkbox', disabled: true, checked: true });
  expect(radio).toMatchObject({ type: 'radio', checked: true, value: '' });
  expect(view.getByRole('group', { name: 'Exports' }).getAttribute('aria-disabled')).toBeNull();
  for (const action of [view.getByRole('link'), view.getByRole('button')]) {
    expect(action.closest('label')).toBeNull();
    expect(action.closest('[aria-disabled="true"]')).toBeNull();
  }
});

it('omits empty shorthand slots and retains numeric content', () => {
  const { container, rerender } = render(
    <CheckboxCard label="PDF" description=" " metadata="" secondary="" />,
  );
  const input = screen.getByRole('checkbox', { name: 'PDF' });
  expect(input.getAttribute('aria-describedby')).toBeNull();
  expect(container.querySelector('.unica-choice-card-content')?.childElementCount).toBe(1);

  rerender(<CheckboxCard label="PDF" description={0} metadata={0} />);
  expect(screen.getByRole('checkbox', { name: 'PDF', description: '0' })).toBe(input);
  expect(container.querySelector('.unica-choice-card-metadata')?.textContent).toBe('0');
});

it('keeps plate attributes off the native input and preserves its ref and proposal callback', async () => {
  const native = createRef<HTMLInputElement>();
  const proposal = vi.fn();
  const change = vi.fn();
  const { rerender } = render(
    <SwitchCard
      ref={native}
      id="updates"
      name="updates"
      label="Updates"
      className="settings-card"
      style={{ marginBlockEnd: 8 }}
      checked={false}
      onCheckedChange={proposal}
      onChange={change}
    />,
  );
  const input = screen.getByRole('switch', { name: 'Updates' });
  expect(native.current).toBe(input);
  expect(native.current?.labels).toHaveLength(1);
  expect(input.classList.contains('settings-card')).toBe(false);
  expect(input.closest<HTMLElement>('.settings-card')?.style.marginBlockEnd).toBe('8px');
  fireEvent.click(input);
  await Promise.resolve();
  expect(proposal).toHaveBeenCalledExactlyOnceWith(true);
  expect(change).toHaveBeenCalledTimes(1);
  expect(native.current?.checked).toBe(false);

  rerender(<SwitchCard ref={native} id="updates" label="Updates" checked={true} inert hidden />);
  expect(native.current).toBe(input);
  expect(native.current?.checked).toBe(true);
  expect(input.hasAttribute('inert')).toBe(false);
  expect(input.parentElement?.hasAttribute('inert')).toBe(true);
  expect(input.parentElement?.hidden).toBe(true);
});
