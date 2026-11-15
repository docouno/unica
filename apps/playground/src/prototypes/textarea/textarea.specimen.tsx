import { defineSpecimen } from '../../workbench/types.js';
import type { ReactElement } from 'react';
import type { TextareaExampleName } from './textarea.examples.js';

const { TextareaExamples } = await import('./textarea.examples.js');

function preview(section: TextareaExampleName): ReactElement {
  return <TextareaExamples section={section} />;
}

export default defineSpecimen({
  id: 'textarea',
  title: 'Textarea',
  group: 'Forms',
  summary:
    'Room for a thought: quiet multiline fields, stable feedback, and deliberate control over height.',
  sections: [
    {
      id: 'roles',
      title: 'Roles & sizes',
      kind: 'matrix',
      caption:
        'Default defines a form slot. Ghost keeps inline prose light, with a quiet baseline. S, M, and L share Input geometry.',
      render: () => preview('roles'),
    },
    {
      id: 'interaction',
      title: 'Hover & focus',
      kind: 'states',
      caption:
        'Pinned comparisons: quiet pointer editing and a full keyboard contour, with no movement or change in wrapping.',
      render: () => preview('interaction'),
    },
    {
      id: 'feedback',
      title: 'Status & protected gutter',
      kind: 'states',
      caption:
        'One glyph at the first line, before the native scrollbar. Its space stays reserved even without a status.',
      render: () => preview('feedback'),
    },
    {
      id: 'availability',
      title: 'Reading & availability',
      kind: 'states',
      caption:
        'Read-only keeps full contrast, selection, and scrolling. Disabled suppresses editing cues, status, and resizing.',
      render: () => preview('availability'),
    },
    {
      id: 'height',
      title: 'Manual, fixed & growing height',
      kind: 'matrix',
      caption:
        'One height owner: manual resizing or content growth. At the cap, the native text viewport scrolls.',
      render: () => preview('height'),
    },
    {
      id: 'footer',
      title: 'Labels, guidance & counters',
      kind: 'matrix',
      caption:
        'Guidance spans the width. Feedback and counter share the footer, wrapping cleanly in narrow spaces.',
      render: () => preview('footer'),
    },
    {
      id: 'live',
      title: 'Live length & feedback transitions',
      kind: 'context',
      caption:
        'Type, paste, check, and correct. This local demonstration preserves the draft and keeps the status gutter stable.',
      render: () => preview('live'),
    },
    {
      id: 'overflow',
      title: 'Long content & direction',
      kind: 'states',
      caption:
        'Try 360px, 120% text, and RTL. Long prose wraps; explicit log lines keep their horizontal viewport.',
      render: () => preview('overflow'),
    },
    {
      id: 'surfaces',
      title: 'Base & overlay materials',
      kind: 'context',
      caption:
        'The same fields on real material plates. These are static surface comparisons, not open dialogs.',
      render: () => preview('surfaces'),
    },
  ],
});
