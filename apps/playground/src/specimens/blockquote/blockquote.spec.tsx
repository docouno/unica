import { Blockquote, Code, Link, Text } from '@docouno/unica';
import { previewProps, previewText } from '../preview-code.js';
import type { ReactElement } from 'react';
import type { IconProps as PhosphorIconProps } from '@phosphor-icons/react';
import { QuotesIcon } from '@phosphor-icons/react';
import { defineComponent } from '../../workbench/types.js';
import { Card } from '../../prototypes/card/card.proto.js';
import {
  PopoverBody,
  PopoverContent,
  PopoverTitle,
} from '../../prototypes/popover/popover.proto.js';
import './blockquote.examples.css';

const sourceUrl =
  'https://html.spec.whatwg.org/multipage/grouping-content.html#the-blockquote-element';
const defaultAttribution = 'On-call handbook';
const defaultPassage = 'Write the decision down while you still have the context.';

const glyphChoices = [
  { value: 'none', label: 'None' },
  { value: 'quotes', label: 'Quotation marks' },
] as const;

function OpeningQuotes(props: PhosphorIconProps): ReactElement {
  return <QuotesIcon {...props} style={{ ...props.style, transform: 'rotate(180deg)' }} />;
}

export default defineComponent({
  id: 'blockquote',
  title: 'Blockquote',
  category: 'Typography',
  status: 'UI',
  summary: 'Give another voice room, without interrupting the reading rhythm.',
  componentName: 'Blockquote',
  props: {
    size: {
      kind: 'enum',
      group: 'Appearance',
      default: 'm',
      description: 'The size of the quote and its frame.',
      choices: [{ value: 's' }, { value: 'm' }, { value: 'l' }],
    },
    status: {
      kind: 'enum',
      group: 'Appearance',
      default: 'neutral',
      description: 'The semantic status of the quotation.',
      choices: [
        { value: 'neutral' },
        { value: 'info' },
        { value: 'success' },
        { value: 'warning' },
        { value: 'danger' },
      ],
    },
    attribution: {
      kind: 'string',
      group: 'Content',
      default: defaultAttribution,
      description: 'Optional source credit below the quote.',
      examples: [defaultAttribution, ''],
    },
    citeUrl: {
      kind: 'string',
      group: 'Content',
      default: '',
      description: 'The source URL recorded on the native blockquote.',
      examples: ['', sourceUrl],
    },
    iconLeft: {
      kind: 'slot',
      group: 'Glyphs',
      default: 'none',
      description: 'Decorative mark at the logical start.',
      choices: glyphChoices,
    },
    iconRight: {
      kind: 'slot',
      group: 'Glyphs',
      default: 'none',
      description: 'Decorative mark at the logical end.',
      choices: glyphChoices,
    },
    children: {
      kind: 'string',
      group: 'Content',
      default: defaultPassage,
      description: 'Text of the quotation.',
      examples: [defaultPassage, '', 'A concise excerpt.'],
    },
  },
  render: ({ ctx, values: { children, citeUrl, iconLeft, iconRight, ...props } }) => (
    <Blockquote
      {...ctx.subject}
      {...props}
      citeUrl={citeUrl || undefined}
      iconLeft={iconLeft === 'quotes' ? QuotesIcon : undefined}
      iconRight={iconRight === 'quotes' ? QuotesIcon : undefined}
    >
      {children}
    </Blockquote>
  ),
  code: ({ children, iconLeft, iconRight, ...props }) => {
    const attributes = previewProps(props, {
      size: 'm',
      status: 'neutral',
      attribution: '',
      citeUrl: '',
    });
    const leading = iconLeft === 'quotes' ? ' iconLeft={QuotesIcon}' : '';
    const trailing = iconRight === 'quotes' ? ' iconRight={QuotesIcon}' : '';
    return `<Blockquote${attributes}${leading}${trailing}>${previewText(children)}</Blockquote>`;
  },
  constraints: [
    {
      kind: 'ignored',
      when: { children: '' },
      affects: ['attribution', 'iconLeft', 'iconRight'],
      reason: 'Attribution and glyphs appear with a quotation.',
    },
  ],
  matrixViews: [
    {
      id: 'sizes',
      rows: 'size',
      title: 'Three reading scales',
      reference: () => (
        <div className="quote-example-stack">
          {(['s', 'm', 'l'] as const).map((size) => (
            <div className="quote-example-stack quote-example-compact" key={size}>
              <Text size="caption-l" color="muted">
                {size.toUpperCase()} ·{' '}
                {size === 's'
                  ? 'COMPACT EXCERPT'
                  : size === 'm'
                    ? 'READING DEFAULT'
                    : 'FEATURED PASSAGE'}
              </Text>
              <Blockquote size={size} attribution={<cite>Writing guidelines · Clarity</cite>}>
                Good documentation gives the reader enough context to make the next decision with
                confidence.
              </Blockquote>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'statuses',
      rows: 'status',
      title: 'Meaning at the margin',
      reference: () => (
        <div className="quote-example-stack">
          <Text size="body-s" color="muted">
            Status describes the quoted material. It does not turn the excerpt into a live
            notification.
          </Text>
          <Blockquote size="s" attribution={<cite>Editorial principles</cite>}>
            Keep the explanation close to the decision it supports.
          </Blockquote>
          <Blockquote
            size="s"
            status="info"
            iconLeft={OpeningQuotes}
            attribution={<cite>Release notes · Information</cite>}
          >
            The preview format is available for evaluation.
          </Blockquote>
          <Blockquote
            size="s"
            status="success"
            attribution={<cite>Review summary · Accepted</cite>}
          >
            The updated procedure meets the acceptance criteria.
          </Blockquote>
          <Blockquote
            size="s"
            status="warning"
            attribution={<cite>Migration guide · Caution</cite>}
          >
            Existing clients may continue using the previous format during the transition.
          </Blockquote>
          <Blockquote
            size="s"
            status="danger"
            attribution={<cite>Safety policy · Prohibition</cite>}
          >
            Unverified backups must never be treated as a recovery guarantee.
          </Blockquote>
        </div>
      ),
    },
  ],
  cases: [
    {
      id: 'anatomy',
      title: 'A voice, a source, an optional mark',
      kind: 'behavior',
      render: () => (
        <div className="quote-example-stack">
          <div className="quote-example-stack quote-example-compact">
            <Text size="caption-l" color="muted">
              TEXT ONLY
            </Text>
            <Blockquote>Make the important thing easy to find.</Blockquote>
          </div>
          <div className="quote-example-stack quote-example-compact">
            <Text size="caption-l" color="muted">
              LEADING MARK · AUTHOR
            </Text>
            <Blockquote iconLeft={OpeningQuotes} attribution="Documentation team">
              We learned more from watching one person read the page than from another round of
              polishing it.
            </Blockquote>
          </div>
          <div className="quote-example-stack quote-example-compact">
            <Text size="caption-l" color="muted">
              TRAILING MARK · SOURCE
            </Text>
            <Blockquote
              iconRight={QuotesIcon}
              attribution={<cite>Research notes · Finding 04</cite>}
            >
              The smallest useful example often explains the rule better than the longest
              definition.
            </Blockquote>
          </div>
          <div className="quote-example-stack quote-example-compact">
            <Text size="caption-l" color="muted">
              PAIRED MARKS · AUTHOR AND SOURCE
            </Text>
            <Blockquote
              size="l"
              iconLeft={OpeningQuotes}
              iconRight={QuotesIcon}
              attribution={
                <>
                  Research team · <cite>Interface review</cite>
                </>
              }
            >
              Let the reader’s next question shape the next paragraph.
            </Blockquote>
          </div>
        </div>
      ),
    },
    {
      id: 'content',
      title: 'Rich text keeps its own emphasis',
      kind: 'behavior',
      render: () => (
        <div className="quote-example-stack">
          <Blockquote attribution={<cite>Contribution guide · Verification</cite>}>
            <p>
              Keep <Code>strict</Code> enabled. A passing build is <em>useful evidence</em>, but it
              is not the whole review.
            </p>
            <p>
              <strong>Describe what the reader can observe.</strong> Include the smallest example
              that demonstrates the change.
            </p>
            <ul>
              <li>State the expected result.</li>
              <li>Explain how the result was checked.</li>
            </ul>
          </Blockquote>
          <Blockquote
            citeUrl={sourceUrl}
            attribution={
              <cite>
                <Link href={sourceUrl}>HTML Living Standard</Link>
              </cite>
            }
          >
            Attribution for the quotation, if any, must be placed outside the{' '}
            <Code>blockquote</Code> element.
          </Blockquote>
          <div className="quote-example-stack quote-example-compact">
            <Text size="caption-l" color="muted">
              ONE QUOTED EXCERPT WITHIN A QUOTE
            </Text>
            <Blockquote attribution={<cite>Editorial review · Reply</cite>}>
              <p>The earlier guidance was concise:</p>
              <Blockquote size="s">Start with what the reader needs to know.</Blockquote>
              <p>We should keep that principle and add a concrete example.</p>
            </Blockquote>
          </div>
        </div>
      ),
    },
    {
      id: 'overflow',
      title: 'Long passages and complete sources',
      kind: 'content',
      render: () => (
        <div className="quote-example-stack">
          <Blockquote
            iconLeft={OpeningQuotes}
            iconRight={QuotesIcon}
            attribution={
              <>
                Documentation working group ·{' '}
                <cite>
                  Practical guidelines for maintaining reliable references across multiple product
                  generations
                </cite>{' '}
                · Revision 12
              </>
            }
          >
            <p>
              A reference should remain useful when the surrounding interface changes. Keep the
              explanation specific, retain the original terminology, and make every dependency
              visible to the reader.
            </p>
            <p>
              When a path such as{' '}
              <Code>packages/documentation/references/release_candidate_validation.md</Code> is
              essential, show it in full.
            </p>
          </Blockquote>
          <Blockquote
            size="s"
            citeUrl={sourceUrl}
            attribution={
              <cite>
                <Link href={sourceUrl}>{sourceUrl}</Link>
              </cite>
            }
          >
            <p>
              Attribution [...] must be placed <Link href={sourceUrl}>outside</Link> the{' '}
              <Code>blockquote</Code> element.
            </p>
          </Blockquote>
          <Text size="body-s" color="muted">
            Select the text or Tab to either source link. Long text wraps; the quote has no internal
            scroll, collapse, or truncation.
          </Text>
        </div>
      ),
    },
    {
      id: 'overlay',
      title: 'An excerpt on a floating surface',
      overlayStage: true,
      surface: 'overlay',
      kind: 'surface',
      render: () => (
        <div className="quote-example-stack quote-example-overlay">
          <PopoverContent size="l" role="group" aria-label="Quoted source on overlay material">
            <PopoverBody>
              <PopoverTitle>Source excerpt</PopoverTitle>
              <Blockquote size="s" attribution={<cite>API guidelines · Cancellation</cite>}>
                <p>
                  An <Code>AbortSignal</Code> describes the lifetime of an operation. Once aborted,
                  it cannot be reset.
                </p>
              </Blockquote>
              <Text size="body-s" color="muted">
                Static surface study. The panel supplies the glass; the quotation adds no blur or
                shadow.
              </Text>
            </PopoverBody>
          </PopoverContent>
        </div>
      ),
    },
  ],
  usage: [
    {
      id: 'surfaces',
      code: `<Card>
  <Blockquote attribution="On-call handbook">Document the recovery steps.</Blockquote>
</Card>`,
      title: 'In the reading flow',
      render: () => (
        <div className="quote-example-stack">
          <Text size="body-s">
            A clear introduction sets the context. The excerpt that follows can then speak in its
            own voice.
          </Text>
          <Blockquote size="s" attribution={<cite>Reading guidelines · Context</cite>}>
            Introduce a quotation with the reason it matters to the reader.
          </Blockquote>
          <Text size="body-s">
            The surrounding paragraph resumes at its original margin, without competing with the
            quoted passage.
          </Text>
          <Card size="m">
            <Text size="caption-l" color="muted">
              ON A CARD SURFACE
            </Text>
            <Blockquote size="s" attribution={<cite>Reference notes</cite>}>
              A small, complete example is easier to trust than an impressive fragment.
            </Blockquote>
          </Card>
        </div>
      ),
    },
  ],
});
