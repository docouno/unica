import type { ReactElement } from 'react';
import type { GlyphProps } from '../icon/icon.proto.js';
import { QuotesIcon } from '@phosphor-icons/react';
import { defineSpecimen } from '../../workbench/types.js';
import { Blockquote } from './blockquote.proto.js';
import { Code } from '../code/code.proto.js';
import { Card } from '../card/card.proto.js';
import { Link } from '../link/link.proto.js';
import { PopoverBody, PopoverContent, PopoverTitle } from '../popover/popover.proto.js';
import { Text } from '../text/text.proto.js';
import './blockquote.examples.css';

const sourceUrl =
  'https://html.spec.whatwg.org/multipage/grouping-content.html#the-blockquote-element';

function OpeningQuotes(props: GlyphProps): ReactElement {
  return <QuotesIcon {...props} style={{ ...props.style, transform: 'rotate(180deg)' }} />;
}

export default defineSpecimen({
  id: 'blockquote',
  title: 'Blockquote',
  group: 'Typography',
  summary: 'Give another voice room, without interrupting the reading rhythm.',
  sections: [
    {
      id: 'sizes',
      title: 'Three reading scales',
      kind: 'matrix',
      render: () => (
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
      id: 'tones',
      title: 'Meaning at the margin',
      kind: 'matrix',
      render: () => (
        <div className="quote-example-stack">
          <Text size="body-s" color="muted">
            Tone describes the quoted material. It does not turn the excerpt into a live
            notification.
          </Text>
          <Blockquote size="s" attribution={<cite>Editorial principles</cite>}>
            Keep the explanation close to the decision it supports.
          </Blockquote>
          <Blockquote
            size="s"
            tone="info"
            iconLeft={OpeningQuotes}
            attribution={<cite>Release notes · Information</cite>}
          >
            The preview format is available for evaluation.
          </Blockquote>
          <Blockquote size="s" tone="success" attribution={<cite>Review summary · Accepted</cite>}>
            The updated procedure meets the acceptance criteria.
          </Blockquote>
          <Blockquote size="s" tone="warning" attribution={<cite>Migration guide · Caution</cite>}>
            Existing clients may continue using the previous format during the transition.
          </Blockquote>
          <Blockquote size="s" tone="danger" attribution={<cite>Safety policy · Prohibition</cite>}>
            Unverified backups must never be treated as a recovery guarantee.
          </Blockquote>
        </div>
      ),
    },
    {
      id: 'anatomy',
      title: 'A voice, a source, an optional mark',
      kind: 'matrix',
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
      kind: 'states',
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
      kind: 'states',
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
      id: 'surfaces',
      title: 'In the reading flow',
      kind: 'context',
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
    {
      id: 'overlay',
      title: 'An excerpt on a floating surface',
      kind: 'states',
      overlayStage: true,
      surface: 'overlay',
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
});
