import { createRef } from 'react';
import { Text, Title } from '../src/index.js';
import type {
  HeadingTag,
  TextAlign,
  TextColor,
  TextProps,
  TextSize,
  TextTag,
  TextWeight,
  TitleProps,
  TitleSize,
  TitleTextWrap,
  TitleWeight,
} from '../src/index.js';

const paragraph = createRef<HTMLParagraphElement>();
const label = createRef<HTMLLabelElement>();
const heading = createRef<HTMLHeadingElement>();

export const textProps = {
  as: 'label' satisfies TextTag,
  htmlFor: 'name',
  ref: label,
  size: 'body-xs' satisfies TextSize,
  weight: 'light' satisfies TextWeight,
  color: 'success' satisfies TextColor,
  align: 'end' satisfies TextAlign,
  onClick: (event) => {
    event.currentTarget.control?.focus();
  },
} satisfies TextProps;

export const titleProps = {
  as: 'h2' satisfies HeadingTag,
  ref: heading,
  size: 'body-m' satisfies TitleSize,
  weight: 'bold' satisfies TitleWeight,
  textWrap: 'pretty' satisfies TitleTextWrap,
} satisfies TitleProps;

export const validTypography = (
  <>
    <Text {...textProps} />
    <Text as="label" onClick={(event) => event.currentTarget.control?.focus()} />
    <Text
      ref={paragraph}
      onClick={(event) => {
        const node: HTMLParagraphElement = event.currentTarget;
        node.focus();
      }}
    />
    <Title {...titleProps} />
  </>
);

const spreadHtmlFor = { htmlFor: 'name', children: 'Name' };
const svg = createRef<SVGSVGElement>();

export const invalidTypography = [
  // @ts-expect-error The default root is a paragraph.
  <Text htmlFor="name" />,
  // @ts-expect-error A spread must also respect the root-specific attributes.
  <Text as="span" {...spreadHtmlFor} />,
  // @ts-expect-error A label ref must point to an HTMLLabelElement.
  <Text as="label" ref={paragraph} />,
  // @ts-expect-error Text supports a closed set of native roots.
  <Text as="a" />,
  // @ts-expect-error Text does not accept custom React roots.
  <Text as={Title} />,
  // @ts-expect-error Display sizes belong to Title.
  <Text size="display-l" />,
  // @ts-expect-error Wrapping styles belong to Title.
  <Text textWrap="balance" />,
  // @ts-expect-error Alignment uses logical directions.
  <Text align="left" />,
  // @ts-expect-error Appearance belongs to the theme.
  <Text appearance="solid" />,
  // @ts-expect-error Preview state belongs to the Workbench.
  <Text previewState="focus" />,
  // @ts-expect-error All heading ranks use HTMLHeadingElement.
  <Title as="h2" ref={svg} />,
  // @ts-expect-error Only body-m is on both scales.
  <Title size="body-xs" />,
  // @ts-expect-error Heading weights start at medium.
  <Title weight="light" />,
  // @ts-expect-error Alignment uses logical directions.
  <Title align="right" />,
  // @ts-expect-error A custom root cannot supply a heading level.
  <Title as="div" />,
];
