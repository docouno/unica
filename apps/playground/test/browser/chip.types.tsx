import { createRef } from 'react';
import { Chip, ChipGroup } from '@docouno/unica';
import type { ChipGroupProps, ChipProps } from '@docouno/unica';

const items: ChipGroupProps['items'] = [
  { value: '', label: <strong>All</strong>, textValue: 'All' },
];
const style: ChipProps['style'] = { '--chip-max-width': '12rem' };
const input = createRef<HTMLInputElement>();
const group = createRef<HTMLFieldSetElement>();

<Chip ref={input} textValue="Long name" style={style}>
  <span>Long name</span>
</Chip>;
<ChipGroup
  ref={group}
  aria-label="Types"
  items={items}
  value={null}
  onValueChange={(next) => next.toUpperCase()}
/>;
<ChipGroup
  multiple
  label="Types"
  items={items}
  value={[]}
  onValueChange={(next) => next.join(',')}
/>;
// @ts-expect-error Rich labels need an equivalent text value.
<Chip>
  <span>Long name</span>
</Chip>;
// @ts-expect-error A group requires an accessible name.
<ChipGroup items={items} />;
// @ts-expect-error Group descriptions do not serve as accessible names.
<ChipGroup description="Pick one" items={items} />;
// @ts-expect-error A radio group cannot accept multiple values.
<ChipGroup label="Types" value={['a']} items={items} />;
// @ts-expect-error A multiple group takes an array of keys.
<ChipGroup multiple label="Types" value="a" items={items} />;
// @ts-expect-error A multiple group proposes an array of keys.
<ChipGroup multiple label="Types" onValueChange={(next: string) => next} items={items} />;
// @ts-expect-error A standalone Chip is a checkbox.
<Chip type="radio">Invalid</Chip>;
// @ts-expect-error Chip omits readOnly.
<Chip readOnly>Invalid</Chip>;
// @ts-expect-error ChipGroup omits readOnly.
<ChipGroup label="Types" items={items} readOnly />;
// @ts-expect-error Options omit readOnly.
<ChipGroup label="Types" items={[{ value: 'a', label: 'A', readOnly: true }]} />;
// @ts-expect-error Chip omits previewState.
<Chip previewState="hover">Invalid</Chip>;
// @ts-expect-error Chip omits data-preview.
<Chip data-preview="hover">Invalid</Chip>;
// @ts-expect-error Chip omits indeterminate.
<Chip indeterminate>Invalid</Chip>;
