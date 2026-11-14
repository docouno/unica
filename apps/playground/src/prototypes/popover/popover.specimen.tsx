import { defineSpecimen } from '../../workbench/types.js';
import {
  EditorExample,
  PlacementExamples,
  SizeExamples,
  StateExamples,
} from './popover.examples.js';

export default defineSpecimen({
  id: 'popover',
  title: 'Popover',
  group: 'Overlays',
  summary:
    'A quiet surface close to its source. Three sizes, one silhouette, six material presets.',
  defaultSurface: 'overlay',
  sections: [
    {
      id: 'sizes',
      title: 'One silhouette · Three sizes',
      kind: 'matrix',
      caption:
        '18 / 22 / 28rem width ceilings. Shared surface-s radius. Close and reopen each panel.',
      overlayStage: true,
      render: () => <SizeExamples />,
    },
    {
      id: 'placements',
      title: 'A clear connection',
      kind: 'matrix',
      caption:
        'Explore all 12 logical placements and RTL. In-flow visual study; collision handling belongs to the library implementation.',
      overlayStage: true,
      render: () => <PlacementExamples />,
    },
    {
      id: 'states',
      title: 'Controls belong to the surface',
      kind: 'states',
      caption:
        'Native field and button stand-ins. Try hover, keyboard focus, editing, and closing. Full overlay behavior ships in Wave 2.',
      overlayStage: true,
      render: () => <StateExamples />,
    },
    {
      id: 'editor',
      title: 'Folio · A link in context',
      kind: 'context',
      caption:
        'Rich editor vignette with a 760px prose column. Edit and save a link; native controls stand in for upcoming families.',
      overlayStage: true,
      render: () => <EditorExample />,
    },
  ],
});
