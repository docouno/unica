import { ArrowRightIcon } from '@phosphor-icons/react';
import { Blockquote, Icon, Link, Stack, Text, Title } from '@docouno/unica';
import '@docouno/unica/styles.css';

const linkPurpose = 'https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html';

export function LinkReadingExample({ subject = {} } = {}) {
  return (
    <Stack gap={16} style={{ inlineSize: 'min(100%, 44rem)' }}>
      <Title as="h3" size="heading-s">
        <Link {...subject} tone="inherit" href="https://www.w3.org/WAI/tips/writing/">
          Writing for web accessibility
        </Link>
      </Title>
      <Text>
        <bdi>
          Use the{' '}
          <Link {...subject} href="https://www.w3.org/WAI/tutorials/page-structure/">
            page structure tutorial
          </Link>{' '}
          to organize your document. The{' '}
          <Link
            {...subject}
            href="https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a"
          >
            HTML anchor reference
          </Link>{' '}
          explains how to link to each section.
        </bdi>
      </Text>
      <Text size="body-s" color="secondary">
        <bdi>
          When reviewing links, check the guidance on{' '}
          <Link
            {...subject}
            tone="neutral"
            href="https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html"
          >
            visible focus
          </Link>{' '}
          and{' '}
          <Link
            {...subject}
            tone="neutral"
            href="https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html"
          >
            use of color
          </Link>
          .
        </bdi>
      </Text>
      <Blockquote
        citeUrl={linkPurpose}
        attribution={<bdi>W3C WAI, Understanding Link Purpose (In Context)</bdi>}
      >
        <Text size="body-l" italic>
          <bdi>
            “Provide{' '}
            <Link {...subject} tone="inherit" href={linkPurpose}>
              descriptive names or context
            </Link>{' '}
            for all links.”
          </bdi>
        </Text>
      </Blockquote>
      <div>
        <Link
          {...subject}
          size="body-s"
          href="https://www.w3.org/WAI/tutorials/"
          style={{ display: 'inline-block', minBlockSize: 44, alignContent: 'center' }}
        >
          Explore the accessibility tutorials{'\u00a0'}
          <Icon usage="slot" icon={ArrowRightIcon} directional />
        </Link>
      </div>
    </Stack>
  );
}
