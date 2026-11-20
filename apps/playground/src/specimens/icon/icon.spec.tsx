import { ArrowRightIcon, FileTextIcon, MagnifyingGlassIcon } from '@phosphor-icons/react';
import { Icon } from '../../prototypes/icon/icon.proto.js';
import { previewProps } from '../preview-code.js';
import { defineComponent } from '../../workbench/types.js';
import {
  ColorExamples,
  ConnectorExample,
  EditorExample,
  OverlayExamples,
  ShapeExamples,
  SizeExamples,
  TokenExample,
} from '../../prototypes/icon/icon.examples.js';

export default defineComponent({
  id: 'icon',
  title: 'Icon',
  category: 'Typography',
  status: 'Proto',
  summary:
    'One Phosphor regular set. Square token frames, inherited text rhythm, and semantic ink.',
  componentName: 'Icon',
  props: {
    icon: {
      kind: 'slot',
      group: 'Glyph',
      default: 'document',
      description: 'The vector drawn by the icon.',
      choices: [
        { value: 'document', label: 'Document' },
        { value: 'search', label: 'Search' },
        { value: 'arrow', label: 'Arrow' },
      ],
    },
    size: {
      kind: 'enum',
      group: 'Appearance',
      default: 'inherit',
      description: 'Scale the icon relative to text or to a fixed control size.',
      choices: [{ value: 'inherit' }, { value: 's' }, { value: 'm' }, { value: 'l' }],
    },
    color: {
      kind: 'enum',
      group: 'Appearance',
      default: 'inherit',
      description: 'Use the surrounding foreground or a semantic color.',
      choices: [
        { value: 'inherit' },
        { value: 'primary' },
        { value: 'secondary' },
        { value: 'muted' },
        { value: 'subtle' },
        { value: 'disabled' },
        { value: 'accent' },
        { value: 'info' },
        { value: 'success' },
        { value: 'warning' },
        { value: 'danger' },
      ],
    },
    directional: {
      kind: 'boolean',
      group: 'Semantics',
      default: false,
      description: 'Mirror the glyph when direction switches to RTL.',
    },
    'aria-label': {
      kind: 'string',
      group: 'Semantics',
      default: '',
      label: 'Accessible name',
      description: 'Optional accessible name for a standalone icon.',
    },
  },
  render: ({ ctx, values: { icon, ...props } }) => (
    <Icon
      {...ctx.subject}
      {...props}
      icon={{ document: FileTextIcon, search: MagnifyingGlassIcon, arrow: ArrowRightIcon }[icon]}
    />
  ),
  code: ({ icon, ...props }) =>
    `<Icon icon={${{ document: 'FileTextIcon', search: 'MagnifyingGlassIcon', arrow: 'ArrowRightIcon' }[icon]}}${previewProps(props, { size: 'inherit', color: 'inherit', directional: false, 'aria-label': '' })} />`,
  matrixViews: [
    {
      id: 'sizes',
      rows: 'size',
      cols: 'icon',
      title: 'Size follows context',
      reference: () => <SizeExamples />,
    },
  ],
  cases: [
    {
      id: 'shapes',
      title: 'Proportions & selective RTL',
      kind: 'behavior',
      render: () => <ShapeExamples />,
    },
    {
      id: 'colors',
      title: 'Semantic colors on base surfaces',
      kind: 'behavior',
      render: () => <ColorExamples />,
    },
    {
      id: 'tokens',
      mode: 'live',
      title: 'Live token inheritance',
      kind: 'behavior',
      render: () => <TokenExample />,
    },
    {
      id: 'overlay',
      title: 'Semantic colors on an overlay',
      surface: 'overlay',
      overlayStage: true,
      kind: 'surface',
      render: () => <OverlayExamples />,
    },
  ],
  usage: [
    {
      id: 'editor',
      code: `<button type="button" aria-label="Insert a document">
  <Icon icon={FileTextIcon} />
</button>`,
      title: 'Folio · Rich editor',
      render: () => <EditorExample />,
    },
    {
      id: 'connector',
      code: `<span><Icon icon={ArrowRightIcon} directional /> Continue setup</span>`,
      title: 'Folio · Connector spotlight',
      render: () => <ConnectorExample />,
    },
  ],
});
