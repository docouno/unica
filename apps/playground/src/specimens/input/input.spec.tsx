import { useState } from 'react';
import type { ReactElement } from 'react';
import { ArrowUpRightIcon, EnvelopeSimpleIcon } from '@phosphor-icons/react';
import { Input, Text } from '@docouno/unica';
import type { InputProps } from '@docouno/unica';
import {
  choice,
  size,
  variant,
  status,
  width,
  disabled,
  readOnly,
  required,
  clearable,
  loading,
  eventProp,
} from '../control-props.js';
import { previewProps } from '../preview-code.js';
import { defineComponent } from '../../workbench/types.js';
import {
  InputAnatomy,
  InputAvailability,
  InputFeedback,
  InputFormExample,
  InputInteraction,
  InputLive,
  InputOverflow,
  InputRoles,
  InputSurfaces,
} from './input.examples.js';

const stringProp = (group: string, description: string, initial = '') => ({
  kind: 'string' as const,
  group,
  description,
  default: initial,
});

function ControlledPreview({ value = '', onChange, ...props }: InputProps): ReactElement {
  const [text, setText] = useState(value);
  return (
    <Input
      {...props}
      value={text}
      onChange={(event) => {
        setText(event.currentTarget.value);
        onChange?.(event);
      }}
    />
  );
}

export default defineComponent({
  id: 'input',
  title: 'Input',
  category: 'Forms',
  status: 'UI',
  summary:
    'Single-line text entry with native form behavior, clear feedback, and logical adornments.',
  componentName: 'Input',
  form: 'wrap',
  props: {
    size,
    variant,
    status,
    width,
    type: choice(
      'Field',
      'Native text editing type.',
      ['text', 'search', 'email', 'url', 'tel', 'password'],
      'text',
    ),
    disabled,
    readOnly,
    required,
    clearable,
    loading,
    valueMode: {
      ...choice(
        'Value',
        'The form or a React owner retains the text.',
        ['uncontrolled', 'controlled'],
        'uncontrolled',
      ),
      demo: true,
    },
    defaultValue: stringProp('Value', 'Initial and reset value in uncontrolled mode.', 'Folio'),
    value: stringProp('Value', 'Value supplied by the React owner in controlled mode.', 'Folio'),
    placeholder: stringProp(
      'Content',
      'Hint displayed while the input is empty.',
      'Enter a workspace name',
    ),
    prefix: stringProp('Content', 'Decorative text at the start of the value.'),
    suffix: stringProp('Content', 'Decorative text at the end of the value.'),
    iconLeft: {
      kind: 'slot',
      group: 'Content',
      default: 'none',
      description: 'Decorative glyph at the logical start.',
      choices: [
        { value: 'none', label: 'None' },
        { value: 'email', label: 'Envelope', code: 'EnvelopeSimpleIcon' },
      ],
    },
    iconRight: {
      kind: 'slot',
      group: 'Content',
      default: 'none',
      description: 'Decorative glyph at the logical end.',
      choices: [
        { value: 'none', label: 'None' },
        { value: 'link', label: 'External reference', code: 'ArrowUpRightIcon' },
      ],
    },
    clearLabel: stringProp('Semantics', 'Accessible name for the Clear action.'),
    name: stringProp('Semantics', 'Key used when submitting the native field.', 'workspace'),
    id: stringProp('Semantics', 'ID for the external label. Scoped per artboard in this preview.'),
    description: {
      ...stringProp('Semantics', 'External description linked to the field.'),
      demo: true,
    },
    onChange: eventProp('Reports the value of a native edit, including Clear.', 'handleChange'),
    onClear: eventProp('Runs after the Clear edit is reported.', 'handleClear'),
  },
  constraints: [
    {
      kind: 'ignored',
      when: { disabled: true },
      affects: ['status', 'loading', 'clearable'],
      reason: 'A disabled field suppresses validation, busy feedback and clearing.',
    },
    {
      kind: 'ignored',
      when: { readOnly: true },
      affects: ['clearable'],
      reason: 'A read-only field allows selection and copying.',
    },
    {
      kind: 'precedence',
      when: { loading: true, disabled: false },
      affects: ['clearable', 'iconRight'],
      reason:
        'The spinner takes the trailing position. A visible Clear button stays in place and becomes unavailable.',
    },
    ...(['info', 'success', 'warning', 'danger'] as const).map((feedback) => ({
      kind: 'precedence' as const,
      when: { status: feedback, disabled: false },
      affects: ['iconRight'],
      reason: 'Validation takes the decorative trailing icon’s position.',
    })),
    {
      kind: 'ignored',
      when: { valueMode: 'controlled' },
      affects: ['defaultValue'],
      reason: 'The React owner supplies the value in controlled mode.',
    },
    {
      kind: 'ignored',
      when: { valueMode: 'uncontrolled' },
      affects: ['value'],
      reason: 'The native form retains the current edit in uncontrolled mode.',
    },
  ],
  render: function InputSubject({ values, ctx }) {
    const { valueMode, value, defaultValue, description, id, iconLeft, iconRight, ...props } =
      values;
    const controlled = valueMode === 'controlled';
    const PreviewInput = controlled ? ControlledPreview : Input;
    const fieldId = id.trim() ? `${ctx.id}-${id.trim().replace(/\s+/g, '-')}` : ctx.id;
    return (
      <div className="input-study-field">
        <label htmlFor={fieldId}>Workspace name</label>
        <div className="input-study-subject" data-width={props.width} {...ctx.subject}>
          <PreviewInput
            {...props}
            key={controlled ? value : defaultValue}
            id={fieldId}
            aria-describedby={description ? `${fieldId}-hint` : undefined}
            value={controlled ? value : undefined}
            defaultValue={controlled ? undefined : defaultValue}
            iconLeft={iconLeft === 'email' ? EnvelopeSimpleIcon : undefined}
            iconRight={iconRight === 'link' ? ArrowUpRightIcon : undefined}
            onChange={(event) => ctx.action('onChange')(event.currentTarget.value)}
            onClear={ctx.action('onClear')}
          />
        </div>
        {description && (
          <Text id={`${fieldId}-hint`} size="caption-l" color="muted">
            {description}
          </Text>
        )}
      </div>
    );
  },
  code: ({ valueMode, value, defaultValue, description, id, iconLeft, iconRight, ...props }) => {
    const name = id.trim().replace(/\s+/g, '-') || 'workspace';
    const inputId = JSON.stringify(name);
    const hintId = JSON.stringify(`${name}-hint`);
    const hintAttribute = description ? ` aria-describedby={${hintId}}` : '';
    const valueAttribute =
      valueMode === 'controlled'
        ? ` value={${JSON.stringify(value)}}`
        : ` defaultValue={${JSON.stringify(defaultValue)}}`;
    const icons =
      (iconLeft === 'email' ? ' iconLeft={EnvelopeSimpleIcon}' : '') +
      (iconRight === 'link' ? ' iconRight={ArrowUpRightIcon}' : '');
    const attributes = previewProps(props, {
      size: 'm',
      variant: 'default',
      status: 'neutral',
      width: 'full',
      type: 'text',
      disabled: false,
      readOnly: false,
      required: false,
      clearable: false,
      loading: false,
      placeholder: '',
      prefix: '',
      suffix: '',
      clearLabel: '',
    });
    const hint = description ? `\n  <p id={${hintId}}>{${JSON.stringify(description)}}</p>` : '';
    return `<>
  <label htmlFor={${inputId}}>Workspace name</label>
  <Input id={${inputId}}${hintAttribute}${valueAttribute}${icons}${attributes} onChange={handleChange}${props.clearable ? ' onClear={handleClear}' : ''} />${hint}
</>`;
  },
  matrixViews: [
    { id: 'roles', rows: 'size', cols: 'variant', title: 'Roles and sizes', reference: InputRoles },
    {
      id: 'availability',
      rows: 'status',
      cols: 'disabled',
      title: 'Validation and disabled state',
      fixed: { loading: true, clearable: true },
      reference: InputAvailability,
    },
    {
      id: 'editing',
      rows: 'readOnly',
      cols: 'loading',
      title: 'Editing and pending work',
      fixed: { status: 'warning', clearable: true },
    },
  ],
  cases: [
    { id: 'anatomy', title: 'Anatomy and slot priority', kind: 'behavior', render: InputAnatomy },
    {
      id: 'interaction',
      title: 'Pointer, keyboard and Clear',
      caption:
        'Click to edit quietly or press Tab for the focus outline. Tab to Clear and press Enter or Space.',
      kind: 'behavior',
      mode: 'live',
      render: InputInteraction,
    },
    {
      id: 'feedback',
      title: 'Validation and information',
      kind: 'behavior',
      render: InputFeedback,
    },
    {
      id: 'availability',
      title: 'Availability and overlapping states',
      kind: 'behavior',
      render: InputAvailability,
    },
    {
      id: 'live',
      title: 'Live editing and feedback',
      caption:
        'Start a simulated check, choose a result, then change the value to clear the old result.',
      kind: 'behavior',
      mode: 'live',
      render: InputLive,
    },
    {
      id: 'overflow',
      title: 'Long values, affixes and direction',
      kind: 'content',
      render: InputOverflow,
    },
    {
      id: 'surfaces',
      title: 'Base and overlay materials',
      kind: 'surface',
      compareSurfaces: true,
      overlayStage: true,
      render: ({ ctx }) => <InputSurfaces overlay={ctx.surface === 'overlay'} />,
    },
  ],
  usage: [
    {
      id: 'native-form',
      title: 'Native label, submit and reset',
      render: ({ ctx }) => <InputFormExample id={ctx.id} />,
      code: `<form>
  <label htmlFor="workspace">Workspace name</label>
  <Input id="workspace" name="workspace" defaultValue="Folio" aria-describedby="workspace-hint" clearable required />
  <p id="workspace-hint">Shown to members of your workspace.</p>
  <button type="submit">Submit</button>
  <button type="reset">Reset</button>
</form>`,
    },
    {
      id: 'external-form',
      title: 'Input owned by another form',
      render: ({ ctx }) => <InputFormExample id={ctx.id} external />,
      code: `<>
  <label htmlFor="workspace">Workspace name</label>
  <Input id="workspace" name="workspace" form="settings" defaultValue="Folio" clearable required />
  <form id="settings">
    <button type="submit">Submit</button>
    <button type="reset">Reset</button>
  </form>
</>`,
    },
  ],
});
