import { Blockquote } from '@docouno/unica';
import { QuotesIcon } from '@phosphor-icons/react';
import { ExampleSurface } from '../shared/example-surface.js';
import { defineComponent } from '../../workbench/types.js';
import { previewProps, previewText } from '../preview-code.js';
import {
  AnatomyExample,
  ContentExample,
  OpeningQuotes,
  OverflowExample,
  OverlayExample,
  ReadingExample,
  blockquoteSourceUrl,
  readingCode,
} from './blockquote.examples.js';

const defaultPassage =
  'The blockquote element represents a section that is quoted from another source.';
const openingGlyphCode =
  "(props) => <QuotesIcon {...props} style={{ ...props.style, transform: 'rotate(180deg)' }} />";
const glyphChoices = [
  { value: 'none', label: 'None' },
  { value: 'quotes', label: 'Quotation marks', code: 'QuotesIcon' },
] as const;

export default defineComponent({
  id: 'blockquote',
  title: 'Blockquote',
  category: 'Typography',
  status: 'UI',
  summary: 'A quoted passage with optional source credit and decorative marks.',
  componentName: 'Blockquote',
  props: {
    size: {
      kind: 'enum',
      group: 'Geometry',
      default: 'm',
      description: 'The size of the quote and its frame.',
      choices: [{ value: 's' }, { value: 'm' }, { value: 'l' }],
    },
    status: {
      kind: 'enum',
      group: 'Role',
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
      publicType: 'ReactNode',
      default: '',
      description:
        'Source credit below the quote. Empty or omitted attribution leaves the caption out.',
      examples: ['', 'HTML Living Standard'],
    },
    citeUrl: {
      kind: 'string',
      group: 'Content',
      default: '',
      description: 'The source URL recorded on the native blockquote.',
      examples: ['', blockquoteSourceUrl],
    },
    iconLeft: {
      kind: 'slot',
      group: 'Content',
      publicType: 'GlyphSource',
      default: 'none',
      description: 'Decorative mark at the logical start.',
      choices: [
        { value: 'none', label: 'None' },
        { value: 'quotes', label: 'Opening quotation marks', code: openingGlyphCode },
      ],
    },
    iconRight: {
      kind: 'slot',
      group: 'Content',
      publicType: 'GlyphSource',
      default: 'none',
      description: 'Decorative mark at the logical end.',
      choices: glyphChoices,
    },
    children: {
      kind: 'string',
      group: 'Content',
      default: defaultPassage,
      publicType: 'ReactNode',
      description:
        'The editor starts with an example passage. The component supplies no text and hides an empty quote.',
      examples: [defaultPassage, '', 'A concise excerpt.'],
    },
  },
  render: ({ ctx, values: { children, attribution, citeUrl, iconLeft, iconRight, ...props } }) => (
    <ExampleSurface surface={ctx.surface} gap={16}>
      <Blockquote
        {...ctx.subject}
        {...props}
        attribution={attribution ? <bdi>{attribution}</bdi> : undefined}
        citeUrl={citeUrl || undefined}
        iconLeft={iconLeft === 'quotes' ? OpeningQuotes : undefined}
        iconRight={iconRight === 'quotes' ? QuotesIcon : undefined}
      >
        {children ? <bdi>{children}</bdi> : null}
      </Blockquote>
    </ExampleSurface>
  ),
  code: ({ children, attribution, iconLeft, iconRight, ...props }) => {
    const attributes = previewProps(props, {
      size: 'm',
      status: 'neutral',
      citeUrl: '',
    });
    const credit = attribution ? ` attribution={<bdi>${previewText(attribution)}</bdi>}` : '';
    const body = children ? `<bdi>${previewText(children)}</bdi>` : '';
    const leading = iconLeft === 'quotes' ? ` iconLeft={${openingGlyphCode}}` : '';
    const trailing = iconRight === 'quotes' ? ' iconRight={QuotesIcon}' : '';
    const glyphImport =
      leading || trailing ? "\nimport { QuotesIcon } from '@phosphor-icons/react';" : '';
    return `import { Blockquote } from '@docouno/unica';${glyphImport}\n\n<Blockquote${attributes}${credit}${leading}${trailing}>${body}</Blockquote>`;
  },
  constraints: [
    {
      kind: 'ignored',
      when: { children: '' },
      affects: ['attribution', 'iconLeft', 'iconRight'],
      reason: 'Attribution and glyphs appear with a quotation.',
    },
  ],
  states: [
    {
      id: 'sizes',
      rows: 'size',
      title: 'Three reading scales',
      caption:
        'The passage and its padding change with size. The source credit keeps its reading size.',
      fixed: { attribution: 'HTML Living Standard' },
    },
    {
      id: 'statuses',
      rows: 'status',
      title: 'Meaning at the margin',
      caption:
        'Status colors the rail and decorative mark. The passage stays readable in its normal color and makes no live announcement.',
      fixed: { children: 'A concise excerpt.', iconLeft: 'quotes' },
    },
  ],
  cases: [
    {
      id: 'anatomy',
      title: 'A voice, a source, an optional mark',
      kind: 'content',
      mode: 'pinned',
      caption:
        'Compare an uncredited passage, author and source credits, and paired marks. Narrow quotes move the marks above and below the passage.',
      render: AnatomyExample,
    },
    {
      id: 'content',
      title: 'Rich text keeps its own emphasis',
      kind: 'content',
      mode: 'live',
      caption:
        'Paragraphs, a list and a nested quotation keep their own structure. The source link sits outside the quoted passage.',
      render: ContentExample,
    },
    {
      id: 'overflow',
      title: 'Long passages and complete sources',
      kind: 'content',
      mode: 'live',
      caption:
        'The file path and source address wrap in narrow columns. Tab reaches the link in the passage before the link in the credit.',
      render: OverflowExample,
    },
    {
      id: 'overlay',
      title: 'An excerpt on a floating surface',
      kind: 'surface',
      mode: 'pinned',
      overlayStage: true,
      surface: 'overlay',
      caption:
        'The static panel supplies the overlay material. The quote and inline code inherit that surface.',
      render: OverlayExample,
    },
  ],
  compositions: [
    {
      id: 'surfaces',
      title: 'In the reading flow',
      mode: 'pinned',
      caption:
        'An excerpt separates two paragraphs in the reading flow. A second excerpt appears on a card.',
      render: ReadingExample,
      code: readingCode,
    },
  ],
});
