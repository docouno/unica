import { defineGlyph, SegmentedControl } from '@docouno/unica';
import type { GlyphSvgProps, SegmentedControlOption } from '@docouno/unica';
import { useState } from 'react';
import type { JSX } from 'react';

const layoutGlyph = defineGlyph(function Layout(props: GlyphSvgProps): JSX.Element {
  return (
    <svg {...props} viewBox="0 0 16 16" fill="currentColor">
      <path d="M1 2h6v12H1zm8 0h6v12H9z" />
    </svg>
  );
});

const items = [
  { value: 'first', label: 'First mode' },
  { value: 'middle', label: 'Middle mode' },
  { value: 'last', label: 'Final mode' },
] as const satisfies readonly SegmentedControlOption[];

const iconItems = items.map((option) => ({
  ...option,
  iconOnly: true as const,
  iconLeft: layoutGlyph,
}));

export default function SegmentedLayoutFixture(): JSX.Element {
  const [value, setValue] = useState('first');
  const [width, setWidth] = useState(190);
  const [updates, setUpdates] = useState(0);
  return (
    <>
      <button type="button" onClick={() => setUpdates((count) => count + 1)}>
        Update adjacent content
      </button>
      <output data-testid="updates">{updates}</output>
      <button type="button" onClick={() => setValue('last')}>
        Set final mode
      </button>
      <button type="button" onClick={() => setWidth(135)}>
        Narrow parent
      </button>
      <div data-testid="scroll-parent" style={{ width: 310, overflow: 'auto' }}>
        <div style={{ width: 400, paddingBlock: 8 }}>
          <div style={{ width }}>
            <SegmentedControl aria-label="Overflow" items={[...items]} value={value} size="s" />
          </div>
        </div>
      </div>
      {(['s', 'm', 'l'] as const).map((size) => (
        <section key={size} style={{ marginBlock: 12 }}>
          <SegmentedControl
            aria-label={`Text ${size}`}
            items={items}
            size={size}
            defaultValue="middle"
          />
          <SegmentedControl
            aria-label={`Icons ${size}`}
            items={iconItems}
            size={size}
            defaultValue="middle"
          />
        </section>
      ))}
      <SegmentedControl
        aria-label="Column"
        items={iconItems}
        orientation="vertical"
        size="s"
        defaultValue="middle"
      />
      <div data-testid="vertical-parent" style={{ blockSize: 62, overflow: 'auto' }}>
        <SegmentedControl aria-label="Vertical choices" orientation="vertical" items={items} />
      </div>
      <SegmentedControl
        aria-label="Short labels"
        size="s"
        items={[
          { value: 'i', label: 'I' },
          { value: 'j', label: 'J' },
        ]}
      />
    </>
  );
}
