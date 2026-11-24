import type { ReactElement, ReactNode } from 'react';
import { Badge, Kbd, KbdGroup, Link, Stack, Text, Title } from '@docouno/unica';
import type { PreviewProps } from '../../workbench/types.js';
import { TextFrame } from '../text/text.examples.js';
import { HeadingViewport } from './title.viewport.js';
import './title.examples.css';

const headline = 'Build a release checklist your whole team can use';

function Sample({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <Stack gap={4}>
      <Text size="caption-l" color="secondary">
        <bdi>{label}</bdi>
      </Text>
      {children}
    </Stack>
  );
}

export function WrappingExample({ ctx }: PreviewProps): ReactElement {
  return (
    <TextFrame ctx={ctx}>
      <Stack gap={12} className="title-example-measure">
        {(['wrap', 'pretty', 'balance'] as const).map((textWrap) => (
          <Sample key={textWrap} label={textWrap}>
            <Title
              {...(textWrap === 'wrap' ? ctx.subject : {})}
              as="h2"
              size="heading-xl"
              textWrap={textWrap}
            >
              <bdi>{headline}</bdi>
            </Title>
          </Sample>
        ))}
        <Sample label="nowrap">
          <div dir="auto">
            <HeadingViewport>
              <Title as="h2" size="heading-xl" textWrap="nowrap">
                {headline}
              </Title>
            </HeadingViewport>
          </div>
        </Sample>
        <Sample label="Truncate with balance">
          <Title as="h2" size="heading-xl" textWrap="balance" truncate>
            <bdi>{headline}</bdi>
          </Title>
        </Sample>
        <Sample label="Two-line clamp with truncate and nowrap">
          <Title as="h2" size="heading-xl" textWrap="nowrap" truncate lineClamp={2}>
            <bdi>{headline}</bdi>
          </Title>
        </Sample>
      </Stack>
    </TextFrame>
  );
}

export function BaselineExample({ ctx }: PreviewProps): ReactElement {
  return (
    <TextFrame ctx={ctx}>
      <Title {...ctx.subject} as="h2" size="heading-m" className="title-example-line-box">
        <bdi>
          Release notes{' '}
          <Badge size="s" status="info">
            Updated
          </Badge>
        </bdi>
      </Title>
      <Title as="h2" size="heading-m" className="title-example-line-box">
        <bdi>
          Keys{' '}
          <KbdGroup>
            <Kbd label="Control">Ctrl</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </bdi>
      </Title>
      <Title as="h2" size="heading-m" className="title-example-line-box">
        <bdi>
          Read the <Link href="?item=text&tab=compositions&block=reader">handbook entry</Link>
        </bdi>
      </Title>
    </TextFrame>
  );
}
