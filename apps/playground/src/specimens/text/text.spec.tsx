import { Text } from '@docouno/unica';
import type { TextSize, TextTag } from '@docouno/unica';
import { previewProps, previewText } from '../preview-code.js';
import { defineComponent } from '../../workbench/types.js';
import { Example, longCopy, ReaderCopy, SettingsCopy } from './typography.examples.js';
import { clampPrecedence, foregrounds, typographyControls } from './typography.controls.js';

const sizes: readonly TextSize[] = [
  'body-l',
  'body-m',
  'body-s',
  'body-xs',
  'caption-l',
  'caption-m',
  'caption-s',
];
const unlinkedTags = ['p', 'span', 'div', 'strong', 'em'] as const satisfies readonly TextTag[];

export default defineComponent({
  id: 'text',
  title: 'Text',
  category: 'Typography',
  status: 'UI',
  summary:
    'Reading, labels, and metadata. Native wrapping with shared line boxes across six presets.',
  componentName: 'Text',
  props: {
    as: {
      kind: 'enum',
      group: 'Semantics',
      default: 'p',
      description: 'Select the element appropriate to the content.',
      choices: [...unlinkedTags.map((value) => ({ value })), { value: 'label' }],
    },
    htmlFor: {
      kind: 'slot',
      group: 'Semantics',
      default: 'unset',
      description: 'Link the label to a native input.',
      choices: [
        { value: 'unset', label: 'Unset' },
        { value: 'field', label: 'Link to field' },
      ],
    },
    size: {
      kind: 'enum',
      group: 'Typography',
      default: 'body-m',
      description: 'Scale body text or captions.',
      choices: sizes.map((value) => ({ value })),
    },
    weight: {
      kind: 'slot',
      group: 'Typography',
      default: 'auto',
      description: 'Choose visual emphasis or keep the element’s default.',
      choices: [
        { value: 'auto', label: 'From element' },
        { value: 'light', label: 'Light' },
        { value: 'regular', label: 'Regular' },
        { value: 'medium', label: 'Medium' },
        { value: 'semibold', label: 'Semibold' },
        { value: 'bold', label: 'Bold' },
      ],
    },
    ...typographyControls,
    children: {
      kind: 'string',
      group: 'Content',
      default: 'Readable typography gives quieter details room to breathe.',
      description: 'Change the text to inspect wrapping and emphasis.',
    },
  },
  constraints: [
    {
      kind: 'forbidden',
      when: { htmlFor: 'field' },
      affects: unlinkedTags.map((value) => ({ key: 'as', value })),
      reason: 'Only a native label can be linked to a field.',
    },
    ...clampPrecedence,
  ],
  render: ({
    ctx,
    values: { as, htmlFor, children, weight, lineClamp, align, italic, ...props },
  }) => {
    const textProps = {
      ...ctx.subject,
      ...props,
      weight: weight === 'auto' ? undefined : weight,
      lineClamp: lineClamp === 'off' ? undefined : Number(lineClamp),
      align: align === 'inherit' ? undefined : align,
      italic: italic === 'auto' ? undefined : italic === 'italic',
      style: { maxInlineSize: 'min(100%, 28rem)' },
    };

    if (as === 'label' && htmlFor === 'field') {
      const fieldId = `${ctx.id}-field`;
      return (
        <div className="type-field">
          <Text {...textProps} as="label" htmlFor={fieldId}>
            {children}
          </Text>
          <input className="type-input" id={fieldId} />
        </div>
      );
    }

    return (
      <Text {...textProps} as={as}>
        {children}
      </Text>
    );
  },
  code: ({ htmlFor, children, weight, lineClamp, align, italic, ...props }) => {
    const attributes = previewProps(
      {
        ...props,
        weight,
        align,
        ...(italic === 'auto' ? {} : { italic: italic === 'italic' }),
        ...(lineClamp === 'off' ? {} : { lineClamp: Number(lineClamp) }),
      },
      {
        as: 'p',
        size: 'body-m',
        weight: 'auto',
        color: 'inherit',
        align: 'inherit',
        tabularNums: false,
        truncate: false,
      },
    );
    const copy = previewText(children);
    return htmlFor === 'field' && props.as === 'label'
      ? `<div>
  <Text${attributes} htmlFor="text-field">${copy}</Text>
  <input id="text-field" />
</div>`
      : `<Text${attributes}>${copy}</Text>`;
  },
  matrixViews: [
    {
      id: 'scale',
      rows: 'size',
      title: 'Reading & metadata scale',
      reference: () => (
        <div className="type-study">
          {sizes.map((size) => (
            <Example key={size} label={size}>
              <Text size={size} data-sample-size={size}>
                {size.startsWith('caption')
                  ? 'Updated today · 4 minute read'
                  : 'A clear place for shared knowledge.'}
              </Text>
            </Example>
          ))}
          <Text size="caption-l" color="secondary">
            Caption sizes are reserved for metadata. Body sizes carry reading and control copy.
          </Text>
        </div>
      ),
    },
    {
      id: 'emphasis',
      rows: 'weight',
      cols: 'as',
      title: 'Weight, emphasis & inheritance',
      reference: () => (
        <div className="type-study">
          {(['light', 'regular', 'medium', 'semibold', 'bold'] as const).map((weight) => (
            <Example key={weight} label={weight}>
              <Text weight={weight}>The right detail at the right time.</Text>
            </Example>
          ))}
          <Example label="strong / em">
            <Text>
              One <Text as="strong">clear owner</Text>, a little <Text as="em">shared context</Text>
              .
            </Text>
          </Example>
          <Example label="inherit">
            <div style={{ color: 'var(--accent-soft-fg)' }}>
              <Text>Text inherits the foreground of its owner.</Text>
            </div>
          </Example>
        </div>
      ),
    },
    {
      id: 'foregrounds',
      rows: 'color',
      title: 'Foregrounds on owning surfaces',
      reference: () => (
        <div className="type-study">
          {(['canvas', 'surface', 'overlay'] as const).map((surface) => (
            <div className="type-surface" key={surface} data-sample-surface={surface}>
              <Text size="caption-l" weight="semibold">
                {surface}
              </Text>
              {foregrounds.map((color) => (
                <Text key={color} color={color} size="body-s" data-sample-color={color}>
                  {color} · Shared workspace notes
                </Text>
              ))}
            </div>
          ))}
        </div>
      ),
    },
  ],
  cases: [
    {
      id: 'overflow',
      title: 'Live overflow & alignment',
      kind: 'content',
      render: () => (
        <div className="type-study">
          <Example label="wrap">
            <div className="type-measure">
              <Text>{longCopy}</Text>
            </div>
          </Example>
          <Example label="truncate">
            <div className="type-measure">
              <Text truncate>{longCopy}</Text>
            </div>
          </Example>
          <Example label="inline truncate">
            <div className="type-measure">
              <Text as="span" truncate>
                {longCopy}
              </Text>
            </div>
          </Example>
          <Example label="lineClamp=2 wins over truncate">
            <div className="type-measure" style={{ whiteSpace: 'nowrap' }}>
              <Text lineClamp={2} truncate>
                {longCopy}
              </Text>
            </div>
          </Example>
          {(['start', 'center', 'end'] as const).map((align) => (
            <Example key={align} label={align}>
              <Text align={align}>Ready for review</Text>
            </Example>
          ))}
        </div>
      ),
    },
  ],
  usage: [
    {
      id: 'reader',
      code: `<article>
  <Title as="h2" size="heading-m">Before the release</Title>
  <Text>Start with the outcome. Explain who benefits, what changes, and how the team can verify the result. Keep the supporting decisions beside the work.</Text>
</article>`,
      title: 'Folio · Document reader',
      render: () => <ReaderCopy />,
    },
    {
      id: 'settings',
      code: `<div>
  <Text as="label" htmlFor="display-name" weight="medium">Display name</Text>
  <input id="display-name" />
</div>`,
      title: 'Folio · Dense preferences',
      render: ({ ctx }) => <SettingsCopy fieldId={`${ctx.id}-display-name`} />,
    },
  ],
});
