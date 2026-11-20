import { Link } from '../../prototypes/link/link.proto.js';
import { previewProps, previewText } from '../preview-code.js';
import { defineComponent } from '../../workbench/types.js';
import {
  ReadingExamples,
  TypographyExamples,
  StateExamples,
  NavigationExamples,
  WrappingExamples,
  SurfaceExamples,
  LiveExamples,
} from '../../prototypes/link/link.examples.js';

export default defineComponent({
  id: 'link',
  title: 'Link',
  category: 'Navigation',
  status: 'Proto',
  summary: 'Navigation ink, natural text rhythm, and quiet standalone destinations.',
  componentName: 'Link',
  props: {
    tone: {
      kind: 'enum',
      group: 'Appearance',
      default: 'accent',
      description: 'Emphasis within the surrounding content.',
      choices: [{ value: 'accent' }, { value: 'neutral' }, { value: 'inherit' }],
    },
    size: {
      kind: 'enum',
      group: 'Appearance',
      default: 'inherit',
      description: 'Typography scale relative to nearby text.',
      choices: [
        { value: 'inherit' },
        { value: 'body-l' },
        { value: 'body-m' },
        { value: 'body-s' },
        { value: 'caption-l' },
        { value: 'caption-m' },
        { value: 'caption-s' },
      ],
    },
    underline: {
      kind: 'enum',
      group: 'Appearance',
      default: 'always',
      description: 'When to display the underline.',
      choices: [{ value: 'always' }, { value: 'hover' }, { value: 'none' }],
    },
    external: {
      kind: 'boolean',
      group: 'Semantics',
      default: false,
      description: 'Append an external destination glyph.',
    },
    disabled: {
      kind: 'boolean',
      group: 'Availability',
      default: false,
      description: 'Allow reading the link label while preventing activation.',
    },
    children: {
      kind: 'string',
      group: 'Content',
      default: 'Read the field guide',
      description: 'Visible link text.',
    },
    onClick: {
      kind: 'action',
      group: 'Events',
      code: 'handleClick',
      description: 'Records link activation in this preview without leaving it.',
    },
  },
  render: ({ ctx, values: { children, ...props } }) => (
    <Link
      {...ctx.subject}
      {...props}
      href="/guide"
      onClick={(event) => {
        event.preventDefault();
        ctx.action('onClick')(event.currentTarget.textContent);
      }}
    >
      {children}
    </Link>
  ),
  code: ({ children, ...props }) =>
    `<Link href="/guide"${previewProps(props, { tone: 'accent', size: 'inherit', underline: 'always', external: false, disabled: false })} onClick={handleClick}>${previewText(children)}</Link>`,
  matrixViews: [
    {
      id: 'typography',
      rows: 'size',
      cols: 'underline',
      group: 'tone',
      title: 'Scale & anatomy',
      caption: 'Six explicit text sizes. Inline links inherit size, weight, and italic by default.',
      reference: () => <TypographyExamples />,
    },
  ],
  cases: [
    {
      id: 'states',
      mode: 'pinned',
      title: 'Ink & interaction',
      caption:
        'Pinned visual states. Current uses a persistent 2px line; ordinary hover stays 1px.',
      kind: 'behavior',
      render: () => <StateExamples />,
    },
    {
      id: 'wrapping',
      title: 'Long text & direction',
      caption:
        'Native inline fragments, long URLs, and an external symbol attached to the final word.',
      kind: 'content',
      render: () => <WrappingExamples />,
    },
    {
      id: 'surfaces',
      title: 'Canvas & surface',
      kind: 'surface',
      render: () => <SurfaceExamples />,
    },
    {
      id: 'overlay',
      mode: 'pinned',
      title: 'Links on a floating surface',
      surface: 'overlay',
      overlayStage: true,
      kind: 'surface',
      render: () => <SurfaceExamples overlay />,
    },
    {
      id: 'live',
      mode: 'live',
      title: 'Try native navigation',
      caption:
        'Tab, Enter, context menu, and modified clicks work. Space keeps its native scrolling behavior.',
      kind: 'behavior',
      render: () => <LiveExamples />,
    },
  ],
  usage: [
    {
      id: 'reading',
      code: `<p>Read the <Link href="/guide">field guide</Link> for context.</p>`,
      title: 'Links in the reading flow',
      caption: 'Inherited type, persistent underlines, and meaningful destinations.',
      render: () => <ReadingExamples />,
    },
    {
      id: 'navigation',
      code: `<nav><Link href="/workspace" tone="neutral">Workspace</Link></nav>`,
      title: 'Standalone navigation',
      caption:
        'Underline modes and additive current/focus states. Padding belongs to the navigation layout.',
      render: () => <NavigationExamples />,
    },
  ],
});
