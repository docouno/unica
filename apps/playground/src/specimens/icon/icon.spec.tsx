import { useState } from 'react';
import { ArrowRightIcon, FileTextIcon, MagnifyingGlassIcon } from '@phosphor-icons/react';
import { Icon, IconProvider } from '@docouno/unica';
import type { IconAdapter, IconProps } from '@docouno/unica';
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
} from './icon.examples.js';
import { WideGlyph } from './icon.glyph.js';

const sources = {
  document: FileTextIcon,
  search: MagnifyingGlassIcon,
  arrow: ArrowRightIcon,
  wide: WideGlyph,
};

const sourceNames = {
  document: 'FileTextIcon',
  search: 'MagnifyingGlassIcon',
  arrow: 'ArrowRightIcon',
  wide: 'WideGlyph',
};

const outlineAdapter: IconAdapter = (_source, { svgProps }) => (
  <svg viewBox="0 0 24 24" {...svgProps}>
    {svgProps.children}
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
);

function IconExample({
  source,
  frame,
  weight,
  mirrored,
  usage,
  nameMode,
  nameId,
}: {
  source: keyof typeof sources;
  frame: Pick<IconProps, 'size' | 'color' | 'directional'> & { 'data-wb-subject': '' };
  weight: 'default' | 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
  mirrored: boolean;
  usage: 'standalone' | 'slot';
  nameMode: 'decorative' | 'label' | 'labelledby' | 'title';
  nameId: string;
}) {
  const name =
    nameMode === 'label'
      ? { 'aria-label': 'Release ready' }
      : nameMode === 'labelledby'
        ? { 'aria-labelledby': nameId, 'aria-label': 'Fallback label' }
        : nameMode === 'title'
          ? { children: <title>Release ready</title> }
          : {};
  const semantics = usage === 'slot' ? ({ usage } as const) : { ...name, usage };
  return source === 'wide' ? (
    <Icon {...frame} {...semantics} icon={WideGlyph} />
  ) : (
    <Icon
      {...frame}
      {...semantics}
      icon={sources[source]}
      weight={weight === 'default' ? undefined : weight}
      mirrored={mirrored}
    />
  );
}

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
      group: 'Glyph',
      default: 'document',
      description: 'The vector drawn by the icon.',
      choices: [
        { value: 'document', label: 'Document' },
        { value: 'search', label: 'Search' },
        { value: 'arrow', label: 'Arrow' },
        { value: 'wide', label: 'Project SVG' },
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
    adapter: {
      kind: 'enum',
      group: 'Glyph',
      default: 'phosphor',
      demo: true,
      description: 'Adapter used by the surrounding IconProvider.',
      choices: [{ value: 'phosphor' }, { value: 'custom' }],
    },
    weight: {
      kind: 'enum',
      group: 'Glyph',
      default: 'default',
      description: 'The Phosphor weight. Default leaves the vendor prop unset.',
      choices: [
        { value: 'default' },
        { value: 'thin' },
        { value: 'light' },
        { value: 'regular' },
        { value: 'bold' },
        { value: 'fill' },
        { value: 'duotone' },
      ],
    },
    mirrored: {
      kind: 'boolean',
      group: 'Glyph',
      default: false,
      description: 'Reflect the Phosphor glyph in both directions.',
    },
    usage: {
      kind: 'enum',
      group: 'Semantics',
      default: 'standalone',
      description: 'A slot glyph is decorative and takes its size from the owner.',
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
      affects: [
        ...['thin', 'light', 'regular', 'bold', 'fill', 'duotone'].map((value) => ({
          key: 'weight',
          value,
        })),
        { key: 'mirrored', value: true },
      ],
      reason: 'The project SVG has no Phosphor weight or mirrored prop.',
    },
    {
      kind: 'ignored',
      when: { icon: 'wide' },
      affects: [{ key: 'adapter', value: 'custom' }],
      reason: 'WideGlyph has its own native adapter.',
    },
    {
      kind: 'ignored',
      when: { adapter: 'custom' },
      affects: ['weight', 'mirrored'],
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
  render: ({ ctx, values: { icon, size, color, directional, adapter, ...example } }) => {
    const nameId = `${ctx.id}-name`;
    const glyph = (
      <IconExample
        {...example}
        source={icon}
        frame={{ ...ctx.subject, size, color, directional }}
        nameId={nameId}
      />
    );
    return (
      <IconProvider adapter={adapter === 'custom' ? outlineAdapter : 'phosphor'}>
        {example.nameMode === 'labelledby' ? (
          <>
            <span id={nameId}>Release ready</span>{' '}
          </>
        ) : null}
        {glyph}
      </IconProvider>
    );
  },
  code: ({ icon, adapter, nameMode, ...props }) => {
    const options = previewProps(props, {
      size: 'inherit',
      color: 'inherit',
      directional: false,
      weight: 'default',
      mirrored: false,
      usage: 'standalone',
    });
    const name =
      nameMode === 'labelledby'
        ? ' aria-labelledby="release-name" aria-label="Fallback label"'
        : nameMode === 'label'
          ? ' aria-label="Release ready"'
          : '';
    const open = `<Icon icon={${sourceNames[icon]}}${options}${name}`;
    const iconCode =
      nameMode === 'title' ? `${open}><title>Release ready</title></Icon>` : `${open} />`;
    const subject =
      nameMode === 'labelledby'
        ? `<>
  <span id="release-name">Release ready</span>
  ${iconCode}
</>`
        : iconCode;
    return adapter === 'custom'
      ? `<IconProvider adapter={outlineAdapter}>
  ${subject}
</IconProvider>`
      : subject;
  },
  matrixViews: [
    {
      id: 'sizes',
      rows: 'size',
      cols: 'icon',
      title: 'Size follows context',
      fixed: {
        weight: 'default',
        mirrored: false,
        nameMode: 'decorative',
        usage: 'standalone',
        adapter: 'phosphor',
      },
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
      id: 'names',
      title: 'Naming a standalone glyph',
      kind: 'behavior',
      mode: 'live',
      render: function NamedGlyph({ ctx }) {
        const [name, setName] = useState('Release ready');
        const nameId = `${ctx.id}-status`;
        return (
          <div className="icon-study">
            <label>
              Accessible label{' '}
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <span id={nameId}>{name}</span>
            <Icon icon={WideGlyph} size="l" aria-labelledby={nameId} aria-label="Fallback label">
              <title>Project mark</title>
            </Icon>
          </div>
        );
      },
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
      code: `<button type="button" aria-label="Bold" aria-pressed={active} onClick={toggleBold}>
  <Icon usage="slot" icon={TextBIcon} size="s" />
</button>`,
      title: 'Folio · Rich editor',
      render: () => <EditorExample />,
    },
    {
      id: 'connector',
      code: `<span><Icon usage="slot" icon={CheckCircleIcon} size="s" color="success" /> Synced 2 minutes ago</span>`,
      title: 'Folio · Connector spotlight',
      render: () => <ConnectorExample />,
    },
  ],
});
