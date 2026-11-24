import { BellIcon } from '@phosphor-icons/react';
import { defineComponent } from '../../workbench/types.js';
import { size, disabled, readOnly, loading, toggle, eventProp } from '../control-props.js';
import { previewProps, previewText } from '../preview-code.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import {
  Sizes,
  Interaction,
  Availability,
  FeedbackSizes,
  AsyncSetting,
  Overflow,
  Surfaces,
  MeasuredSwitch,
} from './switch.examples.js';
import { NotificationPreferences } from './notification-preferences.js';
import preferencesSource from './notification-preferences.tsx?raw';

export default defineComponent({
  id: 'switch',
  title: 'Switch',
  category: 'Forms',
  status: 'UI',
  summary: 'Immediate settings with a focusable pending state.',
  componentName: 'Switch',
  form: 'owned',
  props: {
    size,
    disabled,
    readOnly,
    loading,
    defaultChecked: toggle(
      'Interaction',
      'This example starts with notifications on. Omit the prop to start off. Reset restores the initial setting.',
      true,
    ),
    thumbIcon: {
      kind: 'slot',
      group: 'Content',
      publicType: 'ReactNode',
      description: 'Optional decorative content in the thumb. This example offers a bell.',
      choices: [
        { value: '', label: 'None' },
        { value: 'bell', label: 'Bell', code: '<BellIcon />' },
      ],
      default: '',
    },
    description: {
      kind: 'string',
      group: 'Content',
      publicType: 'ReactNode',
      description: 'Supporting text associated with the switch.',
      default: '',
    },
    onCheckedChange: eventProp(
      'Reports the proposed on or off value after activation.',
      '(next) => console.log(next)',
      '(next: boolean) => void',
    ),
  },
  constraints: [
    {
      kind: 'ignored',
      when: { disabled: true },
      affects: [{ key: 'loading', value: true }],
      reason: 'The disabled state suppresses the pending indicator.',
    },
    {
      kind: 'precedence',
      when: { disabled: true },
      affects: [
        { key: 'readOnly', value: true },
        { key: 'thumbIcon', value: 'bell' },
      ],
      reason: 'A disabled switch leaves the tab order and hides its thumb icon.',
    },
    {
      kind: 'precedence',
      when: { loading: true, disabled: false },
      affects: [{ key: 'thumbIcon', value: 'bell' }],
      reason: 'A pending indicator fills the thumb icon slot.',
    },
  ],
  render: withOverlaySurface(
    ({ values: { thumbIcon, ...values }, ctx }) => (
      <form {...ctx.form} className="switch-example-form">
        <MeasuredSwitch
          subject={ctx.subject}
          {...values}
          key={String(values.defaultChecked)}
          label="Notifications"
          name="notifications"
          description={values.description || undefined}
          thumbIcon={thumbIcon === 'bell' ? <BellIcon /> : undefined}
          onCheckedChange={ctx.action('onCheckedChange')}
        />
      </form>
    ),
    'border-box',
  ),
  code: ({ description, thumbIcon, ...values }) => {
    const attributes = previewProps(values, {
      size: 'm',
      disabled: false,
      readOnly: false,
      loading: false,
      defaultChecked: false,
    });
    const help = description ? ` description={<bdi>${previewText(description)}</bdi>}` : '';
    const bell = thumbIcon === 'bell';
    return `import { Switch } from '@docouno/unica';
${bell ? "import { BellIcon } from '@phosphor-icons/react';\n" : ''}import '@docouno/unica/styles.css';

export function Notifications() {
  return (
    <form>
      <Switch label="Notifications" name="notifications"${attributes}${help}${bell ? ' thumbIcon={<BellIcon />}' : ''} onCheckedChange={(next) => console.log(next)} />
    </form>
  );
}`;
  },
  states: [
    {
      id: 'sizes',
      rows: 'size',
      cols: 'loading',
      fixed: { defaultChecked: true, thumbIcon: 'bell' },
      title: 'Density and pending feedback',
      caption:
        'The bell follows the thumb across three densities. During a request, a spinner takes its place while the committed setting stays on.',
    },
    {
      id: 'pending',
      rows: 'defaultChecked',
      cols: 'loading',
      title: 'Committed value during a request',
      caption:
        'Compare a setting that starts on or off. An available switch responds immediately. A pending switch keeps its value and remains focusable.',
    },
  ],
  cases: [
    {
      id: 'thumb-sizes',
      title: 'Track, thumb and optional icon',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'Compare an empty thumb, a selected thumb and an optional bell at each density. Each switch can be changed independently.',
      render: withOverlaySurface(Sizes, 'border-box'),
    },
    {
      id: 'interaction',
      title: 'Keyboard and pointer activation',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Tab to a switch and press Space or Enter. Press and hold its label to inspect pointer feedback before release.',
      render: withOverlaySurface(Interaction, 'border-box'),
    },
    {
      id: 'availability',
      title: 'Restricted settings and pending values',
      kind: 'behavior',
      mode: 'pinned',
      caption:
        'Read-only and pending switches keep their value in the tab order. Disabled controls skip focus and suppress pending decoration.',
      render: withOverlaySurface(Availability, 'border-box'),
    },
    {
      id: 'feedback',
      title: 'Pending at every size',
      kind: 'behavior',
      mode: 'pinned',
      caption:
        'The six requests stay pending. Compare thumb position and spinner size while a change from off or on is awaiting confirmation.',
      render: withOverlaySurface(FeedbackSizes, 'border-box'),
    },
    {
      id: 'live',
      title: 'Save, fail and retry',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      controls: { fail: { kind: 'boolean', label: 'Fail the next save', default: false } },
      caption:
        'Toggle notifications to start a save. Select Fail the next save to reject one request, then activate that switch again to retry.',
      render: withOverlaySurface(AsyncSetting, 'border-box'),
    },
    {
      id: 'overflow',
      title: 'Long labels and density',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'Compare the first-line track alignment beside wrapped labels, a long settings key and supporting copy. The standalone switch has an accessible name.',
      render: withOverlaySurface(Overflow, 'border-box'),
    },
    {
      id: 'surfaces',
      title: 'Notifications on base and overlay',
      kind: 'surface',
      mode: 'live',
      reset: true,
      compareSurfaces: true,
      caption: 'Toggle the same settings on either material. Each surface keeps its own values.',
      render: Surfaces,
    },
  ],
  compositions: [
    {
      id: 'group',
      title: 'Notification and reading preferences',
      mode: 'live',
      reset: true,
      caption:
        'Choose any combination of notification channels. The reading preference uses a trailing switch with its own label and help.',
      render: withOverlaySurface(
        ({ ctx }) => <NotificationPreferences subjectProps={ctx.subject} />,
        'border-box',
      ),
      code: preferencesSource,
    },
  ],
});
