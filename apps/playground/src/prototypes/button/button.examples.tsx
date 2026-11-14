import { useState } from 'react';
import type { ReactElement } from 'react';
import {
  ArrowRightIcon,
  ArrowSquareOutIcon,
  CheckIcon,
  DotsThreeIcon,
  FolderIcon,
  GithubLogoIcon,
  HouseIcon,
  LinkIcon,
  PlusIcon,
  PushPinIcon,
  TextBIcon,
  TextItalicIcon,
  TrashIcon,
  UploadSimpleIcon,
  XIcon,
} from '@phosphor-icons/react';
import { Text } from '../text/text.proto.js';
import { Title } from '../title/title.proto.js';
import type { GlyphProps } from '../icon/icon.proto.js';
import { Button, IconButton } from './button.proto.js';
import type { ButtonSize, ButtonTone, ButtonVariant } from './button.proto.js';
import './button.examples.css';

const variants: readonly ButtonVariant[] = ['primary', 'secondary', 'ghost'];
const tones: readonly ButtonTone[] = ['accent', 'neutral', 'danger'];
const sizes: readonly ButtonSize[] = ['s', 'm', 'l'];

function ForwardArrowIcon(props: GlyphProps): ReactElement {
  return <ArrowRightIcon {...props} data-directional />;
}

export function LightExample(): ReactElement {
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [created, setCreated] = useState(false);
  return (
    <div className="button-study">
      <div className="button-study-light">
        <Button
          iconLeft={PlusIcon}
          loading={loading}
          disabled={disabled}
          onClick={() => setCreated(!created)}
        >
          Create collection
        </Button>
      </div>
      <div className="button-study-row">
        <label className="button-study-control">
          <input
            type="checkbox"
            checked={loading}
            onChange={(event) => setLoading(event.target.checked)}
          />
          Pending
        </label>
        <label className="button-study-control">
          <input
            type="checkbox"
            checked={disabled}
            onChange={(event) => setDisabled(event.target.checked)}
          />
          Disabled
        </label>
      </div>
      <Text size="body-s" color="muted" aria-live="polite">
        {created ? 'Collection created.' : 'Move over the action, press, or focus it with Tab.'}
      </Text>
    </div>
  );
}

export function RoleExamples(): ReactElement {
  return (
    <div className="button-study">
      <div className="button-study-columns">
        {tones.map((tone) => (
          <Text key={tone} size="caption-l" color="muted">
            {tone}
          </Text>
        ))}
      </div>
      {variants.map((variant) => (
        <div className="button-study-group" key={variant}>
          <Text size="caption-l" color="muted">
            {variant}
          </Text>
          <div className="button-study-columns">
            {tones.map((tone) => (
              <Button key={tone} variant={variant} tone={tone} width="full">
                {tone === 'danger' ? 'Delete' : tone === 'neutral' ? 'Save draft' : 'Continue'}
              </Button>
            ))}
          </div>
          <div className="button-study-columns">
            {tones.map((tone) => (
              <IconButton
                key={tone}
                variant={variant}
                tone={tone}
                icon={tone === 'danger' ? TrashIcon : PlusIcon}
                aria-label={tone === 'danger' ? 'Delete item' : 'Add item'}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SizeExamples(): ReactElement {
  return (
    <div className="button-study">
      {sizes.map((size) => (
        <div className="button-study-group" key={size}>
          <Text size="caption-l" color="muted">
            {size} · {size === 's' ? '30 / 14' : size === 'm' ? '40 / 16' : '48 / 20'}px control /
            icon
          </Text>
          <div className="button-study-row">
            <Button size={size}>Create</Button>
            <Button size={size} variant="secondary" tone="neutral" iconLeft={PlusIcon}>
              Create
            </Button>
            <Button size={size} variant="secondary" tone="neutral" iconRight={ForwardArrowIcon}>
              Open
            </Button>
            <Button
              size={size}
              variant="ghost"
              tone="neutral"
              iconLeft={FolderIcon}
              iconRight={ArrowSquareOutIcon}
            >
              Files
            </Button>
            <IconButton size={size} icon={PlusIcon} aria-label="Add item" />
          </div>
        </div>
      ))}
      <Button width="full" iconLeft={PlusIcon}>
        Create collection
      </Button>
    </div>
  );
}

export function StateExamples(): ReactElement {
  return (
    <div className="button-study">
      {variants.map((variant) => (
        <div className="button-study-group" key={variant}>
          <Text size="caption-l" color="muted">
            {variant}
          </Text>
          <div className="button-study-row button-study-states">
            {(
              [
                'rest',
                'hover',
                'active',
                'focus',
                'pressed',
                'loading',
                'disabled',
                'disabled + loading',
              ] as const
            ).map((state) => (
              <div className="button-study-sample" key={state}>
                <div className="button-study-row">
                  <Button
                    variant={variant}
                    tone={variant === 'primary' ? 'accent' : 'neutral'}
                    size="s"
                    previewState={
                      state === 'hover' || state === 'active' || state === 'focus'
                        ? state
                        : undefined
                    }
                    pressed={state === 'pressed' ? true : undefined}
                    loading={state.includes('loading')}
                    disabled={state.includes('disabled')}
                  >
                    Save draft
                  </Button>
                  <IconButton
                    icon={PushPinIcon}
                    aria-label="Pin"
                    size="s"
                    variant={variant}
                    tone={variant === 'primary' ? 'accent' : 'neutral'}
                    previewState={
                      state === 'hover' || state === 'active' || state === 'focus'
                        ? state
                        : undefined
                    }
                    pressed={state === 'pressed' ? true : undefined}
                    loading={state.includes('loading')}
                    disabled={state.includes('disabled')}
                  />
                </div>
                <Text size="caption-m" color="muted">
                  {state}
                </Text>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ToggleExamples(): ReactElement {
  const [bold, setBold] = useState(true);
  const [pinned, setPinned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  return (
    <div className="button-study">
      <div className="button-study-row">
        <IconButton
          variant="ghost"
          icon={TextBIcon}
          aria-label="Bold"
          pressed={bold}
          onPressedChange={setBold}
        />
        <Button
          variant="secondary"
          tone="accent"
          iconLeft={PushPinIcon}
          pressed={pinned}
          onPressedChange={setPinned}
        >
          Pin
        </Button>
        <Button iconLeft={CheckIcon} loading={loading} onClick={() => setSaved(!saved)}>
          Save changes
        </Button>
      </div>
      <label className="button-study-control">
        <input
          type="checkbox"
          checked={loading}
          onChange={(event) => setLoading(event.target.checked)}
        />
        Preview pending request
      </label>
      <Text size="body-s" color="muted" aria-live="polite">
        {loading ? 'Saving changes…' : saved ? 'Changes saved.' : 'Draft is up to date.'}
      </Text>
      <div className="button-study-columns">
        {tones.map((tone) => (
          <div className="button-study-group" key={tone}>
            <Text size="caption-l" color="muted">
              {tone} · pressed
            </Text>
            <Button size="s" variant="secondary" tone={tone} pressed>
              Pin
            </Button>
            <IconButton
              size="s"
              variant="ghost"
              tone={tone}
              icon={PushPinIcon}
              aria-label="Pin"
              pressed
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function OverflowExamples(): ReactElement {
  return (
    <div className="button-study">
      <Text size="body-s" color="muted">
        Long actions wrap inside their available width. Pending actions keep the same label and box.
      </Text>
      <Button width="full" iconLeft={UploadSimpleIcon} iconRight={ForwardArrowIcon}>
        Import selected files into the shared research collection
      </Button>
      <Button width="full" iconLeft={UploadSimpleIcon} iconRight={ForwardArrowIcon} loading>
        Import selected files into the shared research collection
      </Button>
      <div className="button-study-row">
        {sizes.map((size) => (
          <div className="button-study-sample" key={size}>
            <div className="button-study-row">
              <IconButton size={size} icon={PlusIcon} aria-label="Add item" />
              <IconButton size={size} icon={PlusIcon} aria-label="Add item" loading />
            </div>
            <Text size="caption-m" color="muted">
              {size} · rest / loading
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SignInExample(): ReactElement {
  return (
    <div className="button-study button-study-auth">
      <Text size="caption-l" weight="semibold" color="accent">
        FOLIO / YOUR WORK, TOGETHER
      </Text>
      <Title as="h3" size="heading-l">
        A place for your next idea.
      </Title>
      <Text size="body-s" color="muted">
        Sign in to pick up where you left off.
      </Text>
      <label className="button-study-field">
        Work email
        <input type="email" placeholder="you@example.com" />
      </label>
      <Button width="full" size="l" iconRight={ForwardArrowIcon}>
        Continue with email
      </Button>
      <div className="button-study-rule">
        <span>or</span>
      </div>
      <Button width="full" size="l" variant="secondary" tone="neutral" iconLeft={GithubLogoIcon}>
        Continue with GitHub
      </Button>
      <Text size="caption-l" color="muted">
        Your workspace. Your ideas. One place.
      </Text>
    </div>
  );
}

export function EditorExample(): ReactElement {
  const [bold, setBold] = useState(true);
  const [italic, setItalic] = useState(false);
  const [pinned, setPinned] = useState(false);
  return (
    <div className="button-study-editor">
      <aside className="button-study-rail" aria-label="Workspace navigation preview">
        <IconButton
          size="s"
          variant="ghost"
          icon={HouseIcon}
          aria-label="Workspace overview"
          pressed
        />
        <IconButton size="s" variant="ghost" icon={FolderIcon} aria-label="Collections" />
        <IconButton size="s" variant="ghost" icon={PlusIcon} aria-label="New collection" />
      </aside>
      <div className="button-study-editor-main">
        <div className="button-study-toolbar">
          <Text size="caption-l" color="muted">
            Research / Field notes
          </Text>
          <IconButton
            size="s"
            variant="ghost"
            icon={DotsThreeIcon}
            aria-label="More document actions"
          />
        </div>
        <div className="button-study-toolbar" aria-label="Formatting preview">
          <div className="button-study-row">
            <IconButton
              size="s"
              variant="ghost"
              icon={TextBIcon}
              aria-label="Bold"
              pressed={bold}
              onPressedChange={setBold}
            />
            <IconButton
              size="s"
              variant="ghost"
              icon={TextItalicIcon}
              aria-label="Italic"
              pressed={italic}
              onPressedChange={setItalic}
            />
            <IconButton size="s" variant="ghost" icon={LinkIcon} aria-label="Insert link" />
            <IconButton
              size="s"
              variant="ghost"
              icon={PushPinIcon}
              aria-label="Pin"
              pressed={pinned}
              onPressedChange={setPinned}
            />
          </div>
          <Button size="s">Publish</Button>
        </div>
        <div className="button-study-prose">
          <Text size="caption-l" color="muted">
            FIELD NOTES · DRAFT
          </Text>
          <Title as="h3" size="heading-m">
            Make room for good ideas.
          </Title>
          <Text size="body-s" color="secondary">
            Collect the details. Connect the patterns. Turn a quiet observation into something worth
            sharing.
          </Text>
        </div>
      </div>
    </div>
  );
}

export function OverlayExample(): ReactElement {
  const [sent, setSent] = useState(false);
  return (
    <div className="button-study button-study-overlay">
      <div className="button-study-toolbar">
        <Title as="h3" size="heading-m">
          Invite your team
        </Title>
        <IconButton variant="ghost" icon={XIcon} aria-label="Close invitation preview" />
      </div>
      <Text size="body-s" color="secondary">
        Good work gets better together. Invite people to your shared workspace.
      </Text>
      <label className="button-study-field">
        Email address
        <input type="email" placeholder="teammate@example.com" />
      </label>
      <Text size="caption-l" color="muted">
        Members can create collections and edit shared notes.
      </Text>
      <div className="button-study-footer">
        <Button variant="secondary" tone="neutral" onClick={() => setSent(false)}>
          Cancel
        </Button>
        <Button iconLeft={PlusIcon} onClick={() => setSent(true)}>
          Send invite
        </Button>
      </div>
      <Text size="caption-l" color="muted" aria-live="polite">
        {sent ? 'Invitation preview sent.' : 'Only invited people will have access.'}
      </Text>
    </div>
  );
}

export function PopoverExample(): ReactElement {
  return (
    <div className="button-study button-study-overlay button-study-popover">
      <div className="button-study-toolbar">
        <Title as="h3" size="heading-s">
          Share this note
        </Title>
        <IconButton size="s" variant="ghost" icon={XIcon} aria-label="Close sharing preview" />
      </div>
      <Text size="body-s" color="muted">
        Anyone in your workspace can read this note.
      </Text>
      <div className="button-study-footer">
        <Button size="s" variant="secondary" tone="neutral">
          Done
        </Button>
        <Button size="s" iconLeft={LinkIcon}>
          Copy link
        </Button>
      </div>
    </div>
  );
}

export function ImportExample(): ReactElement {
  const [loading, setLoading] = useState(false);
  return (
    <div className="button-study button-study-import">
      <Text size="caption-l" weight="semibold" color="muted">
        WORKSPACE / IMPORT
      </Text>
      <Title as="h3" size="heading-m">
        Bring your knowledge along.
      </Title>
      <Text size="body-s" color="secondary">
        24 Markdown files are ready to join your workspace.
      </Text>
      <div className="button-study-import-file">
        <Text size="body-s">Research archive</Text>
        <Text size="caption-l" color="muted">
          24 files · 3.8 MB
        </Text>
      </div>
      <div className="button-study-footer">
        <Button variant="secondary" tone="neutral" onClick={() => setLoading(false)}>
          Cancel
        </Button>
        <Button iconLeft={UploadSimpleIcon} loading={loading} onClick={() => setLoading(true)}>
          Import 24 files
        </Button>
      </div>
      <Text size="caption-l" color="muted" aria-live="polite">
        {loading
          ? 'Importing files… Cancel resets this preview.'
          : 'Existing notes will stay in place.'}
      </Text>
    </div>
  );
}
