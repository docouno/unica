import { defineSpecimen } from '../../workbench/types.js';
import { Text } from './text.proto.js';
import type { TextColor, TextSize } from './text.proto.js';
import { Example, longCopy, ReaderCopy, SettingsCopy } from './typography.examples.js';

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

export default defineSpecimen({
  id: 'text',
  title: 'Text',
  group: 'Typography',
  summary:
    'Reading, labels, and metadata. Native wrapping with shared line boxes across six presets.',
  sections: [
    {
      id: 'scale',
      title: 'Reading & metadata scale',
      kind: 'matrix',
      render: () => (
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
      title: 'Weight, emphasis & inheritance',
      kind: 'matrix',
      render: () => (
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
      title: 'Foregrounds on owning surfaces',
      kind: 'matrix',
      render: () => (
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
    {
      id: 'overflow',
      title: 'Live overflow & alignment',
      kind: 'states',
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
    { id: 'reader', title: 'Folio · Document reader', kind: 'context', render: ReaderCopy },
    { id: 'settings', title: 'Folio · Dense preferences', kind: 'context', render: SettingsCopy },
  ],
});
