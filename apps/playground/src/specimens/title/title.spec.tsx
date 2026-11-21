import { Kbd } from '@docouno/unica';
import { previewProps, previewText } from '../preview-code.js';
import { defineComponent } from '../../workbench/types.js';
import { Text, Title } from '@docouno/unica';
import {
  EditorCopy,
  Example,
  longHeading,
  OverlayCopy,
  SignInCopy,
} from '../text/typography.examples.js';
import type { HeadingTag, TitleSize } from '@docouno/unica';
import type { Constraint } from '../../workbench/types.js';
import { clampPrecedence, clampSteps, typographyControls } from '../text/typography.controls.js';

const sizes: readonly TitleSize[] = [
  'display-l',
  'display-m',
  'display-s',
  'heading-xl',
  'heading-l',
  'heading-m',
  'heading-s',
  'body-m',
];

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
      kind: 'slot',
      group: 'Typography',
      default: 'auto',
      description: 'Choose an independent size or use the heading level’s default.',
      choices: [
        { value: 'auto', label: 'From level' },
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
      group: 'Typography',
      default: 'semibold',
      description: 'Visual weight of the heading.',
      choices: [{ value: 'medium' }, { value: 'semibold' }, { value: 'bold' }],
    },
    ...typographyControls,
    textWrap: {
      kind: 'enum',
      group: 'Overflow',
      default: 'wrap',
      description: 'How the heading uses its line measure.',
      choices: [{ value: 'wrap' }, { value: 'nowrap' }, { value: 'pretty' }, { value: 'balance' }],
    },
    children: {
      kind: 'string',
      group: 'Content',
      default: 'A shared place for the knowledge that moves your team forward',
      description: 'Heading to measure or wrap.',
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
  render: ({ ctx, values: { children, size, lineClamp, align, italic, ...props } }) => (
    <Title
      {...ctx.subject}
      {...props}
      size={size === 'auto' ? undefined : size}
      lineClamp={lineClamp === 'off' ? undefined : Number(lineClamp)}
      align={align === 'inherit' ? undefined : align}
      italic={italic === 'auto' ? undefined : italic === 'italic'}
      style={{ maxInlineSize: 'min(100%, 26rem)' }}
    >
      {children}
    </Title>
  ),
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
    return `<Title${attributes}>${previewText(children)}</Title>`;
  },
  matrixViews: [
    {
      id: 'scale',
      rows: 'size',
      title: 'Visual heading scale',
      reference: () => (
        <div className="type-study">
          {sizes.map((size) => (
            <Example key={size} label={size}>
              <Title as="h2" size={size} data-sample-size={size}>
                Shared ideas
              </Title>
            </Example>
          ))}
        </div>
      ),
    },
    {
      id: 'semantics',
      rows: 'as',
      cols: 'weight',
      title: 'Semantic defaults & heading weight',
      reference: () => (
        <div className="type-study">
          {(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as readonly HeadingTag[]).map((as) => (
            <Example key={as} label={as}>
              <Title as={as}>The next chapter</Title>
            </Example>
          ))}
          <Example label="h2 with heading-m">
            <Title as="h2" size="heading-m">
              A compact section, still a level-two heading
            </Title>
          </Example>
          {(['medium', 'semibold', 'bold'] as const).map((weight) => (
            <Example key={weight} label={weight}>
              <Title as="h2" size="heading-m" weight={weight}>
                Workspace decisions
              </Title>
            </Example>
          ))}
        </div>
      ),
    },
  ],
  cases: [
    {
      id: 'wrapping',
      title: 'Live wrapping & overflow priority',
      kind: 'content',
      render: () => (
        <div className="type-study">
          {(['wrap', 'nowrap', 'pretty', 'balance'] as const).map((textWrap) => (
            <Example key={textWrap} label={textWrap}>
              <div className="type-measure type-nowrap-window">
                <Title as="h2" size="heading-xl" textWrap={textWrap}>
                  {longHeading}
                </Title>
              </div>
            </Example>
          ))}
          <Example label="truncate wins over balance">
            <div className="type-measure">
              <Title as="h2" size="heading-xl" textWrap="balance" truncate>
                {longHeading}
              </Title>
            </div>
          </Example>
          <Example label="lineClamp=2 wins over truncate + nowrap">
            <div className="type-measure">
              <Title as="h2" size="heading-xl" textWrap="nowrap" truncate lineClamp={2}>
                {longHeading}
              </Title>
            </div>
          </Example>
        </div>
      ),
    },
    {
      id: 'baseline',
      title: 'Inline baseline studies',
      kind: 'behavior',
      render: () => (
        <div className="type-study">
          <Text size="caption-l" color="secondary">
            Inline alignment with Kbd, a status badge, and a link.
          </Text>
          <Title as="h2" size="heading-m" className="type-baseline">
            Release notes <span className="type-inline-badge">Updated</span>
          </Title>
          <Title as="h2" size="heading-m" className="type-baseline">
            Quick find <Kbd>Ctrl K</Kbd>
          </Title>
          <Title as="h2" size="heading-m" className="type-baseline">
            Read the{' '}
            <a className="type-inline-link" href="?item=text&tab=usage&block=reader">
              review guide
            </a>
          </Title>
          <Text size="body-s" color="secondary">
            Review the outcome, the supporting evidence, and the next step.
          </Text>
        </div>
      ),
    },
  ],
  usage: [
    {
      id: 'auth',
      code: `<header>
  <Title textWrap="balance">Good work starts with shared context.</Title>
  <Text color="secondary">Bring your notes, decisions, and people together in one calm workspace.</Text>
</header>`,
      title: 'Folio · Sign-in introduction',
      render: () => <SignInCopy />,
    },
    {
      id: 'editor',
      code: `<Title textWrap="balance">Make room for the next good idea</Title>`,
      title: 'Folio · Editor, 760px maximum measure',
      render: () => <EditorCopy />,
    },
    {
      id: 'drawer',
      code: `<header>
  <Title as="h2" size="heading-xl" textWrap="balance">Everything this page connects</Title>
  <Text color="secondary">Keep ownership, review dates, and related decisions close to the document.</Text>
</header>`,
      title: 'Folio · 520px drawer copy',
      surface: 'overlay',
      overlayStage: true,
      render: () => <OverlayCopy kind="drawer" />,
    },
    {
      id: 'modal',
      code: `<header>
  <Title as="h2" size="heading-xl" textWrap="balance">Invite your team to the workspace</Title>
  <Text color="secondary">Give people the context and access they need to contribute with confidence.</Text>
</header>`,
      title: 'Folio · 548px invitation copy',
      surface: 'overlay',
      overlayStage: true,
      render: () => <OverlayCopy kind="modal" />,
    },
  ],
});
