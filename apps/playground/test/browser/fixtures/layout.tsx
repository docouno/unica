import { Fragment, useState, type CSSProperties, type ReactNode } from 'react';
import { Box, Container, Flex, Grid, GridItem, Stack, Text, VisuallyHidden } from '@docouno/unica';

function identifyRef(node: HTMLElement | null) {
  if (node) {
    node.dataset.refTag = node.localName;
  }
}

function LayoutRoots() {
  const [hidden, setHidden] = useState(true);
  const [clicks, setClicks] = useState(0);
  return (
    <>
      <nav aria-label="Controls">
        <button type="button" onClick={() => setHidden(!hidden)}>
          Toggle hidden layout
        </button>
      </nav>
      <div data-testid="hide-together">
        <Box
          as="nav"
          aria-label="Release navigation"
          ref={identifyRef}
          hidden={hidden}
          display={{ mobile: 'inline-block', tablet: 'flow-root' }}
          data-testid="hidden-box"
        >
          <button type="button">Box child</button>
        </Box>
        <Flex ref={identifyRef} hidden={hidden} data-testid="hidden-flex">
          <button type="button">Flex child</button>
        </Flex>
        <Stack ref={identifyRef} hidden={hidden} data-testid="hidden-stack">
          <button type="button">Stack child</button>
        </Stack>
        <Grid ref={identifyRef} hidden={hidden} data-testid="hidden-grid">
          <button type="button">Grid child</button>
        </Grid>
        <GridItem ref={identifyRef} hidden={hidden} data-testid="hidden-grid-item">
          <button type="button">GridItem child</button>
        </GridItem>
        <Container ref={identifyRef} hidden={hidden} data-testid="hidden-container">
          <button type="button">Container child</button>
        </Container>
      </div>
      <button type="button">After hidden layout</button>
      <Box
        as="section"
        aria-label="Release notes"
        className="fixture-layout-heading"
        lang="en"
        marginInlineEnd={8}
        marginInline={4}
        margin={16}
        paddingInlineStart={0}
        paddingInline={8}
        padding={16}
        style={{ minBlockSize: 40 }}
        onClick={() => setClicks(clicks + 1)}
        data-clicks={clicks}
        data-testid="logical-box"
      >
        <div>
          <Box as="span" data-testid="inner-box">
            Published
          </Box>
        </div>
      </Box>
      <Flex className="fixture-layout-display" data-testid="display-class">
        Class override
      </Flex>
      <Stack
        className="fixture-layout-display"
        style={{ display: 'inline-grid' }}
        data-testid="display-style"
      >
        Style override
      </Stack>
      <div data-testid="native-until-found">Native text</div>
    </>
  );
}

function LayoutFlow() {
  const [showDivider, setShowDivider] = useState(false);
  const [insertField, setInsertField] = useState(false);
  const reverse = { mobile: 'column', tablet: 'row-reverse' } as const;

  return (
    <>
      <Flex
        data-testid="wrapped-flex"
        gap={8}
        justify="end"
        align="start"
        wrap="wrap"
        style={{ inlineSize: 150 }}
      >
        <div style={{ inlineSize: 60, blockSize: 20 }}>One</div>
        <div style={{ inlineSize: 60, blockSize: 20 }}>Two</div>
        <div style={{ inlineSize: 60, blockSize: 20 }}>Three</div>
      </Flex>
      <Flex direction={{ tablet: 'column-reverse' }} gap={{ desktop: 24 }}>
        <div>
          <Flex data-testid="inner-flex">Inner flex</Flex>
        </div>
      </Flex>
      <Stack direction={{ tablet: 'row' }} gap={{ desktop: 24 }}>
        <div>
          <Stack data-testid="inner-stack">Inner stack</Stack>
        </div>
      </Stack>
      <button type="button" onClick={() => setInsertField(!insertField)}>
        Insert keyed sibling
      </button>
      <button type="button" onClick={() => setShowDivider(!showDivider)}>
        Toggle divider
      </button>
      <form data-testid="layout-form">
        <Stack
          data-testid="field-stack"
          direction={reverse}
          gap={8}
          divider={showDivider ? <hr /> : undefined}
        >
          {insertField && <span key="prefix">Name fields</span>}
          <Fragment key="wrapped">
            <input key="name" name="name" defaultValue="Draft" aria-label="Name" />
          </Fragment>
          <input key="version" name="version" defaultValue="1.0" aria-label="Version" />
          <button key="submit" type="submit">
            Save layout form
          </button>
        </Stack>
      </form>
      <Stack divider={<hr />} data-testid="divided-stack">
        {null}
        {''}
        <span>A</span>
        {false}
        {0}
        <>
          <span>B</span>
          <span>C</span>
        </>
        <></>
        {undefined}
      </Stack>
      <Stack divider={<hr />} data-testid="single-stack">
        <span>One</span>
      </Stack>
      <Stack divider={<hr />} data-testid="empty-stack">
        {false}
      </Stack>
      <Stack divider={0} data-testid="zero-divider">
        <span>A</span>
        <span>B</span>
      </Stack>
      <Stack divider={<></>} data-testid="empty-divider">
        <span>A</span>
        <span>B</span>
      </Stack>
      <Stack divider={<hr />} data-testid="nested-array-stack">
        {[[<span key="same">First array</span>], [<span key="same">Second array</span>]]}
      </Stack>
    </>
  );
}

function AreaGrid({ name, children }: { name: string; children?: ReactNode }) {
  return (
    <Grid
      data-testid={`area-grid-${name}`}
      areas={[`${name}-start . .`, `. ${name}-end .`, `. . ${name}`]}
      style={{ inlineSize: 300, blockSize: 120, gridAutoRows: '1fr' }}
    >
      <GridItem area={name}>{children}</GridItem>
    </Grid>
  );
}

function LayoutGrid() {
  const [named, setNamed] = useState(true);
  const [flow, setFlow] = useState<'row' | 'column'>('row');
  return (
    <>
      <Grid data-testid="span-grid" columns={3} gap={8} style={{ inlineSize: 300 }}>
        <GridItem data-testid="responsive-span" span={{ mobile: 1, desktop: 2 }}>
          Summary
        </GridItem>
        <GridItem>Activity</GridItem>
      </Grid>
      <Grid data-testid="twelve-grid" columns={{ mobile: 12, desktop: 1, wide: 12 }} gap={8}>
        <div>
          <Grid data-testid="inner-grid">
            <GridItem>Nested grid</GridItem>
          </Grid>
        </div>
      </Grid>
      <Grid data-testid="map-twelve" areas={['a b c d e f g h i j k l']} />
      <Grid data-testid="map-dots" areas={['a...b']} />
      <Grid
        data-testid="map-grid"
        columns={{ desktop: 3 }}
        areas={named ? ['nav body body', 'nav foot .'] : undefined}
        style={{ inlineSize: 300, blockSize: 100, gridAutoRows: '1fr' }}
      >
        <GridItem data-testid="map-nav" area={named ? 'nav' : undefined}>
          Navigation
        </GridItem>
        <GridItem data-testid="map-body" area={named ? 'body' : undefined}>
          Body
        </GridItem>
        <GridItem data-testid="map-foot" area={named ? 'foot' : undefined}>
          Foot
        </GridItem>
      </Grid>
      <button type="button" onClick={() => setNamed(!named)}>
        Toggle area map
      </button>
      {['auto', 'span', '1st', '列'].map((name) => (
        <AreaGrid key={name} name={name}>
          {name}
        </AreaGrid>
      ))}
      <Grid
        data-testid="flow-grid"
        areas={['. .', '. .']}
        flow={flow}
        style={{ inlineSize: 100, blockSize: 100, gridAutoRows: '1fr' }}
      >
        <button type="button">Item A</button>
        <button type="button">Item B</button>
        <button type="button">Item C</button>
      </Grid>
      <button type="button" onClick={() => setFlow(flow === 'row' ? 'column' : 'row')}>
        Toggle grid flow
      </button>
    </>
  );
}

function LayoutContainer() {
  return (
    <>
      <div data-testid="container-parent" style={{ inlineSize: 1500 }}>
        <Container data-testid="container-s" size="s">
          <div data-testid="container-s-content">Small</div>
        </Container>
        <Container data-testid="container-m">
          <div>Medium</div>
        </Container>
        <Container data-testid="container-l" size="l">
          <div>Large</div>
        </Container>
        <Container data-testid="container-start" centered={false}>
          <div>Start</div>
        </Container>
        <Container
          data-testid="container-responsive"
          size={{ tablet: 's', desktop: 'l' }}
          gutter={{ mobile: 16, tablet: 0, wide: 32 }}
        >
          <div data-testid="container-responsive-content">Responsive</div>
          <div>
            <Container data-testid="container-nested">Nested container</Container>
          </div>
        </Container>
        <div style={{ '--container-m': '640px' } as CSSProperties}>
          <Container data-testid="container-custom-default">
            <div>Custom default container</div>
          </Container>
        </div>
      </div>
      <div data-testid="container-narrow-parent" style={{ inlineSize: 360 }}>
        <Container data-testid="container-narrow">
          <div data-testid="container-narrow-content">Narrow</div>
        </Container>
      </div>
      <div style={{ inlineSize: 48 }}>
        <Container data-testid="container-tight" gutter={32}>
          <div data-testid="container-tight-content" />
        </Container>
      </div>
      <div
        data-testid="layout-hardening-probes"
        style={
          {
            inlineSize: 320,
            '--space-16': '20px',
          } as CSSProperties
        }
      >
        <Stack data-testid="spacing-12-stack" gap={12}>
          <Box data-testid="custom-space-16-box" padding={16}>
            Custom 16
          </Box>
          <Flex data-testid="overflow-flex" gap={8} style={{ inlineSize: 220 }}>
            <Box data-testid="overflow-box" style={{ flex: '1 1 auto' }}>
              <Text data-testid="overflow-text" truncate>
                UninterruptedLongIdentifierThatMustTruncateInsideFlexBoxWithoutPushingOuterWidth
              </Text>
            </Box>
          </Flex>
          <Grid data-testid="overflow-grid" columns={2} gap={8} style={{ inlineSize: 220 }}>
            <Stack data-testid="overflow-grid-stack">
              <Text data-testid="overflow-grid-text" truncate>
                GridNestedStackTextThatMustNotBlowOutTrackWidthUnderMinInlineSizeZero
              </Text>
            </Stack>
            <span>Peer</span>
          </Grid>
          <VisuallyHidden data-testid="vh-span">Hidden span announcement</VisuallyHidden>
          <VisuallyHidden as="div" data-testid="vh-div">
            Hidden div announcement
          </VisuallyHidden>
        </Stack>
      </div>
    </>
  );
}

export default function LayoutFixture() {
  return (
    <>
      <LayoutRoots />
      <LayoutFlow />
      <LayoutGrid />
      <LayoutContainer />
    </>
  );
}
