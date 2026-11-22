import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import type { JSX, ReactNode } from 'react';
import { Blockquote, Code, defineGlyph, Link, Text, Title, UnicaProvider } from '@docouno/unica';
import type { GlyphSource, GlyphSvgProps } from '@docouno/unica';
import { Alert } from '../../../src/prototypes/alert/alert.proto.js';
import { Button } from '../../../src/prototypes/button/button.proto.js';
import { Card } from '../../../src/prototypes/card/card.proto.js';
import { PopoverContent } from '../../../src/prototypes/popover/popover.proto.js';
import { unicaWorkbenchBase } from '../../../src/unica.workbench.shared.js';

function Mark(props: GlyphSvgProps): JSX.Element {
  return (
    <svg {...props} viewBox="0 0 32 16">
      <path fill="currentColor" d="M0 0H12V16H0z M16 8H32V16H16z" />
    </svg>
  );
}

const fixedMark = defineGlyph(Mark);
const noMark = defineGlyph(Mark, () => null);

function NullMark(): null {
  return null;
}

function Baseline(): JSX.Element {
  return <span data-baseline="" style={{ display: 'inline-block', height: 0, width: 0 }} />;
}

function Quote({
  id,
  start,
  end,
}: {
  id: string;
  start?: GlyphSource;
  end?: GlyphSource;
}): JSX.Element {
  return (
    <Blockquote
      data-testid={id}
      status="info"
      iconLeft={start}
      iconRight={end}
      citeUrl="#source"
      attribution={<cite>Usage guide</cite>}
    >
      <p>Open the source record for the context.</p>
      <p>Use the steps that match your document.</p>
    </Blockquote>
  );
}

function ContextSample(): JSX.Element {
  return (
    <div data-surface="base">
      <Code data-testid="canvas">canvas</Code>
      <Code status="neutral" data-testid="neutral">
        neutral
      </Code>
      <Alert status="info">
        <Blockquote status="danger">
          <Code data-testid="alert-quote">through a quote</Code>{' '}
          <Code data-testid="explicit" status="info">
            explicit info
          </Code>
        </Blockquote>
        <Card>
          <span>
            <Code data-testid="card">opaque card</Code>
          </span>
        </Card>
        <Code data-testid="resumed">alert again</Code>
        <span data-surface="base">
          <Code data-testid="base-reset">new base</Code>
        </span>
        <span data-theme="pixel-light">
          <Code data-testid="theme-reset">new theme</Code>
        </span>
        <PopoverContent>
          <Code data-testid="overlay">overlay</Code>
        </PopoverContent>
        <Button data-testid="button" tone="accent">
          Run <Code plate={false}>retry()</Code>
        </Button>
        <Link data-testid="link" href="#source">
          Read <Code plate={false}>config</Code>
        </Link>
      </Alert>
    </div>
  );
}

function SurfaceSample(): JSX.Element {
  const overlay = document.documentElement.dataset.surface === 'overlay';
  // Use the same surface and underlay as the Workbench.
  const theme = unicaWorkbenchBase.themes.find(
    ({ id }) => id === document.documentElement.dataset.theme,
  )!;
  const sample = (
    <Blockquote
      data-testid="surface-quote"
      attribution="Recovery handbook · Verification and escalation paths"
    >
      Preserve the details a reader needs to make the next decision.
    </Blockquote>
  );
  return overlay ? (
    <div className="wb-artboard" data-theme={theme.id}>
      {unicaWorkbenchBase.renderStage?.({
        theme,
        surface: 'overlay',
        overlayStage: true,
        children: <PopoverContent size="l">{sample}</PopoverContent>,
      })}
    </div>
  ) : (
    <div style={{ background: 'var(--bg-canvas)' }}>{sample}</div>
  );
}

function EditorialForm(): JSX.Element {
  const attemptedEditing = { role: 'button', tabindex: 0, contenteditable: 'true' };
  return (
    <form data-testid="form">
      <button type="button">Before</button>
      <Code {...(attemptedEditing as Record<string, unknown>)} data-testid="passive-code">
        command
      </Code>
      <Blockquote
        {...(attemptedEditing as Record<string, unknown>)}
        data-testid="passive-quote"
        attribution={<Link href="#source">Quoted source</Link>}
      >
        Follow the instructions.
      </Blockquote>
      <button type="button">After</button>
      <div contentEditable suppressContentEditableWarning data-testid="editor">
        <Code data-testid="editor-code">Editable literal</Code>
        <Code contentEditable={false} data-testid="fixed-code">
          Fixed literal
        </Code>
        <Blockquote data-testid="editor-quote">Editable quote</Blockquote>
        <Blockquote contentEditable="false" data-testid="fixed-quote">
          Fixed quote
        </Blockquote>
      </div>
      <input name="topic" value="Reading" readOnly />
      <div id="source">Source destination</div>
    </form>
  );
}

function Standalone({ size }: { size: 's' | 'm' | 'l' }): JSX.Element {
  return (
    <div>
      <Text size={`body-${size}`} data-testid={`body-${size}`}>
        Reference body size
      </Text>
      <Code size={size} data-testid={`standalone-${size}`}>
        config
      </Code>
    </div>
  );
}

export default function EditorialFixture(): JSX.Element {
  function line(content: ReactNode): ReactNode {
    return (
      <>
        Set {content} before running the command.
        <Baseline />
      </>
    );
  }

  return (
    <>
      <EditorialForm />
      <div data-testid="literals">
        <Title as="h2" size="heading-m" data-testid="heading">
          {line(<Code>cache</Code>)}
        </Title>
        <Title as="h2" size="heading-m" data-testid="heading-reference">
          {line('cache')}
        </Title>
        <Text size="caption-s" data-testid="caption">
          {line(<Code>cache</Code>)}
        </Text>
        <Text size="caption-s" data-testid="caption-reference">
          {line('cache')}
        </Text>
        <div dir="rtl">
          <Code data-testid="ltr">packages/ui/src/index.ts</Code>
          <Code dir="auto" data-testid="auto">
            مقتطف code
          </Code>
          <Code dir="rtl" data-testid="rtl">
            مقتطف code
          </Code>
        </div>
        {(['s', 'm', 'l'] as const).map((size) => (
          <Standalone key={size} size={size} />
        ))}
        <Code data-testid="empty-code" />
        <Code hidden data-testid="hidden-code">
          Hidden
        </Code>
        <div
          style={{ width: 156, marginInline: 'auto', font: '15px / 26px var(--font-family-base)' }}
          data-testid="measure"
        >
          <Code data-testid="wrapping">
            {
              'packages/ui/src/components/reconnect-with-a-long-timeout  --label="release  candidate"'
            }
          </Code>
        </div>
        <textarea aria-label="Clipboard destination" />
      </div>
      <ContextSample />
      <UnicaProvider iconAdapter="native">
        <div data-testid="quote-layout" style={{ display: 'grid', justifyItems: 'center' }}>
          <Quote id="both" start={Mark} end={fixedMark} />
          <Quote id="end-only" end={fixedMark} />
          <Quote id="start-only" start={Mark} />
          <Quote id="adapter-null" start={noMark} end={fixedMark} />
          <Quote id="component-null" start={Mark} end={NullMark} />
          <Blockquote data-testid="outer-quote">
            Outer passage
            <Blockquote data-testid="inner-quote" size="s">
              Inner passage.
            </Blockquote>
          </Blockquote>
          <Blockquote data-testid="empty-quote" iconLeft={Mark} attribution="Hidden caption" />
          <Blockquote data-testid="hidden-quote" hidden>
            Hidden body.
          </Blockquote>
        </div>
      </UnicaProvider>
      <SurfaceSample />
    </>
  );
}
