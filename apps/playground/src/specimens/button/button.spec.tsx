import { Button, IconButton } from '@docouno/unica';
import { PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import type { MouseEvent, ReactElement } from 'react';
import { defineComponent } from '../../workbench/types.js';
import type { ComponentValues, PreviewContext, PropSchema } from '../../workbench/types.js';
import { previewText } from '../preview-code.js';
import {
  FormExample,
  ForwardArrowIcon,
  LightExample,
  OpenTriggerExample,
  OverflowExamples,
  RoleExamples,
  SizeExamples,
  StateExamples,
  ToggleExamples,
  workspaceDestination,
} from './button.examples.js';

const props = {
  variant: {
    kind: 'enum',
    group: 'Role',
    description: 'Auto uses primary for Button and secondary for IconButton.',
    default: 'auto',
    choices: [
      { value: 'auto', label: 'Auto' },
      { value: 'primary' },
      { value: 'secondary' },
      { value: 'ghost' },
    ],
  },
  tone: {
    kind: 'enum',
    group: 'Role',
    description: 'Auto selects accent for primary and neutral for secondary and ghost.',
    default: 'auto',
    choices: [
      { value: 'auto', label: 'Auto' },
      { value: 'accent' },
      { value: 'neutral' },
      { value: 'danger' },
    ],
  },
  size: {
    kind: 'enum',
    group: 'Geometry',
    description: 'The control and icon scale.',
    default: 'm',
    choices: [{ value: 's' }, { value: 'm' }, { value: 'l' }],
  },
  width: {
    kind: 'enum',
    group: 'Geometry',
    description: 'Fit the label or fill the available space.',
    default: 'auto',
    choices: [{ value: 'auto' }, { value: 'full' }],
  },
  content: {
    kind: 'slot',
    group: 'Content',
    demo: true,
    description: 'Select Button slots or use the square IconButton.',
    default: 'text',
    choices: [
      { value: 'text', label: 'Label' },
      { value: 'leading', label: 'Leading icon' },
      { value: 'trailing', label: 'Trailing icon' },
      { value: 'both', label: 'Both icons' },
      { value: 'icon', label: 'Icon only' },
    ],
  },
  label: {
    kind: 'string',
    group: 'Content',
    demo: true,
    label: 'Label',
    description: 'Visible text for Button or the accessible name of IconButton.',
    default: 'Create',
  },
  loading: {
    kind: 'boolean',
    group: 'Availability',
    description: 'Show the pending state and suppress activation while keeping keyboard focus.',
    default: false,
  },
  disabled: {
    kind: 'boolean',
    group: 'Availability',
    description: 'Make the action unavailable and remove it from the tab order.',
    default: false,
  },
  asChild: {
    kind: 'boolean',
    group: 'Host',
    description: 'The child supplies a navigation link. An ordinary click is logged in place.',
    default: false,
  },
  type: {
    kind: 'enum',
    group: 'Host',
    description: 'Auto omits type. A native action defaults to button.',
    default: 'auto',
    choices: [
      { value: 'auto', label: 'Auto' },
      { value: 'button' },
      { value: 'submit' },
      { value: 'reset' },
    ],
  },
  toggle: {
    kind: 'enum',
    group: 'Interaction',
    demo: true,
    description: 'Use pressed for controlled selection or defaultPressed for local selection.',
    default: 'none',
    choices: [
      { value: 'none', label: 'Command' },
      { value: 'controlled', label: 'Controlled toggle' },
      { value: 'uncontrolled', label: 'Uncontrolled toggle' },
    ],
  },
  initiallyPressed: {
    kind: 'boolean',
    group: 'Interaction',
    demo: true,
    label: 'Start selected',
    description: 'Initial selection for the toggle demonstration.',
    default: false,
  },
  'aria-expanded': {
    kind: 'enum',
    group: 'Interaction',
    description: 'Expose the open or closed state of a separately managed panel.',
    default: 'auto',
    choices: [
      { value: 'auto', label: 'Omitted' },
      { value: 'false', label: 'Closed' },
      { value: 'true', label: 'Open' },
    ],
  },
  onClick: {
    kind: 'action',
    group: 'Events',
    description: 'Records an activation from the rendered control.',
    code: 'handleActivation',
  },
  onPressedChange: {
    kind: 'action',
    group: 'Events',
    description: 'Records the proposed selection after an allowed toggle activation.',
    code: 'handlePressedChange',
  },
} as const satisfies PropSchema;

type ButtonValues = ComponentValues<typeof props>;

function labelFor(label: string): string {
  return label.trim() ? label : 'Create';
}

function subjectSlots(values: ButtonValues): { leading: boolean; trailing: boolean } {
  return {
    leading: values.content === 'leading' || values.content === 'both',
    trailing: values.content === 'trailing' || values.content === 'both',
  };
}

function ButtonSubject({
  ctx,
  values,
}: {
  readonly ctx: PreviewContext;
  readonly values: ButtonValues;
}): ReactElement {
  const [isPressed, setPressed] = useState(values.initiallyPressed);
  const { variant, tone, size, width, disabled, loading, content, type, toggle, asChild } = values;
  const { leading, trailing } = subjectSlots(values);
  const label = labelFor(values.label);
  const icon = tone === 'danger' ? TrashIcon : PlusIcon;
  const recordActivation = (): void => ctx.action('onClick')(label);
  const recordNavigation = (event: MouseEvent<HTMLAnchorElement>): void => {
    recordActivation();
    if (
      event.button === 0 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey
    ) {
      event.preventDefault();
    }
  };
  const expanded = values['aria-expanded'];
  const shared = {
    ...ctx.subject,
    ...(variant !== 'auto' && { variant }),
    ...(tone !== 'auto' && { tone }),
    size,
    loading,
    disabled,
    ...(expanded !== 'auto' && { 'aria-expanded': expanded === 'true' }),
  };
  const slots = {
    width,
    ...(leading && { iconLeft: icon }),
    ...(trailing && { iconRight: ForwardArrowIcon }),
  };

  if (asChild) {
    return content === 'icon' ? (
      <IconButton {...shared} asChild icon={icon} aria-label={label} onClick={recordNavigation}>
        <a href={workspaceDestination} />
      </IconButton>
    ) : (
      <Button {...shared} {...slots} asChild onClick={recordNavigation}>
        <a href={workspaceDestination}>{label}</a>
      </Button>
    );
  }

  const onPressedChange = (next: boolean): void => {
    if (toggle === 'controlled') {
      setPressed(next);
    }
    ctx.action('onPressedChange')(next);
  };
  const native = {
    ...shared,
    ...(type !== 'auto' && { type }),
    onClick: recordActivation,
    ...(toggle === 'controlled' && { pressed: isPressed, onPressedChange }),
    ...(toggle === 'uncontrolled' && { defaultPressed: values.initiallyPressed, onPressedChange }),
  };

  return content === 'icon' ? (
    <IconButton {...native} icon={icon} aria-label={label} />
  ) : (
    <Button {...native} {...slots}>
      {label}
    </Button>
  );
}

function buttonCode(values: ButtonValues): string {
  const { variant, tone, size, width, disabled, loading, content, type, toggle, asChild } = values;
  const { leading, trailing } = subjectSlots(values);
  const square = content === 'icon';
  const name = square ? 'IconButton' : 'Button';
  const label = labelFor(values.label);
  const labelContent = label === 'Create' ? label : previewText(label);
  const icon = tone === 'danger' ? 'TrashIcon' : 'PlusIcon';
  const expanded = values['aria-expanded'];
  const attributes = [
    asChild && 'asChild',
    variant !== 'auto' && `variant="${variant}"`,
    tone !== 'auto' && `tone="${tone}"`,
    size !== 'm' && `size="${size}"`,
    !square && width !== 'auto' && `width="${width}"`,
    !asChild && type !== 'auto' && `type="${type}"`,
    disabled && 'disabled',
    loading && 'loading',
    leading && `iconLeft={${icon}}`,
    trailing && 'iconRight={ForwardArrowIcon}',
    square && `icon={${icon}}`,
    square && `aria-label=${previewText(label)}`,
    expanded !== 'auto' && (expanded === 'true' ? 'aria-expanded' : 'aria-expanded={false}'),
    !asChild && toggle === 'controlled' && 'pressed={pressed}',
    !asChild && toggle === 'uncontrolled' && `defaultPressed={${values.initiallyPressed}}`,
    !asChild && toggle !== 'none' && 'onPressedChange={handlePressedChange}',
    'onClick={handleActivation}',
  ]
    .filter(Boolean)
    .join(' ');
  const opening = `<${name} ${attributes}`;
  if (asChild) {
    const anchor = `<a href="${workspaceDestination}"`;
    return `${opening}>
  ${square ? `${anchor} />` : `${anchor}>${labelContent}</a>`}
</${name}>`;
  }
  return square ? `${opening} />` : `${opening}>${labelContent}</${name}>`;
}

const stateCaption = 'Hover, hold, or Tab to an action to inspect its live interaction states.';

export default defineComponent({
  id: 'button',
  title: 'Button & IconButton',
  category: 'Actions',
  status: 'UI',
  summary: 'Action roles, tones, sizes, slots, and interaction states.',
  form: 'owned',
  props,
  constraints: [
    {
      kind: 'forbidden',
      when: { asChild: true },
      affects: [
        { key: 'type', value: 'button' },
        { key: 'type', value: 'submit' },
        { key: 'type', value: 'reset' },
        { key: 'toggle', value: 'controlled' },
        { key: 'toggle', value: 'uncontrolled' },
      ],
      reason: 'An anchor navigates. Use the native button host for form actions and toggles.',
    },
    {
      kind: 'ignored',
      when: { content: 'icon' },
      affects: ['width'],
      reason: 'IconButton is square at each size, so Width has no effect.',
    },
    {
      kind: 'ignored',
      when: { toggle: 'none' },
      affects: [{ key: 'initiallyPressed', value: true }],
      reason: 'Only a toggle carries a selected state.',
    },
    {
      kind: 'precedence',
      when: { disabled: true },
      affects: [{ key: 'loading', value: true }],
      reason: 'A disabled action keeps its label or icon and suppresses the loading indicator.',
    },
  ],
  render: ({ ctx, values }) => (
    <form {...ctx.form} className="button-study-form">
      {(values.type === 'submit' || values.type === 'reset') && (
        <label className="button-study-field">
          Draft title
          <input name="title" defaultValue="Untitled" required />
        </label>
      )}
      <ButtonSubject
        key={`${values.toggle}/${values.initiallyPressed}`}
        ctx={ctx}
        values={values}
      />
    </form>
  ),
  code: buttonCode,
  matrixViews: [
    {
      id: 'roles',
      title: 'Role × tone',
      rows: 'variant',
      cols: 'tone',
      reference: () => <RoleExamples />,
    },
    {
      id: 'sizes',
      title: 'Sizes, slots & squares',
      rows: 'size',
      cols: 'content',
      reference: () => <SizeExamples />,
    },
  ],
  cases: [
    {
      id: 'light',
      title: 'Light & response',
      caption:
        'Approach the edge of the primary accent action. Cross the edge to hover, hold a press, or focus with Tab.',
      kind: 'behavior',
      mode: 'live',
      render: () => <LightExample />,
    },
    {
      id: 'states',
      title: 'Accent · interaction & availability',
      caption: stateCaption,
      kind: 'behavior',
      mode: 'live',
      render: () => <StateExamples />,
    },
    {
      id: 'states-neutral',
      title: 'Neutral · interaction & availability',
      caption: stateCaption,
      kind: 'behavior',
      mode: 'live',
      render: () => <StateExamples tone="neutral" />,
    },
    {
      id: 'states-danger',
      title: 'Danger · interaction & availability',
      caption: stateCaption,
      kind: 'behavior',
      mode: 'live',
      render: () => <StateExamples tone="danger" />,
    },
    {
      id: 'toggles',
      title: 'Selected commands',
      caption:
        'Toggle Bold, Pin, or Mute alerts. The samples below hold selection and availability constant for comparison.',
      kind: 'behavior',
      mode: 'live',
      render: () => <ToggleExamples />,
    },
    {
      id: 'open',
      title: 'Open trigger states',
      caption:
        'Open and closed states are fixed for comparison. Tab to either trigger to inspect focus.',
      kind: 'behavior',
      mode: 'pinned',
      render: () => <OpenTriggerExample />,
    },
    {
      id: 'overflow',
      title: 'Long labels & stable loading',
      kind: 'content',
      mode: 'live',
      render: () => <OverflowExamples />,
    },
  ],
  usage: [
    {
      id: 'actions',
      title: 'Confirm or cancel',
      code: `<>
  <Button variant="ghost">Cancel</Button>
  <Button>Save changes</Button>
</>`,
      render: () => (
        <div className="button-study-row">
          <Button variant="ghost">Cancel</Button>
          <Button>Save changes</Button>
        </div>
      ),
    },
    {
      id: 'form',
      title: 'Submit or reset a form',
      mode: 'live',
      code: `<form onSubmit={handleSubmit} onReset={handleReset}>
  <label>
    Draft title
    <input name="title" defaultValue="Untitled" required />
  </label>
  <Button type="reset" variant="ghost">Reset</Button>
  <Button type="submit" name="intent" value="save">Save draft</Button>
</form>`,
      render: () => <FormExample />,
    },
    {
      id: 'navigation',
      title: 'Navigate to a destination',
      mode: 'live',
      code: `<Button asChild>
  <a href="${workspaceDestination}">Open workspace</a>
</Button>`,
      render: () => (
        <Button asChild>
          <a href={workspaceDestination}>Open workspace</a>
        </Button>
      ),
    },
  ],
});
