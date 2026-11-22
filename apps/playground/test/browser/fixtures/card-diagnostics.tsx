import { Card, CardBody, CardDescription, CardMedia, CardSection, CardTitle } from '@docouno/unica';
import { useId, useState } from 'react';
import type { ReactElement } from 'react';

function FloatingCardParts(): ReactElement {
  const wide = { orientation: 'horizontal', style: { inlineSize: 482 } } as const;
  const floating = { popover: 'manual', style: { inlineSize: 140 } } as const;
  const notes = <CardBody data-flowing="">Release notes</CardBody>;
  return (
    <>
      <Card {...wide} data-testid="popover-direct-media">
        <CardMedia {...floating} aspectRatio="4 / 3">
          Preview
        </CardMedia>
        {notes}
      </Card>
      <Card {...wide} data-testid="popover-section">
        <CardSection {...floating}>
          <CardMedia aspectRatio="4 / 3">Preview</CardMedia>
        </CardSection>
        {notes}
      </Card>
      <Card {...wide} data-testid="popover-wrapped-media">
        <CardSection placement="inset">
          <CardMedia {...floating} aspectRatio="4 / 3">
            Preview
          </CardMedia>
        </CardSection>
        {notes}
      </Card>
      <Card {...wide} data-testid="popover-body">
        <CardMedia data-flowing="" aspectRatio="4 / 3">
          Preview
        </CardMedia>
        <CardBody {...floating}>Release notes</CardBody>
      </Card>
    </>
  );
}

export default function CardDiagnosticsFixture(): ReactElement {
  const id = useId();
  const enclosedTitle = useId();
  const popup = useId();
  const popupTitle = useId();
  const anchorTitle = useId();
  const [hidden, setHidden] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setHidden(true)}>
        Hide title text
      </button>
      <Card asChild aria-labelledby={id}>
        <a href="#guide">
          <CardTitle id={id}>
            <span hidden={hidden}>Field guide</span>
          </CardTitle>
          <CardDescription>Release notes</CardDescription>
        </a>
      </Card>
      <Card popover="manual" orientation="horizontal" data-testid="card-popover">
        <CardTitle>Popover content</CardTitle>
        <button type="button">Popover action</button>
      </Card>
      <Card asChild aria-labelledby={anchorTitle}>
        <a href="#guide" popover="manual" data-testid="anchor-popover">
          <CardTitle id={anchorTitle}>Popover guide</CardTitle>
        </a>
      </Card>
      <CardTitle popover="manual" lineClamp={2} data-testid="title-popover">
        Popover heading
      </CardTitle>
      <details>
        <summary>Read related material</summary>
        <Card asChild aria-labelledby={enclosedTitle}>
          <a href="#guide">
            <CardTitle id={enclosedTitle}>Related guide</CardTitle>
          </a>
        </Card>
      </details>
      <button type="button" popoverTarget={popup}>
        Show reference popup
      </button>
      <div popover="auto" id={popup} data-testid="reference-popup">
        <Card asChild aria-labelledby={popupTitle}>
          <a href="#guide">
            <CardTitle id={popupTitle} hidden>
              Hidden reference
            </CardTitle>
          </a>
        </Card>
      </div>
      <FloatingCardParts />
    </>
  );
}
