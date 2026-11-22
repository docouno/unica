import { createRef } from 'react';
import { SegmentedControl } from '../src/index.js';
import type { SegmentedControlOption, SegmentedControlProps } from '../src/index.js';
import type { SegmentedControlProps as ServerProps } from '../src/server.js';

const items: readonly SegmentedControlOption[] = [
  { value: '', label: 'Empty key', iconOnly: undefined },
  { value: 'grid', label: 'Grid', disabled: undefined },
];
const props: SegmentedControlProps = {
  items,
  'aria-label': 'Layout',
  ref: createRef<HTMLDivElement>(),
  defaultValue: null,
  onValueChange: (next: string) => next,
  status: undefined,
};
const serverProps: ServerProps = props;

<SegmentedControl {...serverProps} form="options" data-page-mode="list" />;
<SegmentedControl {...props} value="" onValueChange={undefined} />;

// @ts-expect-error Accessible group names are required.
<SegmentedControl items={items} />;
// @ts-expect-error Icon-only options require a glyph.
<SegmentedControl aria-label="Layout" items={[{ value: 'grid', label: 'Grid', iconOnly: true }]} />;
// @ts-expect-error Status is neutral or danger.
<SegmentedControl {...props} status="warning" />;
// @ts-expect-error Options are supplied by the items prop.
<SegmentedControl {...props}>Layout</SegmentedControl>;
// @ts-expect-error Validation feedback uses status.
<SegmentedControl {...props} invalid />;
// @ts-expect-error The native radio owns checked state.
<SegmentedControl {...props} aria-checked="true" />;
// @ts-expect-error The root owns its orientation semantics.
<SegmentedControl {...props} aria-orientation="vertical" />;
// @ts-expect-error The root uses radiogroup semantics.
<SegmentedControl {...props} aria-selected="true" />;
