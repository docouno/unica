import type { ReactElement } from 'react';
import { defineSpecimen } from '../../workbench/types.js';
import type { AvatarExampleSection } from './avatar.examples.js';

// Resolve the example chunk before registration so the first render is complete.
const { default: AvatarExamples } = await import('./avatar.examples.js');

function Example({ section }: { readonly section: AvatarExampleSection }): ReactElement {
  return <AvatarExamples section={section} />;
}

export default defineSpecimen({
  id: 'avatar',
  title: 'Avatar & AvatarGroup',
  group: 'Identity',
  summary: 'Quiet identity, resilient images and legible collaborator stacks.',
  sections: [
    {
      id: 'sizes',
      title: 'Identity scale',
      kind: 'matrix',
      render: () => <Example section="sizes" />,
    },
    {
      id: 'fallback',
      title: 'Fallback hierarchy & names',
      kind: 'matrix',
      render: () => <Example section="fallback" />,
    },
    {
      id: 'images',
      title: 'Image lifecycle',
      kind: 'states',
      render: () => <Example section="images" />,
    },
    {
      id: 'crop',
      title: 'Portrait framing & edges',
      kind: 'states',
      render: () => <Example section="crop" />,
    },
    {
      id: 'groups',
      title: 'Group scale & overflow',
      kind: 'matrix',
      render: () => <Example section="groups" />,
    },
    {
      id: 'surfaces',
      title: 'Transparent seams on real surfaces',
      kind: 'states',
      overlayStage: true,
      render: () => <Example section="surfaces" />,
    },
    {
      id: 'direction',
      title: 'Direction & mixed image states',
      kind: 'states',
      render: () => <Example section="direction" />,
    },
    {
      id: 'usage',
      title: 'Identity next to actions',
      kind: 'context',
      render: () => <Example section="usage" />,
    },
  ],
});
