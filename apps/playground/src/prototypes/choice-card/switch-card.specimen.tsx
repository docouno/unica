import { defineSpecimen } from '../../workbench/types.js';
import {
  Anatomy,
  SharedAnatomy,
  Availability,
  Interaction,
  Overflow,
  Overlay,
  Sizes,
  SwitchPending,
  SwitchRequest,
} from './choice-card.examples.js';

export default defineSpecimen({
  id: 'switch-card',
  title: 'SwitchCard',
  group: 'Forms',
  summary:
    'Immediate settings with stable labels. Trailing switches, pending committed values, and local success or failure feedback.',
  sections: [
    {
      id: 'sizes',
      title: 'Three densities · one material',
      kind: 'matrix',
      caption: 'Live values. No decorative variants; every card keeps a visible non-color marker.',
      render: () => <Sizes kind="switch" />,
    },
    {
      id: 'anatomy',
      title: 'Content, metadata & independent actions',
      kind: 'matrix',
      caption:
        'Live details and terms actions do not change selection. Start/end placement and an explicit custom marker share the same anatomy.',
      render: () => <Anatomy kind="switch" />,
    },
    {
      id: 'states',
      title: 'Pointer & keyboard feedback',
      kind: 'states',
      caption:
        'Appearance pins keep hover, held press, and focus visible for comparison. Inputs remain live; pins never move DOM focus.',
      render: () => <Interaction kind="switch" />,
    },
    {
      id: 'availability',
      title: 'Policy & availability',
      kind: 'states',
      render: () => <Availability kind="switch" />,
    },
    {
      id: 'pending',
      title: 'Pending at every size',
      kind: 'states',
      caption:
        'Pinned pending values. The spinner replaces the thumb glyph; the last committed value stays visible.',
      render: () => <SwitchPending />,
    },
    {
      id: 'request',
      title: 'Apply immediately · success, failure & retry',
      kind: 'context',
      caption:
        'Live local request preview. Succeed and Fail explicitly resolve the pending change.',
      render: () => <SwitchRequest />,
    },
    {
      id: 'overflow',
      title: 'Long content & narrow layouts',
      kind: 'states',
      render: () => <Overflow kind="switch" />,
    },
    {
      id: 'shared',
      title: 'Shared anatomy across families',
      kind: 'context',
      caption:
        'Radio alternatives and immediate settings share title and description metrics at every density.',
      render: () => <SharedAnatomy />,
    },
    {
      id: 'overlay',
      title: 'Choices in a floating surface',
      kind: 'context',
      surface: 'overlay',
      overlayStage: true,
      caption:
        'Static floating plate with live inputs, contextual fills, and no competing card shadow.',
      render: () => <Overlay kind="switch" />,
    },
  ],
});
