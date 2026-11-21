import { createRef } from 'react';
import { Divider, type DividerProps } from '../src/index.js';
import type { DividerProps as ServerDividerProps } from '../src/server.js';

const ref = createRef<HTMLDivElement>();
const vertical = { orientation: 'vertical', decorative: false } satisfies ServerDividerProps;
const semantic = {
  decorative: false,
  'aria-labelledby': 'heading',
  'aria-label': 'Fallback',
} satisfies DividerProps;

export const plain = <Divider key="section" ref={ref} data-wb-subject="" />;
export const named = <Divider {...semantic} />;
export const upright = <Divider {...vertical} aria-label="Formatting groups" />;
export const phrase = <Divider label="or" labelPosition="end" />;

// @ts-expect-error A vertical line cannot have a label.
export const verticalLabel = <Divider orientation="vertical" label="or" />;
// @ts-expect-error A label must be text.
export const jsxLabel = <Divider label={<span>or</span>} />;
// @ts-expect-error Position requires a label.
export const missingLabel = <Divider labelPosition="start" />;
// @ts-expect-error Separator semantics apply to plain lines.
export const semanticLabel = <Divider label="or" decorative={false} />;
// @ts-expect-error The phrase exposes its own text.
export const namedLabel = <Divider label="or" aria-label="Alternative" />;
// @ts-expect-error A decorative line has no accessible name.
export const namedDecorative = <Divider aria-labelledby="heading" />;
// @ts-expect-error Divider owns its accessibility attributes.
export const hiddenLabel = <Divider label="or" aria-hidden="true" />;
// @ts-expect-error Divider owns its orientation semantics.
export const ariaOrientation = <Divider decorative={false} aria-orientation="vertical" />;
// @ts-expect-error Static separators have no range.
export const range = <Divider decorative={false} aria-valuenow={3} />;
// @ts-expect-error Use the text label prop to supply content.
export const children = <Divider>Alternate content</Divider>;

const mixed = { label: 'or', tabIndex: 0 };
// @ts-expect-error A spread cannot make this static divider focusable.
export const focusable = <Divider {...mixed} />;
const activated = { orientation: 'vertical' as const, onClick: () => undefined };
// @ts-expect-error Divider does not accept activation handlers.
export const clickable = <Divider {...activated} />;
const replaced = { label: 'or', dangerouslySetInnerHTML: { __html: '<button />' } };
// @ts-expect-error Divider owns its HTML.
export const withHtml = <Divider {...replaced} />;
