import { defineSpecimen } from '../../workbench/types.js';
import {
  ReadingExamples,
  TypographyExamples,
  StateExamples,
  NavigationExamples,
  WrappingExamples,
  SurfaceExamples,
  LiveExamples,
} from './link.examples.js';

export default defineSpecimen({
  id: 'link',
  title: 'Link',
  group: 'Typography',
  summary: 'Navigation ink, natural text rhythm, and quiet standalone destinations.',
  sections: [
    {
      id: 'reading',
      title: 'Links in the reading flow',
      kind: 'context',
      caption: 'Inherited type, persistent underlines, and meaningful destinations.',
      render: () => <ReadingExamples />,
    },
    {
      id: 'typography',
      title: 'Scale & anatomy',
      kind: 'matrix',
      caption: 'Six explicit text sizes. Inline links inherit size, weight, and italic by default.',
      render: () => <TypographyExamples />,
    },
    {
      id: 'states',
      title: 'Ink & interaction',
      kind: 'states',
      caption:
        'Pinned visual states. Current uses a persistent 2px line; ordinary hover stays 1px.',
      render: () => <StateExamples />,
    },
    {
      id: 'navigation',
      title: 'Standalone navigation',
      kind: 'matrix',
      caption:
        'Underline modes and additive current/focus states. Padding belongs to the navigation layout.',
      render: () => <NavigationExamples />,
    },
    {
      id: 'wrapping',
      title: 'Long text & direction',
      kind: 'states',
      caption:
        'Native inline fragments, long URLs, and an external symbol attached to the final word.',
      render: () => <WrappingExamples />,
    },
    {
      id: 'surfaces',
      title: 'Canvas & surface',
      kind: 'states',
      render: () => <SurfaceExamples />,
    },
    {
      id: 'overlay',
      title: 'Links on a floating surface',
      kind: 'states',
      surface: 'overlay',
      overlayStage: true,
      render: () => <SurfaceExamples overlay />,
    },
    {
      id: 'live',
      title: 'Try native navigation',
      kind: 'context',
      caption:
        'Tab, Enter, context menu, and modified clicks work. Space keeps its native scrolling behavior.',
      render: () => <LiveExamples />,
    },
  ],
});
