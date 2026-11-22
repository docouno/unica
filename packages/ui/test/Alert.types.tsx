import { createRef } from 'react';
import {
  Alert,
  AlertActions,
  AlertClose,
  AlertDescription,
  AlertTitle,
  defineGlyph,
} from '../src/index.js';
import type {
  AlertActionsProps,
  AlertCloseProps,
  AlertDescriptionProps,
  AlertProps,
  AlertSize,
  AlertStatus,
  AlertTitleProps,
} from '../src/server.js';

const size: AlertSize = 's';
const status: AlertStatus = 'warning';
const title = {
  as: 'h3',
  ref: createRef<HTMLHeadingElement>(),
  id: 'alert-heading',
} satisfies AlertTitleProps;
const description = {
  ref: createRef<HTMLDivElement>(),
  id: 'alert-context',
} satisfies AlertDescriptionProps;
const actions = { ref: createRef<HTMLDivElement>() } satisfies AlertActionsProps;
const close = {
  ref: createRef<HTMLButtonElement>(),
  'aria-label': 'Dismiss warning',
  onClose: (event) => event.currentTarget.focus(),
} satisfies AlertCloseProps;
const notice = {
  ref: createRef<HTMLDivElement>(),
  size,
  status,
  role: 'region',
  icon: defineGlyph(() => null),
  'aria-labelledby': title.id,
  'aria-describedby': description.id,
  close: <AlertClose {...close} />,
  children: 0,
} satisfies AlertProps;

export const sample = (
  <Alert {...notice} data-example="warning">
    <AlertTitle {...title}>Review required</AlertTitle>
    <AlertDescription {...description}>Check the archive source.</AlertDescription>
    <AlertActions {...actions}>
      <button type="button">Retry</button>
    </AlertActions>
  </Alert>
);
export const bare = (
  <Alert icon={false} close={null}>
    Draft saved.
  </Alert>
);
export const divTitle = <AlertTitle ref={createRef<HTMLDivElement>()}>Hint</AlertTitle>;

// @ts-expect-error The root is passive.
export const interactive = <Alert role="button">Draft saved.</Alert>;
// @ts-expect-error The root owns the live channel.
export const live = <Alert aria-live="assertive">Draft saved.</Alert>;
// @ts-expect-error Alert's shared status subset has no accent.
export const accent: AlertStatus = 'accent';
// @ts-expect-error Alert's size subset stops at large.
export const oversized: AlertSize = 'xl';
// @ts-expect-error The specimen pin is not a package prop.
export const preview = <Alert previewClose="focus">Draft saved.</Alert>;
// @ts-expect-error Glyphs are passed as sources.
export const svg = <Alert icon={<svg />}>Draft saved.</Alert>;
// @ts-expect-error A close button needs a name.
export const unnamed = <AlertClose onClose={() => undefined} />;
// @ts-expect-error A close button needs a handler.
export const inert = <AlertClose aria-label="Dismiss" />;
// @ts-expect-error The close action cannot become a submit button.
export const submit = <AlertClose {...close} type="submit" />;
// @ts-expect-error The author chooses a native heading or a div.
export const badHeading = <AlertTitle as="button">Hint</AlertTitle>;
const svgRef = createRef<SVGSVGElement>();
// @ts-expect-error The heading ref must match its DOM element.
export const badRef = { as: 'h3', ref: svgRef } satisfies AlertTitleProps;
// @ts-expect-error The title cannot publish a second live message.
export const liveTitle = <AlertTitle aria-live="assertive">Hint</AlertTitle>;
// @ts-expect-error The description keeps ordinary document semantics.
export const liveDescription = <AlertDescription role="alert">Hint</AlertDescription>;
// @ts-expect-error Actions do not own live-region attributes.
export const liveActions = <AlertActions aria-atomic="true">Retry</AlertActions>;
