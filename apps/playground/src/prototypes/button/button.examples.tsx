import { useState } from 'react';
import type { ReactElement } from 'react';
import {
  ArrowRightIcon,
  ArrowSquareOutIcon,
  BellSlashIcon,
  CaretDownIcon,
  DotsThreeIcon,
  FileTextIcon,
  FolderIcon,
  PlusIcon,
  PushPinIcon,
  TextBIcon,
  TrashIcon,
  UploadSimpleIcon,
} from '@phosphor-icons/react';
import { Text } from '../text/text.proto.js';
import type { IconProps as PhosphorIconProps } from '@phosphor-icons/react';
import { Button, IconButton } from './button.proto.js';
import type { ButtonProps, ButtonSize, ButtonTone, ButtonVariant } from './button.proto.js';
import './button.examples.css';

const variants: readonly ButtonVariant[] = ['primary', 'secondary', 'ghost'];
const tones: readonly ButtonTone[] = ['accent', 'neutral', 'danger'];
const sizes: readonly ButtonSize[] = ['s', 'm', 'l'];

const toneActions = {
  accent: { label: 'Continue', icon: ForwardArrowIcon },
  neutral: { label: 'Save draft', icon: FileTextIcon },
  danger: { label: 'Delete', icon: TrashIcon },
} as const;

export function ForwardArrowIcon(props: PhosphorIconProps): ReactElement {
  return (
    <ArrowRightIcon
      {...props}
      className={`${props.className ?? ''} button-example-forward-glyph`}
    />
  );
}

interface StateSample {
  readonly label: string;
  readonly props: Pick<
    ButtonProps,
    'previewState' | 'previewFocus' | 'loading' | 'disabled' | 'pressed'
  >;
}

const actionStates: readonly StateSample[] = [
  { label: 'Rest', props: { previewState: 'rest' } },
  { label: 'Hover', props: { previewState: 'hover' } },
  { label: 'Active · held down', props: { previewState: 'active' } },
  { label: 'Keyboard focus', props: { previewState: 'focus' } },
  { label: 'Focus + active', props: { previewState: 'active', previewFocus: true } },
  { label: 'Loading', props: { loading: true } },
  { label: 'Loading + focus', props: { loading: true, previewFocus: true } },
  { label: 'Disabled', props: { disabled: true } },
  { label: 'Disabled + loading', props: { disabled: true, loading: true } },
];

const toggleStates: readonly StateSample[] = [
  { label: 'Off', props: { pressed: false } },
  { label: 'On', props: { pressed: true } },
  { label: 'On + hover', props: { pressed: true, previewState: 'hover' } },
  { label: 'On + active', props: { pressed: true, previewState: 'active' } },
  { label: 'On + focus', props: { pressed: true, previewFocus: true } },
  {
    label: 'On + active + focus',
    props: { pressed: true, previewState: 'active', previewFocus: true },
  },
  { label: 'On + loading', props: { pressed: true, loading: true } },
  { label: 'On + loading + focus', props: { pressed: true, loading: true, previewFocus: true } },
  { label: 'On + disabled', props: { pressed: true, disabled: true } },
  { label: 'On + disabled + loading', props: { pressed: true, disabled: true, loading: true } },
];

export function LightExample(): ReactElement {
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [activations, setActivations] = useState(0);
  return (
    <div className="button-study">
      <div className="button-study-response">
        {variants.map((variant) => (
          <div className="button-study-group" key={variant}>
            <Text size="caption-l" color="muted">
              {variant}
            </Text>
            <div className="button-study-pair">
              <Button
                variant={variant}
                tone={variant === 'primary' ? 'accent' : 'neutral'}
                iconLeft={PlusIcon}
                loading={loading}
                disabled={disabled}
                onClick={() => setActivations((count) => count + 1)}
              >
                Create
              </Button>
              <IconButton
                variant={variant}
                tone={variant === 'primary' ? 'accent' : 'neutral'}
                icon={PlusIcon}
                aria-label={`Create with ${variant}`}
                loading={loading}
                disabled={disabled}
                onClick={() => setActivations((count) => count + 1)}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="button-study-controls">
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
      <Text size="body-s" color="muted" role="status">
        {disabled
          ? 'Actions unavailable.'
          : loading
            ? 'Request pending.'
            : `Activations: ${activations}. Approach, hover, hold a press, or focus with Tab.`}
      </Text>
      <Text size="caption-l" color="muted">
        Pinned comparison · primary accent. Approach places the pointer 12px outside the left edge.
      </Text>
      <div className="button-study-response" data-proximity-comparison>
        {(
          [
            ['Rest', 'rest'],
            ['Approach · pointer outside', 'near'],
            ['Hover', 'hover'],
          ] as const
        ).map(([label, previewState]) => (
          <div className="button-study-group" key={label}>
            <Text size="caption-l" color="muted">
              {label}
            </Text>
            <div className="button-study-pair">
              <Button
                iconLeft={PlusIcon}
                previewState={previewState}
                loading={loading}
                disabled={disabled}
              >
                Create
              </Button>
              <IconButton
                variant="primary"
                tone="accent"
                icon={PlusIcon}
                aria-label={`Create · ${label}`}
                previewState={previewState}
                loading={loading}
                disabled={disabled}
              />
            </div>
          </div>
        ))}
      </div>
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
                {toneActions[tone].label}
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
                aria-label={tone === 'danger' ? 'Remove item' : 'Add item'}
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
        <div className="button-study-size-row" key={size}>
          <Text size="caption-l" color="muted">
            {size.toUpperCase()} · {size === 's' ? '30 / 14' : size === 'm' ? '40 / 16' : '48 / 20'}
            px control / icon
          </Text>
          <div className="button-study-row">
            <Button size={size}>Create</Button>
            <Button size={size} variant="secondary" tone="neutral" iconLeft={PlusIcon}>
              Create
            </Button>
            <Button size={size} variant="secondary" tone="neutral" iconRight={ForwardArrowIcon}>
              Continue
            </Button>
            <Button
              size={size}
              variant="ghost"
              tone="neutral"
              iconLeft={FolderIcon}
              iconRight={ArrowSquareOutIcon}
            >
              Open files
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

export function StateExamples({ tone = 'accent' }: { readonly tone?: ButtonTone }): ReactElement {
  const [size, setSize] = useState<ButtonSize>('m');
  return (
    <div className="button-study">
      <div className="button-study-controls">
        <label className="button-study-control">
          Size
          <select
            aria-label="Action size"
            value={size}
            onChange={(event) => setSize(event.target.value as ButtonSize)}
          >
            {sizes.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      </div>
      {variants.map((variant) => (
        <div className="button-study-group" key={variant}>
          <Text size="caption-l" weight="semibold" color="muted">
            {variant} / {tone}
          </Text>
          <div className="button-study-state-grid" data-study-size={size}>
            {actionStates.map(({ label, props }) => (
              <div className="button-study-sample" key={label}>
                <div className="button-study-pair">
                  <Button variant={variant} tone={tone} size={size} {...props}>
                    {toneActions[tone].label}
                  </Button>
                  <IconButton
                    variant={variant}
                    tone={tone}
                    size={size}
                    icon={toneActions[tone].icon}
                    aria-label={toneActions[tone].label}
                    {...props}
                  />
                </div>
                <Text size="caption-m" color="muted">
                  {label}
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
  const [tone, setTone] = useState<ButtonTone>('neutral');
  const [size, setSize] = useState<ButtonSize>('s');
  const [bold, setBold] = useState(true);
  const [pinned, setPinned] = useState(false);
  const [muted, setMuted] = useState(false);
  const action =
    tone === 'danger'
      ? { label: 'Mute alerts', icon: BellSlashIcon }
      : tone === 'accent'
        ? { label: 'Pin', icon: PushPinIcon }
        : { label: 'Bold', icon: TextBIcon };
  return (
    <div className="button-study">
      <div className="button-study-row">
        <IconButton
          variant="ghost"
          size="m"
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
        <IconButton
          variant="ghost"
          size="m"
          tone="danger"
          icon={BellSlashIcon}
          aria-label="Mute alerts"
          pressed={muted}
          onPressedChange={setMuted}
        />
      </div>
      <div className="button-study-controls">
        <label className="button-study-control">
          Tone
          <select
            aria-label="Toggle tone"
            value={tone}
            onChange={(event) => setTone(event.target.value as ButtonTone)}
          >
            {tones.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="button-study-control">
          Size
          <select
            aria-label="Toggle size"
            value={size}
            onChange={(event) => setSize(event.target.value as ButtonSize)}
          >
            {sizes.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      </div>
      {variants.map((variant) => (
        <div className="button-study-group" key={variant}>
          <Text size="caption-l" weight="semibold" color="muted">
            {variant} / {tone} / {size}
          </Text>
          <div className="button-study-state-grid" data-study-size={size}>
            {toggleStates.map(({ label, props }) => (
              <div className="button-study-sample" key={label}>
                <div className="button-study-pair">
                  <Button
                    variant={variant}
                    tone={tone}
                    size={size}
                    iconLeft={action.icon}
                    {...props}
                  >
                    {action.label}
                  </Button>
                  <IconButton
                    variant={variant}
                    tone={tone}
                    size={size}
                    icon={action.icon}
                    aria-label={action.label}
                    {...props}
                  />
                </div>
                <Text size="caption-m" color="muted">
                  {label}
                </Text>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function OverflowExamples(): ReactElement {
  const [loading, setLoading] = useState(false);
  return (
    <div className="button-study">
      {sizes.map((size) => (
        <div className="button-study-group" key={size}>
          <Text size="caption-l" color="muted">
            {size.toUpperCase()} · natural wrapping
          </Text>
          <div className="button-study-narrow">
            <Button
              size={size}
              width="full"
              iconLeft={UploadSimpleIcon}
              iconRight={ForwardArrowIcon}
            >
              Import documents into the shared collection
            </Button>
          </div>
        </div>
      ))}
      <div className="button-study-group">
        <Text size="caption-l" color="muted">
          Unbroken content · defensive fallback
        </Text>
        <div className="button-study-narrow">
          <Button width="full" variant="secondary" tone="neutral">
            Restore workspace_research_archive_2026
          </Button>
        </div>
      </div>
      <div className="button-study-group">
        <Text size="caption-l" color="muted">
          Stable width and height · toggle pending below
        </Text>
        <div className="button-study-narrow">
          <Button
            width="full"
            iconLeft={UploadSimpleIcon}
            iconRight={ForwardArrowIcon}
            loading={loading}
          >
            Import documents into the shared collection
          </Button>
        </div>
        <label className="button-study-control">
          <input
            type="checkbox"
            checked={loading}
            onChange={(event) => setLoading(event.target.checked)}
          />
          Pending request
        </label>
      </div>
      <div className="button-study-row">
        {sizes.map((size) => (
          <div className="button-study-sample" key={size}>
            <div className="button-study-pair">
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

export function OpenTriggerExample(): ReactElement {
  return (
    <div className="button-study">
      <div className="button-study-open-samples">
        {[false, true].map((expanded) => (
          <div className="button-study-sample" key={String(expanded)}>
            <div className="button-study-pair">
              <Button
                variant="secondary"
                tone="neutral"
                iconRight={CaretDownIcon}
                aria-expanded={expanded}
              >
                Actions
              </Button>
              <IconButton
                variant="ghost"
                icon={DotsThreeIcon}
                aria-label="Document actions"
                aria-expanded={expanded}
              />
            </div>
            <Text size="caption-m" color="muted">
              {expanded ? 'Open · no pressed state' : 'Closed'}
            </Text>
          </div>
        ))}
        <div className="button-study-sample">
          <div className="button-study-pair">
            <Button
              variant="secondary"
              tone="neutral"
              iconRight={CaretDownIcon}
              aria-expanded
              previewFocus
            >
              Actions
            </Button>
            <IconButton
              variant="ghost"
              icon={DotsThreeIcon}
              aria-label="Document actions"
              aria-expanded
              previewFocus
            />
          </div>
          <Text size="caption-m" color="muted">
            Open + focus
          </Text>
        </div>
      </div>
    </div>
  );
}
