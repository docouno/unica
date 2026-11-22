import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { createRef, StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import {
  Checkbox,
  CheckboxGroup,
  CheckboxIndicator,
  Radio,
  RadioGroup,
  RadioIndicator,
  Switch,
  SwitchGroup,
  SwitchIndicator,
} from '../src/index.js';
import type { CheckboxIndicatorProps } from '../src/index.js';

afterEach(cleanup);

it('exposes native input and group refs, with names and descriptions on their own nodes', () => {
  const checkboxRef = createRef<HTMLInputElement>();
  const radioRef = createRef<HTMLInputElement>();
  const switchRef = createRef<HTMLInputElement>();
  const checkboxGroupRef = createRef<HTMLDivElement>();
  const radioGroupRef = createRef<HTMLDivElement>();
  const switchGroupRef = createRef<HTMLDivElement>();

  const { unmount } = render(
    <StrictMode>
      <p id="hint">This applies to your account.</p>
      <span id="permissions">Permissions</span>
      <CheckboxGroup ref={checkboxGroupRef} aria-labelledby="permissions" status="danger">
        <Checkbox
          ref={checkboxRef}
          label={
            <>
              Read <strong>reports</strong>
            </>
          }
          description="View all reports."
          aria-describedby="hint"
          id="read"
          name="permissions"
          value=""
          className="settings-row"
          style={{ marginInlineStart: 8 }}
          required
          readOnly
          defaultChecked
          indeterminate
        />
      </CheckboxGroup>
      <RadioGroup ref={radioGroupRef} aria-label="Visibility" name="visibility" value="team">
        <Radio ref={radioRef} value="team" label="Team only" />
      </RadioGroup>
      <SwitchGroup ref={switchGroupRef} aria-label="Notifications">
        <Switch ref={switchRef} id="mail" defaultChecked name="mail" />
        <label htmlFor="mail">Mail alerts</label>
      </SwitchGroup>
    </StrictMode>,
  );

  const checkbox = screen.getByRole('checkbox', {
    name: 'Read reports',
    description: 'This applies to your account. View all reports.',
  });
  const radio = screen.getByRole('radio', { name: 'Team only' });
  const toggle = screen.getByRole('switch', { name: 'Mail alerts' });
  expect(checkboxRef.current).toBe(checkbox);
  expect(radioRef.current).toBe(radio);
  expect(switchRef.current).toBe(toggle);
  expect(checkboxGroupRef.current).toBe(screen.getByRole('group', { name: 'Permissions' }));
  expect(radioGroupRef.current).toBe(screen.getByRole('radiogroup', { name: 'Visibility' }));
  expect(switchGroupRef.current).toBe(screen.getByRole('group', { name: 'Notifications' }));
  for (const { current } of [checkboxGroupRef, radioGroupRef, switchGroupRef]) {
    expect(current).toBeInstanceOf(HTMLDivElement);
  }

  expect(checkboxRef.current).toMatchObject({
    type: 'checkbox',
    id: 'read',
    name: 'permissions',
    value: '',
    checked: true,
    indeterminate: true,
    required: true,
    readOnly: false,
  });
  expect(checkbox.getAttribute('aria-readonly')).toBe('true');
  expect(checkbox.getAttribute('aria-invalid')).toBe('true');
  expect(checkbox.classList.contains('settings-row')).toBe(false);
  expect(checkbox.closest<HTMLElement>('.settings-row')?.style.marginInlineStart).toBe('8px');
  expect(radioRef.current).toMatchObject({ type: 'radio', name: 'visibility', checked: true });
  expect(switchRef.current).toMatchObject({ type: 'checkbox', value: 'on', checked: true });
  expect(Array.from(switchRef.current?.labels ?? [])).toContain(screen.getByText('Mail alerts'));

  unmount();
  expect([
    checkboxRef.current,
    radioRef.current,
    switchRef.current,
    checkboxGroupRef.current,
    radioGroupRef.current,
    switchGroupRef.current,
  ]).toEqual(Array(6).fill(null));
});

it('forwards an explicit accessible name and keeps the row hidden when requested', () => {
  render(
    <>
      <span id="external">Choose audit events</span>
      <Checkbox aria-labelledby="external" label="Audit events" status="danger" disabled />
      <Switch label="Send alerts" className="hidden-row" hidden />
    </>,
  );

  const option = screen.getByRole('checkbox', { name: 'Choose audit events' });
  expect(option.getAttribute('aria-invalid')).not.toBe('true');
  expect(screen.queryByRole('switch', { name: 'Send alerts' })).toBeNull();
  expect(screen.getByText('Send alerts').closest('.hidden-row')?.hasAttribute('hidden')).toBe(true);
});

it('preserves a named input across an uncontrolled gesture and forwards its native event', () => {
  const native = createRef<HTMLInputElement>();
  const eventLog: unknown[] = [];
  render(
    <form aria-label="Preferences">
      <Checkbox
        ref={native}
        name="reports"
        label="Read reports"
        onCheckedChange={(next) => eventLog.push(next)}
        onChange={(event) => {
          eventLog.push(event.currentTarget, event.nativeEvent.type);
        }}
      />
    </form>,
  );

  const input = screen.getByRole('checkbox', { name: 'Read reports' });
  fireEvent.click(input);
  expect(eventLog).toEqual([true, input, 'click']);
  expect(native.current).toBe(input);
  expect(native.current?.checked).toBe(true);
});

it('renders indicators as passive spans even with untyped role and focus overrides', () => {
  const checkbox = createRef<HTMLSpanElement>();
  const radio = createRef<HTMLSpanElement>();
  const toggle = createRef<HTMLSpanElement>();
  const untyped = {
    role: 'button',
    tabIndex: 0,
    'aria-hidden': false,
  } as unknown as CheckboxIndicatorProps;
  const thumbIcon = <svg data-slot="test-icon" />;
  const { container } = render(
    <>
      <CheckboxIndicator {...untyped} ref={checkbox} checked indeterminate />
      <RadioIndicator {...untyped} ref={radio} checked />
      <SwitchIndicator {...untyped} ref={toggle} thumbIcon={thumbIcon} />
    </>,
  );

  for (const { current } of [checkbox, radio, toggle]) {
    expect(current).toBeInstanceOf(HTMLSpanElement);
    expect(current?.getAttribute('aria-hidden')).toBe('true');
    expect(current?.hasAttribute('role')).toBe(false);
    expect(current?.hasAttribute('tabindex')).toBe(false);
  }
  expect(toggle.current?.querySelector('svg[data-slot="test-icon"]')).toBeTruthy();
  expect(container.querySelector('input')).toBeNull();
});

it('hydrates native checked values and distinct generated radio names without replacing nodes', () => {
  const view = (
    <form aria-label="Preferences">
      <Checkbox name="reports" label="Read reports" description="All reports." defaultChecked />
      <RadioGroup aria-label="First plan" defaultValue="">
        <Radio value="" label="No plan" />
        <Radio value="advanced" label="Advanced" />
      </RadioGroup>
      <RadioGroup aria-label="Second plan" name="" value="advanced">
        <Radio value="" label="No plan" />
        <Radio value="advanced" label="Advanced" />
      </RadioGroup>
      <Switch name="mail" label="Mail alerts" checked />
    </form>
  );
  const container = document.body.appendChild(document.createElement('div'));
  container.innerHTML = renderToString(view);
  const form = container.querySelector('form')!;
  const inputs = Array.from(form.querySelectorAll('input'));
  const names = inputs.map((input) => input.name);
  const [reports, first, firstAlternative, secondAlternative, second, mail] = names;
  expect(first).toBeTruthy();
  expect(second).toBeTruthy();
  expect(first).not.toBe(second);
  expect(first).toBe(firstAlternative);
  expect(second).toBe(secondAlternative);
  const entries = [
    [reports, 'on'],
    [first, ''],
    [second, 'advanced'],
    [mail, 'on'],
  ];
  expect([...new FormData(form)]).toEqual(entries);
  const describedBy = inputs[0]?.getAttribute('aria-describedby');
  expect(describedBy && document.getElementById(describedBy)?.textContent).toBe('All reports.');

  const onRecoverableError = vi.fn();
  render(view, { container, hydrate: true, onRecoverableError });
  expect(onRecoverableError).not.toHaveBeenCalled();
  expect(screen.getByRole('form', { name: 'Preferences' })).toBe(form);
  const hydratedInputs = Array.from(form.querySelectorAll('input'));
  expect(hydratedInputs).toHaveLength(inputs.length);
  for (const [index, input] of hydratedInputs.entries()) {
    expect(input).toBe(inputs[index]);
  }
  expect(inputs.map((input) => input.name)).toEqual(names);
  expect(inputs[0]?.getAttribute('aria-describedby')).toBe(describedBy);
  expect([...new FormData(form)]).toEqual(entries);
  expect(within(form).getByRole('radio', { name: 'No plan', checked: true })).toBe(inputs[1]);
  expect(within(form).getByRole('radio', { name: 'Advanced', checked: true })).toBe(inputs[4]);
});
