import { Alert, AlertTitle, Box, Card, Flex, Icon, Link, Stack, Text } from '@docouno/unica';
import { ArrowRightIcon, FileTextIcon } from '@phosphor-icons/react';
import type { ReactElement, ReactNode } from 'react';
import type { PreviewProps } from '../../workbench/types.js';
import { ExampleSurface } from '../shared/example-surface.js';
import { focusLinkedFragment, specimenBlockPage } from '../shared/specimen-fragment.js';

const writing = 'https://www.w3.org/WAI/tips/writing/';
const linkPurpose = 'https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html';
const errors = 'https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html';
const notifications = 'https://www.w3.org/WAI/tutorials/forms/notifications/';

function Study({ label, children }: { label: string; children: ReactNode }): ReactElement {
  return (
    <Stack gap={8}>
      <Text size="caption-l" color="muted">
        {label}
      </Text>
      {children}
    </Stack>
  );
}

export function LinkGlyphStudy({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack gap={24}>
      <Study label="Leading document glyph">
        <Text size="body-s" italic>
          <Link {...ctx.subject} href={writing} iconLeft={FileTextIcon}>
            Writing for Web Accessibility
          </Link>
        </Text>
      </Study>
      <Study label="External destination in this tab">
        <Text size="body-s">
          <Link {...ctx.subject} href={linkPurpose} external>
            Understanding link purpose
          </Link>
        </Text>
      </Study>
      <Study label="External destination in a new tab">
        <Text size="body-s">
          <Link {...ctx.subject} href={linkPurpose} target="_blank">
            Understanding link purpose
          </Link>
        </Text>
      </Study>
    </Stack>
  );
}

export function LinkStates({ ctx }: PreviewProps): ReactElement {
  const id = 'link-states-' + ctx.theme.id;
  const page = specimenBlockPage('link', 'states', 'states', ctx.theme.id);
  return (
    <Stack
      id={id}
      ref={focusLinkedFragment}
      tabIndex={-1}
      role="group"
      aria-label="Link states"
      gap={24}
    >
      {(['accent', 'neutral', 'inherit'] as const).map((tone) => (
        <Study key={tone} label={tone}>
          <Flex gap={16} wrap="wrap" align="baseline">
            <Text size="body-s">
              <Link {...ctx.subject} href={writing} tone={tone} external>
                Writing tips
              </Link>
            </Text>
            <Text size="body-s">
              <Link {...ctx.subject} href={page + '#' + id} tone={tone} aria-current="page">
                Link states
              </Link>
            </Text>
            <Text size="body-s">
              <Link {...ctx.subject} disabled external tone={tone}>
                Archived guide
              </Link>
            </Text>
          </Flex>
        </Study>
      ))}
    </Stack>
  );
}

export function LinkWrapping({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack gap={24} style={{ inlineSize: 'min(100%, 34rem)' }}>
      <Study label="Long reference">
        <Text size="body-m">
          <bdi>
            Before publishing, review the{' '}
            <Link {...ctx.subject} href={writing} external>
              practical guidance for writing accessible web content
            </Link>
            .
          </bdi>
        </Text>
      </Study>
      <Study label="Long URL">
        <Text size="body-s">
          <Link {...ctx.subject} href={linkPurpose} external>
            <bdi>{linkPurpose}</bdi>
          </Link>
        </Text>
      </Study>
      <Study label="Latin identifier in the reading direction">
        <Text size="body-s">
          <bdi>
            Reference:{' '}
            <Link {...ctx.subject} href={linkPurpose} external>
              <bdi>WCAG 2.2 SC 2.4.4</bdi>
            </Link>
            .
          </bdi>
        </Text>
      </Study>
      <Study label="Directional continuation">
        <Text size="body-s">
          <Link {...ctx.subject} href={writing}>
            Read the writing tips{'\u00a0'}
            <Icon usage="slot" icon={ArrowRightIcon} directional />
          </Link>
        </Text>
      </Study>
    </Stack>
  );
}

function SurfaceLinks({
  ctx,
  surface,
}: PreviewProps & { surface: 'Canvas' | 'Card' | 'Overlay' }): ReactElement {
  const block = surface === 'Overlay' ? 'overlay' : 'surfaces';
  const id = 'link-surface-' + surface.toLowerCase() + '-' + ctx.theme.id;
  const page = specimenBlockPage('link', 'states', block, ctx.theme.id);
  return (
    <Stack
      id={id}
      ref={focusLinkedFragment}
      tabIndex={-1}
      role="group"
      aria-label={surface + ' links'}
      gap={12}
    >
      <Text size="caption-l" color="muted">
        {surface}
      </Text>
      <Text size="body-s">
        <bdi>
          Compare the{' '}
          <Link {...ctx.subject} href={writing}>
            writing tips
          </Link>{' '}
          with the{' '}
          <Link {...ctx.subject} href={linkPurpose} tone="neutral">
            link purpose criterion
          </Link>
          .
        </bdi>
      </Text>
      <Flex gap={16} wrap="wrap" align="baseline">
        <Text size="body-s">
          <Link {...ctx.subject} href={notifications} external>
            Form notifications
          </Link>
        </Text>
        <Text size="body-s">
          <Link {...ctx.subject} href={page + '#' + id} aria-current="page">
            {surface} links
          </Link>
        </Text>
        <Text size="body-s">
          <Link {...ctx.subject} disabled>
            Archived guide
          </Link>
        </Text>
      </Flex>
    </Stack>
  );
}

export function LinkSurfaces({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack gap={16}>
      <Box padding={16} style={{ backgroundColor: 'var(--bg-canvas)' }} data-surface="base">
        <SurfaceLinks ctx={ctx} surface="Canvas" />
      </Box>
      <Card size="s" data-surface="base">
        <SurfaceLinks ctx={ctx} surface="Card" />
      </Card>
    </Stack>
  );
}

export function LinkOverlay({ ctx }: PreviewProps): ReactElement {
  return (
    <ExampleSurface surface="overlay" sizing="border-box">
      <SurfaceLinks ctx={ctx} surface="Overlay" />
    </ExampleSurface>
  );
}

export function LinkContext({ ctx }: PreviewProps): ReactElement {
  return (
    <Alert role="none" status="danger">
      <AlertTitle>The form has validation errors</AlertTitle>
      <Text size="body-s" color="secondary">
        <Link {...ctx.subject} href={errors} tone="inherit">
          Error identification
        </Link>
      </Text>
      <Card size="s" data-surface="base">
        <Text size="body-s" color="secondary">
          <Link {...ctx.subject} href={writing} tone="inherit">
            Writing tips for clear instructions
          </Link>
        </Text>
      </Card>
      <ExampleSurface surface="overlay" sizing="border-box">
        <Text size="body-s" color="secondary">
          <Link {...ctx.subject} href={notifications} tone="inherit">
            Form notifications
          </Link>
        </Text>
      </ExampleSurface>
      <Text size="body-s" color="secondary">
        <Link {...ctx.subject} href={errors + '#examples'} tone="inherit">
          Examples of error identification
        </Link>
      </Text>
    </Alert>
  );
}
