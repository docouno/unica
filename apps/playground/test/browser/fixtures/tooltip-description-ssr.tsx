import { Link, Tooltip } from '@docouno/unica';
import { useEffect, useRef, useState } from 'react';
import type { ComponentPropsWithRef, ReactElement } from 'react';

type RouteProps = Omit<ComponentPropsWithRef<'a'>, 'href'> & { readonly to: string };

function Route({ to, ...props }: RouteProps): ReactElement {
  return <a {...props} href={to} />;
}

export default function DescriptionSamples(): ReactElement {
  const section = useRef<HTMLElement>(null);
  const [describe, setDescribe] = useState(true);
  const [label, setLabel] = useState('Extra');

  useEffect(() => {
    section.current?.setAttribute('data-hydrated', '');
  }, []);

  return (
    <section ref={section}>
      <span id="description-one" hidden>
        Context
      </span>
      <span id="description-two" hidden>
        Scope
      </span>
      <p data-testid="inline-context">
        Before{' '}
        <Tooltip label="Extra" describe={describe} defaultOpen>
          <a href="#target" data-testid="inline-source" aria-description="Original">
            Read report
          </a>
        </Tooltip>{' '}
        after
      </p>
      <Tooltip label="Copy link">
        <button type="button" aria-label="Copy link" data-testid="label-only">
          Copy
        </button>
      </Tooltip>
      <Tooltip label="Extra" describe={describe} shortcut="Ctrl+K">
        <button
          type="button"
          data-testid="known-idrefs"
          aria-describedby="description-one description-two description-one"
          aria-description="Original"
        >
          Known references
        </button>
      </Tooltip>
      <Tooltip id="late-reference-preview" label={label} describe={describe}>
        <button
          type="button"
          data-testid="missing-idref"
          aria-describedby="late-description"
          aria-description="Original"
        >
          Late reference
        </button>
      </Tooltip>
      <Tooltip label="Extra" describe={describe}>
        <button type="button" title="Title-only name" data-testid="title-name" />
      </Tooltip>
      <Tooltip label="Extra" describe={describe}>
        <button type="button" title="Original" data-testid="title-description">
          Read details
        </button>
      </Tooltip>
      <Tooltip label="Extra" describe={describe}>
        <input type="button" value="Send" title="Original" data-testid="input-title" />
      </Tooltip>
      <Tooltip label="Extra" describe={describe}>
        <Link href="#target" target="_blank" data-testid="plain-link" aria-description="Original">
          Link to report
        </Link>
      </Tooltip>
      <Tooltip label="Extra" describe={describe}>
        <Link asChild target="_blank" aria-describedby="missing-link-description">
          <Route
            to="#target"
            data-testid="router-link"
            aria-describedby="late-description"
            aria-description="Original"
          >
            Router to report
          </Route>
        </Link>
      </Tooltip>
      <Tooltip label="Extra" describe={describe}>
        <Link asChild>
          <Route to="#target" data-testid="same-tab-router-link" aria-description="Original">
            Report details
          </Route>
        </Link>
      </Tooltip>
      <button type="button" onClick={() => setDescribe(false)}>
        Remove Tooltip descriptions
      </button>
      <button type="button" onClick={() => setLabel(' ')}>
        Clear one Tooltip label
      </button>
    </section>
  );
}
