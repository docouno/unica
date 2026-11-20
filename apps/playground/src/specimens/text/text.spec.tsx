import { previewProps, previewText } from '../preview-code.js';
import { defineComponent } from '../../workbench/types.js';
import { Text } from '../../prototypes/text/text.proto.js';
import type { TextColor, TextSize } from '../../prototypes/text/text.proto.js';
import {
  Example,
  longCopy,
  ReaderCopy,
  SettingsCopy,
} from '../../prototypes/text/typography.examples.js';

const sizes: readonly TextSize[] = [
  'body-l',
  'body-m',
  'body-s',
  'caption-l',
  'caption-m',
  'caption-s',
];
const colors: readonly TextColor[] = [
  'primary',
  'secondary',
  'muted',
  'subtle',
  'accent',
  'info',
  'success',
  'warning',
  'danger',
];

export default defineComponent({
  id: 'text',
  title: 'Text',
  category: 'Typography',
  status: 'Proto',
  summary:
    'Reading, labels, and metadata. Native wrapping with shared line boxes across six presets.',
  componentName: 'Text',
  props: {
    as: {
      kind: 'enum',
      group: 'Semantics',
      default: 'p',
      description: 'Select the element appropriate to the content.',
      choices: [{ value: 'p' }, { value: 'span' }, { value: 'strong' }, { value: 'em' }],
    },
    size: {
      kind: 'enum',
      group: 'Typography',
      default: 'body-m',
      description: 'Scale body text or captions.',
      choices: [
        { value: 'body-l' },
        { value: 'body-m' },
        { value: 'body-s' },
        { value: 'caption-l' },
        { value: 'caption-m' },
        { value: 'caption-s' },
      ],
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
    color: {
      kind: 'enum',
      group: 'Typography',
      default: 'inherit',
      description: 'Inherit surrounding color or use a semantic foreground.',
      choices: [
        { value: 'inherit' },
        { value: 'primary' },
        { value: 'secondary' },
        { value: 'muted' },
        { value: 'subtle' },
        { value: 'accent' },
        { value: 'info' },
        { value: 'success' },
        { value: 'warning' },
        { value: 'danger' },
      ],
    },
    children: {
      kind: 'string',
      group: 'Content',
      default: 'Readable typography gives quieter details room to breathe.',
      description: 'Change the text to inspect wrapping and emphasis.',
    },
    lineClamp: {
      kind: 'slot',
      group: 'Overflow',
      default: 'off',
      description: 'Limit the text to a fixed number of lines.',
      choices: [
        { value: 'off', label: 'Off' },
        { value: '2', label: '2 lines' },
        { value: '3', label: '3 lines' },
      ],
    },
    truncate: {
      kind: 'boolean',
      group: 'Overflow',
      default: false,
      description: 'Keep the content on one line and indicate overflow with an ellipsis.',
    },
  },
  constraints: [
    {
      kind: 'precedence',
      when: { lineClamp: '2' },
      affects: [{ key: 'truncate', value: true }],
      reason: 'A two-line clamp takes precedence over single-line truncation.',
    },
    {
      kind: 'precedence',
      when: { lineClamp: '3' },
      affects: [{ key: 'truncate', value: true }],
      reason: 'A three-line clamp takes precedence over single-line truncation.',
    },
  ],
  render: ({ ctx, values: { children, weight, lineClamp, ...props } }) => (
    <Text
      {...ctx.subject}
      {...props}
      {...(weight === 'auto' ? {} : { weight })}
      {...(lineClamp === 'off' ? {} : { lineClamp: Number(lineClamp) })}
      style={{ maxInlineSize: '28rem' }}
    >
      {children}
    </Text>
  ),
  code: ({ children, weight, lineClamp, ...props }) =>
    `<Text${previewProps({ ...props, weight }, { as: 'p', size: 'body-m', weight: 'auto', color: 'inherit', truncate: false })}${lineClamp === 'off' ? '' : ` lineClamp={${lineClamp}}`}>${previewText(children)}</Text>`,
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
              {colors.map((color) => (
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
          {(['left', 'center', 'right'] as const).map((align) => (
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
  <Title as="h2">Decision record</Title>
  <Text>Capture the context for the next person who opens this page.</Text>
</article>`,
      title: 'Folio · Document reader',
      render: () => <ReaderCopy />,
    },
    {
      id: 'settings',
      code: `<div>
  <Text as="label" htmlFor="display-name" weight="medium">Display name</Text>
  <Input id="display-name" />
</div>`,
      title: 'Folio · Dense preferences',
      render: () => <SettingsCopy />,
    },
  ],
});
