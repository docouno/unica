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
import { previewProps, previewText } from '../preview-code.js';
import { WorkspaceForm } from './workspace-form.js';
import workspaceSource from './workspace-form.tsx?raw';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { defineComponent } from '../../workbench/types.js';
import {
  InputAnatomy,
  InputAvailability,
  InputFeedback,
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
      'Role',
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
        'Interaction',
        'Uncontrolled reset restores the initial text. Controlled reset keeps the latest text committed by this React owner.',
        ['uncontrolled', 'controlled'],
        'uncontrolled',
      ),
      demo: true,
    },
    defaultValue: stringProp(
      'Interaction',
      'Initial and reset value in uncontrolled mode.',
      'Folio',
    ),
    value: stringProp(
      'Interaction',
      'Initial text of the controlled example. Editing commits a new value to its React owner.',
      'Folio',
    ),
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
      publicType: 'GlyphSource',
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
      publicType: 'GlyphSource',
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
    onChange: eventProp(
      'Receives the native edit event, including Clear. The log displays the resulting text.',
      '(event) => console.log(event.currentTarget.value)',
      'ChangeEventHandler<HTMLInputElement>',
    ),
    onClear: eventProp(
      'Runs without arguments after Clear reports the empty value.',
      "() => console.log('onClear')",
      '() => void',
    ),
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
  render: withOverlaySurface(function InputSubject({ values, ctx }) {
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
            <bdi>{description}</bdi>
          </Text>
        )}
      </div>
    );
  }, 'border-box'),
  code: ({ valueMode, value, defaultValue, description, id, iconLeft, iconRight, ...props }) => {
    const suffix = id.trim().replace(/\s+/g, '-');
    const idLine = suffix
      ? `const uid = useId();\n  const id = uid + ${JSON.stringify('-' + suffix)};`
      : 'const id = useId();';
    const hintAttribute = description ? ' aria-describedby={id + "-hint"}' : '';
    const controlled = valueMode === 'controlled';
    const valueAttribute = controlled
      ? ' value={text}'
      : ` defaultValue=${previewText(defaultValue)}`;
    const glyphs = [
      iconLeft === 'email' && 'EnvelopeSimpleIcon',
      iconRight === 'link' && 'ArrowUpRightIcon',
    ].filter(Boolean);
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
    const hint = description
      ? `\n      <Text as="p" id={id + '-hint'} size="caption-l" color="muted"><bdi>${previewText(description)}</bdi></Text>`
      : '';
    const change = controlled
      ? '(event) => { setText(event.currentTarget.value); console.log(event.currentTarget.value); }'
      : '(event) => console.log(event.currentTarget.value)';
    return `import { useId${controlled ? ', useState' : ''} } from 'react';
import { Input, Stack${description ? ', Text' : ''} } from '@docouno/unica';${glyphs.length ? '\nimport { ' + glyphs.join(', ') + " } from '@phosphor-icons/react';" : ''}
import '@docouno/unica/styles.css';

export function WorkspaceInput() {
  ${idLine}${controlled ? `\n  const [text, setText] = useState(${JSON.stringify(value)});` : ''}
  return (
    <Stack gap={8}>
      <label htmlFor={id}>Workspace name</label>
      <Input id={id}${hintAttribute}${valueAttribute}${icons}${attributes} onChange={${change}}${props.clearable ? " onClear={() => console.log('onClear')}" : ''} />${hint}
    </Stack>
  );
}`;
  },
  states: [
    {
      id: 'roles',
      rows: 'size',
      cols: 'variant',
      title: 'Role and control size',
      caption: 'Compare the bordered form field and inline editor across all three densities.',
    },
    {
      id: 'availability',
      rows: 'status',
      cols: 'disabled',
      title: 'Validation and disabled state',
      fixed: { loading: true, clearable: true },
      caption:
        'The enabled field keeps its status, spinner, and unavailable Clear target during a check. Disabled fields suppress feedback and clearing.',
    },
    {
      id: 'editing',
      rows: 'readOnly',
      cols: 'loading',
      title: 'Editing and pending work',
      fixed: { status: 'warning', clearable: true },
      caption: 'Compare editing and copying while a warning or pending check is present.',
    },
  ],
  cases: [
    {
      id: 'hosts',
      title: 'Form field and inline property',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'Edit a named collection in its form field, then add a reference directly in the property row. The empty inline editor keeps its external label.',
      render: withOverlaySurface(InputRoles, 'border-box'),
    },
    {
      id: 'anatomy',
      title: 'Adornment and feedback priority',
      kind: 'content',
      mode: 'pinned',
      caption:
        'Compare logical icons, visible prefixes and suffixes, and Clear. A status glyph and pending check take priority over a trailing decorative icon.',
      render: withOverlaySurface(InputAnatomy, 'border-box'),
    },
    {
      id: 'interaction',
      title: 'Pointer, keyboard and Clear',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Click to edit or Tab for the keyboard outline. Activate Clear with Enter or Space to resume typing in the same field. Compare its target with the trailing icon at each size.',
      render: withOverlaySurface(InputInteraction, 'border-box'),
    },
    {
      id: 'feedback',
      title: 'Validation and information',
      kind: 'behavior',
      mode: 'pinned',
      caption:
        'Compare four feedback tones under both roles. Each field owns its status icon and points to the matching explanation.',
      render: withOverlaySurface(InputFeedback, 'border-box'),
    },
    {
      id: 'availability',
      title: 'Editable, read-only, disabled and checking',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Try editing, selecting text, and clearing the values. Compare populated and empty fields, including a disabled inline editor and a read-only field with a pending check.',
      render: withOverlaySurface(InputAvailability, 'border-box'),
    },
    {
      id: 'live',
      title: 'Check and correct an address',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      actions: [
        { id: 'check', label: 'Start check' },
        { id: 'available', label: 'Mark available' },
        { id: 'taken', label: 'Mark taken' },
      ],
      caption:
        'Enter an address and start a simulated check. Choose a result while checking. A later edit or Clear discards that result.',
      render: withOverlaySurface(InputLive, 'border-box'),
    },
    {
      id: 'overflow',
      title: 'Long values, affixes and direction',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'Move the caret through the full value while the decorative affixes yield space. The URL keeps its writing direction in either layout.',
      render: withOverlaySurface(InputOverflow, 'border-box'),
    },
    {
      id: 'surfaces',
      title: 'Field roles on base and overlay',
      kind: 'surface',
      mode: 'pinned',
      compareSurfaces: true,
      caption:
        'Compare filled and empty form fields and inline editors on each material. The last address pins a validation error.',
      render: InputSurfaces,
    },
  ],
  compositions: [
    {
      id: 'native-form',
      title: 'Native label, submit and reset',
      mode: 'live',
      reset: true,
      caption:
        'Submit the field to inspect the current name. Reset restores Folio; the next submission reads the restored value.',
      render: withOverlaySurface(
        ({ ctx }) => <WorkspaceForm subject={ctx.subject} />,
        'border-box',
      ),
      code: workspaceSource,
    },
    {
      id: 'external-form',
      title: 'Input owned by another form',
      mode: 'live',
      reset: true,
      caption:
        'This input sits outside its form. Its explicit form association still submits the edited name and restores Folio on reset.',
      render: withOverlaySurface(
        ({ ctx }) => <WorkspaceForm external subject={ctx.subject} />,
        'border-box',
      ),
      code: workspaceSource.replace('external = false', 'external = true'),
    },
  ],
});
