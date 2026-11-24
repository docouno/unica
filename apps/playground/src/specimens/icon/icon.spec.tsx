import { ArrowRightIcon, FileTextIcon, MagnifyingGlassIcon } from '@phosphor-icons/react';
import { Flex, Icon, Text, UnicaProvider } from '@docouno/unica';
import type { IconAdapter } from '@docouno/unica';
import { ExampleSurface } from '../shared/example-surface.js';
import { previewProps } from '../preview-code.js';
import { defineComponent } from '../../workbench/types.js';
import {
  ColorExamples,
  NameExample,
  OverlayExamples,
  ShapeExamples,
  SizeExamples,
  TokenExample,
} from './icon.examples.js';
import { WideGlyph } from './icon.glyph.js';
import { ConnectorExample, EditorExample, connectorCode, editorCode } from './icon.compositions.js';

const glyphs = {
  document: { source: FileTextIcon, code: 'FileTextIcon', label: 'Release notes' },
  search: { source: MagnifyingGlassIcon, code: 'MagnifyingGlassIcon', label: 'Search notes' },
  arrow: { source: ArrowRightIcon, code: 'ArrowRightIcon', label: 'Next page' },
  wide: { source: WideGlyph, code: 'WideGlyph', label: 'Project mark' },
} as const;

const weights = ['thin', 'light', 'regular', 'bold', 'fill', 'duotone'] as const;
const phosphorOptions = [
  ...weights.map((value) => ({ key: 'weight', value })),
  { key: 'mirrored', value: true },
];

function glyphLabel(icon: keyof typeof glyphs, adapter: 'custom' | 'phosphor'): string {
  return adapter === 'custom' && icon !== 'wide' ? 'Outline circle' : glyphs[icon].label;
}

const outlineAdapter: IconAdapter = (_source, { svgProps }) => (
  <svg viewBox="0 0 24 24" {...svgProps}>
    {svgProps.children}
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const wideGlyphCode = `const WideGlyph = defineGlyph(({ children, ...props }) => (
  <svg {...props} viewBox="0 0 32 16">
    {children}
    <path fill="none" stroke="currentColor" strokeWidth={2} d="M1 1h30v14H1zM7 8h18" />
  </svg>
));`;

const outlineAdapterCode = `(_source, { svgProps }) => (
  <svg viewBox="0 0 24 24" {...svgProps}>
    {svgProps.children}
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
)`;

export default defineComponent({
  id: 'icon',
  title: 'Icon',
  category: 'Typography',
  status: 'UI',
  summary: 'A vector glyph with a square token frame, semantic ink, and optional accessible name.',
  componentName: 'Icon',
  props: {
    icon: {
      kind: 'slot',
      group: 'Content',
      default: 'document',
      publicType: 'GlyphSource',
      description:
        'Required SVG source. The editor starts with a Phosphor document icon and also offers a registered project glyph.',
      choices: [
        { value: 'document', label: 'Document', code: glyphs.document.code },
        { value: 'search', label: 'Search', code: glyphs.search.code },
        { value: 'arrow', label: 'Arrow', code: glyphs.arrow.code },
        { value: 'wide', label: 'Project SVG', code: glyphs.wide.code },
      ],
    },
    size: {
      kind: 'enum',
      group: 'Geometry',
      default: 'omitted',
      description:
        'Without an explicit size, standalone icons use the provider or theme default, and slots inherit. Explicit inherit always follows the surrounding type.',
      choices: [
        { value: 'omitted', label: 'Use default', omit: true },
        { value: 'inherit' },
        { value: 's' },
        { value: 'm' },
        { value: 'l' },
      ],
    },
    color: {
      kind: 'enum',
      group: 'Role',
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
    adapter: {
      kind: 'enum',
      group: 'Host',
      default: 'phosphor',
      demo: true,
      description: 'Adapter used by the surrounding UnicaProvider.',
      choices: [{ value: 'phosphor' }, { value: 'custom' }],
    },
    weight: {
      kind: 'enum',
      group: 'Content',
      default: 'default',
      description:
        'Phosphor source option. Omitted weight resolves to regular for standalone icons and can inherit the Phosphor weight in slots.',
      choices: [
        { value: 'default', label: 'Use default', omit: true },
        ...weights.map((value) => ({ value })),
      ],
    },
    mirrored: {
      kind: 'boolean',
      group: 'Content',
      default: false,
      description: 'Reflect the Phosphor glyph in both directions.',
    },
    usage: {
      kind: 'enum',
      group: 'Semantics',
      default: 'standalone',
      description:
        'Standalone icons can have an accessible name. A slot is decorative and inherits its owner’s size when size is omitted.',
      choices: [{ value: 'standalone' }, { value: 'slot' }],
    },
    nameMode: {
      kind: 'enum',
      group: 'Semantics',
      default: 'decorative',
      demo: true,
      description: 'Choose how the SVG gets its accessible name.',
      choices: [
        { value: 'decorative' },
        { value: 'label', label: 'aria-label' },
        { value: 'labelledby', label: 'aria-labelledby + fallback' },
        { value: 'title', label: 'SVG title' },
      ],
    },
  },
  constraints: [
    {
      kind: 'forbidden',
      when: { icon: 'wide' },
      affects: phosphorOptions,
      reason: 'The project SVG has no Phosphor weight or mirrored prop.',
    },
    {
      kind: 'ignored',
      when: { icon: 'wide' },
      affects: [{ key: 'adapter', value: 'custom' }],
      reason: 'The registered project glyph uses its own native adapter.',
    },
    {
      kind: 'ignored',
      when: { adapter: 'custom' },
      affects: phosphorOptions,
      reason: 'The example adapter draws its own circle.',
    },
    {
      kind: 'precedence',
      when: { directional: true },
      affects: [{ key: 'mirrored', value: true }],
      reason: 'Directional glyphs reflect only in RTL.',
    },
    {
      kind: 'forbidden',
      when: { usage: 'slot' },
      affects: ['label', 'labelledby', 'title'].map((value) => ({ key: 'nameMode', value })),
      reason: 'The owner provides the accessible name for a slot.',
    },
  ],
  render: ({
    ctx,
    values: { icon, size, color, directional, adapter, nameMode, weight, usage, mirrored },
  }) => {
    const label = glyphLabel(icon, adapter);
    const nameId = `${ctx.id}-name`;
    const name =
      nameMode === 'label'
        ? { 'aria-label': label }
        : nameMode === 'labelledby'
          ? { 'aria-labelledby': nameId, 'aria-label': label }
          : nameMode === 'title'
            ? { children: <title>{label}</title> }
            : {};
    const semantics = usage === 'slot' ? ({ usage } as const) : { ...name, usage };
    const frame = {
      ...ctx.subject,
      size: size === 'omitted' ? undefined : size,
      color,
      directional,
      ...semantics,
    };
    return (
      <ExampleSurface surface={ctx.surface}>
        <UnicaProvider iconAdapter={adapter === 'custom' ? outlineAdapter : 'phosphor'}>
          <Flex align="center" justify={ctx.tab === 'playground' ? 'center' : 'start'} gap={8}>
            {nameMode === 'labelledby' && (
              <Text as="span" id={nameId}>
                {label}
              </Text>
            )}
            {icon === 'wide' ? (
              <Icon {...frame} icon={WideGlyph} />
            ) : (
              <Icon
                {...frame}
                icon={glyphs[icon].source}
                weight={weight === 'default' ? undefined : weight}
                mirrored={mirrored}
              />
            )}
          </Flex>
        </UnicaProvider>
      </ExampleSurface>
    );
  },
  code: ({ icon, adapter, nameMode, ...props }) => {
    const label = glyphLabel(icon, adapter);
    const options = previewProps(props, {
      size: 'omitted',
      color: 'inherit',
      directional: false,
      weight: 'default',
      mirrored: false,
      usage: 'standalone',
    });
    const linked = nameMode === 'labelledby';
    const name = linked
      ? ` aria-labelledby={nameId} aria-label="${label}"`
      : nameMode === 'label'
        ? ` aria-label="${label}"`
        : '';
    const open = `<Icon icon={${glyphs[icon].code}}${options}${name}`;
    let subject = nameMode === 'title' ? `${open}><title>${label}</title></Icon>` : `${open} />`;
    const imports = ['Icon'];
    if (linked) {
      imports.push('Flex', 'Text');
      subject = `<Flex align="center" gap={8}><Text as="span" id={nameId}>${label}</Text>${subject}</Flex>`;
    }
    if (adapter === 'custom') {
      imports.push('UnicaProvider');
      subject = `<UnicaProvider iconAdapter={${outlineAdapterCode}}>${subject}</UnicaProvider>`;
    }
    if (linked) {
      subject = `export function NamedIcon() {
  const nameId = useId();
  return (
${subject}
  );
}`;
    }
    if (icon === 'wide') {
      imports.push('defineGlyph');
    }
    const source = icon === 'wide' ? wideGlyphCode + '\n\n' : '';
    const vendor =
      icon === 'wide' ? '' : `import { ${glyphs[icon].code} } from '@phosphor-icons/react';\n`;
    const react = linked ? "import { useId } from 'react';\n" : '';
    return `${react}${vendor}import { ${imports.join(', ')} } from '@docouno/unica';\n\n${source}${subject}`;
  },
  states: [
    {
      id: 'sizes',
      rows: 'size',
      cols: 'icon',
      title: 'Sources and square frames',
      caption:
        'Compare the frame of each source at the inherited and fixed sizes. With no provider override, the default standalone size is 1em.',
      fixed: {
        weight: 'default',
        mirrored: false,
        directional: false,
        color: 'inherit',
        nameMode: 'decorative',
        usage: 'standalone',
        adapter: 'phosphor',
      },
    },
  ],
  cases: [
    {
      id: 'owners',
      title: 'Icons in controls and type',
      kind: 'content',
      mode: 'pinned',
      caption:
        'Compare the glyph and target sizes of icon buttons, then follow a one-em glyph through body text and a heading.',
      render: SizeExamples,
    },
    {
      id: 'shapes',
      title: 'Shape and reading direction',
      kind: 'behavior',
      mode: 'pinned',
      caption:
        'A wide SVG keeps its proportions within a square frame. Logical arrows follow reading direction while checks and warnings keep their orientation.',
      render: ShapeExamples,
    },
    {
      id: 'colors',
      title: 'Foreground roles on reading surfaces',
      kind: 'surface',
      mode: 'pinned',
      caption:
        'Compare inherited, semantic and disabled ink on the reading surface and on a card. Each status has a text label.',
      render: ColorExamples,
    },
    {
      id: 'tokens',
      title: 'A local icon size override',
      kind: 'behavior',
      mode: 'live',
      caption:
        'Change the medium icon token for a pair of glyphs. The reference outside that scope keeps its theme size.',
      controls: { enlarged: { kind: 'boolean', label: 'Use 24px icons', default: false } },
      reset: true,
      render: TokenExample,
    },
    {
      id: 'names',
      title: 'Accessible naming',
      kind: 'behavior',
      mode: 'live',
      caption:
        'Inspect the accessible name supplied by referenced text, a fallback label, or an SVG title. The decorative glyph stays out of the accessibility tree.',
      controls: {
        nameSource: {
          kind: 'enum',
          label: 'Name source',
          default: 'linked',
          choices: [
            { value: 'linked', label: 'Referenced text' },
            { value: 'fallback', label: 'Fallback label' },
            { value: 'title', label: 'SVG title' },
            { value: 'decorative', label: 'Decorative' },
          ],
        },
      },
      reset: true,
      render: NameExample,
    },
    {
      id: 'overlay',
      title: 'Foreground roles on a floating surface',
      surface: 'overlay',
      overlayStage: true,
      kind: 'surface',
      mode: 'pinned',
      caption: 'Judge the same foreground roles against the material of a static floating panel.',
      render: OverlayExamples,
    },
  ],
  compositions: [
    {
      id: 'editor',
      title: 'Format a document label',
      mode: 'live',
      reset: true,
      caption:
        'Bold and Italic change the document label. Clear formatting restores both settings. Each icon button owns its accessible name.',
      render: EditorExample,
      code: editorCode,
    },
    {
      id: 'connector',
      title: 'Pause and resume a mirror',
      mode: 'live',
      reset: true,
      caption:
        'Pause the mirror, edit the source title, then resume to apply the changes. The status glyph and its text change together.',
      render: ConnectorExample,
      code: connectorCode,
    },
  ],
});
