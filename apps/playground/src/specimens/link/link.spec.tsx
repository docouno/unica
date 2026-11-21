import { FileTextIcon, ArrowRightIcon } from '@phosphor-icons/react';
import { Link } from '@docouno/unica';
import type { MouseEvent } from 'react';
import { previewProps, previewText } from '../preview-code.js';
import { defineComponent } from '../../workbench/types.js';
import {
  ReadingExamples,
  TypographyExamples,
  StateExamples,
  NavigationExamples,
  WrappingExamples,
  SurfaceExamples,
  ContextExamples,
  LiveExamples,
  DestinationExamples,
  RouteAnchor,
} from './link.examples.js';

export default defineComponent({
  id: 'link',
  title: 'Link',
  category: 'Navigation',
  status: 'UI',
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
    href: {
      kind: 'enum',
      group: 'Destination',
      default: '#guide',
      choices: [
        { value: '#guide', label: 'Guide fragment' },
        { value: '', label: 'Omitted' },
      ],
      description: 'To use a child route, temporarily disable the link and omit its outer href.',
    },
    asChild: {
      kind: 'boolean',
      group: 'Destination',
      default: false,
      description: 'Render a child that supplies the address and forwards anchor props and ref.',
    },
    target: {
      kind: 'enum',
      group: 'Destination',
      default: '',
      choices: [
        { value: '', label: 'Current tab' },
        { value: '_blank', label: 'New tab' },
      ],
      description: 'New-tab navigation adds a description and safe rel tokens.',
    },
    rel: {
      kind: 'enum',
      group: 'Semantics',
      default: '',
      choices: [{ value: '', label: 'Omitted' }, { value: 'nofollow' }, { value: 'opener' }],
      description: 'Relationship tokens. A new tab strips opener and adds noopener noreferrer.',
    },
    download: {
      kind: 'boolean',
      group: 'Destination',
      default: false,
      description: 'Request a browser download. Try the live Destinations case.',
    },
    'aria-current': {
      kind: 'enum',
      group: 'Semantics',
      default: '',
      choices: [{ value: '', label: 'Omitted' }, { value: 'page' }, { value: 'location' }],
      description: 'The current destination keeps a full 2px underline.',
    },
    newTabHint: {
      kind: 'string',
      group: 'Semantics',
      default: '',
      examples: ['', 'Se abre en una pestaña nueva'],
      description: 'Localized new-tab description. An empty value uses the default.',
    },
    iconLeft: {
      kind: 'slot',
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
  constraints: [
    {
      kind: 'forbidden',
      when: { asChild: false, disabled: false },
      affects: [{ key: 'href', value: '' }],
      reason: 'An enabled native Link requires an href.',
    },
    {
      kind: 'forbidden',
      when: { asChild: true },
      affects: [{ key: 'href', value: '#guide' }],
      reason: 'The child supplies the address in asChild mode.',
    },
    {
      kind: 'precedence',
      when: { disabled: true },
      affects: [
        { key: 'href', value: '#guide' },
        { key: 'download', value: true },
        { key: 'aria-current', value: 'page' },
        { key: 'aria-current', value: 'location' },
      ],
      reason: 'An unavailable link has no address, download behavior, or current state.',
    },
    {
      kind: 'ignored',
      when: { disabled: true },
      affects: [{ key: 'newTabHint', value: 'Se abre en una pestaña nueva' }],
      reason: 'Unavailable destinations have no new-tab notice.',
    },
    {
      kind: 'ignored',
      when: { target: '' },
      affects: [{ key: 'newTabHint', value: 'Se abre en una pestaña nueva' }],
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
      reason: 'New-tab navigation supplies an external mark.',
    },
    {
      kind: 'precedence',
      when: { target: '_blank', download: true },
      affects: [{ key: 'newTabHint', value: 'Se abre en una pestaña nueva' }],
      reason: 'Download keeps the safe rel and suppresses the automatic mark and notice.',
    },
  ],
  render: ({
    ctx,
    values: {
      children,
      href,
      asChild,
      target,
      rel,
      download,
      iconLeft,
      iconRight,
      disabled,
      ...style
    },
  }) => {
    const props = {
      ...ctx.subject,
      ...style,
      disabled,
      target: target || undefined,
      rel: rel || undefined,
      download,
      iconLeft: iconLeft ? FileTextIcon : undefined,
      iconRight: iconRight ? ArrowRightIcon : undefined,
      'aria-current': style['aria-current'] || undefined,
      onClick(event: MouseEvent<HTMLAnchorElement>) {
        event.preventDefault();
        ctx.action('onClick')(event.currentTarget.getAttribute('href'));
      },
    };
    if (asChild) {
      return (
        <Link {...props} asChild>
          <RouteAnchor to="#guide">{children}</RouteAnchor>
        </Link>
      );
    }
    return disabled && !href ? (
      <Link {...props} disabled>
        {children}
      </Link>
    ) : (
      <Link {...props} href={href}>
        {children}
      </Link>
    );
  },
  code: ({ children, href, asChild, iconLeft, iconRight, ...props }) => {
    const common = previewProps(props, {
      tone: 'accent',
      size: 'inherit',
      underline: 'always',
      external: false,
      disabled: false,
      'aria-current': '',
      rel: '',
      target: '',
      download: false,
      newTabHint: '',
    });
    const icons =
      (iconLeft ? ' iconLeft={FileTextIcon}' : '') +
      (iconRight ? ' iconRight={ArrowRightIcon}' : '');
    const url = href ? ' href="#guide"' : '';
    const label = previewText(children);
    return asChild
      ? `<Link asChild${common}${icons} onClick={handleClick}>
  <RouterLink to="#guide">${label}</RouterLink>
</Link>`
      : `<Link${url}${common}${icons} onClick={handleClick}>${label}</Link>`;
  },
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
    {
      id: 'destinations',
      rows: 'target',
      cols: 'aria-current',
      group: 'disabled',
      title: 'Destination & availability',
      caption: 'Current and new-tab descriptions follow the availability of the destination.',
    },
  ],
  cases: [
    {
      id: 'states',
      mode: 'live',
      title: 'Ink & interaction',
      caption: 'Hover, hold, or Tab to a link. Current keeps a 2px line through interaction.',
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
      title: 'Links on a floating surface',
      surface: 'overlay',
      overlayStage: true,
      kind: 'surface',
      render: () => <SurfaceExamples overlay />,
    },
    {
      id: 'context',
      title: 'Inherited ink at surface boundaries',
      caption:
        'Tab through the notice, Card, and Overlay to see where contextual focus ink resets and returns.',
      mode: 'live',
      kind: 'surface',
      render: () => <ContextExamples />,
    },
    {
      id: 'destinations',
      mode: 'live',
      title: 'Route, download, and new tab',
      caption:
        'Toggle the route link’s availability, follow its fragment, or download the sample file.',
      kind: 'behavior',
      render: () => <DestinationExamples />,
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
