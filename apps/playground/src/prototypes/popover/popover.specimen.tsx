import { defineSpecimen } from '../../workbench/types.js';
import {
  ContentExamples,
  FormExamples,
  OverflowExamples,
  SizeExamples,
  StateExamples,
} from './popover.examples.js';
import { PlacementExamples } from './popover.preview.js';

export default defineSpecimen({
  id: 'popover',
  title: 'Popover',
  group: 'Overlays',
  summary: 'Short context, immediate settings and compact forms. One quiet surface, six materials.',
  defaultSurface: 'overlay',
  sections: [
    {
      id: 'sizes',
      title: 'One surface · Three uses',
      kind: 'matrix',
      caption:
        '18 / 22 / 28rem width ceilings. Shared 10px radius, square in Pixel. Native checkboxes are visual stand-ins.',
      overlayStage: true,
      render: () => <SizeExamples />,
    },
    {
      id: 'placements',
      title: 'Anchoring & focus',
      kind: 'matrix',
      caption:
        'Live native popover. Twelve logical placements with a bounded positioning preview; touch avoids an automatic keyboard. No entrance or exit motion.',
      overlayStage: true,
      render: () => <PlacementExamples />,
    },
    {
      id: 'states',
      title: 'Interaction & availability',
      kind: 'states',
      caption:
        'Quiet close, clear keyboard focus. Read-only content stays selectable; unavailable controls explain why.',
      overlayStage: true,
      render: () => <StateExamples />,
    },
    {
      id: 'form',
      title: 'Edit · Save · Recover',
      kind: 'states',
      caption:
        'A local transaction with validation, pending feedback, retry and a saved result. Pinned in flow for comparison.',
      overlayStage: true,
      render: () => <FormExamples />,
    },
    {
      id: 'content',
      title: 'Content arrives in the same surface',
      kind: 'states',
      caption:
        'Ready, loading, empty and load failure. Controlled previews keep the title and exit available.',
      overlayStage: true,
      render: () => <ContentExamples />,
    },
    {
      id: 'overflow',
      title: 'Long text · Limited space',
      kind: 'states',
      caption:
        'Wrapping, a scrollable body and an anchored footer. Inspect at 360px, 120% text and RTL.',
      overlayStage: true,
      render: () => <OverflowExamples />,
    },
  ],
});
