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
  Text,
} from '@docouno/unica';
import type { ReactElement } from 'react';
import { defineComponent } from '../../workbench/types.js';
import type { ComponentValues, PropSchema } from '../../workbench/types.js';
import { previewProps, previewText } from '../preview-code.js';
import {
  Anatomy,
  Availability,
  Hierarchy,
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
    group: 'Card',
    default: 'default',
    description: 'Choose the surface hierarchy.',
    choices: [{ value: 'default' }, { value: 'subtle' }],
  },
  size: {
    kind: 'enum',
    group: 'Card',
    default: 'm',
    description: 'Set padding, spacing and corner geometry.',
    choices: [{ value: 's' }, { value: 'm' }, { value: 'l' }],
  },
  orientation: {
    kind: 'enum',
    group: 'Card',
    default: 'vertical',
    description: 'Place media beside the body when the card has enough room.',
    choices: [{ value: 'vertical' }, { value: 'horizontal' }],
  },
  host: {
    kind: 'enum',
    group: 'Composition',
    demo: true,
    default: 'div',
    description: 'Delegate the root with asChild to use an article, section or link.',
    choices: [
      { value: 'div' },
      { value: 'article' },
      { value: 'section' },
      { value: 'a', label: 'Whole-card link' },
    ],
  },
  action: {
    kind: 'boolean',
    group: 'Composition',
    demo: true,
    default: false,
    description: 'Add a save button in CardAction and a separate title link.',
  },
  media: {
    kind: 'slot',
    group: 'Composition',
    demo: true,
    default: 'none',
    description: 'Insert an image directly or put it in a configurable CardSection.',
    choices: [{ value: 'none' }, { value: 'direct' }, { value: 'section' }],
  },
  title: {
    kind: 'string',
    group: 'CardTitle',
    demo: true,
    default: 'Field guide',
    description: 'Visible heading and accessible name of the whole-card link.',
  },
  as: {
    kind: 'enum',
    group: 'CardTitle',
    default: 'h3',
    description: 'Fit the heading to the surrounding document outline.',
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
    group: 'CardTitle',
    demo: true,
    default: 'body-m',
    description: 'Set the heading size independently of the surface.',
    choices: [{ value: 'body-m' }, { value: 'heading-s' }, { value: 'heading-m' }],
  },
  justify: {
    kind: 'enum',
    group: 'CardFooter',
    default: 'between',
    description: 'Align footer content along the inline axis.',
    choices: [{ value: 'start' }, { value: 'end' }, { value: 'between' }],
  },
  withBorder: {
    kind: 'boolean',
    group: 'CardFooter',
    default: false,
    description: 'Separate the footer with a divider.',
  },
  placement: {
    kind: 'enum',
    group: 'CardSection',
    default: 'flush',
    description: 'Bleed to the edge or keep the section within the card inset.',
    choices: [{ value: 'flush' }, { value: 'inset' }],
  },
  padded: {
    kind: 'boolean',
    group: 'CardSection',
    default: false,
    description: 'Add the card inset within the media section.',
  },
  sectionBorder: {
    kind: 'boolean',
    group: 'CardSection',
    demo: true,
    label: 'withBorder',
    default: false,
    description: 'Draw a divider between the media section and the card content.',
  },
  aspectRatio: {
    kind: 'enum',
    group: 'CardMedia',
    default: '',
    description: 'Reserve a frame or let the original image set the height.',
    choices: [
      { value: '', label: 'Use style or natural size' },
      { value: '16 / 9' },
      { value: '4 / 3' },
    ],
  },
  fit: {
    kind: 'enum',
    group: 'CardMedia',
    default: 'cover',
    description: 'Crop to fill the frame or show the whole image.',
    choices: [{ value: 'cover' }, { value: 'contain' }],
  },
  styleRatio: {
    kind: 'enum',
    group: 'CardMedia',
    demo: true,
    label: 'style.aspectRatio',
    default: '',
    description: 'Supply a ratio through the style prop.',
    choices: [{ value: '', label: 'Omit' }, { value: '3 / 2' }, { value: '2 / 1' }],
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
  render: ({ ctx, values }) => {
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
            <CardTitle id={titleId} as={as} size={titleSize}>
              {action ? <a href={href}>{title}</a> : title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
            {action && (
              <CardAction>
                <SaveAction name={title} />
              </CardAction>
            )}
          </CardHeader>
          <CardFooter justify={justify} withBorder={withBorder}>
            <Text size="caption-m" color="muted">
              {host === 'a' ? 'Read the guide' : 'Updated today'}
            </Text>
            {host === 'a' && <Icon usage="slot" icon={ArrowRightIcon} size="m" directional />}
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
    return host === 'a' || action ? (
      <div className="card-example-stack">
        {card}
        <div className="card-example-destination" tabIndex={-1} id={destinationId}>
          Guide preview
        </div>
      </div>
    ) : (
      card
    );
  },
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
    const titleText = previewText(title.trim() || 'Field guide');
    const linked = host === 'a';
    const mediaLines =
      media === 'none'
        ? []
        : [
            `<CardMedia${frame}${style}>`,
            `  <img src="${imageSrc}" alt="" width={720} height={405} />`,
            '</CardMedia>',
          ];
    const content = [
      ...(media === 'section'
        ? [`<CardSection${section}>`, ...mediaLines.map((line) => `  ${line}`), '</CardSection>']
        : mediaLines),
      '<CardBody>',
      '  <CardHeader>',
      `    <CardTitle${linked ? ' id="guide-title"' : ''}${titleAttrs}>${action ? `<a href="#guide">${titleText}</a>` : titleText}</CardTitle>`,
      `    <CardDescription>${description}</CardDescription>`,
      ...(action ? ['    <CardAction><button type="button">Save</button></CardAction>'] : []),
      '  </CardHeader>',
      `  <CardFooter${footer}>`,
      `    <Text size="caption-m" color="muted">${linked ? 'Read the guide' : 'Updated today'}</Text>`,
      ...(linked ? ['    <Icon usage="slot" icon={ArrowRightIcon} size="m" directional />'] : []),
      '  </CardFooter>',
      '</CardBody>',
    ];
    const children =
      host === 'div'
        ? content
        : [
            linked ? '<a href="#guide" aria-labelledby="guide-title">' : `<${host}>`,
            ...content.map((line) => `  ${line}`),
            `</${host}>`,
          ];
    return [`<Card${root}>`, ...children.map((line) => `  ${line}`), '</Card>'].join('\n');
  },
  matrixViews: [
    {
      id: 'hierarchy',
      rows: 'variant',
      cols: 'size',
      title: 'Surface hierarchy & density',
      reference: () => <Hierarchy />,
    },
    {
      id: 'orientation',
      rows: 'orientation',
      cols: 'media',
      fixed: { aspectRatio: '4 / 3' },
      title: 'Orientation & media composition',
    },
  ],
  cases: [
    { id: 'anatomy', title: 'Header, body & footer', kind: 'behavior', render: () => <Anatomy /> },
    {
      id: 'media',
      title: 'Media, corners & orientation',
      kind: 'behavior',
      render: () => <Media />,
    },
    {
      id: 'sections',
      title: 'Inset, flush & bordered sections',
      kind: 'content',
      render: () => <Sections />,
    },
    {
      id: 'navigation',
      mode: 'live',
      title: 'Links & independent actions',
      kind: 'behavior',
      render: () => <Navigation />,
    },
    {
      id: 'states',
      mode: 'pinned',
      title: 'Navigation state study',
      kind: 'behavior',
      render: () => <States />,
    },
    {
      id: 'availability',
      mode: 'live',
      title: 'Loading, empty & unavailable',
      kind: 'behavior',
      render: () => <Availability />,
    },
    {
      id: 'overflow',
      title: 'Wrapping & uneven content',
      kind: 'content',
      render: () => <Overflow />,
    },
    {
      id: 'overlay',
      title: 'Inside a floating surface',
      surface: 'overlay',
      overlayStage: true,
      kind: 'surface',
      render: () => <Overlay />,
    },
  ],
  usage: [
    {
      id: 'sections',
      code: `<Card asChild>
  <article>
    <CardHeader>
      <CardTitle as="h2">Field guide</CardTitle>
      <CardDescription>Notes and decisions for the release.</CardDescription>
    </CardHeader>
    <CardSection withBorder padded>Release notes</CardSection>
  </article>
</Card>`,
      title: 'Sections & content composition',
      render: () => (
        <Card asChild>
          <article>
            <CardHeader>
              <CardTitle as="h2">Field guide</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardSection withBorder padded>
              Release notes
            </CardSection>
          </article>
        </Card>
      ),
    },
  ],
});
