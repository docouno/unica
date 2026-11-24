import { Title } from '@docouno/unica';
import { defineComponent } from '../../workbench/types.js';
import type { Constraint } from '../../workbench/types.js';
import { previewProps, previewText } from '../preview-code.js';
import { TextFrame } from '../text/text.examples.js';
import { clampPrecedence, clampSteps, typographyControls } from '../text/typography.controls.js';
import { BaselineExample, WrappingExample } from './title.examples.js';
import { HeadingViewport } from './title.viewport.js';
import {
  AuthExample,
  DrawerExample,
  EditorExample,
  ModalExample,
  authCode,
  drawerCode,
  editorCode,
  modalCode,
} from './title.compositions.js';

const defaultHeading = 'A shared place for the knowledge that moves your team forward';
const measure = { inlineSize: 'min(100%, 26rem)', marginInline: 'auto' };

export default defineComponent({
  id: 'title',
  title: 'Title',
  category: 'Typography',
  status: 'UI',
  summary: 'Semantic h1–h6, independent visual sizes, and browser-native heading wraps.',
  componentName: 'Title',
  props: {
    as: {
      kind: 'enum',
      group: 'Semantics',
      default: 'h1',
      description: 'Choose the level in the document outline.',
      choices: [
        { value: 'h1' },
        { value: 'h2' },
        { value: 'h3' },
        { value: 'h4' },
        { value: 'h5' },
        { value: 'h6' },
      ],
    },
    size: {
      kind: 'enum',
      group: 'Geometry',
      default: 'auto',
      description:
        'When omitted, h1 through h6 use display-s, heading-xl, heading-l, heading-m, heading-s, and body-m respectively. An explicit size preserves the heading level.',
      choices: [
        { value: 'auto', label: 'From level', omit: true },
        { value: 'display-l', label: 'Display L' },
        { value: 'display-m', label: 'Display M' },
        { value: 'display-s', label: 'Display S' },
        { value: 'heading-xl', label: 'Heading XL' },
        { value: 'heading-l', label: 'Heading L' },
        { value: 'heading-m', label: 'Heading M' },
        { value: 'heading-s', label: 'Heading S' },
        { value: 'body-m', label: 'Body M' },
      ],
    },
    weight: {
      kind: 'enum',
      group: 'Role',
      default: 'semibold',
      description: 'Visual weight of the heading.',
      choices: [{ value: 'medium' }, { value: 'semibold' }, { value: 'bold' }],
    },
    ...typographyControls,
    italic: {
      ...typographyControls.italic,
      description:
        'Omit to inherit the surrounding font style. An explicit boolean selects italic or upright headings.',
    },
    textWrap: {
      kind: 'enum',
      group: 'Geometry',
      default: 'wrap',
      description:
        'Wrap normally, keep one line, or let the browser improve line breaks with pretty or balance.',
      choices: [{ value: 'wrap' }, { value: 'nowrap' }, { value: 'pretty' }, { value: 'balance' }],
    },
    children: {
      kind: 'string',
      group: 'Content',
      default: defaultHeading,
      publicType: 'ReactNode',
      description: 'Inline heading content. The editor starts with a sample headline.',
      examples: [defaultHeading, 'Aa', '7', 'Release notes'],
    },
  },
  constraints: [
    ...clampPrecedence,
    {
      kind: 'ignored',
      when: { truncate: true, lineClamp: 'off' },
      affects: ['textWrap'],
      reason: 'Single-line truncation sets its own wrapping behavior.',
    },
    ...clampSteps.map((lineClamp): Constraint => ({
      kind: 'ignored',
      when: { lineClamp },
      affects: ['textWrap'],
      reason: 'Line clamp sets its own wrapping behavior.',
    })),
  ],
  render: ({ ctx, values: { children, size, lineClamp, align, italic, ...props } }) => {
    const unwrapped = props.textWrap === 'nowrap' && !props.truncate && lineClamp === 'off';
    const heading = (
      <Title
        {...ctx.subject}
        {...props}
        size={size === 'auto' ? undefined : size}
        lineClamp={lineClamp === 'off' ? undefined : Number(lineClamp)}
        align={align === 'inherit' ? undefined : align}
        italic={italic === 'auto' ? undefined : italic === 'italic'}
      >
        <bdi>{children}</bdi>
      </Title>
    );
    return (
      <TextFrame ctx={ctx}>
        <div style={measure}>
          {unwrapped ? <HeadingViewport>{heading}</HeadingViewport> : heading}
        </div>
      </TextFrame>
    );
  },
  code: ({ children, size, lineClamp, align, italic, ...props }) => {
    const attributes = previewProps(
      {
        ...props,
        size,
        align,
        ...(italic === 'auto' ? {} : { italic: italic === 'italic' }),
        ...(lineClamp === 'off' ? {} : { lineClamp: Number(lineClamp) }),
      },
      {
        as: 'h1',
        size: 'auto',
        weight: 'semibold',
        color: 'inherit',
        align: 'inherit',
        tabularNums: false,
        textWrap: 'wrap',
        truncate: false,
      },
    );
    const unwrapped = props.textWrap === 'nowrap' && !props.truncate && lineClamp === 'off';
    const heading = `<Title${attributes}><bdi>${previewText(children)}</bdi></Title>`;
    const layout = "style={{ inlineSize: 'min(100%, 26rem)', marginInline: 'auto' }}";
    if (unwrapped) {
      return `import { useState } from 'react';
import '@docouno/unica/styles.css';
import { Title } from '@docouno/unica';

export function UnwrappedHeading() {
  const [overflowing, setOverflowing] = useState(false);
  return (
    <div ${layout}>
      <div className="unica-scrollbar"
        style={{ overflowX: 'auto', minInlineSize: 0, outlineColor: 'var(--focus-ring-color)', outlineOffset: 2 }}
        role={overflowing ? 'region' : undefined}
        aria-label={overflowing ? 'Scrollable single-line heading' : undefined}
        tabIndex={overflowing ? 0 : undefined}
        ref={owner => {
          if (!owner?.firstElementChild) {
            return;
          }
          const observer = new ResizeObserver(() => setOverflowing(owner.scrollWidth > owner.clientWidth));
          observer.observe(owner);
          observer.observe(owner.firstElementChild);
          return () => observer.disconnect();
        }}>
        <div style={{ minInlineSize: 'max-content' }}>${heading}</div>
      </div>
    </div>
  );
}`;
    }
    return `<div ${layout}>${heading}</div>`;
  },
  states: [
    {
      id: 'scale',
      rows: 'size',
      title: 'Visual scale on one heading level',
      caption:
        'Compare eight explicit sizes with the default for a level-two heading. The native heading level stays the same in every row.',
      fixed: { as: 'h2', children: 'Aa' },
    },
    {
      id: 'semantics',
      rows: 'as',
      cols: 'weight',
      title: 'Heading levels and weights',
      caption:
        'Each heading level supplies its own size when size is omitted. Compare medium, semibold, and bold at each level.',
      fixed: { size: 'auto', children: '7' },
    },
  ],
  cases: [
    {
      id: 'wrapping',
      title: 'Line breaks and overflow',
      kind: 'content',
      mode: 'live',
      caption:
        'Compare three wrapping strategies for one heading. Scroll the single line, then inspect how truncation and a two-line clamp take precedence.',
      render: WrappingExample,
    },
    {
      id: 'baseline',
      title: 'Inline elements in a heading',
      kind: 'behavior',
      mode: 'live',
      caption:
        'The guides mark the bottom of each line box. Compare the badge, shortcut and link alongside the heading text. Follow the link to the handbook entry.',
      render: BaselineExample,
    },
  ],
  compositions: [
    {
      id: 'auth',
      title: 'Sign-in introduction',
      mode: 'pinned',
      caption: 'A balanced page heading and a short instruction introduce sign-in.',
      code: authCode,
      render: AuthExample,
    },
    {
      id: 'editor',
      title: 'Article and section headings',
      mode: 'pinned',
      caption:
        'The document title and compact section heading keep their native h1 and h2 levels at different visual sizes.',
      code: editorCode,
      render: EditorExample,
    },
    {
      id: 'drawer',
      title: 'Details panel heading',
      mode: 'pinned',
      surface: 'overlay',
      overlayStage: true,
      caption:
        'The visible heading names a narrow complementary region containing the owner and review interval.',
      code: drawerCode,
      render: DrawerExample,
    },
    {
      id: 'modal',
      title: 'Name a native dialog',
      mode: 'live',
      caption:
        'Open the native dialog to read the invitation policy. Its heading supplies the accessible name. Close or Escape returns focus to the trigger.',
      code: modalCode,
      render: ModalExample,
    },
  ],
});
