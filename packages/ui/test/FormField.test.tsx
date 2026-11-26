// @vitest-environment jsdom

import { createRef } from 'react';
import type { ReactNode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import {
  Checkbox,
  CheckboxCard,
  CheckboxCardGroup,
  CheckboxGroup,
  FormField,
  FormFieldDescription,
  FormFieldFeedback,
  FormFieldLabel,
  Input,
  RangeSlider,
  Radio,
  RadioGroup,
  Select,
  SegmentedControl,
  Slider,
  Switch,
  SwitchGroup,
  Textarea,
  useFormField,
} from '../src/index.js';
import { resetDevWarnings } from '../src/core/devWarning.js';

afterEach(cleanup);

function serverMarkup(children: ReactNode): HTMLDivElement {
  const host = document.createElement('div');
  host.innerHTML = renderToString(children);
  return host;
}

function description(control: Element): string[] {
  return (control.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .filter(Boolean)
    .map(
      (id) => control.closest('[data-test-root]')?.querySelector(`[id="${id}"]`)?.textContent ?? id,
    );
}

it('binds unique server IDs, preserves ordered author descriptions, and renders a zero count', () => {
  const host = serverMarkup(
    <div data-test-root="">
      <p id="author">Account scope.</p>
      <FormField
        label="Name"
        description="Persistent help."
        status="warning"
        message="Advisory."
        counter={0}
      >
        <Input aria-describedby={' author\t author \n'} />
      </FormField>
      <FormField id="field" controlId="nickname" labelId="nickname-label" label="Name" required>
        <Textarea />
      </FormField>
    </div>,
  );
  const [first, second] = host.querySelectorAll('label');
  expect(first?.control).toBe(host.querySelector('input'));
  expect(second?.control).toBe(host.querySelector('textarea'));
  expect(first?.htmlFor).not.toBe(second?.htmlFor);
  expect(second?.htmlFor).toBe('nickname');
  expect(second?.id).toBe('nickname-label');
  expect(second?.control?.hasAttribute('required')).toBe(true);
  expect(host.querySelector('#field')).not.toBe(second?.control);
  expect(description(first!.control!)).toEqual([
    'Account scope.',
    'Persistent help.',
    'Advisory.',
    '0',
  ]);
  expect(first?.control?.hasAttribute('aria-invalid')).toBe(false);
});

it('binds a searchable Select trigger and a choice-card group in server markup', () => {
  const host = serverMarkup(
    <div data-test-root="">
      <p id="catalog-hint">Catalog scope.</p>
      <FormField
        label="Document"
        controlId="document"
        required
        description="Pick a saved document."
        status="danger"
        message="Choose a document."
        counter="0 / 1"
      >
        <Select
          name="document"
          searchable
          aria-describedby="catalog-hint catalog-hint"
          options={[{ value: 'guide', label: 'Guide' }]}
        />
      </FormField>
      <FormField target="group" label="Sources" labelId="sources" description="Pick a source.">
        <CheckboxCardGroup defaultValue={['published']}>
          <CheckboxCard value="published" label="Published documents" />
        </CheckboxCardGroup>
      </FormField>
    </div>,
  );
  const trigger = host.querySelector('#document')!;
  const search = host.querySelector('input[aria-label="Search options"]')!;
  const group = host.querySelector('[role="group"]')!;
  expect(host.querySelector<HTMLLabelElement>('label[for="document"]')?.control).toBe(trigger);
  expect(trigger.getAttribute('aria-invalid')).toBe('true');
  expect(description(trigger)).toEqual([
    'Catalog scope.',
    'Pick a saved document.',
    'Choose a document.',
    '0 / 1',
  ]);
  expect(host.querySelector('select[name="document"]')?.hasAttribute('required')).toBe(true);
  expect(search.id).not.toBe(trigger.id);
  expect(description(search)).toEqual([]);
  expect(group.getAttribute('aria-labelledby')).toBe('sources');
  expect(description(group)).toEqual(['Pick a source.']);
  expect(group.querySelector('input:checked')?.getAttribute('value')).toBe('published');
  expect(group.textContent).toBe('Published documents');
});

it('preserves a choice-card title and isolates secondary controls from its field', () => {
  const host = serverMarkup(
    <div data-test-root="">
      <FormField label="Retention" controlId="retention" description="Choose a policy." required>
        <CheckboxCard
          label="Keep originals"
          description="For 30 days."
          secondary={<Input id="notes" name="notes" aria-label="Notes" />}
        />
      </FormField>
    </div>,
  );
  const carrier = host.querySelector<HTMLInputElement>('input#retention')!;
  const notes = host.querySelector<HTMLInputElement>('input#notes')!;
  expect(host.querySelector<HTMLLabelElement>('label[for="retention"]')?.control).toBe(carrier);
  expect(host.textContent).toContain('Keep originals');
  expect(carrier.required).toBe(true);
  expect(carrier.getAttribute('aria-labelledby')).toBeNull();
  expect(description(carrier)).toEqual(['For 30 days.', 'Choose a policy.']);
  expect(notes.required).toBe(false);
  expect(description(notes)).toEqual([]);
});

it('gives the scope control ID precedence and warns once about conflicting child IDs', () => {
  resetDevWarnings();
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const host = serverMarkup(
      <>
        <FormField label="Title" controlId="title">
          <Input id="other" />
        </FormField>
        <FormField label="Notes" controlId="notes">
          <Textarea id="wrong" />
        </FormField>
        <FormField label="Match" controlId="match">
          <Input id="match" />
        </FormField>
        <Input id="standalone" />
      </>,
    );
    expect([...host.querySelectorAll('input, textarea')].map((node) => node.id)).toEqual([
      'title',
      'notes',
      'match',
      'standalone',
    ]);
    expect(warning).toHaveBeenCalledExactlyOnceWith(
      'Set the control ID on FormField using controlId.',
    );
  } finally {
    warning.mockRestore();
    resetDevWarnings();
  }
});

function AuthorDescription() {
  const field = useFormField();
  return <Input aria-describedby={`author ${field?.messageId} author`} disabled />;
}

it('resolves explicit, local, and field-level availability before hydration', () => {
  const host = serverMarkup(
    <div data-test-root="">
      <span id="author">Author help.</span>
      <FormField
        label="Locally disabled"
        description="Retained help."
        status="danger"
        message="Missing title."
        counter="1 / 20"
      >
        <AuthorDescription />
      </FormField>
      <FormField
        label="Disabled wrapper"
        description="Outside scope."
        status="danger"
        message="Suppressed."
        disabled
        required
        readOnly
      >
        <Input disabled={false} required={false} readOnly={false} />
      </FormField>
      <FormField label="Locked" status="danger" message="Locked review." readOnly>
        <Textarea />
      </FormField>
    </div>,
  );
  const [disabled, available, locked] = host.querySelectorAll('input, textarea');
  expect(host.textContent).toContain('Missing title.');
  expect(description(disabled!)).toEqual(['Author help.', 'Retained help.', '1 / 20']);
  expect(disabled?.hasAttribute('aria-invalid')).toBe(false);
  expect(disabled?.hasAttribute('disabled')).toBe(true);
  expect(available?.hasAttribute('disabled')).toBe(false);
  expect(available?.hasAttribute('readonly')).toBe(false);
  expect(available?.hasAttribute('required')).toBe(false);
  expect(available?.hasAttribute('aria-invalid')).toBe(false);
  expect(description(available!)).toEqual(['Outside scope.']);
  expect(host.textContent).not.toContain('Suppressed.');
  expect(locked?.getAttribute('aria-invalid')).toBe('true');
  expect(locked?.hasAttribute('readonly')).toBe(true);
  expect(description(locked!)).toEqual(['Locked review.']);
});

function Invisible() {
  return null;
}

it('normalizes empty slots and keeps empty reservation out of the accessible description', () => {
  const host = serverMarkup(
    <div data-test-root="">
      <FormField
        label={<></>}
        description={[null, false, '  ']}
        message=""
        counter={<></>}
        status="danger"
        reserveMessage
      >
        <Input aria-label="Suppressed" />
      </FormField>
      <FormField status="info" message={<>{false} </>} statusLabel={[false, '  ', null]}>
        <Input aria-label="Fallback" />
      </FormField>
      <FormField status="danger" message={0}>
        <Input aria-label="Zero" />
      </FormField>
      <FormField status="warning" message={<Invisible />}>
        <Input aria-label="Opaque" />
      </FormField>
      <FormField status="success" message={null} statusLabel="Verified">
        <Input aria-label="Localized" />
      </FormField>
      <FormFieldFeedback id="independent" status="warning" />
      <FormFieldFeedback id="suppressed" status="info">
        {''}
      </FormFieldFeedback>
    </div>,
  );
  const controls = [...host.querySelectorAll('input')];
  expect(controls.map(description)).toEqual([[], ['Information'], ['0'], [''], ['Verified']]);
  expect(host.querySelector('label')).toBeNull();
  expect(controls[0]?.hasAttribute('aria-describedby')).toBe(false);
  expect(host.querySelector('#independent')?.textContent).toBe('Review this value');
  expect(host.querySelector('#suppressed')).toBeNull();
});

it('scopes shipped groups and single controls while retaining the standalone naming contract', () => {
  const host = serverMarkup(
    <div data-test-root="">
      <span id="team">Team</span>
      <FormField
        target="group"
        labelId="channels"
        label="Channels"
        status="danger"
        message="Choose one."
        required
      >
        <CheckboxGroup aria-labelledby="team channels" name="channels">
          <Checkbox id="mail" label="Mail" value="mail" />
          <Checkbox id="chat" label="Chat" value="chat" />
        </CheckboxGroup>
      </FormField>
      <FormField target="group" label="Explicit group status">
        <CheckboxGroup status="danger">
          <Checkbox label="Legacy option status" />
        </CheckboxGroup>
      </FormField>
      <FormField target="group" label="Access" required>
        <RadioGroup>
          <Radio label="Read" value="read" />
        </RadioGroup>
      </FormField>
      <FormField
        target="group"
        label="Notifications"
        status="danger"
        message="Change preferences."
        required
      >
        <SwitchGroup>
          <Switch label="Preview" />
        </SwitchGroup>
      </FormField>
      <FormField target="group" label="View" labelId="view" status="danger" required>
        <SegmentedControl aria-labelledby="view" items={[{ value: 'list', label: 'List' }]} />
      </FormField>
      <FormField label="Confirm">
        <Checkbox label="Inline label" />
      </FormField>
      <FormField label="Zoom">
        <Slider />
      </FormField>
      <FormField target="group" label="Budget" description="Choose a range.">
        <RangeSlider
          thumbLabels={['Minimum', 'Maximum']}
          inputProps={[{ id: 'min' }, { id: 'max' }]}
        />
      </FormField>
    </div>,
  );
  const [channels, explicitGroup, switches, range] = host.querySelectorAll('[role="group"]');
  const [access, view] = host.querySelectorAll('[role="radiogroup"]');
  expect(channels?.getAttribute('aria-labelledby')).toBe('team channels');
  expect(channels?.getAttribute('aria-invalid')).toBe('true');
  expect(description(channels!)).toEqual(['Choose one.']);
  expect(channels?.querySelector('input[required],input[aria-invalid]')).toBeNull();
  expect(channels?.querySelectorAll('#mail,#chat')).toHaveLength(2);
  expect(explicitGroup?.querySelector('input')?.getAttribute('aria-invalid')).toBe('true');
  expect(access?.getAttribute('aria-required')).toBe('true');
  expect(access?.querySelector('input')?.hasAttribute('required')).toBe(true);
  expect(switches?.hasAttribute('aria-invalid')).toBe(false);
  expect(switches?.querySelector('input[required]')).toBeNull();
  expect(description(switches!)).toEqual(['Change preferences.']);
  expect(view?.getAttribute('aria-labelledby')).toBe('view');
  expect(view?.getAttribute('aria-required')).toBe('true');
  expect(view?.getAttribute('aria-invalid')).toBe('true');
  expect([...host.querySelectorAll('label[for]')].map((label) => label.textContent)).toEqual([
    'Confirm',
    'Zoom',
  ]);
  expect(host.textContent).not.toContain('Inline label');
  expect(description(range!)).toEqual(['Choose a range.']);
  expect(description(range!.querySelector('#min')!)).toEqual(['Choose a range.']);
  expect(range?.querySelector('#max')?.getAttribute('aria-label')).toBe('Maximum');
});

function ScopeProbe({ name }: { name: string }) {
  const field = useFormField();
  return <span data-testid={name}>{field?.labelId ?? 'outside'}</span>;
}

it('isolates headings and support content from nested scope, and forwards the real part refs', () => {
  const root = createRef<HTMLDivElement>();
  const nativeLabel = createRef<HTMLLabelElement>();
  const groupLabel = createRef<HTMLSpanElement>();
  const help = createRef<HTMLDivElement>();
  const result = createRef<HTMLDivElement>();
  render(
    <>
      <FormField ref={root} target="group" label="Outer" labelId="outer">
        <ScopeProbe name="outer" />
        <FormField
          label="Inner"
          labelId="inner"
          labelAction={<ScopeProbe name="action" />}
          description={<ScopeProbe name="description" />}
        >
          <ScopeProbe name="inner" />
          <Input />
        </FormField>
      </FormField>
      <FormFieldLabel ref={nativeLabel} htmlFor="standalone" required optional="Unused">
        Access
      </FormFieldLabel>
      <FormFieldLabel ref={groupLabel} target="group" optional="Optional">
        Delivery
      </FormFieldLabel>
      <FormFieldDescription ref={help}>Instructions</FormFieldDescription>
      <FormFieldFeedback ref={result} status="danger" icon={false} />
    </>,
  );
  expect(root.current?.tagName).toBe('DIV');
  expect(nativeLabel.current?.htmlFor).toBe('standalone');
  expect(nativeLabel.current?.textContent).not.toContain('Unused');
  expect(groupLabel.current?.tagName).toBe('SPAN');
  expect(groupLabel.current?.textContent).toContain('Optional');
  expect(help.current?.textContent).toBe('Instructions');
  expect(result.current?.textContent).toBe('Needs attention');
  expect(result.current?.querySelector('svg')).toBeNull();
  expect(
    ['outer', 'inner', 'action', 'description'].map((id) => screen.getByTestId(id).textContent),
  ).toEqual(['outer', 'inner', 'outside', 'outside']);
});
