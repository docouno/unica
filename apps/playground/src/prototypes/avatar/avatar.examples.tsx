import { useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { UsersIcon } from '@phosphor-icons/react';
import { Card, Divider, Icon, Text } from '@docouno/unica';
import { useStoryAction } from '../../workbench/storyFrameState.js';
import type { PreviewProps } from '../../workbench/types.js';
import { Avatar, AvatarGroup } from './avatar.proto.js';
import type { AvatarGroupMember, AvatarGroupSize } from './avatar.proto.js';
import './avatar.examples.css';

const lightPortrait = '/assets/avatar-person-light.png';
const darkPortrait = '/assets/avatar-person-dark.png';
const brokenPortrait = 'data:image/png;base64,YnJva2Vu';
const groupSizes: readonly AvatarGroupSize[] = ['xs', 's', 'm', 'l'];
const members: readonly AvatarGroupMember[] = [
  { id: 'editor', name: 'Content editor', src: lightPortrait },
  { id: 'reviewer', name: 'Design reviewer', src: darkPortrait },
  { id: 'writer', name: 'Workspace writer' },
  { id: 'owner', name: 'Project owner' },
  { id: 'engineer', name: 'Platform engineer' },
  { id: 'researcher', name: 'Design researcher' },
  { id: 'maintainer', name: 'Library maintainer' },
];

function Sample({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className="avatar-example-sample">
      <div className="avatar-example-content">{children}</div>
      <Text as="span" size="caption-l" color="muted">
        <bdi>{label}</bdi>
      </Text>
    </div>
  );
}

export function IdentityFallbacks(): ReactElement {
  return (
    <div className="avatar-example-stack">
      <div className="avatar-example-row">
        <Sample label="Loaded photo">
          <Avatar
            name="Content editor"
            src={lightPortrait}
            fallback={<Icon usage="slot" icon={UsersIcon} />}
            alt="Content editor"
            size="l"
          />
        </Sample>
        <Sample label="Custom mark">
          <Avatar
            name="Editorial team"
            fallback={<Icon usage="slot" icon={UsersIcon} />}
            alt="Editorial team"
            size="l"
          />
        </Sample>
        <Sample label="Initials">
          <Avatar name="Workspace writer" alt="Workspace writer" size="l" />
        </Sample>
        <Sample label="Unknown">
          <Avatar alt="Unassigned person" size="l" />
        </Sample>
      </div>
      <div className="avatar-example-row">
        {(['2xs', 'xs'] as const).map((size) => (
          <Sample key={size} label={size === '2xs' ? '20px · one initial' : '24px · two initials'}>
            <Avatar size={size} name="Wide Workspace" alt="Wide Workspace" />
            <Avatar size={size} alt="Unassigned person" />
          </Sample>
        ))}
      </div>
      <Divider />
      <div className="avatar-example-row">
        {(
          [
            ['Writer', 'One word'],
            ['Wide Workspace', 'Wide letters'],
            ['Internal Infrastructure', 'Narrow letters'],
            ['李 雷', 'CJK'],
            ['E\u0301quipe Design', 'Combining mark'],
            ['  ', 'Blank name'],
            ['ß mann', 'Uppercase expansion'],
          ] as const
        ).map(([name, label]) => (
          <Sample key={label} label={label}>
            <Avatar
              name={name}
              alt={name.trim() || 'Unassigned person'}
              className={name === '李 雷' ? 'avatar-example-cjk' : undefined}
            />
          </Sample>
        ))}
      </div>
    </div>
  );
}

export function ImageLifecycle({ ctx }: PreviewProps): ReactElement {
  const state = ctx.story?.controls.image;
  const reviewer = ctx.story?.controls.person === 'reviewer';
  const [request, setRequest] = useState(0);
  const name = reviewer ? 'Design reviewer' : 'Content editor';
  const src =
    state === 'missing'
      ? undefined
      : state === 'failed'
        ? brokenPortrait
        : reviewer
          ? darkPortrait
          : lightPortrait;
  useStoryAction(ctx, (actionId) => {
    if (actionId === 'retry') {
      setRequest((previous) => previous + 1);
      ctx.story?.setControl('image', 'photo');
    }
  });
  return (
    <div className="avatar-example-stack">
      <div className="avatar-example-row">
        <Sample label="Waiting · held preview">
          <Avatar
            name="Content editor"
            src={lightPortrait}
            alt="Content editor"
            previewStatus="loading"
          />
        </Sample>
        <Sample label="Loaded">
          <Avatar name="Content editor" src={lightPortrait} alt="Content editor" />
        </Sample>
        <Sample label="Failed · real image error">
          <Avatar name="Content editor" src={brokenPortrait} alt="Content editor" />
        </Sample>
        <Sample label="Missing source">
          <Avatar name="Content editor" alt="Content editor" />
        </Sample>
        <Sample label="Failed · no name">
          <Avatar src={brokenPortrait} alt="Unknown member" />
        </Sample>
      </div>
      <Divider />
      <div className="avatar-example-person">
        <Avatar
          key={request}
          name={name}
          alt=""
          src={src}
          size="l"
          previewStatus={state === 'waiting' ? 'loading' : undefined}
        />
        <Text size="body-s" weight="medium">
          {name}
        </Text>
      </div>
    </div>
  );
}

export function PortraitCrop(): ReactElement {
  return (
    <div className="avatar-example-stack">
      <div className="avatar-example-row">
        <Sample label="Light portrait">
          <Avatar src={lightPortrait} alt="Light-background portrait" size="l" />
        </Sample>
        <Sample label="Dark portrait">
          <Avatar src={darkPortrait} alt="Dark-background portrait" size="l" />
        </Sample>
        <Sample label="Wide source · cover">
          <img
            className="avatar-example-source"
            src="/assets/avatar-portrait-wide.png"
            alt="Wide crop fixture"
          />
          <Avatar
            src="/assets/avatar-portrait-wide.png"
            alt="Wide image cropped to square"
            size="l"
          />
        </Sample>
        <Sample label="Tall source · cover">
          <img
            className="avatar-example-source"
            src="/assets/avatar-portrait-tall.png"
            alt="Tall crop fixture"
          />
          <Avatar
            src="/assets/avatar-portrait-tall.png"
            alt="Tall image cropped to square"
            size="l"
          />
        </Sample>
        <Sample label="Adjusted focal point">
          <Avatar
            src="/assets/avatar-portrait-tall.png"
            imagePosition="50% 32%"
            alt="Tall image with adjusted focal point"
            size="l"
          />
        </Sample>
      </div>
    </div>
  );
}

export function GroupScale(): ReactElement {
  return (
    <div className="avatar-example-stack">
      {groupSizes.map((size) => (
        <div className="avatar-example-group-row" key={size}>
          <Text as="span" size="caption-l" color="muted">
            {size}
          </Text>
          <AvatarGroup label={`${size} contributor group`} members={members} size={size} />
        </div>
      ))}
      <Divider />
      <div className="avatar-example-row">
        <Sample label="Empty · no footprint">
          <AvatarGroup label="Empty group" members={[]} size="s" />
          <Text size="caption-l" color="muted">
            No members
          </Text>
        </Sample>
        <Sample label="One">
          <AvatarGroup label="Single contributor" members={members.slice(0, 1)} size="s" />
        </Sample>
        <Sample label="At the limit">
          <AvatarGroup label="Four contributors" members={members.slice(0, 4)} size="s" />
        </Sample>
        <Sample label="One beyond">
          <AvatarGroup label="Five contributors" members={members.slice(0, 5)} size="s" />
        </Sample>
      </div>
      <div className="avatar-example-row">
        {[12, 128, 1200].map((count) => (
          <Sample key={count} label={`${count} more · exact count`}>
            <AvatarGroup
              label="Large contributor group"
              size="xs"
              max={2}
              members={Array.from({ length: count + 2 }, (_, index) => ({
                id: String(index),
                name: `Contributor ${String(index + 1)}`,
              }))}
            />
          </Sample>
        ))}
      </div>
    </div>
  );
}

function SeamSample({ label }: { readonly label: string }): ReactElement {
  return (
    <>
      <Text size="caption-l" color="muted">
        {label}
      </Text>
      <AvatarGroup label={`${label} contributors`} size="s" members={members} />
      <div className="avatar-example-person">
        <Avatar name="Workspace writer" alt="" size="xs" />
        <Text size="body-s">Workspace writer</Text>
      </div>
    </>
  );
}

export function SurfaceSeams({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="avatar-example-surfaces">
      {(['Shell', 'Canvas'] as const).map((label) => (
        <div
          className="avatar-example-surface"
          data-example-surface={label}
          data-surface="base"
          key={label}
        >
          <SeamSample label={label} />
        </div>
      ))}
      <Card data-surface="base">
        <SeamSample label="Card" />
      </Card>
      {ctx.surface === 'overlay' && (
        <div className="avatar-example-surface unica-overlay-surface" data-surface="overlay">
          <SeamSample label="Overlay" />
        </div>
      )}
    </div>
  );
}

export function GroupDirection(): ReactElement {
  return (
    <div className="avatar-example-stack">
      <div className="avatar-example-row">
        <Sample label="LTR · source order">
          <div dir="ltr">
            <AvatarGroup label="Left to right members" members={members} size="s" max={3} />
          </div>
        </Sample>
        <Sample label="RTL · same source order">
          <div dir="rtl">
            <AvatarGroup label="Right to left members" members={members} size="s" max={3} />
          </div>
        </Sample>
        <Sample label="Mixed loading states">
          <AvatarGroup
            label="Mixed image states"
            size="s"
            members={[
              members[0]!,
              { id: 'failed', name: 'Workspace writer', src: brokenPortrait },
              {
                id: 'unknown',
                name: 'Unassigned reviewer',
                fallback: <Icon usage="slot" icon={UsersIcon} />,
              },
              members[1]!,
            ]}
          />
        </Sample>
      </div>
    </div>
  );
}

export function NameHints(): ReactElement {
  const namedMembers: readonly AvatarGroupMember[] = [
    members[0]!,
    members[2]!,
    { id: 'long-name', name: 'Alexandra Montgomery-Wellington' },
    { id: 'rtl-name', name: 'ندى منصور', src: darkPortrait },
  ];
  return (
    <div className="avatar-example-stack avatar-example-names">
      <div className="avatar-example-row">
        {groupSizes.map((size) => (
          <Sample key={size} label={size}>
            <AvatarGroup
              label={`${size} named contributors`}
              members={namedMembers}
              size={size}
              showNames
            />
          </Sample>
        ))}
      </div>
      <div className="avatar-example-row">
        <Sample label="Passive group">
          <AvatarGroup label="Passive contributors" members={members} size="s" max={3} />
        </Sample>
        <Sample label="Long name">
          <AvatarGroup label="Long member name" members={[namedMembers[2]!]} size="s" showNames />
        </Sample>
      </div>
    </div>
  );
}
