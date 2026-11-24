import { Card, Divider, Flex, Stack, Text } from '@docouno/unica';
import type { ReactElement, ReactNode } from 'react';
import type { PreviewProps } from '../../workbench/types.js';
import { ExampleSurface } from '../shared/example-surface.js';
import './divider.examples.css';

function DividerSample({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <figure className="divider-demo-case">
      <figcaption>
        <Text as="span" size="caption-l" weight="semibold">
          {title}
        </Text>
      </figcaption>
      <Card size="s" variant="subtle" className="divider-demo-stage">
        {children}
      </Card>
    </figure>
  );
}

export function HostLayout({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack gap={16} className="divider-demo-layout">
      <Text size="body-s" weight="semibold">
        Document access
      </Text>
      <Divider {...ctx.subject} />
      <Flex gap={12} align="center">
        <Text size="body-s">Draft</Text>
        <Divider {...ctx.subject} orientation="vertical" />
        <Text size="body-s" color="secondary">
          Saved just now
        </Text>
      </Flex>
      <div className="divider-demo-columns">
        <Stack gap={4}>
          <Text size="body-s" weight="medium">
            <bdi>3 editors</bdi>
          </Text>
          <Text size="caption-l" color="secondary">
            Can make changes
          </Text>
        </Stack>
        <Divider {...ctx.subject} orientation="vertical" />
        <Stack gap={4}>
          <Text size="body-s" weight="medium">
            <bdi>12 readers</bdi>
          </Text>
          <Text size="caption-l" color="secondary">
            Can view and comment
          </Text>
        </Stack>
      </div>
    </Stack>
  );
}

export function Wrapping({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack gap={24} className="divider-demo-comparisons">
      {(['start', 'center', 'end'] as const).map((position) => (
        <DividerSample key={position} title={position.charAt(0).toUpperCase() + position.slice(1)}>
          <Divider
            {...ctx.subject}
            label="or continue with your organization’s email address"
            labelPosition={position}
          />
        </DividerSample>
      ))}
    </Stack>
  );
}

export function Content({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack gap={24} className="divider-demo-comparisons">
      <DividerSample title="Unbroken text">
        <Divider {...ctx.subject} label="anotherworkspaceauthenticationmethod" />
      </DividerSample>
      <DividerSample title="Empty label">
        <Divider {...ctx.subject} label="" />
      </DividerSample>
    </Stack>
  );
}

function SurfaceSample({ ctx }: PreviewProps): ReactElement {
  return (
    <>
      <Text size="body-s" weight="medium">
        Document details
      </Text>
      <Divider {...ctx.subject} />
      <Flex align="center" gap={12}>
        <Text size="caption-l" color="secondary">
          Draft
        </Text>
        <Divider {...ctx.subject} orientation="vertical" />
        <Text size="caption-l" color="secondary">
          Saved just now
        </Text>
      </Flex>
      <Divider {...ctx.subject} label="or use a template" />
      <Text size="body-s" color="secondary">
        <bdi>Start with a reusable outline.</bdi>
      </Text>
    </>
  );
}

export function Surfaces({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="divider-demo-grid">
      <Stack gap={12} className="divider-demo-canvas" data-surface="base">
        <SurfaceSample ctx={ctx} />
      </Stack>
      <Card>
        <SurfaceSample ctx={ctx} />
      </Card>
    </div>
  );
}

export function Overlay({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="divider-demo-overlay">
      <ExampleSurface surface={ctx.surface}>
        <SurfaceSample ctx={ctx} />
      </ExampleSurface>
    </div>
  );
}
