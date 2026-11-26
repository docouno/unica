import { choice, eventProp, toggle } from '../control-props.js';

export const menuProps = {
  size: choice('Geometry', 'Sets row density throughout the menu.', ['s', 'm', 'l'], 'm'),
  align: choice('Geometry', 'Aligns MenuContent to the button.', ['start', 'end'], 'start'),
  open: {
    kind: 'enum',
    group: 'Interaction',
    publicType: 'boolean',
    description: 'Control visibility in the single-theme Playground.',
    default: 'omitted',
    choices: [
      { value: 'omitted', label: 'Uncontrolled', omit: true },
      { value: 'true', label: 'True' },
      { value: 'false', label: 'False' },
    ],
  },
  defaultOpen: toggle('Interaction', 'Begin open in the single-theme Playground.'),
  onOpenChange: eventProp(
    'Report opening proposals, closing proposals and completed native dismissals.',
    '(open) => console.log(open)',
    '(open: boolean) => void',
  ),
} as const;

export const openConstraints = (['true', 'false'] as const).map((value) => ({
  kind: 'precedence' as const,
  when: { open: value },
  affects: [{ key: 'defaultOpen', value: true }],
  reason: 'The controlled value takes precedence over the initial value.',
}));
