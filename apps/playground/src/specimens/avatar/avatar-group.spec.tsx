import { AvatarGroup } from '@docouno/unica';
import { defineComponent } from '../../workbench/types.js';
import { previewProps } from '../preview-code.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { ContributorDirectory } from './avatar-directory.examples.js';
import directorySource from './avatar-directory.examples.tsx?raw';
import { contributors } from './avatar.members.js';
import { NameHints } from './avatar.examples.js';

const memberSets = { empty: [], one: contributors.slice(0, 1), team: contributors } as const;

function localizedOverflow(count: number): string {
  return `${String(count)} más`;
}

export default defineComponent({
  id: 'avatar-group',
  title: 'AvatarGroup',
  category: 'Surfaces & Structure',
  status: 'UI',
  summary: 'Summarize an ordered list of members with an exact remainder and optional name hints.',
  componentName: 'AvatarGroup',
  props: {
    label: {
      kind: 'string',
      group: 'Semantics',
      default: 'Contributors',
      description: 'Required accessible name of the list.',
    },
    members: {
      kind: 'slot',
      group: 'Content',
      publicType: "AvatarGroupProps['members']",
      default: 'team',
      description:
        'Required ordered list of members with stable IDs and optional portrait sources.',
      choices: [
        { value: 'empty', label: 'Empty', code: '[]' },
        { value: 'one', label: 'One member', code: JSON.stringify(memberSets.one) },
        { value: 'team', label: 'Seven members', code: JSON.stringify(memberSets.team) },
      ],
    },
    size: {
      kind: 'enum',
      group: 'Geometry',
      default: 'm',
      choices: [{ value: 'xs' }, { value: 's' }, { value: 'm' }, { value: 'l' }],
      description: 'Width and height of each member frame and minimum width of the counter.',
    },
    max: {
      kind: 'number',
      group: 'Geometry',
      default: 4,
      examples: [1, 3, 4, 7],
      description: 'Number of visible members before the extra counter. Invalid limits use four.',
    },
    showNames: {
      kind: 'boolean',
      group: 'Interaction',
      default: false,
      description: 'Show full names on hover and keyboard focus for visible, named members.',
    },
    getOverflowLabel: {
      kind: 'slot',
      group: 'Semantics',
      default: 'auto',
      publicType: '(count: number) => string',
      description: 'Customize the spoken remainder while keeping the exact visible +N.',
      choices: [
        { value: 'auto', label: 'Default' },
        { value: 'localized', label: 'Spanish', code: '(count) => `${count} más`' },
      ],
    },
  },
  constraints: [
    {
      kind: 'ignored',
      when: { members: 'empty' },
      affects: ['label', 'size', 'max', 'showNames', 'getOverflowLabel'],
      reason: 'An empty group renders nothing.',
    },
    {
      kind: 'ignored',
      when: { members: 'one' },
      affects: ['getOverflowLabel'],
      reason: 'A single member fits at every valid limit.',
    },
    {
      kind: 'ignored',
      when: { members: 'team', max: 7 },
      affects: ['getOverflowLabel'],
      reason: 'All seven members are visible.',
    },
  ],
  render: withOverlaySurface(({ ctx, values: { members, getOverflowLabel, ...props } }) => {
    const group = (
      <AvatarGroup
        {...ctx.subject}
        {...props}
        members={memberSets[members]}
        getOverflowLabel={getOverflowLabel === 'localized' ? localizedOverflow : undefined}
      />
    );
    return members === 'empty' ? (
      group
    ) : (
      <div
        className="unica-scrollbar unica-scrollbar--compact"
        role="region"
        aria-label="Scrollable avatars"
        tabIndex={0}
        style={{
          display: 'flex',
          inlineSize: 'max-content',
          maxInlineSize: '100%',
          overflowX: 'auto',
          padding: 4,
          outlineColor: 'var(--focus-ring-color)',
          outlineOffset: 2,
        }}
      >
        {group}
      </div>
    );
  }, 'border-box'),
  code: ({ members, getOverflowLabel, ...props }) => {
    const attrs = previewProps(props, { size: 'm', max: 4, showNames: false });
    const overflow =
      getOverflowLabel === 'localized' ? ' getOverflowLabel={(count) => `${count} más`}' : '';
    return `import { AvatarGroup } from '@docouno/unica';\n\nconst members = ${JSON.stringify(memberSets[members], null, 2)};\n\n<AvatarGroup${attrs} members={members}${overflow} />`;
  },
  states: [
    {
      id: 'members',
      title: 'Member count and frame size',
      rows: 'size',
      cols: 'members',
      caption: 'Compare the frame scale, the exact remainder and the empty group.',
    },
  ],
  cases: [
    {
      id: 'names',
      title: 'Optional name hints',
      kind: 'behavior',
      mode: 'live',
      caption: 'Tab through the visible members. Escape closes the name hint and keeps focus.',
      render: withOverlaySurface(NameHints, 'border-box'),
    },
  ],
  compositions: [
    {
      id: 'directory',
      title: 'Full member list',
      mode: 'live',
      caption: 'Keep the group compact and use a separate disclosure to show every member.',
      code: directorySource,
      render: withOverlaySurface(
        ({ ctx }) => (
          <div data-example-disclosure="">
            <ContributorDirectory identityProps={ctx.subject} />
          </div>
        ),
        'border-box',
      ),
    },
  ],
});
