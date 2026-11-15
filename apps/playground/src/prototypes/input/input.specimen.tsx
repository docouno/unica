import { defineSpecimen } from '../../workbench/types.js';
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

export default defineSpecimen({
  id: 'input',
  title: 'Input & FormField',
  group: 'Forms',
  summary:
    'Quiet form fields and inline editing, with stable slots, clear feedback, and native text interaction.',
  sections: [
    {
      id: 'roles',
      title: 'Field roles & sizes',
      kind: 'matrix',
      caption:
        'Default defines a form slot. Ghost marks inline editing with a quiet baseline and transparent fill.',
      render: () => <InputRoles />,
    },
    {
      id: 'anatomy',
      title: 'Anatomy & slot priority',
      kind: 'matrix',
      caption:
        'Icon, prefix, value, suffix, Clear, status, spinner. Decorative trailing icons yield to feedback.',
      render: () => <InputAnatomy />,
    },
    {
      id: 'interaction',
      title: 'Hover, focus & clear action',
      kind: 'states',
      caption:
        'Compare pointer and keyboard focus, then try both live. End-slot examples compare icons and clear targets.',
      render: () => <InputInteraction />,
    },
    {
      id: 'feedback',
      title: 'Validation & information',
      kind: 'states',
      caption:
        'Feedback uses an edge, a glyph, and readable copy. Keyboard focus preserves the status hue; pointer focus stays quiet.',
      render: () => <InputFeedback />,
    },
    {
      id: 'availability',
      title: 'Availability & overlapping states',
      kind: 'states',
      caption:
        'Read-only preserves reading and selection. Disabled removes actions. Loading indicates work without forcing read-only.',
      render: () => <InputAvailability />,
    },
    {
      id: 'live',
      title: 'Live editing & feedback transitions',
      kind: 'context',
      caption:
        'An explicit response harness demonstrates checking, success, error, correction, and clearing.',
      render: () => <InputLive />,
    },
    {
      id: 'overflow',
      title: 'Long content, naming & direction',
      kind: 'states',
      caption:
        'Inspect at 360px and 120% text, then switch RTL. Text, affixes, labels, and messages have different overflow behavior.',
      render: () => <InputOverflow />,
    },
    {
      id: 'surfaces',
      title: 'Base & overlay materials',
      kind: 'context',
      caption:
        'The same fields on two real surfaces. These material plates are static, not open dialogs or popovers.',
      render: () => <InputSurfaces />,
    },
  ],
});
