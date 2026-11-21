import {
  Box,
  Container,
  Flex,
  Grid,
  GridItem,
  Stack,
  type BoxProps,
  type ContainerProps,
  type FlexProps,
  type GridItemProps,
  type GridProps,
  type Responsive,
  type StackProps,
} from '@docouno/unica';
import { createRef } from 'react';

const columns: Responsive<1 | 2 | 12> = { tablet: 2, desktop: 12 };
const navigation: BoxProps<'nav'> = { as: 'nav', ref: createRef<HTMLElement>(), padding: 0 };
const flex: FlexProps = { gap: { mobile: 0, tablet: 'm' }, justify: 'space-evenly' };
const stack: StackProps = { divider: 0, align: 'baseline' };
const grid: GridProps = { columns, flow: 'column' };
const item: GridItemProps = { span: { tablet: 2 } };
const container: ContainerProps = { size: { mobile: 's', wide: 'l' }, centered: false };

const valid = [
  <Box {...navigation} aria-label="Sections" />,
  <Box as="span" ref={createRef<HTMLSpanElement>()} hidden />,
  <Box ref={createRef<HTMLDivElement>()} onClick={(event) => void event.currentTarget.align} />,
  <Flex {...flex} />,
  <Stack {...stack} />,
  <Grid {...grid} />,
  <GridItem {...item} />,
  <Container {...container} />,
];

const invalid = [
  // @ts-expect-error Decorative props belong to surfaces.
  <Box background="surface" />,
  // @ts-expect-error The native tag choice is limited to structural HTML elements.
  <Box as="button" />,
  // @ts-expect-error A requested non-default tag must be passed at runtime.
  <Box<'nav'> />,
  // @ts-expect-error The ref must accept the selected native element.
  <Box as="nav" ref={createRef<SVGElement>()} />,
  // @ts-expect-error Named breakpoints are closed.
  <Flex direction={{ small: 'row' }} />,
  // @ts-expect-error Spacing uses the shared token scale.
  <Stack gap={6} />,
  // @ts-expect-error Grid has 1 through 12 columns.
  <Grid columns={13} />,
  // @ts-expect-error GridItem has one placement mode at a time.
  <GridItem area="nav" span={2} />,
  // @ts-expect-error Layout uses the native boolean JSX hidden attribute.
  <Container hidden="until-found" />,
];
void [valid, invalid];
