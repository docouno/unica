import { Avatar } from '../../prototypes/avatar/avatar.proto.js';
import { previewProps } from '../preview-code.js';
import type { ReactElement } from 'react';
import { defineComponent } from '../../workbench/types.js';
import type { AvatarExampleSection } from '../../prototypes/avatar/avatar.examples.js';

// Resolve the example chunk before registration so the first render is complete.
const { default: AvatarExamples } = await import('../../prototypes/avatar/avatar.examples.js');

function Example({ section }: { readonly section: AvatarExampleSection }): ReactElement {
  return <AvatarExamples section={section} />;
}

export default defineComponent({
  id: 'avatar',
  title: 'Avatar & AvatarGroup',
  category: 'Surfaces & Structure',
  status: 'Proto',
  summary: 'Quiet identity, resilient images and legible collaborator stacks.',
  componentName: 'Avatar',
  props: {
    size: {
      kind: 'enum',
      group: 'Appearance',
      default: 'm',
      description: 'Diameter of the identity.',
      choices: [{ value: '2xs' }, { value: 'xs' }, { value: 's' }, { value: 'm' }, { value: 'l' }],
    },
    name: {
      kind: 'string',
      group: 'Identity',
      default: 'Alex Rivera',
      description: 'Name used for the initials fallback and accessible image name.',
    },
    src: {
      kind: 'slot',
      group: 'Identity',
      default: 'none',
      description: 'Choose a portrait or inspect the initials fallback.',
      choices: [
        { value: 'none', label: 'No image' },
        { value: '/assets/avatar-portrait-wide.png', label: 'Wide portrait' },
        { value: '/assets/avatar-portrait-tall.png', label: 'Tall portrait' },
      ],
    },
    imagePosition: {
      kind: 'slot',
      group: 'Appearance',
      default: '50% 50%',
      description: 'Position of the crop within the avatar.',
      choices: [
        { value: '50% 50%', label: 'Center' },
        { value: '50% 20%', label: 'Top' },
        { value: '50% 80%', label: 'Bottom' },
      ],
    },
  },
  constraints: [
    {
      kind: 'ignored',
      when: { src: 'none' },
      affects: ['imagePosition'],
      reason: 'Crop position applies to the portrait image.',
    },
  ],
  render: ({ ctx, values: { name, size, src, imagePosition } }) => (
    <Avatar
      {...ctx.subject}
      alt={name || 'Profile'}
      name={name}
      size={size}
      src={src === 'none' ? undefined : src}
      imagePosition={imagePosition}
    />
  ),
  code: ({ name, size, src, imagePosition }) =>
    `<Avatar${previewProps({ alt: name || 'Profile', name, size, src, imagePosition }, { size: 'm', src: 'none', imagePosition: '50% 50%' })} />`,
  matrixViews: [
    {
      id: 'sizes',
      rows: 'size',
      cols: 'src',
      title: 'Identity scale',
      reference: () => <Example section="sizes" />,
    },
  ],
  cases: [
    {
      id: 'fallback',
      title: 'Fallback hierarchy & names',
      kind: 'behavior',
      render: () => <Example section="fallback" />,
    },
    {
      id: 'images',
      title: 'Image lifecycle',
      kind: 'behavior',
      render: () => <Example section="images" />,
    },
    {
      id: 'crop',
      title: 'Portrait framing & edges',
      kind: 'behavior',
      render: () => <Example section="crop" />,
    },
    {
      id: 'groups',
      title: 'Group scale & overflow',
      kind: 'behavior',
      render: () => <Example section="groups" />,
    },
    {
      id: 'surfaces',
      title: 'Transparent seams on real surfaces',
      overlayStage: true,
      kind: 'surface',
      render: () => <Example section="surfaces" />,
    },
    {
      id: 'direction',
      title: 'Direction & mixed image states',
      kind: 'behavior',
      render: () => <Example section="direction" />,
    },
    {
      id: 'names',
      mode: 'live',
      title: 'Optional names on hover and focus',
      kind: 'behavior',
      render: () => <Example section="names" />,
    },
  ],
  usage: [
    {
      id: 'usage',
      code: `<AvatarGroup members={collaborators} />`,
      title: 'Group and full member list',
      render: () => <Example section="usage" />,
    },
    {
      id: 'actions',
      code: `<button type="button" aria-label="Open profile">
  <Avatar alt="" name="Alex Rivera" />
</button>`,
      title: 'Avatar inside an action',
      render: () => <Example section="actions" />,
    },
  ],
});
