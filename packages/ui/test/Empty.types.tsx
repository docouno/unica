import { createRef } from 'react';
import {
  Empty,
  EmptyActions,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
  defineGlyph,
} from '../src/index.js';
import type * as UI from '../src/index.js';
import type * as Server from '../src/server.js';

type Parts = [
  UI.EmptyProps,
  UI.EmptyMediaProps,
  UI.EmptyTitleProps,
  UI.EmptyDescriptionProps,
  UI.EmptyActionsProps,
];
type ServerParts = [
  Server.EmptyProps,
  Server.EmptyMediaProps,
  Server.EmptyTitleProps,
  Server.EmptyDescriptionProps,
  Server.EmptyActionsProps,
];
type Axes = [UI.EmptySize, UI.EmptyAlign, UI.EmptyMediaColor];
type ServerAxes = [Server.EmptySize, Server.EmptyAlign, Server.EmptyMediaColor];

const div = createRef<HTMLDivElement>();
const heading = createRef<HTMLHeadingElement>();
const paragraph = createRef<HTMLParagraphElement>();
const button = createRef<HTMLButtonElement>();
const glyph = defineGlyph(() => <svg />);
const markup = { __html: '<button>Retry</button>' };

export function emptyParts(parts: Parts, axes: Axes): [ServerParts, ServerAxes] {
  return [parts, axes];
}

export const composed = (
  <Empty ref={div} size="l" align="start" data-view="reports" aria-describedby="description">
    <EmptyMedia ref={div} icon={glyph} color="danger" />
    <EmptyTitle ref={heading} as="h1" tabIndex={-1}>
      Reports
    </EmptyTitle>
    <EmptyTitle as="h6">History</EmptyTitle>
    <EmptyDescription ref={paragraph} id="description">
      No reports.
    </EmptyDescription>
    <EmptyActions ref={div} onClick={(event) => event.currentTarget.focus()}>
      0
    </EmptyActions>
  </Empty>
);

// @ts-expect-error Use S, M, or L.
export const badSize = <Empty size="xl" />;
// @ts-expect-error Empty supports logical start and center.
export const badAlign = <Empty align="end" />;
// @ts-expect-error Empty has no decorative variant.
export const variant = <Empty variant="glass" />;
// @ts-expect-error Request state belongs to the surrounding region.
export const preview = <Empty previewState="loading" />;
// @ts-expect-error Only semantic medallion colors are available.
export const mediaColor = <EmptyMedia icon={glyph} color="primary" />;
// @ts-expect-error Title owns its foreground.
export const titleColor = <EmptyTitle color="danger">Reports</EmptyTitle>;
// @ts-expect-error Description owns its foreground.
export const descriptionColor = <EmptyDescription color="danger">No reports.</EmptyDescription>;
// @ts-expect-error Choose a real heading level.
export const fakeHeading = <EmptyTitle as="div">Reports</EmptyTitle>;
// @ts-expect-error The description exposes a paragraph, not a button.
export const wrongRef = <EmptyDescription ref={button}>No reports.</EmptyDescription>;
// @ts-expect-error Supply the contents as React children.
export const rawHtml = <EmptyActions dangerouslySetInnerHTML={markup} />;
