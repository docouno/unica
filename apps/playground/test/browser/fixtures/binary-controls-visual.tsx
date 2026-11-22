import { useState } from 'react';
import type { JSX } from 'react';
import { Checkbox, Radio, Switch } from '@docouno/unica';

function LabelPair({
  kind,
  selected,
  readOnly = false,
}: {
  readonly kind: 'checkbox' | 'switch';
  readonly selected: boolean;
  readonly readOnly?: boolean;
}): JSX.Element {
  const Control = kind === 'checkbox' ? Checkbox : Switch;
  const state = readOnly ? 'locked' : selected ? 'on' : 'off';
  const prefix = `${kind}-${state}`;
  const [changes, setChanges] = useState(0);
  const record = (): void => setChanges((count) => count + 1);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <Control
        id={`${prefix}-internal`}
        label={`${kind} ${state} internal`}
        checked={selected}
        readOnly={readOnly}
        onCheckedChange={record}
      />
      <div style={{ display: 'inline-flex', alignItems: 'center' }}>
        <Control
          id={`${prefix}-external`}
          checked={selected}
          readOnly={readOnly}
          onCheckedChange={record}
        />
        <label htmlFor={`${prefix}-external`} data-testid={`${prefix}-external-text`}>
          {`${kind} ${state} external`}
        </label>
      </div>
      <output data-testid={`${prefix}-changes`}>{changes}</output>
    </div>
  );
}

const sizes = ['s', 'm', 'l'] as const;

export default function BinaryVisualFixture(): JSX.Element {
  return (
    <>
      <LabelPair kind="checkbox" selected={false} />
      <LabelPair kind="checkbox" selected />
      <LabelPair kind="checkbox" selected readOnly />
      <LabelPair kind="switch" selected={false} />
      <LabelPair kind="switch" selected />
      <LabelPair kind="switch" selected readOnly />
      <div style={{ maxWidth: 300 }} data-testid="geometry">
        {sizes.map((size) => (
          <div key={size}>
            <Checkbox
              label="A checkbox label that wraps on a narrow screen"
              description="A description remains readable after text scaling."
              id={`geometry-checkbox-${size}`}
              size={size}
              indeterminate
              status="danger"
            />
            <Radio
              aria-label="A standalone selected radio"
              id={`geometry-radio-${size}`}
              size={size}
              defaultChecked
            />
            <Switch aria-label="A standalone switch" id={`geometry-switch-${size}`} size={size} />
          </div>
        ))}
      </div>
    </>
  );
}
