import { QuotesIcon } from '@phosphor-icons/react';
import type { IconProps as PhosphorIconProps } from '@phosphor-icons/react';
import { Blockquote, Card, Code, Link, Stack, Text, Title } from '@docouno/unica';
import { ExampleSurface } from '../shared/example-surface.js';
import type { PreviewProps } from '../../workbench/types.js';
import './blockquote.examples.css';

export const blockquoteSourceUrl =
  'https://html.spec.whatwg.org/multipage/grouping-content.html#the-blockquote-element';

export function OpeningQuotes(props: PhosphorIconProps) {
  return <QuotesIcon {...props} style={{ ...props.style, transform: 'rotate(180deg)' }} />;
}

export function AnatomyExample({ ctx }: PreviewProps) {
  return (
    <ExampleSurface surface={ctx.surface} gap={16}>
      <Blockquote {...ctx.subject}>
        <bdi>Make the important thing easy to find.</bdi>
      </Blockquote>
      <Blockquote iconLeft={OpeningQuotes} status="info" attribution="Documentation team">
        <bdi>Three readers looked for the example before reading the introduction.</bdi>
      </Blockquote>
      <Blockquote iconRight={QuotesIcon} attribution={<cite>Research notes</cite>}>
        <bdi>The first example helped readers interpret the rule.</bdi>
      </Blockquote>
      <Blockquote
        size="l"
        iconLeft={OpeningQuotes}
        iconRight={QuotesIcon}
        attribution={
          <bdi>
            Research team · <cite>Interface review</cite>
          </bdi>
        }
      >
        <bdi>Let the reader’s next question shape the next paragraph.</bdi>
      </Blockquote>
    </ExampleSurface>
  );
}

export function ContentExample({ ctx }: PreviewProps) {
  return (
    <ExampleSurface surface={ctx.surface} gap={16}>
      <Blockquote {...ctx.subject} attribution={<cite>Contribution guide</cite>}>
        <p>
          <bdi>
            Keep <Code>strict</Code> enabled. Record <em>what you observed</em> during the review.
          </bdi>
        </p>
        <p>
          <bdi>
            <strong>Include a small example.</strong> A second reader should be able to repeat it.
          </bdi>
        </p>
        <ul>
          <li>
            <bdi>State the expected result.</bdi>
          </li>
          <li>
            <bdi>Explain how you checked it.</bdi>
          </li>
        </ul>
      </Blockquote>
      <Blockquote
        citeUrl={blockquoteSourceUrl}
        attribution={
          <cite>
            <Link href={blockquoteSourceUrl}>HTML Living Standard</Link>
          </cite>
        }
      >
        <bdi>
          Attribution for the quotation, if any, must be placed outside the <Code>blockquote</Code>{' '}
          element.
        </bdi>
      </Blockquote>
      <Blockquote attribution={<cite>Editorial review</cite>}>
        <p>
          <bdi>The first draft began with the author’s advice.</bdi>
        </p>
        <Blockquote size="s">
          <bdi>Start with what the reader needs to know.</bdi>
        </Blockquote>
        <p>
          <bdi>We kept the opening and added a worked example.</bdi>
        </p>
      </Blockquote>
    </ExampleSurface>
  );
}

export function OverflowExample({ ctx }: PreviewProps) {
  return (
    <ExampleSurface surface={ctx.surface} gap={16}>
      <Blockquote
        {...ctx.subject}
        iconLeft={OpeningQuotes}
        iconRight={QuotesIcon}
        attribution={
          <bdi>
            Documentation working group ·{' '}
            <cite>
              Practical guidelines for maintaining reliable references across product generations
            </cite>{' '}
            · Revision 12
          </bdi>
        }
      >
        <p>
          <bdi>
            Keep the reference useful as the interface changes. Retain the original terminology and
            list the dependencies a reader needs.
          </bdi>
        </p>
        <p>
          <bdi>
            Record the result in{' '}
            <Code>packages/documentation/references/release_candidate_validation.md</Code> so the
            next reviewer can find it.
          </bdi>
        </p>
      </Blockquote>
      <Blockquote
        size="s"
        citeUrl={blockquoteSourceUrl}
        attribution={
          <Link dir="ltr" href={blockquoteSourceUrl}>
            {blockquoteSourceUrl}
          </Link>
        }
      >
        <bdi>
          The <Link href={blockquoteSourceUrl}>blockquote</Link> element represents a section that
          is quoted from another source.
        </bdi>
      </Blockquote>
    </ExampleSurface>
  );
}

export function OverlayExample({ ctx }: PreviewProps) {
  return (
    <div className="quote-example-overlay">
      <div
        className="unica-overlay-surface quote-example-panel"
        data-surface="overlay"
        role="group"
        aria-labelledby={ctx.id}
      >
        <Title as="h3" size="heading-s" id={ctx.id}>
          Source excerpt
        </Title>
        <Blockquote
          {...ctx.subject}
          size="s"
          attribution={<cite dir="auto">API guidelines · Cancellation</cite>}
        >
          <p>
            <bdi>
              An <Code>AbortSignal</Code> describes the lifetime of an operation. Create a new
              signal for the next request.
            </bdi>
          </p>
        </Blockquote>
      </div>
    </div>
  );
}

export function ReadingExample({ ctx }: PreviewProps) {
  return (
    <ExampleSurface surface={ctx.surface} gap={16}>
      <Text size="body-s">
        <bdi>The field team took two water-level readings after the rain.</bdi>
      </Text>
      <Blockquote
        {...ctx.subject}
        size="s"
        attribution={<cite dir="auto">Field notebook · 14 May</cite>}
      >
        <bdi>At noon the creek rose above the lower marker.</bdi>
      </Blockquote>
      <Text size="body-s">
        <bdi>By dusk the water had dropped below the mark again.</bdi>
      </Text>
      <Card size="s">
        <Title as="h3" size="heading-s">
          Earlier observation
        </Title>
        <Blockquote size="s" attribution={<cite dir="auto">Field notebook · 13 May</cite>}>
          <bdi>Both markers were dry during the morning survey.</bdi>
        </Blockquote>
      </Card>
    </ExampleSurface>
  );
}

export const readingCode = `import '@docouno/unica/styles.css';
import { Blockquote, Card, Stack, Text, Title } from '@docouno/unica';

<Stack gap={16}>
  <Text size="body-s"><bdi>The field team took two water-level readings after the rain.</bdi></Text>
  <Blockquote size="s" attribution={<cite dir="auto">Field notebook · 14 May</cite>}>
    <bdi>At noon the creek rose above the lower marker.</bdi>
  </Blockquote>
  <Text size="body-s"><bdi>By dusk the water had dropped below the mark again.</bdi></Text>
  <Card size="s">
    <Title as="h3" size="heading-s">Earlier observation</Title>
    <Blockquote size="s" attribution={<cite dir="auto">Field notebook · 13 May</cite>}>
      <bdi>Both markers were dry during the morning survey.</bdi>
    </Blockquote>
  </Card>
</Stack>`;
