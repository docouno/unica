import { defineSpecimen } from '../../workbench/types.js';
import {
  ColorExamples,
  ConnectorExample,
  EditorExample,
  OverlayExamples,
  ShapeExamples,
  SizeExamples,
  TokenExample,
} from './icon.examples.js';

export default defineSpecimen({
  id: 'icon',
  title: 'Icon',
  group: 'Foundations',
  summary:
    'One Phosphor regular set. Square token frames, inherited text rhythm, and semantic ink.',
  sections: [
    { id: 'sizes', title: 'Size follows context', kind: 'matrix', render: SizeExamples },
    { id: 'shapes', title: 'Proportions & selective RTL', kind: 'matrix', render: ShapeExamples },
    {
      id: 'colors',
      title: 'Semantic colors on base surfaces',
      kind: 'states',
      render: ColorExamples,
    },
    { id: 'tokens', title: 'Live token inheritance', kind: 'states', render: TokenExample },
    {
      id: 'overlay',
      title: 'Semantic colors on an overlay',
      kind: 'states',
      surface: 'overlay',
      overlayStage: true,
      render: OverlayExamples,
    },
    { id: 'editor', title: 'Folio · Rich editor', kind: 'context', render: EditorExample },
    {
      id: 'connector',
      title: 'Folio · Connector spotlight',
      kind: 'context',
      render: ConnectorExample,
    },
  ],
});
