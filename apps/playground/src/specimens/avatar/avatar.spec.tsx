import { Avatar } from '../../prototypes/avatar/avatar.proto.js';
import {
  GroupDirection,
  GroupScale,
  IdentityFallbacks,
  ImageLifecycle,
  NameHints,
  PortraitCrop,
  SurfaceSeams,
} from '../../prototypes/avatar/avatar.examples.js';
import { defineComponent } from '../../workbench/types.js';
import { previewProps } from '../preview-code.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { ActionGeometry } from './avatar-action-geometry.examples.js';
import { ContributorDirectory } from './avatar-directory.examples.js';
import directorySource from './avatar-directory.examples.tsx?raw';
import { AccountProfile } from './avatar-profile.examples.js';
import profileSource from './avatar-profile.examples.tsx?raw';

function imageLabel(alt: string, name: string): string {
  return alt === 'decorative' ? '' : name.trim() || 'Profile';
}

export default defineComponent({
  id: 'avatar',
  title: 'Avatar & AvatarGroup',
  category: 'Surfaces & Structure',
  status: 'Proto',
  summary: 'Identify a person with a portrait or fallback and show the members of a group.',
  componentName: 'Avatar',
  props: {
    size: {
      kind: 'enum',
      group: 'Geometry',
      default: 'm',
      description: 'Width and height of the identity frame.',
      choices: [{ value: '2xs' }, { value: 'xs' }, { value: 's' }, { value: 'm' }, { value: 'l' }],
    },
    name: {
      kind: 'string',
      group: 'Content',
      default: 'Alex Rivera',
      description: 'Name used to generate initials when a portrait is unavailable.',
    },
    alt: {
      kind: 'slot',
      publicType: 'string',
      group: 'Semantics',
      default: 'named',
      description:
        'Required accessible image name. This example uses the person’s name or “Profile” when blank. An empty string makes the avatar decorative.',
      choices: [
        { value: 'named', label: 'Informative', code: "name.trim() || 'Profile'" },
        { value: 'decorative', label: 'Decorative', code: '""' },
      ],
    },
    src: {
      kind: 'enum',
      group: 'Content',
      default: 'none',
      publicType: 'string',
      description: 'Image URL. A missing or failed image leaves the fallback visible.',
      choices: [
        { value: 'none', label: 'No image', omit: true },
        { value: '/assets/avatar-portrait-wide.png', label: 'Wide portrait' },
        { value: '/assets/avatar-portrait-tall.png', label: 'Tall portrait' },
      ],
    },
    imagePosition: {
      kind: 'enum',
      group: 'Geometry',
      publicType: 'string',
      default: '50% 50%',
      description:
        'CSS object-position for the portrait crop. The top and bottom positions shift the tall source within its square frame.',
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
  render: withOverlaySurface(({ ctx, values: { alt, name, size, src, imagePosition } }) => (
    <Avatar
      {...ctx.subject}
      alt={imageLabel(alt, name)}
      name={name}
      size={size}
      src={src === 'none' ? undefined : src}
      imagePosition={imagePosition}
    />
  )),
  code: ({ alt, name, size, src, imagePosition }) =>
    `import { Avatar } from './prototypes/avatar/avatar.proto.js';\n\n<Avatar${previewProps({ alt: imageLabel(alt, name), name, size, src, imagePosition }, { size: 'm', src: 'none', imagePosition: '50% 50%' })} />`,
  states: [
    {
      id: 'sizes',
      rows: 'size',
      cols: 'src',
      title: 'Identity scale',
      caption:
        'Compare the five fixed frame sizes with initials and two portrait aspect ratios. The 20px frame uses one initial.',
    },
  ],
  cases: [
    {
      id: 'fallback',
      title: 'Fallback hierarchy and names',
      kind: 'content',
      mode: 'pinned',
      caption:
        'A loaded photo takes priority over a custom mark, initials and the unknown-person glyph. Compare initials across frame sizes, scripts and word lengths.',
      render: withOverlaySurface(IdentityFallbacks, 'border-box'),
    },
    {
      id: 'images',
      title: 'Image lifecycle',
      kind: 'behavior',
      mode: 'live',
      controls: {
        image: {
          kind: 'enum',
          label: 'Image',
          default: 'photo',
          choices: [
            { value: 'photo', label: 'Load photo' },
            { value: 'waiting', label: 'Hold waiting' },
            { value: 'failed', label: 'Fail image' },
            { value: 'missing', label: 'Remove source' },
          ],
        },
        person: {
          kind: 'enum',
          label: 'Person',
          default: 'editor',
          choices: [
            { value: 'editor', label: 'Content editor' },
            { value: 'reviewer', label: 'Design reviewer' },
          ],
        },
      },
      actions: [{ id: 'retry', label: 'Retry image' }],
      reset: true,
      caption:
        'Switch people or retry a failed portrait. The waiting preview holds the fallback in place. Loaded and failed images use the browser’s image lifecycle.',
      render: withOverlaySurface(ImageLifecycle, 'border-box'),
    },
    {
      id: 'crop',
      title: 'Portrait framing and edges',
      kind: 'content',
      mode: 'pinned',
      caption:
        'Compare each source with its square cover crop. A focal point shifts the portrait within the same frame.',
      render: withOverlaySurface(PortraitCrop, 'border-box'),
    },
    {
      id: 'groups',
      title: 'Group scale and overflow',
      kind: 'content',
      mode: 'pinned',
      caption:
        'The empty group takes no space. Compare the last visible member with the first hidden member and inspect how the exact remainder grows.',
      render: withOverlaySurface(GroupScale, 'border-box'),
    },
    {
      id: 'surfaces',
      title: 'Transparent seams on real surfaces',
      surface: 'overlay',
      overlayStage: true,
      kind: 'surface',
      mode: 'pinned',
      caption:
        'Look through the seams on Shell, Canvas, Card and the floating Overlay. Each seam exposes its own background.',
      render: SurfaceSeams,
    },
    {
      id: 'direction',
      title: 'Direction and mixed image states',
      kind: 'content',
      mode: 'pinned',
      caption:
        'The stack follows the reading direction. Faces, initials and the +N remainder keep their orientation when member order runs right to left.',
      render: withOverlaySurface(GroupDirection, 'border-box'),
    },
    {
      id: 'names',
      title: 'Optional names on hover and focus',
      kind: 'behavior',
      mode: 'live',
      caption:
        'Focus a member to reveal its full name, or hover for 300 ms and move to the next member. Escape dismisses the hint while keeping keyboard focus.',
      render: withOverlaySurface(NameHints, 'border-box'),
    },
    {
      id: 'action-geometry',
      title: 'Identity inside an account button',
      kind: 'behavior',
      mode: 'live',
      caption:
        'Compare the fixed avatar inset across button sizes, sources and availability. The button owns focus and the label can wrap alongside the identity.',
      render: withOverlaySurface(ActionGeometry, 'border-box'),
    },
  ],
  compositions: [
    {
      id: 'usage',
      title: 'Group and full member list',
      mode: 'live',
      controls: {
        max: { kind: 'number', label: 'Visible members', default: 3, min: 1, max: 4, step: 1 },
      },
      reset: true,
      caption:
        'Three members appear by default. View all seven names with the disclosure, or change the visible limit to compare the group and remainder.',
      code: directorySource.replaceAll('../../prototypes/', './prototypes/'),
      render: withOverlaySurface(
        ({ ctx }) => (
          <div data-avatar-disclosure-preview="">
            <ContributorDirectory max={Number(ctx.story?.controls.max ?? 3)} />
          </div>
        ),
        'border-box',
      ),
    },
    {
      id: 'actions',
      title: 'Avatar inside an action',
      mode: 'live',
      caption:
        'Open the account profile with the named button. The decorative portrait shares the button’s target and stays out of the keyboard order.',
      code: profileSource.replaceAll('../../prototypes/', './prototypes/'),
      render: withOverlaySurface(
        () => (
          <div data-avatar-disclosure-preview="">
            <AccountProfile />
          </div>
        ),
        'border-box',
      ),
    },
  ],
});
