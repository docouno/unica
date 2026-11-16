import { defineSpecimen } from '../../workbench/types.js';
import {
  Anatomy,
  Availability,
  Feedback,
  Groups,
  Layouts,
  LiveValidation,
  Overflow,
  Overlay,
} from './form-field.examples.js';

export default defineSpecimen({
  id: 'form-field',
  title: 'FormField',
  group: 'Forms',
  summary: 'Clear labels, persistent instructions, and considered feedback for fields and groups.',
  sections: [
    {
      id: 'layout',
      title: 'Vertical, horizontal & sizes',
      kind: 'matrix',
      render: () => <Layouts />,
    },
    {
      id: 'anatomy',
      title: 'Labels, actions & supporting content',
      kind: 'matrix',
      render: () => <Anatomy />,
    },
    {
      id: 'feedback',
      title: 'Status & message ownership',
      kind: 'states',
      render: () => <Feedback />,
    },
    {
      id: 'groups',
      title: 'Binary groups & choice cards',
      kind: 'matrix',
      render: () => <Groups />,
    },
    {
      id: 'availability',
      title: 'Availability & focus',
      kind: 'states',
      render: () => <Availability />,
    },
    {
      id: 'live',
      title: 'Validation, correction & reset',
      kind: 'context',
      render: () => <LiveValidation />,
    },
    {
      id: 'overflow',
      title: 'Long content, composite fields & RTL',
      kind: 'states',
      render: () => <Overflow />,
    },
    {
      id: 'overlay',
      title: 'Inside a floating surface',
      kind: 'context',
      surface: 'overlay',
      overlayStage: true,
      render: () => <Overlay />,
    },
  ],
});
