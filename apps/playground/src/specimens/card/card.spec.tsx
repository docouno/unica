import { ArrowRightIcon } from '@phosphor-icons/react';
import {
  Card,
  CardAction,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardMedia,
  CardSection,
  CardTitle,
  Icon,
  Link,
  Stack,
  Text,
} from '@docouno/unica';
import type { ReactElement } from 'react';
import { defineComponent } from '../../workbench/types.js';
import type { ComponentValues, PropSchema } from '../../workbench/types.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { previewProps, previewText } from '../preview-code.js';
import {
  Anatomy,
  Availability,
  Media,
  Navigation,
  Overflow,
  Overlay,
  SaveAction,
  Sections,
  States,
} from './card.examples.js';

const props = {
  variant: {
    kind: 'enum',
    group: 'Role',
    default: 'default',
    description: 'Card.variant sets the surface hierarchy.',
    choices: [{ value: 'default' }, { value: 'subtle' }],
  },
  size: {
    kind: 'enum',
    group: 'Geometry',
    default: 'm',
    description: 'Card.size controls padding, spacing and corner geometry.',
    choices: [{ value: 's' }, { value: 'm' }, { value: 'l' }],
  },
  orientation: {
    kind: 'enum',
    group: 'Geometry',
    default: 'vertical',
    description: 'Card.orientation places media beside the body when the card has enough room.',
    choices: [{ value: 'vertical' }, { value: 'horizontal' }],
  },
  host: {
    kind: 'enum',
    group: 'Host',
    demo: true,
    default: 'div',
    description:
      'Delegate the Card root with asChild to use an article, section or whole-card link.',
    choices: [
      { value: 'div' },
      { value: 'article' },
      { value: 'section' },
      { value: 'a', label: 'Whole-card link' },
    ],
  },
  action: {
    kind: 'boolean',
    group: 'Interaction',
    demo: true,
    default: false,
    description: 'Add a save button in CardAction and a separate title link.',
  },
  media: {
    kind: 'enum',
    group: 'Content',
    demo: true,
    default: 'none',
    description: 'Insert an image directly or put it in a configurable CardSection.',
    choices: [{ value: 'none' }, { value: 'direct' }, { value: 'section' }],
  },
  title: {
    kind: 'string',
    group: 'Content',
    demo: true,
    default: 'Field guide',
    description: 'Content of CardTitle and the accessible name of the whole-card link.',
  },
  as: {
    kind: 'enum',
    group: 'Semantics',
    default: 'h3',
    description: 'CardTitle.as sets the heading level in the surrounding outline.',
    choices: [
      { value: 'h1' },
      { value: 'h2' },
      { value: 'h3' },
      { value: 'h4' },
      { value: 'h5' },
      { value: 'h6' },
    ],
  },
  titleSize: {
    kind: 'enum',
    group: 'Geometry',
    demo: true,
    default: 'body-m',
    description: 'Supplies CardTitle.size independently of Card.size.',
    choices: [{ value: 'body-m' }, { value: 'heading-s' }, { value: 'heading-m' }],
  },
  justify: {
    kind: 'enum',
    group: 'Geometry',
    default: 'between',
    description: 'CardFooter.justify aligns footer content along the inline axis.',
    choices: [{ value: 'start' }, { value: 'end' }, { value: 'between' }],
  },
  withBorder: {
    kind: 'boolean',
    group: 'Geometry',
    default: false,
    description: 'CardFooter.withBorder separates the footer from the body.',
  },
  placement: {
    kind: 'enum',
    group: 'Geometry',
    default: 'flush',
    description:
      'CardSection.placement bleeds media to the edge or keeps the section within the card inset.',
    choices: [{ value: 'flush' }, { value: 'inset' }],
  },
  padded: {
    kind: 'boolean',
    group: 'Geometry',
    default: false,
    description: 'CardSection.padded adds the card inset inside the media section.',
  },
  sectionBorder: {
    kind: 'boolean',
    group: 'Geometry',
    demo: true,
    label: 'CardSection.withBorder',
    default: false,
    description: 'Supplies CardSection.withBorder to separate the media section from the body.',
  },
  aspectRatio: {
    kind: 'enum',
    group: 'Geometry',
    default: '',
    publicType: "CSSProperties['aspectRatio']",
    description:
      'CardMedia.aspectRatio reserves the frame. When omitted, style.aspectRatio or the natural image dimensions govern its height.',
    choices: [
      { value: '', label: 'Use style or natural size', omit: true },
      { value: '16 / 9', label: '16:9' },
      { value: '4 / 3', label: '4:3' },
    ],
  },
  fit: {
    kind: 'enum',
    group: 'Geometry',
    default: 'cover',
    description: 'CardMedia.fit crops to fill its frame or shows the whole image.',
    choices: [{ value: 'cover' }, { value: 'contain' }],
  },
  styleRatio: {
    kind: 'enum',
    group: 'Geometry',
    demo: true,
    label: 'style.aspectRatio',
    default: '',
    description: 'Supplies a CSS ratio through CardMedia style.aspectRatio.',
    choices: [
      { value: '', label: 'Omit', omit: true },
      { value: '3 / 2', label: '3:2' },
      { value: '2 / 1', label: '2:1' },
    ],
  },
} as const satisfies PropSchema;

const imageSrc = '/assets/skeleton-report-landscape.svg';
const description = 'Notes and decisions for the release.';

function heading(values: ComponentValues<typeof props>): string {
  return values.title.trim() || 'Field guide';
}

export default defineComponent({
  id: 'card',
  title: 'Card',
  category: 'Surfaces & Structure',
  status: 'UI',
  summary: 'Bounded surfaces for content, links, and independent actions.',
  componentName: 'Card',
  props,
  constraints: [
    {
      kind: 'forbidden',
      when: { host: 'a' },
      affects: [{ key: 'action', value: true }],
      reason: 'A whole-card anchor can contain only passive content.',
    },
    {
      kind: 'ignored',
      when: { media: 'none' },
      affects: ['fit', 'aspectRatio', 'styleRatio'],
      reason: 'Media props apply when a frame is present.',
    },
    ...(['none', 'direct'] as const).map((media) => ({
      kind: 'ignored' as const,
      when: { media },
      affects: ['placement', 'padded', 'sectionBorder'],
      reason: 'Section props apply when the frame is wrapped in CardSection.',
    })),
    ...(['16 / 9', '4 / 3'] as const).map((aspectRatio) => ({
      kind: 'precedence' as const,
      when: { aspectRatio },
      affects: [
        { key: 'styleRatio', value: '3 / 2' },
        { key: 'styleRatio', value: '2 / 1' },
      ],
      reason: 'The aspectRatio prop overrides style.aspectRatio on the frame.',
    })),
  ],
  render: withOverlaySurface(({ ctx, values }) => {
    const {
      variant,
      size,
      orientation,
      host,
      media,
      action,
      as,
      titleSize,
      justify,
      withBorder,
      placement,
      padded,
      sectionBorder,
      aspectRatio,
      fit,
      styleRatio,
    } = values;
    const surface = { ...ctx.subject, variant, size, orientation };
    const title = heading(values);
    const titleId = `${ctx.id}-heading`;
    const destinationId = `${ctx.id}-destination`;
    const href = `#${destinationId}`;
    const frame = media !== 'none' && (
      <CardMedia
        fit={fit}
        aspectRatio={aspectRatio || undefined}
        style={styleRatio ? { aspectRatio: styleRatio } : undefined}
      >
        <img src={imageSrc} alt="" width="720" height="405" />
      </CardMedia>
    );
    const content = (
      <>
        {media === 'section' ? (
          <CardSection placement={placement} withBorder={sectionBorder} padded={padded}>
            {frame}
          </CardSection>
        ) : (
          frame
        )}
        <CardBody>
          <CardHeader>
            <CardTitle id={host === 'a' ? titleId : undefined} as={as} size={titleSize}>
              {action ? (
                <Link tone="inherit" href={href}>
                  <bdi>{title}</bdi>
                </Link>
              ) : (
                <bdi>{title}</bdi>
              )}
            </CardTitle>
            <CardDescription>
              <bdi>{description}</bdi>
            </CardDescription>
            {action && (
              <CardAction>
                <SaveAction name={title} />
              </CardAction>
            )}
          </CardHeader>
          <CardFooter justify={justify} withBorder={withBorder}>
            <Text size="caption-m" color="muted">
              <bdi>{host === 'a' ? 'Read the guide' : 'Updated today'}</bdi>
            </Text>
            {host === 'a' ? (
              <Icon usage="slot" icon={ArrowRightIcon} size="m" directional />
            ) : (
              <Text size="caption-m" color="muted">
                <bdi>8 min read</bdi>
              </Text>
            )}
          </CardFooter>
        </CardBody>
      </>
    );
    const Host = host;
    let card: ReactElement;
    switch (Host) {
      case 'div':
        card = <Card {...surface}>{content}</Card>;
        break;
      case 'a':
        card = (
          <Card {...surface} asChild>
            <a href={href} aria-labelledby={titleId}>
              {content}
            </a>
          </Card>
        );
        break;
      default:
        card = (
          <Card {...surface} asChild>
            <Host>{content}</Host>
          </Card>
        );
    }
    const sample =
      host === 'a' || action ? (
        <Stack gap={16}>
          {card}
          <Text tabIndex={-1} id={destinationId} size="body-s">
            <bdi>Guide preview</bdi>
          </Text>
        </Stack>
      ) : (
        card
      );
    // Media comparisons need room for Card's 28rem horizontal layout and outer insets.
    return ctx.tab === 'states' ? (
      <div
        data-card-comparison=""
        style={{ inlineSize: media === 'none' ? '16rem' : '33rem', padding: 'var(--space-4)' }}
      >
        {sample}
      </div>
    ) : (
      sample
    );
  }, 'border-box'),
  code: ({
    variant,
    size,
    orientation,
    host,
    media,
    action,
    title,
    as,
    titleSize,
    justify,
    withBorder,
    placement,
    padded,
    sectionBorder,
    aspectRatio,
    fit,
    styleRatio,
  }) => {
    const root = previewProps(
      { variant, size, orientation, asChild: host !== 'div' },
      { variant: 'default', size: 'm', orientation: 'vertical', asChild: false },
    );
    const titleAttrs = previewProps({ as, size: titleSize }, { as: 'h3', size: 'body-m' });
    const footer = previewProps({ justify, withBorder }, { justify: 'between', withBorder: false });
    const section = previewProps(
      { placement, padded, withBorder: sectionBorder },
      { placement: 'flush', padded: false, withBorder: false },
    );
    const frame = previewProps({ aspectRatio, fit }, { aspectRatio: '', fit: 'cover' });
    const style = styleRatio ? ` style={{ aspectRatio: ${JSON.stringify(styleRatio)} }}` : '';
    const name = title.trim() || 'Field guide';
    const titleText = `<bdi>${previewText(name)}</bdi>`;
    const linked = host === 'a';
    const navigable = linked || action;
    const imports = [
      'Card',
      'CardBody',
      'CardDescription',
      'CardFooter',
      'CardHeader',
      'CardTitle',
      'Text',
    ];
    const mediaLines =
      media === 'none'
        ? []
        : [
            `<CardMedia${frame}${style}>`,
            `  <img src="${imageSrc}" alt="" width="720" height="405" />`,
            '</CardMedia>',
          ];
    if (media !== 'none') {
      imports.push('CardMedia');
    }
    if (media === 'section') {
      imports.push('CardSection');
    }
    if (linked) {
      imports.push('Icon');
    }
    if (action) {
      imports.push('CardAction', 'IconButton', 'Link');
    }
    if (navigable) {
      imports.push('Stack');
    }

    const content = [
      ...(media === 'section'
        ? [`<CardSection${section}>`, ...mediaLines, '</CardSection>']
        : mediaLines),
      '<CardBody>',
      '<CardHeader>',
      `<CardTitle${linked ? ' id={titleId}' : ''}${titleAttrs}>${action ? `<Link tone="inherit" href={href}>${titleText}</Link>` : titleText}</CardTitle>`,
      `<CardDescription><bdi>${description}</bdi></CardDescription>`,
      ...(action
        ? [
            '<CardAction>',
            `<IconButton size="s" variant="ghost" tone="neutral" icon={saved ? CheckIcon : BookmarkSimpleIcon} aria-label={${JSON.stringify(`Save ${name}`)}} pressed={saved} onPressedChange={setSaved} />`,
            '</CardAction>',
          ]
        : []),
      '</CardHeader>',
      `<CardFooter${footer}>`,
      `<Text size="caption-m" color="muted"><bdi>${linked ? 'Read the guide' : 'Updated today'}</bdi></Text>`,
      linked
        ? '<Icon usage="slot" icon={ArrowRightIcon} size="m" directional />'
        : '<Text size="caption-m" color="muted"><bdi>8 min read</bdi></Text>',
      '</CardFooter>',
      '</CardBody>',
    ];
    const hostContents =
      host === 'div'
        ? content
        : [
            linked ? '<a href={href} aria-labelledby={titleId}>' : `<${host}>`,
            ...content,
            `</${host}>`,
          ];
    const card = [`<Card${root}>`, ...hostContents, '</Card>'].join('\n');
    const library = `import { ${imports.sort().join(', ')} } from '@docouno/unica';`;
    if (!navigable) {
      return `${library}\n\n${card}`;
    }

    const icons = linked ? 'ArrowRightIcon' : 'BookmarkSimpleIcon, CheckIcon';
    return [
      `import { useId${action ? ', useState' : ''} } from 'react';`,
      `import { ${icons} } from '@phosphor-icons/react';`,
      library,
      '',
      'export function FieldGuideCard() {',
      '  const destinationId = useId();',
      "  const href = '#' + destinationId;",
      ...(linked ? ['  const titleId = useId();'] : []),
      ...(action ? ['  const [saved, setSaved] = useState(false);'] : []),
      '  return (',
      '    <Stack gap={16}>',
      card,
      '      <Text tabIndex={-1} id={destinationId} size="body-s"><bdi>Guide preview</bdi></Text>',
      '    </Stack>',
      '  );',
      '}',
    ].join('\n');
  },
  states: [
    {
      id: 'hierarchy',
      rows: 'variant',
      cols: 'size',
      title: 'Surface hierarchy and density',
      caption:
        'Compare the two surface roles at each size. The title keeps the same type scale as padding and spacing change.',
    },
    {
      id: 'orientation',
      rows: 'orientation',
      cols: 'media',
      fixed: { aspectRatio: '4 / 3' },
      title: 'Orientation and media composition',
      caption:
        'Compare a text-only card with direct media and a media section. Horizontal cards put media beside the body from 28rem of content width.',
    },
  ],
  cases: [
    {
      id: 'anatomy',
      title: 'Header, body and footer',
      kind: 'behavior',
      mode: 'live',
      caption:
        'Save a guide or mark a review complete. Each header action stays separate from its title, description and footer.',
      render: withOverlaySurface(Anatomy, 'border-box'),
    },
    {
      id: 'media',
      title: 'Media, corners and orientation',
      kind: 'behavior',
      mode: 'live',
      controls: {
        size: {
          kind: 'enum',
          label: 'Size',
          default: 'm',
          choices: [
            { value: 's', label: 'Small' },
            { value: 'm', label: 'Medium' },
            { value: 'l', label: 'Large' },
          ],
        },
        placement: {
          kind: 'enum',
          label: 'Horizontal media',
          default: 'flush',
          choices: [
            { value: 'flush', label: 'Flush' },
            { value: 'inset', label: 'Inset' },
          ],
        },
        width: {
          kind: 'number',
          label: 'Available width',
          min: 300,
          max: 680,
          step: 1,
          default: 560,
        },
      },
      reset: true,
      caption:
        'Compare flush and inset media, cover and contain, then change the horizontal card’s width. Media stacks above the body below 28rem of content width.',
      render: withOverlaySurface(Media, 'border-box'),
    },
    {
      id: 'sections',
      title: 'Inset, flush and bordered sections',
      kind: 'content',
      mode: 'live',
      caption:
        'Compare padded and edge-to-edge sections, toggle a reading preference and inspect a quieter card nested inside its parent.',
      render: withOverlaySurface(Sections, 'border-box'),
    },
    {
      id: 'navigation',
      title: 'Links and independent actions',
      kind: 'behavior',
      mode: 'live',
      caption:
        'A short card links as one target. In the richer card, follow the title, bookmark the guide or select it independently.',
      render: withOverlaySurface(Navigation, 'border-box'),
    },
    {
      id: 'states',
      title: 'Navigation state study',
      kind: 'behavior',
      mode: 'pinned',
      controls: {
        variant: {
          kind: 'enum',
          label: 'Variant',
          default: 'default',
          choices: ['default', 'subtle'],
        },
        size: { kind: 'enum', label: 'Size', default: 'm', choices: ['s', 'm', 'l'] },
      },
      reset: true,
      caption:
        'Compare the resting, hovered, pressed and keyboard-focused whole-card link at the same size and hierarchy.',
      render: withOverlaySurface(States, 'border-box'),
    },
    {
      id: 'availability',
      title: 'Loading, empty and unavailable',
      kind: 'behavior',
      mode: 'live',
      controls: { loaded: { kind: 'boolean', label: 'Show loaded content', default: false } },
      actions: [{ id: 'fail-image', label: 'Fail image' }],
      reset: true,
      caption:
        'Compare a loading card with its content, request access to a restricted collection, or retry an unavailable image in its reserved frame.',
      render: withOverlaySurface(Availability, 'border-box'),
    },
    {
      id: 'overflow',
      title: 'Wrapping and uneven content',
      kind: 'content',
      mode: 'live',
      caption:
        'Compare the header, independent action and footer when titles, metadata and body copy have different lengths.',
      render: withOverlaySurface(Overflow, 'border-box'),
    },
    {
      id: 'overlay',
      title: 'Inside a floating surface',
      surface: 'overlay',
      overlayStage: true,
      kind: 'surface',
      mode: 'live',
      controls: {
        study: {
          kind: 'enum',
          label: 'Study',
          default: 'hierarchy',
          choices: [
            { value: 'hierarchy', label: 'Content hierarchy' },
            { value: 'states', label: 'Pinned navigation states' },
            { value: 'navigation', label: 'Live links and actions' },
          ],
        },
        variant: {
          kind: 'enum',
          label: 'Variant',
          default: 'default',
          choices: ['default', 'subtle'],
        },
        size: { kind: 'enum', label: 'Size', default: 'm', choices: ['s', 'm', 'l'] },
      },
      reset: true,
      caption:
        'Inspect content hierarchy, pinned navigation states and live links against one host material. The enclosing panel supplies the floating surface.',
      render: Overlay,
    },
  ],
  compositions: [
    {
      id: 'sections',
      title: 'Sections and content composition',
      mode: 'pinned',
      caption:
        'An article groups a guide heading and summary above a padded release-notes section. The divider belongs to CardSection.',
      code: `import { Card, CardDescription, CardHeader, CardSection, CardTitle, Text } from '@docouno/unica';

<Card asChild>
  <article>
    <CardHeader>
      <CardTitle as="h2">Field guide</CardTitle>
      <CardDescription><bdi>Notes and decisions for the release.</bdi></CardDescription>
    </CardHeader>
    <CardSection withBorder padded><Text size="body-s">Release notes</Text></CardSection>
  </article>
</Card>`,
      render: withOverlaySurface(
        () => (
          <Card asChild>
            <article>
              <CardHeader>
                <CardTitle as="h2">Field guide</CardTitle>
                <CardDescription>
                  <bdi>{description}</bdi>
                </CardDescription>
              </CardHeader>
              <CardSection withBorder padded>
                <Text size="body-s">Release notes</Text>
              </CardSection>
            </article>
          </Card>
        ),
        'border-box',
      ),
    },
  ],
});
