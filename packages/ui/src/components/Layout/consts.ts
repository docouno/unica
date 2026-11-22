export const BOX_TAG = {
  div: 'div',
  span: 'span',
  section: 'section',
  article: 'article',
  aside: 'aside',
  main: 'main',
  header: 'header',
  footer: 'footer',
  nav: 'nav',
} as const;

export const BOX_DISPLAY = {
  block: 'block',
  inline: 'inline',
  'inline-block': 'inline-block',
  'flow-root': 'flow-root',
  none: 'none',
} as const;

export const FLEX_DIRECTION = {
  row: 'row',
  'row-reverse': 'row-reverse',
  column: 'column',
  'column-reverse': 'column-reverse',
} as const;

export const FLEX_ALIGN = {
  start: 'start',
  center: 'center',
  end: 'end',
  stretch: 'stretch',
  baseline: 'baseline',
} as const;

export const FLEX_WRAP = {
  nowrap: 'nowrap',
  wrap: 'wrap',
  'wrap-reverse': 'wrap-reverse',
} as const;

export const FLEX_JUSTIFY = {
  start: 'start',
  center: 'center',
  end: 'end',
  'space-between': 'space-between',
  'space-around': 'space-around',
  'space-evenly': 'space-evenly',
} as const;

export const CONTAINER_SIZE = {
  s: 's',
  m: 'm',
  l: 'l',
} as const;

export const GRID_FLOW = {
  row: 'row',
  column: 'column',
} as const;

export const VISUALLY_HIDDEN_TAG = {
  span: 'span',
  div: 'div',
} as const;
