import { Box, Container, Grid, GridItem } from '@docouno/unica';

export default function LayoutSsr() {
  return (
    <Container data-layout-root="" gutter={0}>
      <Grid
        data-responsive-grid=""
        columns={{ mobile: 1, tablet: 2, desktop: 3, wide: 4 }}
        gap={{ mobile: 8, desktop: 16 }}
      >
        <GridItem span={{ mobile: 1, desktop: 2 }}>
          <Box as="section" marginInline={{ tablet: 8 }} padding={16} paddingInlineEnd={0}>
            Build status
          </Box>
        </GridItem>
        <GridItem>Deployments</GridItem>
      </Grid>
    </Container>
  );
}
