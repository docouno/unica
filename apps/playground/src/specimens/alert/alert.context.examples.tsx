import { useId } from 'react';
import type { ReactElement } from 'react';
import { ArrowClockwiseIcon, CaretUpIcon, PushPinIcon } from '@phosphor-icons/react';
import {
  Alert,
  AlertActions,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  Code,
  Flex,
  IconButton,
  Link,
  Stack,
  Text,
  Title,
} from '@docouno/unica';
import type { PreviewProps } from '../../workbench/types.js';
import { ExampleSurface } from '../shared/example-surface.js';
import { specimenBlockPage } from '../shared/specimen-fragment.js';
import { ContextNotice } from './alert-context-composition.examples.js';
import { notices } from './alert-notices.js';

const retry = {
  secondary: 'Try again',
  ghost: 'Details',
  icon: ArrowClockwiseIcon,
  name: 'Refresh notice',
};

const states = [
  { value: 'ready', label: 'Ready', actions: retry },
  { value: 'pending', label: 'Pending', actions: retry },
  { value: 'disabled', label: 'Disabled', actions: retry },
  {
    value: 'open',
    label: 'Expanded',
    actions: {
      secondary: 'Hide details',
      ghost: 'Details',
      icon: CaretUpIcon,
      name: 'Hide notice details',
    },
  },
  {
    value: 'selected',
    label: 'Selected',
    actions: {
      secondary: 'Pin notice',
      ghost: 'Mute notice',
      icon: PushPinIcon,
      name: 'Pin this notice',
    },
  },
] as const;

function selectedNotice(ctx: PreviewProps['ctx']) {
  return (
    Object.values(notices).find(({ status }) => status === ctx.story?.controls.status) ??
    notices.danger
  );
}

function guidanceHref(themeId: string, status: string): string {
  const page = specimenBlockPage('alert', 'compositions', 'context', themeId);
  return `${page}#alert-guidance-${themeId}-${status}`;
}

export function ContextStateExamples({ ctx }: PreviewProps): ReactElement {
  const notice = selectedNotice(ctx);
  const setting = ctx.story?.controls.underline;
  const underline = setting === 'hover' || setting === 'none' ? setting : 'always';
  const detailsId = useId();
  return (
    <Alert {...ctx.subject} role="none" status={notice.status}>
      <AlertTitle>{notice.title}</AlertTitle>
      <AlertDescription>
        <bdi>
          {notice.description} Reference: <Code>{notice.reference}</Code>.{' '}
          <Link
            href={guidanceHref(ctx.theme.id, notice.status)}
            tone="inherit"
            underline={underline}
          >
            Guidance
          </Link>
          .
        </bdi>
      </AlertDescription>
      <Stack gap={16}>
        {states.map(({ value: state, label, actions }) => (
          <Stack gap={4} key={state}>
            <Text size="body-s" weight="medium">
              {label}
            </Text>
            <Flex gap={12} wrap="wrap" align="center">
              {(['secondary', 'ghost'] as const).map((variant) => (
                <Button
                  key={variant}
                  size="s"
                  variant={variant}
                  tone="neutral"
                  loading={state === 'pending'}
                  disabled={state === 'disabled'}
                  aria-expanded={state === 'open' ? true : undefined}
                  aria-controls={state === 'open' ? detailsId : undefined}
                  pressed={state === 'selected' ? true : undefined}
                >
                  {actions[variant]}
                </Button>
              ))}
              <IconButton
                size="s"
                variant="ghost"
                tone="neutral"
                icon={actions.icon}
                aria-label={actions.name}
                loading={state === 'pending'}
                disabled={state === 'disabled'}
                aria-expanded={state === 'open' ? true : undefined}
                aria-controls={state === 'open' ? detailsId : undefined}
                pressed={state === 'selected' ? true : undefined}
              />
            </Flex>
            {state === 'open' && (
              <div id={detailsId}>
                <Text size="body-s">
                  <bdi>{notice.detail}</bdi>
                </Text>
              </div>
            )}
          </Stack>
        ))}
      </Stack>
    </Alert>
  );
}

export function ContextBoundaryExamples({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack gap={24}>
      <Alert {...ctx.subject} role="none" status="danger">
        <AlertTitle>The source is unavailable</AlertTitle>
        <AlertDescription>
          <bdi>
            Connection error: <Code>connection_timeout</Code>.
          </bdi>
        </AlertDescription>
        <Text size="body-s" color="secondary">
          <bdi>
            Last response: <Code>connection_timeout</Code>.
          </bdi>
        </Text>
        <Card size="s">
          <Title as="h3" size="heading-s">
            Source details
          </Title>
          <Text size="body-s" color="secondary">
            <bdi>
              Source identifier: <Code>source_id</Code>.
            </bdi>
          </Text>
          <Flex gap={8} wrap="wrap">
            <Button size="s" variant="secondary" tone="neutral">
              Inspect source
            </Button>
            <Button size="s" variant="ghost" tone="neutral">
              Details
            </Button>
          </Flex>
        </Card>
        <AlertDescription>
          <bdi>
            Retry the request after resolving <Code>connection_timeout</Code>.
          </bdi>
        </AlertDescription>
        <AlertActions>
          <Button size="s" variant="secondary" tone="neutral">
            Try again
          </Button>
          <Button size="s" variant="ghost" tone="neutral">
            Keep draft
          </Button>
        </AlertActions>
      </Alert>
      <Alert {...ctx.subject} role="none" status="warning">
        <AlertTitle>Review the document owner</AlertTitle>
        <AlertDescription>
          <bdi>
            Owner reference: <Code>owner_id</Code>.
          </bdi>
        </AlertDescription>
        <ExampleSurface surface="overlay" sizing="border-box">
          <Title as="h3" size="heading-s">
            Reference details
          </Title>
          <Text size="body-s" color="secondary">
            <bdi>
              Owner field: <Code>owner_id</Code>.
            </bdi>
          </Text>
          <Flex gap={8} wrap="wrap">
            <Button size="s" variant="secondary" tone="neutral">
              Inspect owner
            </Button>
            <Button size="s" variant="ghost" tone="neutral">
              Close details
            </Button>
          </Flex>
        </ExampleSurface>
        <AlertActions>
          <Button size="s" variant="secondary" tone="neutral">
            Review owner
          </Button>
        </AlertActions>
      </Alert>
      <Alert {...ctx.subject} role="none" status="warning">
        <AlertTitle>This draft has unpublished changes</AlertTitle>
        <AlertDescription>
          <bdi>
            Draft identifier: <Code status="neutral">draft_id</Code>.
          </bdi>
        </AlertDescription>
        <Stack gap={12}>
          <Flex gap={8} wrap="wrap" align="center">
            <Button size="s" variant="secondary" tone="neutral">
              Review draft
            </Button>
            <Code>neutral</Code>
          </Flex>
          <Flex gap={8} wrap="wrap" align="center">
            <Button size="s" variant="primary" tone="accent">
              Create a copy
            </Button>
            <Code>accent</Code>
          </Flex>
          <Flex gap={8} wrap="wrap" align="center">
            <Button size="s" variant="primary" tone="danger">
              Discard draft
            </Button>
            <Code>danger</Code>
          </Flex>
          <Flex>
            <Button size="s" variant="secondary" tone="neutral">
              Inspect <Code plate={false}>draft_id</Code>
            </Button>
          </Flex>
        </Stack>
      </Alert>
    </Stack>
  );
}

export function ContextOverlayExamples({ ctx }: PreviewProps): ReactElement {
  const notice = selectedNotice(ctx);
  return (
    <div data-example-disclosure="" style={{ inlineSize: 'min(100%, 32rem)' }}>
      <ExampleSurface surface={ctx.surface} sizing="border-box">
        <Title as="h2" size="heading-s">
          Workspace notices
        </Title>
        <ContextNotice
          key={notice.status}
          status={notice.status}
          compact
          alertProps={ctx.subject}
          guidanceHref={guidanceHref(ctx.theme.id, notice.status)}
        />
      </ExampleSurface>
    </div>
  );
}
