import { defineSpecimen } from '../../workbench/types.js';

const {
  HoverContentStates,
  HoverContextExamples,
  HoverEntityExamples,
  HoverIdentityExamples,
  HoverLiveExamples,
  HoverOverflowExamples,
} = await import('./hover-card.examples.js');

export default defineSpecimen({
  id: 'hover-card',
  title: 'HoverCard',
  group: 'Overlays',
  summary:
    'A read-only glimpse behind a real link. Identity, context and metadata without a detour.',
  defaultSurface: 'overlay',
  sections: [
    {
      id: 'identity',
      title: 'People & teams',
      kind: 'matrix',
      caption:
        'Pinned in flow. 22rem ceiling, 16px insets, 12px rhythm. Identity first, one short summary, optional metadata.',
      overlayStage: true,
      render: () => <HoverIdentityExamples />,
    },
    {
      id: 'entities',
      title: 'Documents · Issues · Commits',
      kind: 'matrix',
      caption:
        'Content owns the anatomy. Classification uses passive badges; removable Tags would introduce actions.',
      overlayStage: true,
      render: () => <HoverEntityExamples />,
    },
    {
      id: 'interaction',
      title: 'Preview intent & placement',
      kind: 'states',
      caption:
        'Live native top layer. First hover 600ms; focus opens immediately. Move onto the card, select text, press Escape or follow the link.',
      overlayStage: true,
      render: () => <HoverLiveExamples />,
    },
    {
      id: 'content',
      title: 'Loading · Missing · Restricted',
      kind: 'states',
      caption:
        'Controlled content previews. The link stays available. No retry button or error-colored surface inside a hover preview.',
      overlayStage: true,
      render: () => <HoverContentStates />,
    },
    {
      id: 'overflow',
      title: 'Long content · Limited space',
      kind: 'states',
      caption:
        'Titles and metadata wrap. Normal cards need no scroll; the final example pins a 200px height limit. Full details remain at the link destination.',
      overlayStage: true,
      render: () => <HoverOverflowExamples />,
    },
    {
      id: 'context',
      title: 'A little context before navigating',
      kind: 'context',
      caption:
        'Pinned relationship to a normal inline link. No focus ring at rest, no nested card or competing elevation.',
      overlayStage: true,
      render: () => <HoverContextExamples />,
    },
  ],
});
