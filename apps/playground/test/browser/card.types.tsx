import { createRef } from 'react';
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
} from '@docouno/unica';
import type {
  CardActionProps,
  CardBodyProps,
  CardDescriptionProps,
  CardFooterJustify,
  CardFooterProps,
  CardHeaderProps,
  CardMediaFit,
  CardMediaProps,
  CardOrientation,
  CardProps,
  CardSectionPlacement,
  CardSectionProps,
  CardSize,
  CardTitleProps,
  CardVariant,
} from '@docouno/unica';

const div = createRef<HTMLDivElement>();
const anchor = createRef<HTMLAnchorElement>();
const heading = createRef<HTMLHeadingElement>();
const paragraph = createRef<HTMLParagraphElement>();
const variant: CardVariant = 'subtle';
const size: CardSize = 'l';
const orientation: CardOrientation = 'horizontal';
const justify: CardFooterJustify = 'end';
const placement: CardSectionPlacement = 'inset';
const fit: CardMediaFit = 'contain';
const root: CardProps = { ref: div, variant, size, orientation };
const header: CardHeaderProps = { ref: div, hidden: true };
const title: CardTitleProps = { ref: heading, as: 'h2', size: 'body-m' };
const description: CardDescriptionProps = { ref: paragraph };
const body: CardBodyProps = { ref: div };
const action: CardActionProps = { ref: div };
const footer: CardFooterProps = { ref: div, justify, withBorder: undefined };
const section: CardSectionProps = { ref: div, placement, padded: true };
const media: CardMediaProps = { ref: div, fit, aspectRatio: '4 / 3' };

export const layout = (
  <Card
    {...root}
    tabIndex={0}
    role="group"
    aria-label="Report"
    data-owner="reader"
    onPointerDown={(event) => {
      const target: HTMLDivElement = event.currentTarget;
      target.focus();
    }}
  >
    <CardSection {...section}>
      <CardMedia {...media} />
    </CardSection>
    <CardBody {...body}>
      <CardHeader {...header}>
        <CardTitle {...title}>Report</CardTitle>
        <CardDescription {...description}>Notes</CardDescription>
        <CardAction {...action} />
      </CardHeader>
      <CardFooter {...footer} />
    </CardBody>
  </Card>
);

export const link = (
  <Card asChild ref={anchor}>
    <a href="/report" aria-labelledby="report" ref={anchor}>
      <CardTitle id="report">Report</CardTitle>
    </a>
  </Card>
);

// @ts-expect-error The default host is a div.
<Card ref={anchor} />;
// @ts-expect-error A delegated host requires one element.
<Card asChild>Report</Card>;
// @ts-expect-error A delegated host requires one element.
<Card asChild>
  <div />
  <div />
</Card>;
// @ts-expect-error The delegated anchor owns its address.
<Card asChild href="/report">
  <a />
</Card>;
// @ts-expect-error Card uses short surface sizes.
<Card size="xl" />;
// @ts-expect-error Card uses the shared orientation axis.
<Card orientation="diagonal" />;
// @ts-expect-error Card owns no selection state.
<Card value="one" />;
// @ts-expect-error Card has no decorative appearance.
<Card appearance="glass" />;
// @ts-expect-error Card has no specimen state.
<Card previewState="hover" />;
// @ts-expect-error CardTitle supports semantic headings.
<CardTitle as="div" />;
// @ts-expect-error CardSection uses structural placement.
<CardSection placement="overlay" />;
// @ts-expect-error CardMedia uses its two frame fits.
<CardMedia fit="fill" />;
