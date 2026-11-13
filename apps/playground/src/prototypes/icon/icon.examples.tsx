import { useState } from 'react';
import type { CSSProperties, ReactElement } from 'react';
import {
  ArrowRightIcon,
  ArrowsLeftRightIcon,
  BellIcon,
  CaretRightIcon,
  CheckIcon,
  CheckCircleIcon,
  CodeIcon,
  FolderIcon,
  GearIcon,
  GithubLogoIcon,
  InfoIcon,
  LinkIcon,
  ListBulletsIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  StarIcon,
  TextBIcon,
  TextItalicIcon,
  WarningCircleIcon,
  XCircleIcon,
  XIcon,
} from '@phosphor-icons/react';
import { Text } from '../text/text.proto.js';
import { Title } from '../title/title.proto.js';
import { Icon, VectorGlyph } from './icon.proto.js';
import type { GlyphComponent, GlyphProps, IconColor, IconSize } from './icon.proto.js';
import './icon.examples.css';

const tiers: readonly Exclude<IconSize, 'inherit'>[] = ['s', 'm', 'l'];
const roles: readonly { color: IconColor; glyph: GlyphComponent }[] = [
  { color: 'inherit', glyph: ArrowRightIcon },
  { color: 'primary', glyph: GearIcon },
  { color: 'secondary', glyph: FolderIcon },
  { color: 'muted', glyph: BellIcon },
  { color: 'subtle', glyph: StarIcon },
  { color: 'disabled', glyph: XIcon },
  { color: 'accent', glyph: PlusIcon },
  { color: 'info', glyph: InfoIcon },
  { color: 'success', glyph: CheckCircleIcon },
  { color: 'warning', glyph: WarningCircleIcon },
  { color: 'danger', glyph: XCircleIcon },
];

function WideGlyph(props: GlyphProps): ReactElement {
  return (
    <VectorGlyph {...props} viewBox="0 0 32 16">
      <path fill="none" stroke="currentColor" strokeWidth="2" d="M1 1h30v14H1zM7 8h18" />
    </VectorGlyph>
  );
}

export function SizeExamples(): ReactElement {
  return (
    <div className="icon-study">
      <div className="icon-tiers">
        {tiers.map((size) => (
          <div className="icon-stack" key={size}>
            <Text size="caption-l" color="secondary">
              {size.toUpperCase()} / {size === 's' ? 14 : size === 'm' ? 16 : 20} px
            </Text>
            <div className="icon-row">
              <span
                className="icon-control-guide"
                style={{
                  width: `var(--size-${size}-height)`,
                  height: `var(--size-${size}-height)`,
                }}
              >
                <Icon icon={GearIcon} size={size} />
              </span>
              <Icon icon={MagnifyingGlassIcon} size={size} />
              <Icon icon={ArrowRightIcon} size={size} directional />
              <Icon icon={CheckCircleIcon} size={size} />
            </div>
            <Text size="caption-l" color="muted">
              {size === 's' ? 30 : size === 'm' ? 40 : 48} px control
            </Text>
          </div>
        ))}
      </div>
      <div className="icon-stack icon-inline-samples">
        <Text size="body-s" color="muted">
          <Icon icon={CheckIcon} /> Updated just now
        </Text>
        <Text size="body-m">
          <Icon icon={ArrowRightIcon} directional /> Open workspace
        </Text>
        <Title as="h3" size="heading-l">
          <Icon icon={FolderIcon} /> Project notes
        </Title>
      </div>
      <Text size="caption-l" color="secondary">
        Inline icons inherit 1em and the surrounding text color. Control frames are guides.
      </Text>
    </div>
  );
}

export function ShapeExamples(): ReactElement {
  return (
    <div className="icon-study">
      <div className="icon-row">
        {(['m', 'l'] as const).map((size) => (
          <span className="icon-frame" key={size}>
            <Icon icon={WideGlyph} size={size} />
          </span>
        ))}
        <Text size="body-s">32 × 16 source, square frame</Text>
      </div>
      {(['ltr', 'rtl'] as const).map((dir) => (
        <div className="icon-row" key={dir} dir={dir}>
          <Text size="caption-l" color="secondary">
            {dir.toUpperCase()}
          </Text>
          <Icon icon={ArrowRightIcon} size="l" directional />
          <Icon icon={CaretRightIcon} size="l" directional />
          <Icon icon={CheckIcon} size="l" />
          <Icon icon={WarningCircleIcon} size="l" />
        </div>
      ))}
      <Text size="caption-l" color="secondary">
        Only directional arrows mirror. Check and warning retain their meaning.
      </Text>
      <div className="icon-row icon-no-wrap">
        <Icon icon={FolderIcon} size="m" />
        <Text size="body-s">
          A long release-readiness-checklist name wraps while its icon keeps a square frame.
        </Text>
      </div>
    </div>
  );
}

function ColorList(): ReactElement {
  return (
    <div className="icon-color-list">
      {roles.map(({ color, glyph }) => (
        <div className="icon-row" key={color} data-icon-color={color}>
          <Icon icon={glyph} size="m" color={color} />
          <Text size="body-s" color="secondary">
            {color}
          </Text>
        </div>
      ))}
    </div>
  );
}

export function ColorExamples(): ReactElement {
  return (
    <div className="icon-study">
      <div className="icon-surfaces">
        {(['canvas', 'surface'] as const).map((surface) => (
          <div className="icon-color-surface icon-stack" key={surface} data-icon-surface={surface}>
            <Text size="caption-l" weight="semibold">
              {surface}
            </Text>
            <ColorList />
          </div>
        ))}
      </div>
      <Text size="caption-l" color="secondary">
        Subtle is decorative; disabled marks an unavailable action. Status always has a text label.
      </Text>
    </div>
  );
}

export function OverlayExamples(): ReactElement {
  return (
    <div className="icon-overlay icon-stack">
      <Title as="h3" size="heading-s">
        Signals on a floating surface
      </Title>
      <ColorList />
    </div>
  );
}

const tools: readonly { name: string; glyph: GlyphComponent }[] = [
  { name: 'Bold', glyph: TextBIcon },
  { name: 'Italic', glyph: TextItalicIcon },
  { name: 'Bulleted list', glyph: ListBulletsIcon },
  { name: 'Inline code', glyph: CodeIcon },
];

export function EditorExample(): ReactElement {
  const [active, setActive] = useState<string[]>([]);
  return (
    <article className="icon-product icon-study">
      <div className="icon-row icon-between">
        <Text size="caption-l" color="secondary">
          FOLIO / RELEASE PLAYBOOK
        </Text>
        <Text size="caption-l" color="muted">
          <Icon icon={CheckCircleIcon} color="success" /> Saved
        </Text>
      </div>
      <div className="icon-toolbar" role="group" aria-label="Formatting preview">
        {tools.map(({ name, glyph }) => (
          <button
            className="icon-tool"
            key={name}
            type="button"
            aria-label={name}
            aria-pressed={active.includes(name)}
            onClick={() =>
              setActive((current) =>
                current.includes(name)
                  ? current.filter((item) => item !== name)
                  : [...current, name],
              )
            }
          >
            <Icon icon={glyph} size="s" />
          </button>
        ))}
        <button
          className="icon-tool"
          type="button"
          aria-label="Insert link (unavailable in preview)"
          disabled
        >
          <Icon icon={LinkIcon} size="s" />
        </button>
      </div>
      <Title as="h3" size="heading-l">
        Ship with shared context
      </Title>
      <Text color="secondary">
        Keep decisions close to the work. Give each release a clear owner and a small, repeatable
        checklist.
      </Text>
      <Text size="caption-l" color="muted">
        Native button stand-ins; selection previews icon states without editing this document.
      </Text>
    </article>
  );
}

export function ConnectorExample(): ReactElement {
  const [connected, setConnected] = useState(true);
  return (
    <article className="icon-product icon-study">
      <div className="icon-row icon-between">
        <div className="icon-row">
          <Icon icon={GithubLogoIcon} size="l" />
          <Icon icon={ArrowsLeftRightIcon} size="s" color="muted" />
          <Text size="caption-l" color="secondary">
            FOLIO
          </Text>
        </div>
        <Text size="caption-l" color="secondary">
          {connected ? 'Connected' : 'Paused'}
        </Text>
      </div>
      <Title as="h3" size="heading-m">
        GitHub Enterprise
      </Title>
      <Text size="body-s" color="secondary">
        Sync architecture decisions and runbooks from your default branch.
      </Text>
      <div className="icon-row icon-between icon-connector-footer">
        <div className="icon-row icon-no-wrap">
          <Icon
            icon={connected ? CheckCircleIcon : WarningCircleIcon}
            size="s"
            color={connected ? 'success' : 'warning'}
          />
          <Text size="body-s" color="secondary">
            {connected ? 'Synced 2 minutes ago' : 'Sync paused'}
          </Text>
        </div>
        <button className="icon-action" type="button" onClick={() => setConnected(!connected)}>
          {connected ? 'Pause sync' : 'Resume sync'}
        </button>
      </div>
      <Text size="caption-l" color="muted">
        Native action stand-in. This preview changes only the local status.
      </Text>
    </article>
  );
}

export function TokenExample(): ReactElement {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="icon-study">
      <label className="icon-row">
        <input
          type="checkbox"
          checked={expanded}
          onChange={(event) => setExpanded(event.currentTarget.checked)}
        />
        <Text as="span" size="body-s">
          Override the local M icon token to 24px
        </Text>
      </label>
      <div
        className="icon-row"
        style={expanded ? ({ '--size-m-icon': '24px' } as CSSProperties) : undefined}
      >
        <Icon icon={GearIcon} size="m" />
        <Icon icon={CheckCircleIcon} size="m" />
        <Text size="body-s" color="secondary">
          {expanded ? '24px local token' : '16px theme token'}
        </Text>
      </div>
    </div>
  );
}
