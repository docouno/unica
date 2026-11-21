import { createRef } from 'react';
import { Blockquote, Code, defineGlyph } from '@docouno/unica';
import type { BlockquoteProps, BlockquoteTone, CodeProps, CodeTone } from '@docouno/unica';

const root = createRef<HTMLElement>();
const svgRef = createRef<SVGSVGElement>();
const codeTone: CodeTone = 'inherit';
const code: CodeProps = { tone: codeTone, ref: root, lang: 'ar', dir: 'rtl' };
const quoteTone: BlockquoteTone = 'info';
const quote: BlockquoteProps = {
  tone: quoteTone,
  ref: root,
  attribution: <cite>Style guide</cite>,
  iconLeft: defineGlyph(() => <svg />),
};

export const codeUsage = (
  <Code {...code} contentEditable="false">
    retry()
  </Code>
);
export const quoteUsage = (
  <Blockquote {...quote} contentEditable="inherit">
    Retry once.
  </Blockquote>
);

const forbidden = {
  role: 'button',
  tabIndex: 0,
  dangerouslySetInnerHTML: { __html: 'replacement' },
} as const;

// @ts-expect-error Code has a closed role.
<Code role={forbidden.role} />;
// @ts-expect-error Code adds no Tab stop.
<Code tabIndex={forbidden.tabIndex} />;
// @ts-expect-error Code only accepts children.
<Code dangerouslySetInnerHTML={forbidden.dangerouslySetInnerHTML} />;
// @ts-expect-error The native code role prohibits names.
<Code aria-label="name" />;
// @ts-expect-error The native code role prohibits names.
<Code aria-labelledby="name" />;
// @ts-expect-error Code cannot create an editing host.
<Code contentEditable="plaintext-only" />;
// @ts-expect-error Code uses an HTML ref.
<Code ref={svgRef} />;
// @ts-expect-error Code uses the defined tones.
<Code tone="accent" />;
// @ts-expect-error Code uses the defined sizes.
<Code size="xl" />;

// @ts-expect-error Blockquote has a closed role.
<Blockquote role={forbidden.role} />;
// @ts-expect-error Blockquote adds no Tab stop.
<Blockquote tabIndex={forbidden.tabIndex} />;
// @ts-expect-error Blockquote only accepts children.
<Blockquote dangerouslySetInnerHTML={forbidden.dangerouslySetInnerHTML} />;
// @ts-expect-error Blockquote cannot create an editing host.
<Blockquote contentEditable />;
// @ts-expect-error Blockquote uses an HTML ref.
<Blockquote ref={svgRef} />;
// @ts-expect-error Blockquote uses the defined tones.
<Blockquote tone="inherit" />;
// @ts-expect-error Blockquote uses the defined sizes.
<Blockquote size="inherit" />;
