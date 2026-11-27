import { Breadcrumb, BreadcrumbLink, BreadcrumbPage, Icon, Link } from '@docouno/unica';
import { HouseIcon } from '@phosphor-icons/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ComponentPropsWithRef, JSX, ReactNode, RefObject } from 'react';

interface RouteProps extends Omit<ComponentPropsWithRef<'a'>, 'href'> {
  readonly to: string;
  readonly onMount: () => void;
}

function Route({ to, children, onMount, ...props }: RouteProps): JSX.Element {
  useEffect(onMount, [onMount]);
  const renderLabel = (pending: boolean): ReactNode => <span aria-busy={pending}>{children}</span>;
  return (
    <a {...props} href={to}>
      {renderLabel(false)}
    </a>
  );
}

function refsMatch(
  outer: RefObject<HTMLAnchorElement | null>,
  child: RefObject<HTMLAnchorElement | null>,
): string {
  return !outer.current && !child.current
    ? 'released'
    : outer.current && outer.current === child.current
      ? outer.current.hasAttribute('href')
        ? 'router'
        : 'fallback'
      : 'different';
}

export default function BreadcrumbFixture(): JSX.Element {
  const [disabled, setDisabled] = useState(false);
  const [shown, setShown] = useState(true);
  const [cancel, setCancel] = useState(true);
  const [mounts, setMounts] = useState(0);
  const [events, setEvents] = useState<string[]>([]);
  const [submits, setSubmits] = useState(0);
  const [refs, setRefs] = useState('');
  const outer = useRef<HTMLAnchorElement>(null);
  const child = useRef<HTMLAnchorElement>(null);
  const onMount = useCallback(() => setMounts((count) => count + 1), []);
  const record = (event: string): void => setEvents((logged) => [...logged, event]);

  return (
    <>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSubmits(submits + 1);
        }}
      >
        <input type="hidden" name="entry" value="keep" />
        <button type="button" data-testid="start">
          Before trail
        </button>
        <Breadcrumb aria-label="Document route" underline="none">
          <BreadcrumbLink href="#destination" data-testid="native">
            Workspace
          </BreadcrumbLink>
          <span>Operations</span>
          <BreadcrumbLink disabled href="#archive">
            Archive
          </BreadcrumbLink>
          <BreadcrumbPage>Guide</BreadcrumbPage>
        </Breadcrumb>
        <button type="button" data-testid="end">
          After trail
        </button>
        <output data-testid="submits">{submits}</output>
      </form>
      <section aria-label="Router trail">
        <button type="button" onClick={() => setDisabled(!disabled)}>
          Toggle availability
        </button>
        <button type="button" onClick={() => setCancel(!cancel)}>
          Toggle cancellation
        </button>
        <button type="button" onClick={() => setShown(false)}>
          Remove route
        </button>
        <button type="button" onClick={() => setRefs(refsMatch(outer, child))}>
          Read refs
        </button>
        {shown && (
          <Breadcrumb underline="none" aria-label="Guide permalink">
            <BreadcrumbLink
              asChild
              disabled={disabled}
              aria-current="page"
              ref={outer}
              onPointerDownCapture={() => record('pointer')}
              onKeyDownCapture={() => record('key')}
              onClick={() => record('outer')}
              aria-describedby="availability"
            >
              <Route
                to="#destination"
                onMount={onMount}
                ref={child}
                onClick={(event) => {
                  record('child');
                  if (cancel) {
                    event.preventDefault();
                  }
                }}
              >
                Routed guide
              </Route>
            </BreadcrumbLink>
          </Breadcrumb>
        )}
        <span id="availability">Publication status</span>
        <Link disabled aria-current="page" href="#archive">
          Ordinary unavailable link
        </Link>
        <output data-testid="mounts">{mounts}</output>
        <output data-testid="events">{events.join(',')}</output>
        <output data-testid="refs">{refs}</output>
      </section>
      <p id="external-note">Opens in a new tab</p>
      <Breadcrumb aria-label="External references">
        <BreadcrumbLink
          href="#destination"
          target="_BLANK"
          rel="opener next"
          iconOnly
          aria-label="Home"
          aria-describedby="external-note"
        >
          <Icon icon={HouseIcon} usage="slot" />
        </BreadcrumbLink>
        <BreadcrumbLink asChild>
          <a href="./index.html" target="_blank" rel="OPENER license" download="guide.html">
            Download guide
          </a>
        </BreadcrumbLink>
      </Breadcrumb>
      <div style={{ blockSize: '110vh' }} />
      <h2 id="destination" tabIndex={-1}>
        Destination
      </h2>
    </>
  );
}
