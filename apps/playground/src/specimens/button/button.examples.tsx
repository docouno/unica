import { useState } from 'react';
import type { ReactElement } from 'react';
import {
  ArrowRightIcon,
  BellSlashIcon,
  CaretDownIcon,
  DotsThreeIcon,
  FileTextIcon,
  PlusIcon,
  PushPinIcon,
  TextBIcon,
  TrashIcon,
  UploadSimpleIcon,
} from '@phosphor-icons/react';
import { Button, IconButton, Text } from '@docouno/unica';
import type { ButtonSize, ButtonTone, ButtonVariant } from '@docouno/unica';
import type { IconProps as PhosphorIconProps } from '@phosphor-icons/react';
import type { PreviewProps } from '../../workbench/types.js';
import './button.examples.css';

const variants: readonly ButtonVariant[] = ['primary', 'secondary', 'ghost'];
const tones: readonly ButtonTone[] = ['accent', 'neutral', 'danger'];
const sizes: readonly ButtonSize[] = ['s', 'm', 'l'];

function isTone(value: unknown): value is ButtonTone {
  return typeof value === 'string' && (tones as readonly string[]).includes(value);
}

function isSize(value: unknown): value is ButtonSize {
  return typeof value === 'string' && (sizes as readonly string[]).includes(value);
}

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
  readonly props: {
    readonly loading?: boolean;
    readonly disabled?: boolean;
    readonly pressed?: boolean;
  };
}

const actionStates: readonly StateSample[] = [
  { label: 'Available', props: {} },
  { label: 'Pending', props: { loading: true } },
  { label: 'Disabled', props: { disabled: true } },
  { label: 'Disabled + pending', props: { disabled: true, loading: true } },
];

const toggleStates: readonly StateSample[] = [
  { label: 'Off', props: { pressed: false } },
  { label: 'On', props: { pressed: true } },
  { label: 'On + pending', props: { pressed: true, loading: true } },
  { label: 'On + disabled', props: { pressed: true, disabled: true } },
  { label: 'On + disabled + pending', props: { pressed: true, disabled: true, loading: true } },
];

export function LightExample({ ctx }: PreviewProps): ReactElement {
  const loading = ctx.story?.controls.loading === true;
  const disabled = ctx.story?.controls.disabled === true;
  const [activations, setActivations] = useState(0);
  return (
    <div className="button-study" data-comparing={ctx.comparing || undefined}>
      <div className="button-study-response">
        {variants.map((variant) => (
          <div className="button-study-group" key={variant}>
            <Text size="caption-l" color="muted">
              {variant}
            </Text>
            <div className="button-study-pair">
              <Button
                {...ctx.subject}
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
                {...ctx.subject}
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
      <Text size="body-s" color="muted" role="status">
        <bdi>
          {disabled
            ? 'Actions unavailable.'
            : loading
              ? 'Request pending.'
              : `Activations: ${activations}.`}
        </bdi>
      </Text>
    </div>
  );
}

export function StateExamples({ ctx }: PreviewProps): ReactElement {
  const rawTone = ctx.story?.controls.tone;
  const rawSize = ctx.story?.controls.size;
  const tone: ButtonTone = isTone(rawTone) ? rawTone : 'accent';
  const size: ButtonSize = isSize(rawSize) ? rawSize : 'm';
  return (
    <div className="button-study" data-comparing={ctx.comparing || undefined}>
      {variants.map((variant) => (
        <div className="button-study-group" key={variant}>
          <Text size="caption-l" weight="semibold" color="muted">
            {variant} / {tone}
          </Text>
          <div className="button-study-state-grid" data-study-size={size}>
            {actionStates.map(({ label, props }) => (
              <div className="button-study-sample" key={label}>
                <div className="button-study-pair">
                  <Button {...ctx.subject} variant={variant} tone={tone} size={size} {...props}>
                    {toneActions[tone].label}
                  </Button>
                  <IconButton
                    {...ctx.subject}
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

export function ToggleExamples({ ctx }: PreviewProps): ReactElement {
  const rawTone = ctx.story?.controls.tone;
  const rawSize = ctx.story?.controls.size;
  const tone: ButtonTone = isTone(rawTone) ? rawTone : 'neutral';
  const size: ButtonSize = isSize(rawSize) ? rawSize : 's';
  const [bold, setBold] = useState(true);
  const [muted, setMuted] = useState(false);
  const action =
    tone === 'danger'
      ? { label: 'Mute alerts', icon: BellSlashIcon }
      : tone === 'accent'
        ? { label: 'Pin', icon: PushPinIcon }
        : { label: 'Bold', icon: TextBIcon };
  return (
    <div className="button-study" data-comparing={ctx.comparing || undefined}>
      <div className="button-study-row button-study-commands">
        <IconButton
          {...ctx.subject}
          variant="ghost"
          size="m"
          icon={TextBIcon}
          aria-label="Bold"
          pressed={bold}
          onPressedChange={setBold}
        />
        <Button
          {...ctx.subject}
          variant="secondary"
          tone="accent"
          iconLeft={PushPinIcon}
          defaultPressed={false}
        >
          Pin
        </Button>
        <IconButton
          {...ctx.subject}
          variant="ghost"
          size="m"
          tone="danger"
          icon={BellSlashIcon}
          aria-label="Mute alerts"
          pressed={muted}
          onPressedChange={setMuted}
        />
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
                    {...ctx.subject}
                    variant={variant}
                    tone={tone}
                    size={size}
                    iconLeft={action.icon}
                    {...props}
                  >
                    {action.label}
                  </Button>
                  <IconButton
                    {...ctx.subject}
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

export function OverflowExamples({ ctx }: PreviewProps): ReactElement {
  const loading = ctx.story?.controls.loading === true;
  return (
    <div className="button-study" data-comparing={ctx.comparing || undefined}>
      {sizes.map((size) => (
        <div className="button-study-group" key={size}>
          <Text size="caption-l" color="muted">
            {size.toUpperCase()} · natural wrapping
          </Text>
          <div className="button-study-narrow">
            <Button
              {...ctx.subject}
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
          <Button {...ctx.subject} width="full" variant="secondary" tone="neutral">
            Restore workspace_research_archive_2026
          </Button>
        </div>
      </div>
      <div className="button-study-group">
        <Text size="caption-l" color="muted">
          Stable width and height under pending state
        </Text>
        <div className="button-study-narrow">
          <Button
            {...ctx.subject}
            width="full"
            iconLeft={UploadSimpleIcon}
            iconRight={ForwardArrowIcon}
            loading={loading}
          >
            Import documents into the shared collection
          </Button>
        </div>
      </div>
      <div className="button-study-row">
        {sizes.map((size) => (
          <div className="button-study-sample" key={size}>
            <div className="button-study-pair">
              <IconButton {...ctx.subject} size={size} icon={PlusIcon} aria-label="Add item" />
              <IconButton
                {...ctx.subject}
                size={size}
                icon={PlusIcon}
                aria-label="Add item"
                loading
              />
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

export function OpenTriggerExample({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="button-study" data-comparing={ctx.comparing || undefined}>
      <div className="button-study-open-samples">
        {[false, true].map((expanded) => (
          <div className="button-study-sample" key={String(expanded)}>
            <div className="button-study-pair">
              <Button
                {...ctx.subject}
                variant="secondary"
                tone="neutral"
                iconRight={CaretDownIcon}
                aria-expanded={expanded}
              >
                Actions
              </Button>
              <IconButton
                {...ctx.subject}
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
      </div>
    </div>
  );
}

export const workspaceDestination = '/?item=02-workspace-overview';
