import { useId, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { ArrowClockwiseIcon, UsersIcon } from '@phosphor-icons/react';
import { Avatar, AvatarGroup } from './avatar.proto.js';
import type { AvatarGroupMember, AvatarGroupSize, AvatarSize } from './avatar.proto.js';
import { Button } from '../button/button.proto.js';
import type { ButtonProps } from '../button/button.proto.js';
import { Icon, Text } from '@docouno/unica';
import './avatar.examples.css';

const lightPortrait = '/assets/avatar-person-light.png';
const darkPortrait = '/assets/avatar-person-dark.png';
const brokenPortrait = 'data:image/png;base64,YnJva2Vu';
const sizes: readonly AvatarSize[] = ['2xs', 'xs', 's', 'm', 'l'];
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
      <span className="avatar-example-label">{label}</span>
    </div>
  );
}

function Scale(): ReactElement {
  return (
    <div className="avatar-example-stack">
      <p className="avatar-example-note">
        One quiet identity frame. Photos retain their own color; fallback identities stay neutral.
      </p>
      <div className="avatar-example-scale">
        {sizes.map((size) => (
          <Sample
            key={size}
            label={`${size} · ${{ '2xs': 20, xs: 24, s: 32, m: 40, l: 48 }[size]}px`}
          >
            <Avatar src={lightPortrait} name="Content editor" alt="Content editor" size={size} />
            <Avatar name="Workspace writer" alt="Workspace writer" size={size} />
            <Avatar name="Database reliability" alt="Database reliability" size={size} />
            <Avatar alt="Unassigned person" size={size} />
          </Sample>
        ))}
      </div>
      <p className="avatar-example-note">
        20px uses one initial. The larger frames use up to two. Frame size stays fixed at 120% text.
      </p>
    </div>
  );
}

function Fallbacks(): ReactElement {
  return (
    <div className="avatar-example-stack">
      <div className="avatar-example-row">
        <Sample label="1 · Loaded photo">
          <Avatar
            name="Content editor"
            src={lightPortrait}
            fallback={<Icon usage="slot" icon={UsersIcon} />}
            alt="Content editor"
            size="l"
          />
        </Sample>
        <Sample label="2 · Custom mark">
          <Avatar
            name="Editorial team"
            fallback={<Icon usage="slot" icon={UsersIcon} />}
            alt="Editorial team"
            size="l"
          />
        </Sample>
        <Sample label="3 · Initials">
          <Avatar name="Workspace writer" alt="Workspace writer" size="l" />
        </Sample>
        <Sample label="4 · Unknown">
          <Avatar alt="Unassigned person" size="l" />
        </Sample>
      </div>
      <div className="avatar-example-rule" />
      <div className="avatar-example-row">
        {[
          'Writer',
          'Wide Workspace',
          'Internal Infrastructure',
          '李 雷',
          'E\u0301quipe Design',
          '  ',
          'ß mann',
        ].map((name, index) => (
          <Sample
            key={index}
            label={
              [
                'One word',
                'Wide letters',
                'Narrow letters',
                'CJK',
                'Combining mark',
                'Blank name',
                'Uppercase expansion',
              ][index] ?? ''
            }
          >
            <Avatar
              name={name}
              alt={name.trim() || 'Unassigned person'}
              className={name === '李 雷' ? 'avatar-example-cjk' : undefined}
            />
          </Sample>
        ))}
      </div>
      <p className="avatar-example-note">
        Names generate first + last initials, never shrink to fit. Custom marks are non-interactive
        and must fit the frame. The CJK example supplies its own script font.
      </p>
    </div>
  );
}

function ImageLifecycle(): ReactElement {
  const [state, setState] = useState<'photo' | 'waiting' | 'failed' | 'missing'>('photo');
  const [person, setPerson] = useState(false);
  const [request, setRequest] = useState(0);
  const name = person ? 'Design reviewer' : 'Content editor';
  const src =
    state === 'missing'
      ? undefined
      : state === 'failed'
        ? brokenPortrait
        : person
          ? darkPortrait
          : lightPortrait;
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
      <div className="avatar-example-live">
        <div className="avatar-example-person">
          <Avatar
            key={request}
            name={name}
            alt=""
            src={src}
            size="l"
            previewStatus={state === 'waiting' ? 'loading' : undefined}
          />
          <div>
            <Text weight="medium">{name}</Text>
            <Text size="caption-l" color="muted">
              {state === 'waiting'
                ? 'Image waiting state is held for inspection.'
                : state === 'failed'
                  ? 'Image failed. Identity remains available.'
                  : state === 'missing'
                    ? 'No image supplied.'
                    : 'Local image loads normally.'}
            </Text>
          </div>
        </div>
        <div className="avatar-example-controls" aria-label="Image preview controls">
          {(['photo', 'waiting', 'failed', 'missing'] as const).map((value) => (
            <Button
              key={value}
              size="s"
              variant="secondary"
              tone="neutral"
              pressed={state === value}
              onClick={() => setState(value)}
            >
              {value === 'photo'
                ? 'Load photo'
                : value === 'waiting'
                  ? 'Hold waiting'
                  : value === 'failed'
                    ? 'Fail image'
                    : 'Remove source'}
            </Button>
          ))}
          <Button size="s" variant="ghost" tone="neutral" onClick={() => setPerson(!person)}>
            Switch person
          </Button>
          <Button
            size="s"
            variant="ghost"
            tone="neutral"
            iconLeft={ArrowClockwiseIcon}
            onClick={() => {
              setRequest(request + 1);
              setState('photo');
            }}
          >
            Retry
          </Button>
        </div>
      </div>
      <p className="avatar-example-note">
        No spinner, error badge, fade or layout jump. A new identity shows its own fallback while
        its image loads. Retry belongs to the host.
      </p>
    </div>
  );
}

function Crop(): ReactElement {
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
      <p className="avatar-example-note">
        Center crop by default. A host-supplied focal point changes framing, never stretches the
        image. The inner hairline preserves a light photo edge.
      </p>
    </div>
  );
}

function Groups(): ReactElement {
  return (
    <div className="avatar-example-stack">
      {groupSizes.map((size) => (
        <div className="avatar-example-group-row" key={size}>
          <span className="avatar-example-label">{size}</span>
          <AvatarGroup label={`${size} contributor group`} members={members} size={size} />
          <span className="avatar-example-label">4 visible · 3 more</span>
        </div>
      ))}
      <div className="avatar-example-rule" />
      <div className="avatar-example-row">
        <Sample label="Empty · no footprint">
          <span className="avatar-example-empty">
            No members
            <AvatarGroup label="Empty group" members={[]} size="s" />
          </span>
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
              members={Array.from(
                { length: count + 2 },
                (_, index) => members[index % members.length] ?? members[0]!,
              )}
            />
          </Sample>
        ))}
      </div>
      <p className="avatar-example-note">
        Compact groups use one initial at 24px. Larger groups use quieter two-letter monograms. The
        static remainder keeps the common height and grows in width when needed. No hidden names are
        implied by the count.
      </p>
    </div>
  );
}

function Surfaces(): ReactElement {
  return (
    <div className="avatar-example-surfaces">
      {(['shell', 'canvas', 'surface', 'overlay'] as const).map((surface) => (
        <div
          className="avatar-example-surface"
          data-example-surface={surface}
          data-surface={surface === 'overlay' ? 'overlay' : 'base'}
          key={surface}
        >
          <span className="avatar-example-label">{surface === 'surface' ? 'Card' : surface}</span>
          <AvatarGroup label={`${surface} contributors`} size="s" members={members} />
          <div className="avatar-example-person">
            <Avatar name="Workspace writer" alt="" size="xs" />
            <span>Workspace writer</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Direction(): ReactElement {
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
      <p className="avatar-example-note">
        The stack follows logical inline direction. Faces and initials keep their orientation; +N
        remains a left-to-right number. Pixel uses complete square tiles with a 2px gap. No member
        is a tab stop.
      </p>
    </div>
  );
}

function Usage(): ReactElement {
  const regionId = useId();
  const [open, setOpen] = useState(false);
  const [max, setMax] = useState(3);
  return (
    <div className="avatar-example-stack">
      <div className="avatar-example-live">
        <div className="avatar-example-controls">
          <AvatarGroup label="Contributors" members={members} size="s" max={max} showNames />
          <Button
            size="s"
            variant="ghost"
            tone="neutral"
            aria-expanded={open}
            aria-controls={regionId}
            onClick={() => setOpen(!open)}
          >
            {open ? 'Hide members' : 'View all 7'}
          </Button>
        </div>
        <label className="avatar-example-range">
          Visible members{' '}
          <input
            type="range"
            min="1"
            max="4"
            value={max}
            onChange={(event) => setMax(Number(event.currentTarget.value))}
          />
          <output>{max}</output>
        </label>
        {open && (
          <div
            id={regionId}
            className="avatar-example-directory"
            role="region"
            aria-label="All contributors"
          >
            {members.map((member) => (
              <div className="avatar-example-person" key={member.id}>
                <Avatar name={member.name} src={member.src} alt="" size="s" />
                <Text size="body-s">{member.name}</Text>
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="avatar-example-note">
        Enter / Space toggles the full list; focus stays on the button. The list is also the
        touch-accessible route to names. Adjacent names own the accessible identity.
      </p>
    </div>
  );
}

function Names(): ReactElement {
  const namedMembers: readonly AvatarGroupMember[] = [
    members[0]!,
    members[2]!,
    { id: 'long-name', name: 'Alexandra Montgomery-Wellington' },
    { id: 'rtl-name', name: 'ندى منصور', src: darkPortrait },
  ];
  return (
    <div className="avatar-example-stack avatar-example-names">
      <p className="avatar-example-note">
        Hover a member for 300 ms, then move to the next one to see their name immediately. Tab
        shows the focused name immediately, and Escape dismisses it.
      </p>
      <div className="avatar-example-row">
        {groupSizes.map((size) => (
          <Sample key={size} label={`${size} · live names`}>
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
        <Sample label="Default · no name hints or Tab stops">
          <AvatarGroup label="Passive contributors" members={members} size="s" max={3} />
        </Sample>
        <Sample label="Long name · live hint">
          <AvatarGroup label="Long member name" members={[namedMembers[2]!]} size="s" showNames />
        </Sample>
      </div>
      <p className="avatar-example-note">
        The bubble stays open while hovered and never contains actions. A shared group focus ring
        leaves the overlap intact. Names keep their own reading direction. The separate full-list
        example demonstrates the touch route; the count is not a hidden menu trigger.
      </p>
    </div>
  );
}

// An action composition, not a proposed AvatarButton library component.
function AccountAction({
  size = 'm',
  source = 'photo',
  children = 'Account',
  ...props
}: ButtonProps & { readonly source?: 'photo' | 'initials' | 'unknown' }): ReactElement {
  return (
    <Button variant="ghost" tone="neutral" {...props} size={size} className="avatar-example-action">
      <span className="avatar-example-action-row">
        <Avatar
          src={source === 'photo' ? lightPortrait : undefined}
          name={source === 'unknown' ? '' : 'Content editor'}
          alt=""
          size={{ s: '2xs', m: 'xs', l: 's' }[size] as AvatarSize}
        />
        <span className="avatar-example-action-label">{children}</span>
      </span>
    </Button>
  );
}

function Actions(): ReactElement {
  return (
    <div className="avatar-example-stack">
      <p className="avatar-example-note">
        The enclosing action owns its target, focus and availability. The identity is a fixed
        leading visual; its label wraps independently.
      </p>
      {(['s', 'm', 'l'] as const).map((size) => (
        <div className="avatar-example-row" key={size}>
          <Sample label={`${size} · photo`}>
            <AccountAction size={size} />
          </Sample>
          <Sample label={`${size} · initials`}>
            <AccountAction size={size} source="initials" />
          </Sample>
          <Sample label={`${size} · unknown`}>
            <AccountAction size={size} source="unknown" />
          </Sample>
          <Sample label={`${size} · secondary`}>
            <AccountAction size={size} variant="secondary" />
          </Sample>
        </div>
      ))}
      <div className="avatar-example-rule" />
      <div className="avatar-example-row">
        {(['rest', 'hover', 'active', 'focus', 'disabled', 'loading'] as const).map((state) => (
          <Sample key={state} label={state}>
            <AccountAction
              disabled={state === 'disabled'}
              loading={state === 'loading'}
              previewState={state === 'disabled' || state === 'loading' ? undefined : state}
            />
          </Sample>
        ))}
      </div>
      <div className="avatar-example-row">
        <Sample label="Unavailable initials">
          <AccountAction source="initials" disabled />
        </Sample>
        <Sample label="Wrapped label · 176px">
          <div className="avatar-example-action-narrow">
            <AccountAction variant="secondary" width="full">
              Editorial workspace account
            </AccountAction>
          </div>
        </Sample>
      </div>
      <p className="avatar-example-note">
        State previews are pinned. Avatar itself has no hover, pressed, selected or disabled state;
        this enclosing action subdues its identity together with the label when unavailable.
      </p>
    </div>
  );
}

export type AvatarExampleSection =
  | 'sizes'
  | 'fallback'
  | 'images'
  | 'crop'
  | 'groups'
  | 'surfaces'
  | 'direction'
  | 'usage'
  | 'actions'
  | 'names';

const examples: Record<AvatarExampleSection, () => ReactElement> = {
  sizes: Scale,
  fallback: Fallbacks,
  images: ImageLifecycle,
  crop: Crop,
  groups: Groups,
  surfaces: Surfaces,
  direction: Direction,
  usage: Usage,
  actions: Actions,
  names: Names,
};

export default function AvatarExamples({
  section,
}: {
  readonly section: AvatarExampleSection;
}): ReactElement {
  const Example = examples[section];
  return <Example />;
}
