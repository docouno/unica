import { defineComponent } from '../../workbench/types.js';
import type { ComponentValues, PropSchema } from '../../workbench/types.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { LinkPlayground } from './link-playground.js';
import { linkCode } from './link-code.js';
import { LinkDestinations, LinkLiveNavigation } from './link-destinations.examples.js';
import {
  LinkGlyphStudy,
  LinkStates,
  LinkWrapping,
  LinkSurfaces,
  LinkOverlay,
  LinkContext,
} from './link-studies.examples.js';
import { LinkReadingExample } from './link-reading.example.js';
import readingSource from './link-reading.example.tsx?raw';
import { LinkNavigationExample } from './link-navigation.example.js';
import navigationSource from './link-navigation.example.tsx?raw';

const props = {
  tone: {
    kind: 'enum',
    group: 'Role',
    default: 'accent',
    description: 'Emphasis within the surrounding content.',
    choices: [{ value: 'accent' }, { value: 'neutral' }, { value: 'inherit' }],
  },
  size: {
    kind: 'enum',
    group: 'Geometry',
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
    group: 'Interaction',
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
  href: {
    kind: 'enum',
    group: 'Host',
    default: '/guides/failover',
    publicType: 'string',
    choices: [
      { value: '/guides/failover', label: 'Failover guide' },
      { value: '', label: 'Omitted', omit: true },
    ],
    description:
      'An enabled native link requires a URL. This example starts with a failover guide. An empty URL opens the current document. Omitted leaves out the attribute. A slotted child supplies its own address.',
  },
  asChild: {
    kind: 'boolean',
    group: 'Host',
    default: false,
    description: 'Render a child that supplies the address and forwards anchor props and ref.',
  },
  target: {
    kind: 'enum',
    publicType: "NonNullable<LinkProps['target']>",
    group: 'Host',
    default: '',
    choices: [
      { value: '', label: 'Current tab', omit: true },
      { value: '_blank', label: 'New tab' },
    ],
    description: 'New-tab navigation adds a description and safe rel tokens.',
  },
  rel: {
    kind: 'enum',
    publicType: 'string',
    group: 'Semantics',
    default: '',
    choices: [
      { value: '', label: 'Omitted', omit: true },
      { value: 'nofollow' },
      { value: 'opener' },
    ],
    description: 'Relationship tokens. A new tab strips opener and adds noopener noreferrer.',
  },
  download: {
    kind: 'boolean',
    publicType: "LinkProps['download']",
    group: 'Host',
    default: false,
    description:
      'Pass true or a file name to request a download. This example saves the guide as field-guide.txt.',
  },
  'aria-current': {
    kind: 'enum',
    publicType: "NonNullable<LinkProps['aria-current']>",
    group: 'Semantics',
    default: '',
    choices: [
      { value: '', label: 'Omitted', omit: true },
      { value: 'page' },
      { value: 'location' },
    ],
    description: 'The current destination keeps a full 2px underline.',
  },
  newTabHint: {
    kind: 'string',
    publicType: 'string',
    group: 'Semantics',
    default: '',
    examples: ['', 'Se abre en una pestaña nueva'],
    description: 'Localized new-tab description. An empty value uses the default.',
  },
  iconLeft: {
    kind: 'slot',
    publicType: 'GlyphSource',
    group: 'Content',
    default: '',
    choices: [
      { value: '', label: 'None' },
      { value: 'file', label: 'File', code: 'FileTextIcon' },
    ],
    description: 'Decorative leading glyph at the inherited text size.',
  },
  iconRight: {
    kind: 'slot',
    publicType: 'GlyphSource',
    group: 'Content',
    default: '',
    choices: [
      { value: '', label: 'None' },
      { value: 'arrow', label: 'Arrow', code: 'ArrowRightIcon' },
    ],
    description: 'Decorative trailing glyph. The external marker takes priority.',
  },
  children: {
    kind: 'string',
    publicType: 'ReactNode',
    group: 'Content',
    default: 'Read the field guide',
    examples: ['Read the field guide', 'Guide'],
    description:
      'Provide a readable name. With asChild, one anchor or route component contains the label. A blank example label falls back to the guide name.',
  },
  onClick: {
    kind: 'action',
    group: 'Interaction',
    publicType: 'MouseEventHandler<HTMLAnchorElement>',
    code: 'undefined',
    description:
      'The Playground records activation before the browser follows the destination. Disabled links suppress this callback.',
  },
} as const satisfies PropSchema;

export type LinkValues = ComponentValues<typeof props>;

export default defineComponent({
  id: 'link',
  title: 'Link',
  category: 'Navigation',
  status: 'UI',
  summary:
    'An inline destination that inherits the surrounding text and supports native navigation, downloads, and external links.',
  componentName: 'Link',
  props,
  constraints: [
    {
      kind: 'forbidden',
      when: { asChild: false, disabled: false },
      affects: [{ key: 'href', value: '' }],
      reason: 'An enabled native Link requires an href.',
    },
    {
      kind: 'ignored',
      when: { asChild: true },
      affects: [{ key: 'href', value: '/guides/failover' }],
      reason: 'The child supplies the address. The outer Link omits its href.',
    },
    {
      kind: 'precedence',
      when: { disabled: true },
      affects: [
        { key: 'href', value: '/guides/failover' },
        { key: 'download', value: true },
        { key: 'target', value: '_blank' },
        { key: 'rel', value: 'nofollow' },
        { key: 'rel', value: 'opener' },
        { key: 'aria-current', value: 'page' },
        { key: 'aria-current', value: 'location' },
      ],
      reason:
        'An unavailable link has no address, target, relationship, download, or current marker.',
    },
    {
      kind: 'ignored',
      when: { disabled: true },
      affects: ['newTabHint'],
      reason: 'Unavailable destinations have no new-tab notice.',
    },
    {
      kind: 'ignored',
      when: { target: '', disabled: false },
      affects: ['newTabHint'],
      reason: 'Only new-tab navigation receives the notice.',
    },
    {
      kind: 'precedence',
      when: { external: true },
      affects: [{ key: 'iconRight', value: 'arrow' }],
      reason: 'The external mark occupies the trailing glyph slot.',
    },
    {
      kind: 'precedence',
      when: { target: '_blank', download: false, external: false },
      affects: [{ key: 'iconRight', value: 'arrow' }],
      reason: 'The new-tab target supplies the external mark.',
    },
    {
      kind: 'precedence',
      when: { target: '_blank', download: true, disabled: false },
      affects: ['newTabHint'],
      reason: 'Download keeps the safe rel and suppresses the automatic mark and notice.',
    },
    {
      kind: 'precedence',
      when: { target: '_blank', disabled: false },
      affects: [{ key: 'rel', value: 'opener' }],
      reason: 'A new-tab target removes opener and adds noopener and noreferrer.',
    },
  ],
  code: linkCode,
  render: withOverlaySurface(LinkPlayground, 'border-box'),
  states: [
    {
      id: 'typography',
      rows: 'size',
      cols: 'underline',
      group: 'tone',
      title: 'Scale and underline',
      fixed: { children: 'Guide', target: '_blank' },
      caption:
        'Compare how the new-tab glyph scales with the text across tones and underline policies.',
    },
    {
      id: 'destinations',
      rows: 'target',
      cols: 'aria-current',
      group: 'disabled',
      title: 'Destination and availability',
      fixed: { children: 'Guide' },
      caption:
        'Compare current and new-tab links. Removing the address also removes the current marker and the new-tab announcement.',
    },
  ],
  cases: [
    {
      id: 'glyphs',
      title: 'Glyphs in the reading line',
      kind: 'content',
      mode: 'live',
      caption:
        'Compare a leading glyph and external destinations in the current and a new tab within the surrounding type.',
      render: withOverlaySurface(LinkGlyphStudy, 'border-box'),
    },
    {
      id: 'states',
      mode: 'live',
      title: 'Ink and interaction',
      kind: 'behavior',
      caption:
        'Hover, hold, or Tab to a link. The current destination keeps a two-pixel line through interaction.',
      render: withOverlaySurface(LinkStates, 'border-box'),
    },
    {
      id: 'wrapping',
      title: 'Long text and direction',
      kind: 'content',
      mode: 'live',
      caption:
        'Read a wrapped label and an unbroken URL. Inspect the external glyph beside the last word and the directional arrow in RTL.',
      render: withOverlaySurface(LinkWrapping, 'border-box'),
    },
    {
      id: 'surfaces',
      title: 'Canvas and card',
      kind: 'surface',
      mode: 'live',
      caption: 'Compare inline and standalone links on the canvas and inside a card.',
      render: LinkSurfaces,
    },
    {
      id: 'overlay',
      title: 'Links on a floating surface',
      kind: 'surface',
      mode: 'live',
      surface: 'overlay',
      overlayStage: true,
      caption: 'Inspect available, current, and unavailable links on the floating material.',
      render: LinkOverlay,
    },
    {
      id: 'context',
      title: 'Inherited ink at surface boundaries',
      kind: 'surface',
      mode: 'live',
      caption:
        'Tab through the notice, card, and floating surface to see where contextual focus ink resets and returns.',
      render: withOverlaySurface(LinkContext, 'border-box'),
    },
    {
      id: 'destinations',
      title: 'Route, download, and new tab',
      kind: 'behavior',
      mode: 'live',
      controls: { disabled: { kind: 'boolean', label: 'Disable release notes', default: false } },
      caption:
        'Change the route link’s availability, follow its fragment, download the text file, or open the Spanish resource in a new tab.',
      render: withOverlaySurface(LinkDestinations, 'border-box'),
    },
    {
      id: 'live',
      title: 'Try native navigation',
      kind: 'behavior',
      mode: 'live',
      caption:
        'Follow Summary and Details using Tab and Enter, a modified click, or the context menu. Back and Forward update the current location.',
      render: withOverlaySurface(LinkLiveNavigation, 'border-box'),
    },
  ],
  compositions: [
    {
      id: 'reading',
      title: 'Links in the reading flow',
      mode: 'live',
      caption:
        'Read links in paragraphs, a linked heading and a quotation. Their type follows the surrounding text.',
      render: withOverlaySurface(
        ({ ctx }) => <LinkReadingExample subject={ctx.subject} />,
        'border-box',
      ),
      code: readingSource,
    },
    {
      id: 'navigation',
      title: 'Standalone navigation',
      mode: 'live',
      caption:
        'Compare underline policies in three navigation groups. The current component keeps its marker and link to this page.',
      render: withOverlaySurface(
        ({ ctx }) => (
          <LinkNavigationExample
            subject={ctx.subject}
            buttonHref="?item=button"
            textHref="?item=text"
          />
        ),
        'border-box',
      ),
      code: navigationSource,
    },
  ],
});
