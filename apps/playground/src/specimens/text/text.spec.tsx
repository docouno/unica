import { Input, Stack, Text } from '@docouno/unica';
import type { TextSize, TextTag } from '@docouno/unica';
import { previewProps, previewText } from '../preview-code.js';
import { defineComponent } from '../../workbench/types.js';
import {
  InheritanceExample,
  OverflowExample,
  SurfacesExample,
  TextFrame,
} from './text.examples.js';
import { ReaderExample, SettingsExample, readerCode, settingsCode } from './text.compositions.js';
import { clampPrecedence, typographyControls } from './typography.controls.js';

const defaultCopy = 'Readable typography gives quieter details room to breathe.';
const measure = { inlineSize: 'min(100%, 28rem)', marginInline: 'auto' };

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
      kind: 'enum',
      publicType: 'string',
      group: 'Semantics',
      default: 'unset',
      description: 'The ID of the field named by a label. This example can link to a nearby input.',
      choices: [
        { value: 'unset', label: 'Not linked', omit: true },
        { value: 'field', label: 'Link to field' },
      ],
    },
    size: {
      kind: 'enum',
      group: 'Geometry',
      default: 'body-m',
      description: 'Scale body text or captions.',
      choices: sizes.map((value) => ({ value })),
    },
    weight: {
      kind: 'enum',
      group: 'Role',
      default: 'auto',
      description:
        'Omitted weight is bold for strong and regular for every other root. An explicit weight changes the ink while keeping the element’s meaning.',
      choices: [
        { value: 'auto', label: 'From element', omit: true },
        { value: 'light', label: 'Light' },
        { value: 'regular', label: 'Regular' },
        { value: 'medium', label: 'Medium' },
        { value: 'semibold', label: 'Semibold' },
        { value: 'bold', label: 'Bold' },
      ],
    },
    ...typographyControls,
    italic: {
      ...typographyControls.italic,
      description:
        'When omitted, em is italic and other roots are upright. An explicit boolean overrides that style.',
    },
    children: {
      kind: 'string',
      group: 'Content',
      default: defaultCopy,
      publicType: 'ReactNode',
      description:
        'Content valid inside the selected native element. The editor starts with a sample sentence.',
      examples: [defaultCopy, 'Ink', 'Release notes', '12,345.00', ''],
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
    };

    if (as === 'label' && htmlFor === 'field') {
      const fieldId = `${ctx.id}-field`;
      return (
        <TextFrame ctx={ctx}>
          <Stack align="start" gap={4} style={measure}>
            <Text {...textProps} as="label" htmlFor={fieldId}>
              <bdi>{children}</bdi>
            </Text>
            <Input
              id={fieldId}
              aria-label={children.trim() ? undefined : 'Example field'}
              name="example"
              size="s"
              width="full"
            />
          </Stack>
        </TextFrame>
      );
    }

    return (
      <TextFrame ctx={ctx}>
        <div style={measure}>
          <Text {...textProps} as={as}>
            <bdi>{children}</bdi>
          </Text>
        </div>
      </TextFrame>
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
    const copy = `<bdi>${previewText(children)}</bdi>`;
    if (htmlFor === 'field' && props.as === 'label') {
      const accessibleName = children.trim() ? '' : ' aria-label="Example field"';
      return `import { useId } from 'react';
import { Input, Stack, Text } from '@docouno/unica';

export function LabeledField() {
  const fieldId = useId();
  return (
    <Stack align="start" gap={4} style={{ inlineSize: 'min(100%, 28rem)', marginInline: 'auto' }}>
      <Text${attributes} htmlFor={fieldId}>${copy}</Text>
      <Input id={fieldId}${accessibleName} name="example" size="s" width="full" />
    </Stack>
  );
}`;
    }
    const text = `<Text${attributes}>${copy}</Text>`;
    return props.truncate || lineClamp !== 'off' || align !== 'inherit'
      ? `<div style={{ inlineSize: 'min(100%, 28rem)', marginInline: 'auto' }}>${text}</div>`
      : text;
  },
  states: [
    {
      id: 'scale',
      rows: 'size',
      title: 'Reading and metadata sizes',
      caption:
        'The four body sizes carry reading and control text. The three caption sizes set supporting metadata.',
      fixed: { children: 'Release notes' },
    },
    {
      id: 'emphasis',
      rows: 'weight',
      cols: 'as',
      title: 'Weight and semantic roots',
      caption:
        'Compare each native element with its default and explicit weights. Strong starts bold. Em keeps its italic style even with an explicit weight.',
      fixed: { children: 'Ink', htmlFor: 'unset', italic: 'auto' },
    },
    {
      id: 'foregrounds',
      rows: 'color',
      title: 'Foreground roles',
      caption: 'Compare the inherited foreground with the explicit text and status colors.',
      fixed: { children: 'Release notes' },
    },
  ],
  cases: [
    {
      id: 'inheritance',
      title: 'Emphasis and inherited ink',
      kind: 'content',
      mode: 'live',
      caption:
        'Strong and em preserve meaning within a sentence. Text can inherit its owner’s foreground or set its own.',
      render: InheritanceExample,
    },
    {
      id: 'surfaces',
      title: 'Foregrounds on their surfaces',
      kind: 'surface',
      mode: 'pinned',
      compareSurfaces: true,
      caption:
        'Compare foreground roles on a reading surface, a card and a floating panel. Status wording carries the same meaning as the color.',
      render: SurfacesExample,
    },
    {
      id: 'overflow',
      title: 'Wrapping, limits and alignment',
      kind: 'content',
      mode: 'pinned',
      caption:
        'Compare a wrapped paragraph, a one-line ellipsis and a two-line clamp in the same measure. Logical alignment follows the writing direction.',
      render: OverflowExample,
    },
  ],
  compositions: [
    {
      id: 'reader',
      title: 'A passage and its metadata',
      mode: 'pinned',
      caption: 'Read a short handbook entry with a lead, inline emphasis, and a source note.',
      code: readerCode,
      render: ReaderExample,
    },
    {
      id: 'settings',
      title: 'Edit a display name',
      mode: 'live',
      reset: true,
      caption:
        'Select the label to focus its field. Edit the display name to update the byline preview.',
      code: settingsCode,
      render: SettingsExample,
    },
  ],
});
