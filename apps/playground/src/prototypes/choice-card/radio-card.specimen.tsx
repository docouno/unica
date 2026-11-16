import { defineSpecimen } from '../../workbench/types.js';
import {
  Anatomy,
  Availability,
  Interaction,
  Overflow,
  Overlay,
  Sizes,
  Validation,
} from './choice-card.examples.js';

export default defineSpecimen({
  id: 'radio-card',
  title: 'RadioCard',
  group: 'Forms',
  summary:
    'One considered choice among alternatives. Circular markers, comparable content, and independent secondary actions.',
  sections: [
    {
      id: 'sizes',
      title: 'Three densities · one material',
      kind: 'matrix',
      caption: 'Live values. No decorative variants; every card keeps a visible non-color marker.',
      render: () => <Sizes kind="radio" />,
    },
    {
      id: 'anatomy',
      title: 'Content, metadata & independent actions',
      kind: 'matrix',
      caption:
        'Live details and terms actions do not change selection. Start/end placement and an explicit custom marker share the same anatomy.',
      render: () => <Anatomy kind="radio" />,
    },
    {
      id: 'states',
      title: 'Pointer & keyboard feedback',
      kind: 'states',
      caption:
        'Appearance pins keep hover, held press, and focus visible for comparison. Inputs remain live; pins never move DOM focus.',
      render: () => <Interaction kind="radio" />,
    },
    {
      id: 'availability',
      title: 'Policy & availability',
      kind: 'states',
      render: () => <Availability kind="radio" />,
    },
    {
      id: 'validation',
      title: 'Validation & state intersections',
      kind: 'states',
      caption:
        'Check an empty selection, then correct it. One message explains the group error; selection stays legible.',
      render: () => <Validation kind="radio" />,
    },
    {
      id: 'overflow',
      title: 'Long content & narrow layouts',
      kind: 'states',
      render: () => <Overflow kind="radio" />,
    },
    {
      id: 'overlay',
      title: 'Choices in a floating surface',
      kind: 'context',
      surface: 'overlay',
      overlayStage: true,
      caption:
        'Static floating plate with live inputs, contextual fills, and no competing card shadow.',
      render: () => <Overlay kind="radio" />,
    },
  ],
});
