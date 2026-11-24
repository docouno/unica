import type { ReactElement, ReactNode } from 'react';
import { Card, Flex, Link, Stack, Text } from '@docouno/unica';
import type { TextColor } from '@docouno/unica';
import { ExampleSurface } from '../shared/example-surface.js';
import type { PreviewProps } from '../../workbench/types.js';
import './text.examples.css';

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

export function InheritanceExample({ ctx }: PreviewProps): ReactElement {
  return (
    <ExampleSurface surface={ctx.surface}>
      <Sample label="Semantic emphasis">
        <Text>
          <bdi>
            Assign{' '}
            <Text {...ctx.subject} as="strong">
              one review owner
            </Text>{' '}
            before sharing the draft. Mark your own comments <Text as="em">optional</Text>.
          </bdi>
        </Text>
      </Sample>
      <Sample label="Explicit weight and style">
        <Text>
          <bdi>
            <Text as="strong" weight="regular">
              Required:
            </Text>{' '}
            name a reviewer. The word{' '}
            <Text as="em" italic={false}>
              optional
            </Text>{' '}
            applies only to comments.
          </bdi>
        </Text>
      </Sample>
      <Sample label="Foreground from a link">
        <Text>
          <bdi>
            Read the{' '}
            <Link href="https://github.com/docouno/unica/blob/main/docs/components/text.md#layout-and-accessibility">
              <Text as="span" color="inherit">
                layout and accessibility notes
              </Text>
            </Link>{' '}
            for inline text.
          </bdi>
        </Text>
      </Sample>
    </ExampleSurface>
  );
}

const colorSamples = {
  primary: 'Review notes',
  secondary: 'A summary of edits',
  muted: 'Updated yesterday',
  subtle: '·',
  accent: 'Editor’s pick',
  info: 'Review requested',
  success: 'Changes saved',
  warning: 'Review overdue',
  danger: 'Upload failed',
} satisfies Record<Exclude<TextColor, 'inherit'>, string>;

function ColorSet({
  title,
  subject,
}: {
  readonly title: string;
  readonly subject?: PreviewProps['ctx']['subject'];
}): ReactElement {
  return (
    <Stack gap={8}>
      <Text weight="semibold">
        <bdi>{title}</bdi>
      </Text>
      <dl className="text-example-colors">
        {(Object.keys(colorSamples) as (keyof typeof colorSamples)[]).map((color) => (
          <div key={color}>
            <dt>
              <Text as="span" size="caption-l" color="secondary">
                {color}
              </Text>
            </dt>
            <dd>
              {color === 'subtle' ? (
                <Text as="span" size="body-s" color="muted">
                  <bdi>
                    Draft{' '}
                    <Text
                      as="span"
                      size="body-s"
                      color={color}
                      data-sample-color={color}
                      aria-hidden="true"
                    >
                      {colorSamples[color]}
                    </Text>{' '}
                    Revision 4
                  </bdi>
                </Text>
              ) : (
                <Text
                  {...(color === 'primary' ? subject : {})}
                  as="span"
                  size="body-s"
                  color={color}
                  data-sample-color={color}
                >
                  <bdi>{colorSamples[color]}</bdi>
                </Text>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </Stack>
  );
}

export function SurfacesExample({ ctx }: PreviewProps): ReactElement {
  return (
    <ExampleSurface surface={ctx.surface}>
      {ctx.surface === 'overlay' ? (
        <ColorSet title="Overlay surface" subject={ctx.subject} />
      ) : (
        <Flex gap={12} wrap="wrap" align="start">
          <div className="text-example-palette">
            <ColorSet title="Canvas" subject={ctx.subject} />
          </div>
          <Card size="s" className="text-example-palette">
            <ColorSet title="Card" />
          </Card>
        </Flex>
      )}
    </ExampleSurface>
  );
}

const reviewNote =
  'Assign a reviewer before sharing the draft. Keep the decision, its rationale, and the date of the next review together so readers can find the full context.';

export function OverflowExample({ ctx }: PreviewProps): ReactElement {
  return (
    <ExampleSurface surface={ctx.surface}>
      <Stack gap={12} className="text-example-measure">
        <Sample label="Natural wrapping">
          <Text>
            <bdi>{reviewNote}</bdi>
          </Text>
        </Sample>
        <Sample label="Single line">
          <Text truncate>
            <bdi>{reviewNote}</bdi>
          </Text>
        </Sample>
        <Sample label="Truncated inline span">
          <div>
            <Text as="span" truncate>
              <bdi>{reviewNote}</bdi>
            </Text>
          </div>
        </Sample>
        <Sample label="Two-line clamp inside a no-wrap parent">
          <div style={{ whiteSpace: 'nowrap' }}>
            <Text {...ctx.subject} truncate lineClamp={2}>
              <bdi>{reviewNote}</bdi>
            </Text>
          </div>
        </Sample>
        <Sample label="Logical alignment">
          <Text align="start">
            <bdi>Start</bdi>
          </Text>
          <Text align="center">
            <bdi>Center</bdi>
          </Text>
          <Text align="end">
            <bdi>End</bdi>
          </Text>
        </Sample>
      </Stack>
    </ExampleSurface>
  );
}
