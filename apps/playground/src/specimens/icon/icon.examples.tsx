import type { CSSProperties, ReactElement, ReactNode } from 'react';
import {
  ArrowRightIcon,
  BellIcon,
  CaretRightIcon,
  CheckCircleIcon,
  CheckIcon,
  FileTextIcon,
  FolderIcon,
  GearIcon,
  InfoIcon,
  PlusIcon,
  StarIcon,
  WarningCircleIcon,
  XCircleIcon,
  XIcon,
} from '@phosphor-icons/react';
import {
  Card,
  Flex,
  Grid,
  Icon,
  IconButton,
  Stack,
  Text,
  Title,
  UnicaProvider,
} from '@docouno/unica';
import type { GlyphComponent, IconColor } from '@docouno/unica';
import type { PreviewProps } from '../../workbench/types.js';
import { WideGlyph } from './icon.glyph.js';
import './icon.examples.css';

export function IconFrame({
  ctx,
  children,
}: PreviewProps & { readonly children: ReactNode }): ReactElement {
  return (
    <Stack
      gap={12}
      data-surface={ctx.surface}
      className={
        ctx.surface === 'overlay' ? 'icon-study-frame unica-overlay-surface' : 'icon-study-frame'
      }
    >
      {children}
    </Stack>
  );
}

export function SizeExamples({ ctx }: PreviewProps): ReactElement {
  return (
    <IconFrame ctx={ctx}>
      <Flex gap={24} wrap="wrap" align="end">
        {(['s', 'm', 'l'] as const).map((size) => (
          <Stack align="center" gap={4} key={size}>
            <IconButton
              asChild
              aria-label="Read the icon reference"
              icon={InfoIcon}
              size={size}
              tone="neutral"
              variant="secondary"
            >
              <a href="https://github.com/docouno/unica/blob/main/docs/components/icon.md" />
            </IconButton>
            <Text size="caption-l" color="secondary">
              {size.toUpperCase()}
            </Text>
          </Stack>
        ))}
      </Flex>
      <Stack gap={8}>
        <Title as="h3" size="heading-l">
          <Icon usage="slot" icon={FolderIcon} /> <bdi>Project notes</bdi>
        </Title>
        <Text size="body-m">
          <Icon usage="slot" icon={FileTextIcon} /> <bdi>Release checklist</bdi>
        </Text>
        <Text size="body-s" color="muted">
          <Icon usage="slot" icon={CheckIcon} /> <bdi>Updated just now</bdi>
        </Text>
      </Stack>
      <UnicaProvider overrides={{ Icon: { size: 'l' } }}>
        <Stack gap={8}>
          <Title as="h4" size="heading-s">
            Large provider default
          </Title>
          <Text size="body-s">
            <Icon {...ctx.subject} icon={FileTextIcon} /> <bdi>Omitted size</bdi>
          </Text>
          <Text size="body-s">
            <Icon size="inherit" icon={FileTextIcon} /> <bdi>Explicit inherit</bdi>
          </Text>
          <Text size="body-s">
            <Icon usage="slot" icon={FileTextIcon} /> <bdi>Slot inside body text</bdi>
          </Text>
        </Stack>
      </UnicaProvider>
    </IconFrame>
  );
}

export function ShapeExamples({ ctx }: PreviewProps): ReactElement {
  return (
    <IconFrame ctx={ctx}>
      <Flex gap={12} wrap="wrap" align="center">
        {(['m', 'l'] as const).map((size) => (
          <span className="icon-frame-guide" key={size}>
            <Icon {...(size === 'm' ? ctx.subject : {})} icon={WideGlyph} size={size} />
          </span>
        ))}
        <Text size="body-s">
          <bdi>32 × 16 source</bdi>
        </Text>
      </Flex>
      {(['ltr', 'rtl'] as const).map((dir) => (
        <Flex gap={12} wrap="wrap" align="center" key={dir} dir={dir}>
          <Text size="caption-l" color="secondary">
            {dir.toUpperCase()}
          </Text>
          <Icon icon={ArrowRightIcon} size="l" directional />
          <Icon icon={CaretRightIcon} size="l" directional />
          <Icon icon={CheckIcon} size="l" />
          <Icon icon={WarningCircleIcon} size="l" />
        </Flex>
      ))}
      <Flex align="start" gap={8} className="icon-file-row">
        <Icon icon={FileTextIcon} size="m" />
        <Text size="body-s">
          <bdi>quarterly-release-readiness-checklist.md</bdi>
        </Text>
      </Flex>
    </IconFrame>
  );
}

const colors: readonly { color: IconColor; glyph: GlyphComponent; label: string }[] = [
  { color: 'inherit', glyph: FileTextIcon, label: 'Release notes' },
  { color: 'primary', glyph: GearIcon, label: 'Settings' },
  { color: 'secondary', glyph: FolderIcon, label: 'Documents' },
  { color: 'muted', glyph: BellIcon, label: 'Last activity' },
  { color: 'subtle', glyph: StarIcon, label: 'Decoration' },
  { color: 'disabled', glyph: XIcon, label: 'Unavailable' },
  { color: 'accent', glyph: PlusIcon, label: 'Add a file' },
  { color: 'info', glyph: InfoIcon, label: 'Details available' },
  { color: 'success', glyph: CheckCircleIcon, label: 'Saved' },
  { color: 'warning', glyph: WarningCircleIcon, label: 'Review needed' },
  { color: 'danger', glyph: XCircleIcon, label: 'Upload failed' },
];

function ColorList({
  subject,
}: {
  readonly subject?: PreviewProps['ctx']['subject'];
}): ReactElement {
  return (
    <Stack gap={8}>
      {colors.map(({ color, glyph, label }) => (
        <Flex gap={8} align="center" key={color} data-icon-color={color}>
          <Icon {...(color === 'inherit' ? subject : {})} icon={glyph} size="m" color={color} />
          <Text size="body-s">
            <bdi>{label}</bdi>
          </Text>
          <Text size="caption-m" color="secondary">
            <bdi>{color}</bdi>
          </Text>
        </Flex>
      ))}
    </Stack>
  );
}

export function ColorExamples({ ctx }: PreviewProps): ReactElement {
  return (
    <IconFrame ctx={ctx}>
      <Grid columns={{ mobile: 1, tablet: 2 }} gap={16}>
        <Stack gap={12} data-icon-surface={ctx.surface}>
          <Title as="h3" size="heading-s">
            {ctx.surface === 'overlay' ? 'Overlay' : 'Canvas'}
          </Title>
          <ColorList subject={ctx.subject} />
        </Stack>
        <Card size="s" data-icon-surface="card">
          <Stack gap={12}>
            <Title as="h3" size="heading-s">
              Card
            </Title>
            <ColorList />
          </Stack>
        </Card>
      </Grid>
    </IconFrame>
  );
}

export function OverlayExamples({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack
      className="icon-overlay-panel unica-overlay-surface"
      data-surface="overlay"
      gap={12}
      role="group"
      aria-labelledby={ctx.id}
    >
      <Title as="h3" size="heading-s" id={ctx.id}>
        Signals on a floating surface
      </Title>
      <ColorList subject={ctx.subject} />
    </Stack>
  );
}

export function TokenExample({ ctx }: PreviewProps): ReactElement {
  const enlarged = ctx.story?.controls.enlarged === true;
  return (
    <IconFrame ctx={ctx}>
      <Flex
        align="center"
        gap={8}
        wrap="wrap"
        style={enlarged ? ({ '--size-m-icon': '24px' } as CSSProperties) : undefined}
      >
        <Icon {...ctx.subject} icon={GearIcon} size="m" />
        <Icon icon={CheckCircleIcon} size="m" />
        <Text size="body-s">
          <bdi>{enlarged ? '24px local override' : '16px theme default'}</bdi>
        </Text>
      </Flex>
      <Flex align="center" gap={8} wrap="wrap">
        <Icon icon={GearIcon} size="m" />
        <Text size="body-s" color="secondary">
          <bdi>Theme default outside the override</bdi>
        </Text>
      </Flex>
    </IconFrame>
  );
}

export function NameExample({ ctx }: PreviewProps): ReactElement {
  const source = ctx.story?.controls.nameSource ?? 'linked';
  const labelId = `${ctx.id}-name`;
  const linked = source === 'linked';
  const fallback = source === 'fallback';
  const titled = source === 'title';
  return (
    <IconFrame ctx={ctx}>
      <Flex gap={12} align="center">
        <Icon
          {...ctx.subject}
          icon={WideGlyph}
          size="l"
          aria-labelledby={linked ? labelId : fallback ? ' ' : undefined}
          aria-label={linked || fallback ? 'Publication mark' : undefined}
        >
          {titled || linked || fallback ? <title>Project mark</title> : null}
        </Icon>
        {linked ? (
          <Text id={labelId} size="body-m">
            Release ready
          </Text>
        ) : (
          <Text size="body-m">
            {fallback ? 'Publication mark' : titled ? 'Project mark' : 'Decorative mark'}
          </Text>
        )}
      </Flex>
    </IconFrame>
  );
}
