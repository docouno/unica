import { PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { defineComponent } from '../../workbench/types.js';
import { Button, IconButton } from '../../prototypes/button/button.proto.js';
import {
  LightExample,
  ForwardArrowIcon,
  RoleExamples,
  SizeExamples,
  StateExamples,
  ToggleExamples,
  OpenTriggerExample,
  OverflowExamples,
} from '../../prototypes/button/button.examples.js';

export default defineComponent({
  id: 'button',
  title: 'Button & IconButton',
  category: 'Actions',
  status: 'Proto',
  summary: 'Action roles, tones, sizes, slots, and interaction states.',
  props: {
    variant: {
      kind: 'enum',
      group: 'Role',
      description: 'The action’s visual priority.',
      default: 'primary',
      choices: [{ value: 'primary' }, { value: 'secondary' }, { value: 'ghost' }],
    },
    tone: {
      kind: 'enum',
      group: 'Role',
      description: 'The semantic tone of the action.',
      default: 'accent',
      choices: [{ value: 'accent' }, { value: 'neutral' }, { value: 'danger' }],
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
      description: 'Compare the label, icon slots, and square IconButton.',
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
      label: 'Label',
      description: 'Visible text or the accessible name of an IconButton.',
      default: 'Create',
    },
    loading: {
      kind: 'boolean',
      group: 'Availability',
      description: 'Show the pending state and suppress activation.',
      default: false,
    },
    disabled: {
      kind: 'boolean',
      group: 'Availability',
      description: 'Make the control unavailable using the native disabled state.',
      default: false,
    },
    onClick: {
      kind: 'action',
      group: 'Interaction',
      description: 'Records an activation from the rendered button.',
      code: 'handleActivation',
    },
  },
  constraints: [
    {
      kind: 'ignored',
      when: { content: 'icon' },
      affects: ['width'],
      reason: 'IconButton is square at each size, so Width has no effect.',
    },
    {
      kind: 'ignored',
      when: { disabled: true },
      affects: [{ key: 'loading', value: true }],
      reason: 'A disabled button suppresses the loading indicator.',
    },
  ],
  render: ({ ctx, values }) => {
    const { variant, tone, size, width, content, label, disabled, loading } = values;
    const leading = content === 'leading' || content === 'both';
    const trailing = content === 'trailing' || content === 'both';
    const icon = tone === 'danger' ? TrashIcon : PlusIcon;
    const accessibleName = label.trim() ? label : 'Create';
    const record = ctx.action('onClick');
    const shared = {
      ...ctx.subject,
      variant,
      tone,
      size,
      disabled,
      loading,
      onClick: () => record(accessibleName),
    };
    if (content === 'icon') {
      return <IconButton {...shared} icon={icon} aria-label={accessibleName} />;
    }
    return (
      <Button
        {...shared}
        width={width}
        aria-label={label.trim() ? undefined : accessibleName}
        {...(leading ? { iconLeft: icon } : {})}
        {...(trailing ? { iconRight: ForwardArrowIcon } : {})}
      >
        {label}
      </Button>
    );
  },
  code: ({ variant, tone, size, width, content, label, disabled, loading }) => {
    const iconOnly = content === 'icon';
    const icon = tone === 'danger' ? 'TrashIcon' : 'PlusIcon';
    const attributes = [
      variant !== (iconOnly ? 'secondary' : 'primary') ? `variant="${variant}"` : '',
      tone !== (iconOnly ? 'neutral' : 'accent') ? `tone="${tone}"` : '',
      size !== 'm' ? `size="${size}"` : '',
      !iconOnly && width !== 'auto' ? `width="${width}"` : '',
      disabled ? 'disabled' : '',
      loading ? 'loading' : '',
      content === 'leading' || content === 'both' ? `iconLeft={${icon}}` : '',
      content === 'trailing' || content === 'both' ? 'iconRight={ForwardArrowIcon}' : '',
      iconOnly ? `icon={${icon}}` : '',
      iconOnly || !label.trim()
        ? `aria-label={${JSON.stringify(label.trim() ? label : 'Create')}}`
        : '',
      'onClick={handleActivation}',
    ]
      .filter(Boolean)
      .join(' ');
    if (iconOnly) {
      return `<IconButton ${attributes} />`;
    }
    const children = label === 'Create' ? label : `{${JSON.stringify(label)}}`;
    return `<Button ${attributes}>${children}</Button>`;
  },
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
      caption: 'Live pointer approach, hover, held press, focus, pending, and unavailable states.',
      kind: 'behavior',
      mode: 'live',
      render: () => <LightExample />,
    },
    {
      id: 'states',
      title: 'Accent · interaction & availability',
      kind: 'behavior',
      mode: 'pinned',
      render: () => <StateExamples />,
    },
    {
      id: 'states-neutral',
      title: 'Neutral · interaction & availability',
      kind: 'behavior',
      mode: 'pinned',
      render: () => <StateExamples tone="neutral" />,
    },
    {
      id: 'states-danger',
      title: 'Danger · interaction & availability',
      kind: 'behavior',
      mode: 'pinned',
      render: () => <StateExamples tone="danger" />,
    },
    {
      id: 'toggles',
      title: 'Selected commands',
      caption: 'Inspect each tone and size, including combined selection and availability states.',
      kind: 'behavior',
      mode: 'live',
      render: () => <ToggleExamples />,
    },
    {
      id: 'open',
      title: 'Open trigger states',
      caption:
        'Pinned aria-expanded states only. Panels and their behavior belong to the consuming component.',
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
      code: '<Button variant="ghost" tone="neutral">Cancel</Button>\n<Button>Save changes</Button>',
      render: () => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <Button variant="ghost" tone="neutral">
            Cancel
          </Button>
          <Button>Save changes</Button>
        </div>
      ),
    },
  ],
});
