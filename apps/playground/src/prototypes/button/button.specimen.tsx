import { defineSpecimen } from '../../workbench/types.js';
import {
  LightExample,
  RoleExamples,
  SizeExamples,
  StateExamples,
  ToggleExamples,
  OpenTriggerExample,
  OverflowExamples,
} from './button.examples.js';

export default defineSpecimen({
  id: 'button',
  title: 'Button & IconButton',
  group: 'Actions',
  summary: 'Action roles, tones, sizes, slots, and interaction states.',
  sections: [
    {
      id: 'light',
      title: 'Light & response',
      kind: 'states',
      caption: 'Live pointer approach, hover, held press, focus, pending, and unavailable states.',
      render: () => <LightExample />,
    },
    { id: 'roles', title: 'Role × tone', kind: 'matrix', render: () => <RoleExamples /> },
    {
      id: 'sizes',
      title: 'Sizes, slots & squares',
      kind: 'matrix',
      render: () => <SizeExamples />,
    },
    {
      id: 'states',
      title: 'Accent · interaction & availability',
      kind: 'states',
      render: () => <StateExamples />,
    },
    {
      id: 'states-neutral',
      title: 'Neutral · interaction & availability',
      kind: 'states',
      render: () => <StateExamples tone="neutral" />,
    },
    {
      id: 'states-danger',
      title: 'Danger · interaction & availability',
      kind: 'states',
      render: () => <StateExamples tone="danger" />,
    },
    {
      id: 'toggles',
      title: 'Selected commands',
      kind: 'states',
      caption: 'Inspect each tone and size, including combined selection and availability states.',
      render: () => <ToggleExamples />,
    },
    {
      id: 'open',
      title: 'Open trigger states',
      kind: 'states',
      caption:
        'Pinned aria-expanded states only. Panels and their behavior belong to the consuming component.',
      render: () => <OpenTriggerExample />,
    },
    {
      id: 'overflow',
      title: 'Long labels & stable loading',
      kind: 'states',
      render: () => <OverflowExamples />,
    },
  ],
});
