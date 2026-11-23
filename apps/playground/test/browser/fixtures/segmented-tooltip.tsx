import { defineGlyph, SegmentedControl } from '@docouno/unica';
import type { GlyphSvgProps } from '@docouno/unica';
import { useLayoutEffect, useRef, useState } from 'react';
import type { JSX } from 'react';

const glyph = defineGlyph(function LayoutGlyph(props: GlyphSvgProps): JSX.Element {
  return (
    <svg {...props} viewBox="0 0 16 16" fill="currentColor">
      <path d="M1 2h6v12H1zm8 0h6v12H9z" />
    </svg>
  );
});

export default function SegmentedTooltipFixture(): JSX.Element {
  const dialog = useRef<HTMLDialogElement>(null);
  const [icons, setIcons] = useState(true);
  const [showRoomy, setShowRoomy] = useState(true);
  const densityOptions = icons
    ? ([
        { value: 'compact', label: 'Compact density', iconOnly: true, iconLeft: glyph },
        { value: 'roomy', label: 'Comfortable density', iconOnly: true, iconLeft: glyph },
      ] as const)
    : [
        { value: 'compact', label: 'Compact density with short spacing' },
        { value: 'roomy', label: 'Comfortable density with roomy spacing' },
      ];
  useLayoutEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog ref={dialog} aria-label="Layout settings" data-surface="overlay">
      <button type="button">Before layout</button>
      <div style={{ width: 73 }}>
        <SegmentedControl
          aria-label="Layout mode"
          size="l"
          items={[
            { value: 'list', label: 'List layout', iconOnly: true, iconLeft: glyph },
            { value: 'grid', label: 'Grid layout', iconOnly: true, iconLeft: glyph },
            { value: 'columns', label: 'Column layout', iconOnly: true, iconLeft: glyph },
          ]}
        />
      </div>
      <button type="button">After layout</button>
      <div style={{ width: 160 }}>
        <SegmentedControl
          aria-label="Density"
          name="density"
          width="full"
          items={showRoomy ? densityOptions : densityOptions.slice(0, 1)}
        />
      </div>
      <button type="button" onClick={() => setIcons((current) => !current)}>
        Toggle density labels
      </button>
      <button
        type="button"
        onClick={() => {
          setShowRoomy(false);
          setIcons(true);
        }}
      >
        Remove comfortable density and show icons
      </button>
    </dialog>
  );
}
