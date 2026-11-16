import { defineSpecimen } from '../../workbench/types.js';
import {
  NumberAnatomy,
  NumberAvailability,
  NumberBounds,
  NumberFeedback,
  NumberInteraction,
  NumberLive,
  NumberOverflow,
  NumberRoles,
  NumberSurfaces,
} from './number-input.examples.js';

export default defineSpecimen({
  id: 'number-input',
  title: 'NumberInput',
  group: 'Forms',
  summary:
    'A centered quantity between full-height decrease and increase actions. Keep the entered number and explain corrections clearly.',
  sections: [
    {
      id: 'roles',
      title: 'Field roles & sizes',
      kind: 'matrix',
      caption:
        'S / M / L match Input. Ghost keeps a quiet baseline; both actions remain visible at rest.',
      render: () => <NumberRoles />,
    },
    {
      id: 'anatomy',
      title: 'Units, slots & shared rhythm',
      kind: 'matrix',
      caption:
        'Decrease, centered prefix/value/unit, feedback, increase. Symmetric feedback clearance keeps the amount centered.',
      render: () => <NumberAnatomy />,
    },
    {
      id: 'interaction',
      title: 'Hover, press & focus',
      kind: 'states',
      caption:
        'Comparisons pin appearance without moving DOM focus. The final example is live. Press changes only the active segment.',
      render: () => <NumberInteraction />,
    },
    {
      id: 'feedback',
      title: 'Status & validation',
      kind: 'states',
      caption:
        'An edge, one distinct glyph, and readable feedback. Actions remain neutral when the value needs correction.',
      render: () => <NumberFeedback />,
    },
    {
      id: 'availability',
      title: 'Reading, availability & checking',
      kind: 'states',
      caption:
        'Read-only preserves selection. Disabled suppresses feedback. Loading leaves editing available unless read-only is explicit.',
      render: () => <NumberAvailability />,
    },
    {
      id: 'bounds',
      title: 'Limits, empty values & decimal steps',
      kind: 'states',
      caption:
        'Live cases. Blur or Enter checks the draft without replacing it. Outward actions stop; the opposite direction offers a correction.',
      render: () => <NumberBounds />,
    },
    {
      id: 'live',
      title: 'Checking, correction & inline properties',
      kind: 'context',
      caption:
        'An explicit response harness and a small property inspector demonstrate state changes without copying an application screen.',
      render: () => <NumberLive />,
    },
    {
      id: 'overflow',
      title: 'Content, width & direction',
      kind: 'states',
      caption:
        'Inspect at 360px, 120% text, and RTL. Labels wrap, numbers keep a native editing viewport, short units stay outside the value.',
      render: () => <NumberOverflow />,
    },
    {
      id: 'surfaces',
      title: 'Base & overlay materials',
      kind: 'context',
      caption:
        'Identical controls on actual material plates. The overlay is static; it does not simulate popover behavior.',
      render: () => <NumberSurfaces />,
    },
  ],
});
