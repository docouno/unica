import type { ComponentValues, Constraint } from '../../workbench/types.js';
import { choice, toggle } from '../control-props.js';

export const dialogRootControls = {
  open: {
    ...choice(
      'Interaction',
      'Controlled visibility. Unset uses internal state. True and false keep visibility fixed and report requests in Events.',
      ['unset', 'true', 'false'],
      'unset',
    ),
    demo: true as const,
  },
  defaultOpen: toggle(
    'Interaction',
    'Initially open in uncontrolled mode. Changing this setting starts a new example.',
  ),
};

export const dialogRootConstraints = [
  {
    kind: 'precedence',
    when: { open: 'true' },
    affects: [{ key: 'defaultOpen', value: true }],
    reason: 'The controlled open prop determines visibility.',
  },
  {
    kind: 'precedence',
    when: { open: 'false' },
    affects: [{ key: 'defaultOpen', value: true }],
    reason: 'The controlled open prop determines visibility.',
  },
] as const satisfies readonly Constraint[];

type RootValues = ComponentValues<typeof dialogRootControls>;

export function dialogRootProps(values: RootValues): {
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
} {
  return values.open === 'unset'
    ? { defaultOpen: values.defaultOpen }
    : { open: values.open === 'true' };
}

export function activeDialogControl(dialog: HTMLDialogElement): HTMLElement | null {
  const document = dialog.ownerDocument;
  const element = document.activeElement;
  const view = document.defaultView;
  return view &&
    element instanceof view.HTMLElement &&
    element !== dialog &&
    dialog.contains(element)
    ? element
    : null;
}
