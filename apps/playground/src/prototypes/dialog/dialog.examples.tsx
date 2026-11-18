import type { CSSProperties, ReactElement, ReactNode } from 'react';
import type { DialogSize } from './dialog.proto.js';
import './dialog.examples.css';

export function DialogStudy({
  controls,
  height = 520,
  children,
}: {
  readonly controls?: ReactNode;
  readonly height?: number;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className="dialog-study">
      {controls && <div className="dialog-study-controls">{controls}</div>}
      <div
        className="dialog-study-stage"
        style={{ '--study-height': `${height}px` } as CSSProperties}
      >
        {children}
      </div>
    </div>
  );
}

export function StudySelect<Value extends string>({
  label,
  value,
  options,
  onChange,
}: {
  readonly label: string;
  readonly value: Value;
  readonly options: readonly (readonly [Value, string])[];
  readonly onChange: (value: Value) => void;
}): ReactElement {
  return (
    <label className="dialog-study-select">
      {label}
      <select
        value={value}
        onChange={(event) => {
          const option = options.find(([key]) => key === event.currentTarget.value);
          if (option) {
            onChange(option[0]);
          }
        }}
      >
        {options.map(([key, text]) => (
          <option key={key} value={key}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}

const densities: readonly (readonly [DialogSize, string])[] = [
  ['s', 'Compact'],
  ['m', 'Regular'],
  ['l', 'Spacious'],
];

const widths: readonly (readonly [DialogSize, string])[] = [
  ['s', 'S · 24rem'],
  ['m', 'M · 36rem'],
  ['l', 'L · 52rem'],
];

export function DialogSizeControls({
  size,
  width,
  onSizeChange,
  onWidthChange,
}: {
  readonly size: DialogSize;
  readonly width: DialogSize;
  readonly onSizeChange: (value: DialogSize) => void;
  readonly onWidthChange: (value: DialogSize) => void;
}): ReactElement {
  return (
    <>
      <StudySelect label="Width" value={width} options={widths} onChange={onWidthChange} />
      <StudySelect label="Density" value={size} options={densities} onChange={onSizeChange} />
    </>
  );
}
