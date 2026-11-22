import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { Fragment, createRef, useId, useState } from 'react';
import type { ComponentPropsWithRef, ReactElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../src/core/devWarning.js';
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
} from '../src/index.js';

type RouteProps = Omit<ComponentPropsWithRef<'a'>, 'href'> & { readonly to: string };
function Route({ to, ...props }: RouteProps): ReactElement {
  return <a {...props} href={to} />;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  resetDevWarnings();
});

it('renders each optional part as one native element and forwards its ref and attributes', () => {
  const root = createRef<HTMLDivElement>();
  const header = createRef<HTMLDivElement>();
  const title = createRef<HTMLHeadingElement>();
  const description = createRef<HTMLParagraphElement>();
  const action = createRef<HTMLDivElement>();
  const body = createRef<HTMLDivElement>();
  const footer = createRef<HTMLDivElement>();
  const section = createRef<HTMLDivElement>();
  const media = createRef<HTMLDivElement>();

  const onContextMenu = vi.fn();
  const { container } = render(
    <Card
      ref={root}
      className="example"
      variant="subtle"
      size="l"
      orientation="horizontal"
      role="group"
      aria-label="Report"
      tabIndex={0}
      data-owner="reader"
      onContextMenu={onContextMenu}
    >
      <CardSection ref={section} padded withBorder placement="inset">
        <CardMedia
          ref={media}
          fit="contain"
          aspectRatio="4 / 3"
          style={{ aspectRatio: '3 / 2', margin: 2 }}
        />
      </CardSection>
      <CardBody ref={body}>
        <CardHeader ref={header}>
          <CardTitle ref={title} as="h2">
            Report
          </CardTitle>
          <CardDescription ref={description}>Release notes</CardDescription>
          <CardAction ref={action} hidden>
            Action
          </CardAction>
        </CardHeader>
        <CardFooter ref={footer} withBorder justify="end">
          Footer
        </CardFooter>
      </CardBody>
    </Card>,
  );

  expect(container.querySelectorAll('*')).toHaveLength(9);
  expect(container.firstElementChild).toBe(root.current);
  expect(root.current?.firstElementChild).toBe(section.current);
  expect(root.current?.lastElementChild).toBe(body.current);
  expect(body.current?.firstElementChild).toBe(header.current);
  expect(body.current?.lastElementChild).toBe(footer.current);
  expect(header.current?.firstElementChild).toBe(title.current);
  expect(header.current?.lastElementChild).toBe(action.current);
  expect(title.current?.nextElementSibling).toBe(description.current);
  expect(section.current?.firstElementChild).toBe(media.current);
  expect(title.current?.tagName).toBe('H2');
  expect(title.current?.dataset.unicaTitleSize).toBe('body-m');
  expect(description.current?.tagName).toBe('P');
  expect(action.current?.hidden).toBe(true);
  expect(root.current?.classList.contains('example')).toBe(true);
  const card = screen.getByRole('group', { name: 'Report' });
  expect(card.dataset.owner).toBe('reader');
  expect(card.tabIndex).toBe(0);
  expect(card.dataset).toMatchObject({
    unicaCardVariant: 'subtle',
    unicaCardSize: 'l',
    unicaCardOrientation: 'horizontal',
  });
  fireEvent.contextMenu(card);
  expect(onContextMenu).toHaveBeenCalledOnce();
  expect(footer.current?.dataset).toMatchObject({
    unicaCardJustify: 'end',
    unicaCardFooterBordered: '',
  });
  expect(section.current?.dataset).toMatchObject({
    unicaCardPlacement: 'inset',
    unicaCardSectionBordered: '',
    unicaCardPadded: '',
  });
  expect(media.current?.dataset).toMatchObject({ unicaCardFit: 'contain' });
  expect(media.current?.style.aspectRatio).toBe('4 / 3');
  expect(media.current?.style.margin).toBe('2px');
});

it('defaults to a passive div and preserves a style ratio when the prop is omitted', () => {
  const { container, rerender } = render(
    <Card>
      <CardTitle>Field guide</CardTitle>
      <CardMedia style={{ aspectRatio: '2 / 1' }} data-testid="media" />
    </Card>,
  );
  const card = container.firstElementChild;
  expect(card?.tagName).toBe('DIV');
  for (const key of ['tabindex', 'role', 'href']) {
    expect(card?.hasAttribute(key)).toBe(false);
  }
  expect(card?.getAttribute('data-unica-card-variant')).toBe('default');
  expect(screen.getByRole('heading', { level: 3 })).toBeTruthy();
  expect(screen.getByTestId('media').style.aspectRatio).toBe('2 / 1');
  rerender(
    <Card>
      <CardMedia aspectRatio="auto" style={{ aspectRatio: '2 / 1' }} data-testid="media" />
    </Card>,
  );
  expect(screen.getByTestId('media').style.aspectRatio).toBe('auto');
});

it('delegates classes, events, styles and refs through native and adapter hosts', () => {
  const order: string[] = [];
  const detached = vi.fn();
  const outer = createRef<HTMLElement>();
  const article = createRef<HTMLElement>();
  let cancel = false;

  function view(anchor: boolean): ReactElement {
    return (
      <Card
        asChild
        ref={outer}
        className="outer"
        aria-labelledby="wrong"
        onClick={() => order.push('outer')}
        style={{ margin: 2, padding: 4 }}
      >
        {anchor ? (
          <Route
            to="#target"
            className="inner"
            style={{ padding: 8 }}
            aria-labelledby="guide"
            ref={(node) => (node ? detached : undefined)}
            onClick={(event) => {
              order.push('child');
              if (cancel) {
                event.preventDefault();
              }
            }}
          >
            <CardTitle id="guide">Guide</CardTitle>
          </Route>
        ) : (
          <article ref={article} aria-labelledby="report" onClick={() => order.push('article')}>
            <CardTitle id="report">Report</CardTitle>
          </article>
        )}
      </Card>
    );
  }
  const { rerender, unmount } = render(view(true));
  const link = screen.getByRole('link', { name: 'Guide' });
  expect(outer.current).toBe(link);
  expect(link.className.split(' ')).toEqual(['unica-card', 'outer', 'inner']);
  expect(link.style.margin).toBe('2px');
  expect(link.style.padding).toBe('8px');
  fireEvent.click(link);
  cancel = true;
  fireEvent.click(link);
  expect(order).toEqual(['child', 'outer', 'child']);
  rerender(view(false));
  expect(detached).toHaveBeenCalledOnce();
  expect(outer.current).toBe(screen.getByRole('article', { name: 'Report' }));
  expect(article.current).toBe(outer.current);
  unmount();
  expect(outer.current).toBeNull();
  expect(article.current).toBeNull();
});

it.each([
  [null, /exactly one React element/],
  ['one', /exactly one React element/],
  [[<div key="one" />, <section key="two" />], /exactly one React element/],
  [
    <Fragment>
      <div />
    </Fragment>,
    /exactly one React element/,
  ],
  [<button type="button" />, /requires a div, article, section, anchor/],
  [<a href=" " aria-labelledby="guide" />, /nonempty href/],
  [<a href="#x" aria-labelledby="" />, /one CardTitle ID/],
  [<a href="#x" aria-labelledby="one two" />, /one CardTitle ID/],
])('rejects invalid direct delegated hosts during render', (child, message) => {
  expect(() =>
    renderToString(<Card asChild aria-labelledby="fallback" children={child as ReactElement} />),
  ).toThrow(message);
});

it.each([
  ['missing heading', <CardTitle id="elsewhere">Guide</CardTitle>],
  [
    'hidden heading',
    <CardTitle id="guide" hidden>
      Guide
    </CardTitle>,
  ],
  ['non-card heading', <h3 id="guide">Guide</h3>],
  [
    'duplicate heading ID',
    <>
      <CardTitle id="guide">Guide</CardTitle>
      <span id="guide">Duplicate</span>
    </>,
  ],
])('warns about %s in both native and delegated anchors', (_, children) => {
  const warnings = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const direct = render(
    <Card asChild>
      <a href="#report" aria-labelledby="guide">
        {children}
      </a>
    </Card>,
  );
  expect(warnings).toHaveBeenCalledWith(
    expect.stringContaining('visible, uniquely identified CardTitle'),
  );
  direct.unmount();
  warnings.mockClear();
  resetDevWarnings();
  render(
    <Card asChild>
      <Route to="#report" aria-labelledby="guide">
        {children}
      </Route>
    </Card>,
  );
  expect(warnings).toHaveBeenCalledWith(
    expect.stringContaining('visible, uniquely identified CardTitle'),
  );
});

it('validates adapter output and changes made in the mounted anchor subtree', async () => {
  const warnings = vi.spyOn(console, 'warn').mockImplementation(() => {});
  function WrongHost(props: ComponentPropsWithRef<'button'>): ReactElement {
    return <button type="button" {...props} />;
  }
  const wrong = render(
    <Card asChild>
      <WrongHost />
    </Card>,
  );
  expect(warnings).toHaveBeenCalledWith(expect.stringContaining('forward its ref'));
  wrong.unmount();

  function GuideTitle(): ReactElement {
    const [hidden, setHidden] = useState(false);
    return (
      <CardTitle
        id="guide"
        hidden={hidden}
        onClick={(event) => {
          event.preventDefault();
          setHidden(true);
        }}
      >
        Guide
      </CardTitle>
    );
  }
  const { unmount } = render(
    <Card asChild aria-labelledby="guide">
      <Route to="#report">
        <GuideTitle />
      </Route>
    </Card>,
  );
  expect(warnings).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('heading', { name: 'Guide' }));
  await Promise.resolve();
  expect(warnings).toHaveBeenCalledWith(
    expect.stringContaining('visible, uniquely identified CardTitle'),
  );
  unmount();

  const missingHref = render(
    <Card asChild aria-labelledby="ok">
      <Route to="">
        <CardTitle id="ok">Guide</CardTitle>
      </Route>
    </Card>,
  );
  expect(warnings).toHaveBeenCalledWith(expect.stringContaining('nonempty href'));
  missingHref.unmount();
  render(
    <Card asChild hidden>
      <a href="#x" aria-labelledby="hidden-guide">
        <CardTitle id="hidden-guide">Guide</CardTitle>
        <span tabIndex={-1}>Another target</span>
      </a>
    </Card>,
  );
  expect(warnings).toHaveBeenCalledWith(expect.stringContaining('interactive descendants'));
  expect(warnings).toHaveBeenCalledTimes(4);
});

it('rechecks an anchor when its hidden ancestor is revealed without a Card render', async () => {
  const warnings = vi.spyOn(console, 'warn').mockImplementation(() => {});
  render(
    <div hidden data-testid="outer">
      <div hidden data-testid="inner">
        <Card asChild aria-labelledby="guide">
          <a href="#guide">
            <CardTitle id="guide" hidden>
              Guide
            </CardTitle>
          </a>
        </Card>
      </div>
    </div>,
  );
  expect(warnings).not.toHaveBeenCalled();
  screen.getByTestId('inner').removeAttribute('hidden');
  await Promise.resolve();
  expect(warnings).not.toHaveBeenCalled();
  screen.getByTestId('outer').removeAttribute('hidden');
  await Promise.resolve();
  expect(warnings).toHaveBeenCalledWith(
    expect.stringContaining('visible, uniquely identified CardTitle'),
  );
});

it('defers the visible-title check until a closed details element opens', async () => {
  const warnings = vi.spyOn(console, 'warn').mockImplementation(() => {});
  render(
    <details data-testid="details">
      <summary>Guide details</summary>
      <Card asChild aria-labelledby="guide">
        <a href="#guide">
          <CardTitle id="guide" hidden>
            Guide
          </CardTitle>
        </a>
      </Card>
    </details>,
  );
  expect(warnings).not.toHaveBeenCalled();
  screen.getByTestId('details').setAttribute('open', '');
  await Promise.resolve();
  expect(warnings).toHaveBeenCalledWith(
    expect.stringContaining('visible, uniquely identified CardTitle'),
  );
});

it('observes the ancestor that supplies inherited hidden visibility', async () => {
  const warnings = vi.spyOn(console, 'warn').mockImplementation(() => {});
  render(
    <div style={{ visibility: 'hidden' }} data-testid="visibility">
      <div>
        <Card asChild aria-labelledby="guide">
          <a href="#guide">
            <CardTitle id="guide" hidden>
              Guide
            </CardTitle>
          </a>
        </Card>
      </div>
    </div>,
  );
  expect(warnings).not.toHaveBeenCalled();
  screen.getByTestId('visibility').style.visibility = 'visible';
  await Promise.resolve();
  expect(warnings).toHaveBeenCalledWith(
    expect.stringContaining('visible, uniquely identified CardTitle'),
  );
});

it('checks IDs in the host ShadowRoot and accepts Card-level aria-labelledby', () => {
  const warnings = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const shell = document.createElement('div');
  const outOfRoot = document.createElement('h2');
  outOfRoot.id = 'guide';
  document.body.append(shell, outOfRoot);
  const root = shell.attachShadow({ mode: 'open' });
  const container = document.createElement('div');
  root.append(container);
  const rendered = render(
    <Card asChild aria-labelledby="guide">
      <a href="#x">
        <CardTitle id="guide">Guide</CardTitle>
      </a>
    </Card>,
    { container },
  );
  try {
    expect(container.querySelector('a')?.getAttribute('aria-labelledby')).toBe('guide');
    expect(warnings).not.toHaveBeenCalled();
  } finally {
    rendered.unmount();
    shell.remove();
    outOfRoot.remove();
  }
});

it('hydrates two uniquely named native anchors on their existing nodes and preserves focus', async () => {
  const anchorRef = createRef<HTMLAnchorElement>();
  const adapterRef = createRef<HTMLElement>();
  const onRecoverableError = vi.fn();
  const warnings = vi.spyOn(console, 'warn').mockImplementation(() => {});

  function Guides(): ReactElement {
    const first = useId();
    const second = useId();
    return (
      <>
        <Card asChild aria-labelledby={first}>
          <a href="#one" ref={anchorRef}>
            <CardTitle id={first}>First guide</CardTitle>
            <CardDescription>Keep this out of the link name.</CardDescription>
          </a>
        </Card>
        <Card asChild ref={adapterRef} aria-labelledby="wrong">
          <Route to="#two" aria-labelledby={second}>
            <CardTitle id={second}>Second guide</CardTitle>
            <CardFooter>Metadata</CardFooter>
          </Route>
        </Card>
      </>
    );
  }

  const container = document.createElement('div');
  document.body.append(container);
  container.innerHTML = renderToString(<Guides />);
  const first = within(container).getByRole('link', { name: 'First guide' });
  const second = within(container).getByRole('link', { name: 'Second guide' });
  const names = [first, second].map((anchor) => anchor.getAttribute('aria-labelledby'));
  expect(new Set(names).size).toBe(2);
  first.focus();

  const root = hydrateRoot(container, <Guides />, { onRecoverableError });
  try {
    await act(async () => {});
    expect(within(container).getByRole('link', { name: 'First guide' })).toBe(first);
    expect(within(container).getByRole('link', { name: 'Second guide' })).toBe(second);
    expect([first, second].map((anchor) => anchor.getAttribute('aria-labelledby'))).toEqual(names);
    expect(document.activeElement).toBe(first);
    expect(anchorRef.current).toBe(first);
    expect(adapterRef.current).toBe(second);
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(warnings).not.toHaveBeenCalled();
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});
