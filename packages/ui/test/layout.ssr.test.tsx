// @vitest-environment node
import { Children, Fragment } from 'react';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';

import { resetDevWarnings } from '../src/core/devWarning.js';
import { Box, Container, Flex, Grid, GridItem, Stack, type GridItemProps } from '../src/index.js';

afterEach(() => {
  resetDevWarnings();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

it('renders one native root and only the supplied responsive slots during SSR', () => {
  const page = renderToString(
    <Box as="main" aria-label="Overview" padding={{ desktop: 16 }} paddingInlineStart={0}>
      <Container size={{}} style={{ color: 'currentColor' }}>
        <Grid columns={{ tablet: 2, wide: 3 }}>
          <GridItem>Activity</GridItem>
        </Grid>
      </Container>
    </Box>,
  );

  expect(page).toBe(
    '<main aria-label="Overview" class="unica-box" style="--_box-padding-desktop:var(--space-16);--_box-padding-inline-start-mobile:var(--space-0)">' +
      '<div class="unica-container" style="color:currentColor">' +
      '<div class="unica-grid" style="--_grid-columns-tablet:2;--_grid-columns-wide:3">' +
      '<div class="unica-grid-item">Activity</div></div></div></main>',
  );
  expect(renderToStaticMarkup(<Box as="span" display={{}} />)).toBe(
    '<span class="unica-box"></span>',
  );
  expect(renderToStaticMarkup(<Flex />)).toBe('<div class="unica-flex"></div>');
  expect(renderToStaticMarkup(<Stack />)).toBe('<div class="unica-stack"></div>');
});

it('inserts native divider content between meaningful children, including zero', () => {
  const html = renderToStaticMarkup(
    <Stack divider={<hr />}>
      {[null, <span key="first">First</span>, false, 0, '', <Fragment key="empty" />, undefined]}
      <Fragment key="nested">
        <span>Second</span>
        <span>Third</span>
      </Fragment>
    </Stack>,
  );

  expect(html).toBe(
    '<div class="unica-stack"><span>First</span><hr/>0<hr/><span>Second</span><hr/><span>Third</span></div>',
  );
  expect(
    renderToStaticMarkup(
      <Stack divider={<hr />}>
        <span>Only</span>
      </Stack>,
    ),
  ).not.toContain('<hr');
  expect(
    renderToStaticMarkup(
      <Stack divider={0}>
        <span>A</span>
        <span>B</span>
      </Stack>,
    ),
  ).toContain('</span>0<span>');
  expect(renderToStaticMarkup(<Stack divider={<Fragment />}>AB</Stack>)).toBe(
    '<div class="unica-stack">AB</div>',
  );
});

it('renders native inner HTML in a Stack without children', () => {
  expect(
    renderToStaticMarkup(<Stack dangerouslySetInnerHTML={{ __html: '<p>Content</p>' }} />),
  ).toBe('<div class="unica-stack"><p>Content</p></div>');
});

it('reports malformed maps, incompatible tracks and invalid direct item placements in development', () => {
  vi.stubEnv('NODE_ENV', 'development');
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const conflict = { area: 'auto', span: 2 } as GridItemProps;

  expect(renderToStaticMarkup(<Grid areas={[]} />)).not.toContain('--_grid-areas');
  expect(renderToStaticMarkup(<Grid areas={[]} />)).not.toContain('--_grid-areas');
  expect(renderToStaticMarkup(<Grid areas={['a b c d e f g h i j k l m']} />)).not.toContain(
    '--_grid-area-width',
  );
  expect(renderToStaticMarkup(<Grid areas={['a b', 'c']} />)).not.toContain('--_grid-areas');
  expect(renderToStaticMarkup(<Grid areas={['a/b']} />)).not.toContain('--_grid-areas');
  renderToStaticMarkup(<Grid areas={['a a', 'a b']} />);
  renderToStaticMarkup(
    <Grid areas={['a b']} columns={{ desktop: 3, wide: 2 }}>
      <GridItem area="missing" />
      <GridItem span={{ tablet: 3, wide: 1 }} />
    </Grid>,
  );
  const item = renderToStaticMarkup(<GridItem {...conflict} />);
  expect(item).toContain('--_grid-item-area-start:1 auto-start');
  expect(item).not.toContain('--_grid-item-span');
  expect(warn.mock.calls.flat()).toEqual([
    expect.stringContaining('between 1 and 12'),
    expect.stringContaining('between 1 and 12'),
    expect.stringContaining('same number of cells'),
    expect.stringContaining('invalid name'),
    expect.stringContaining('"a" must form a single rectangle'),
    expect.stringContaining('columns at desktop'),
    expect.stringContaining('area "missing" is absent'),
    expect.stringContaining('span 3 exceeds 2 Grid columns at tablet'),
    expect.stringContaining('area takes precedence over span'),
  ]);
});

it('keeps valid SSR identical and skips direct child diagnostics in production', () => {
  const visit = vi.spyOn(Children, 'forEach');
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const valid = (
    <Grid areas={['1st...span']} columns={{ wide: 3 }}>
      <GridItem area="1st" />
      <GridItem area="span" />
    </Grid>
  );
  const missing = (
    <Grid areas={['known']}>
      <GridItem area="missing" />
    </Grid>
  );

  vi.stubEnv('NODE_ENV', 'development');
  const html = renderToString(valid);
  expect(html).toContain('--_grid-area-width:3');
  expect(html).toContain('1 \\31 st-start');
  expect(html).toContain('1 span-end');
  renderToString(missing);
  expect(warn).toHaveBeenCalledExactlyOnceWith(expect.stringContaining('missing'));
  expect(visit).toHaveBeenCalledTimes(2);

  vi.stubEnv('NODE_ENV', 'production');
  warn.mockClear();
  visit.mockClear();
  expect(renderToString(valid)).toBe(html);
  expect(renderToString(missing)).toContain('1 missing-start');
  expect(warn).not.toHaveBeenCalled();
  expect(visit).not.toHaveBeenCalled();
});
