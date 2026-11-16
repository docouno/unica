import { useId, useState } from 'react';
import type { ReactElement } from 'react';
import { Button } from '../button/button.proto.js';
import { Spinner } from './progress.proto.js';
import { ProgressCircle } from './progress-circle.proto.js';
import './progress.examples.css';

function HandoffStudy(): ReactElement {
  const id = useId();
  const [known, setKnown] = useState(false);
  const [value, setValue] = useState(42);
  return (
    <div className="activity-study">
      <div className="activity-label">
        <ProgressCircle
          size="m"
          tone="accent"
          value={known ? value : null}
          aria-label="Archive transfer"
        />
        <span dir="auto">
          {known ? (value === 100 ? 'Archive sent' : 'Sending archive…') : 'Preparing archive…'}
          {known && <span className="activity-muted"> · {value}%</span>}
        </span>
      </div>
      <div className="activity-preview-controls">
        <Button size="s" variant="secondary" tone="neutral" onClick={() => setKnown(!known)}>
          {known ? 'Return to preparing' : 'Measurement available'}
        </Button>
        <label htmlFor={id}>Measured amount · {value}%</label>
        <input
          id={id}
          type="range"
          min="0"
          max="100"
          value={value}
          disabled={!known}
          onChange={(event) => setValue(Number(event.target.value))}
        />
      </div>
      <span className="activity-caption">
        The same icon slot, stroke and tone. Waiting moves; a known amount fills from twelve and
        stays still. Local controls supply the value; this is not a simulated upload.
      </span>
    </div>
  );
}

const examples: Record<string, () => ReactElement> = {
  scale: () => (
    <div className="activity-study">
      {(['s', 'm', 'l', 'inherit'] as const).map((size) => (
        <div className="activity-row" key={size}>
          <Spinner size={size} tone="accent" />
          <ProgressCircle size={size} tone="accent" value={64} aria-label="Transfer" />
          <span className="activity-caption">
            {size === 'inherit'
              ? 'Inherit · 1em'
              : `${size.toUpperCase()} · ${size === 's' ? 14 : size === 'm' ? 16 : 20}px`}
          </span>
        </div>
      ))}
      <span className="activity-caption">
        Spinner beside its measured counterpart. Shared geometry in every theme; text and
        percentages stay in the surrounding interface.
      </span>
    </div>
  ),
  boundaries: () => (
    <div className="activity-study">
      <div className="activity-row">
        {[0, 12.5, 37.5, 64, 100].map((value) => (
          <div className="activity-sample" key={value}>
            <ProgressCircle size="l" tone="accent" value={value} aria-label="Transfer" />
            <span className="activity-caption">{value}%</span>
          </div>
        ))}
      </div>
      <span className="activity-caption">
        Empty at zero, full at 100. Pixel fills the same eight cells clockwise, including a partial
        leading cell. No looping motion or automatic success color.
      </span>
    </div>
  ),
  context: () => (
    <div className="activity-study">
      <div className="activity-label">
        <ProgressCircle
          size="m"
          value={42}
          max={80}
          tone="accent"
          aria-label="Sending references.pdf"
          aria-valuetext="42 of 80 MB"
        />
        <span dir="auto">
          references.pdf{' '}
          <span className="activity-muted">
            · <bdi>42 of 80 MB</bdi>
          </span>
        </span>
      </div>
      <div className="activity-label">
        <ProgressCircle
          size="m"
          value={3}
          max={8}
          tone="accent"
          aria-label="Processing archive"
          aria-valuetext="3 of 8 stages"
        />
        <span dir="auto">
          Processing archive{' '}
          <span className="activity-muted">
            · <bdi>3 of 8 stages</bdi>
          </span>
        </span>
      </div>
      <div className="activity-label activity-muted">
        <ProgressCircle
          size="m"
          value={42}
          max={80}
          aria-label="Transfer paused"
          aria-valuetext="42 of 80 MB, paused"
        />
        <span dir="auto">Transfer paused · waiting for connection</span>
      </div>
      <div className="activity-label">
        <ProgressCircle
          size="s"
          value={1284}
          max={1528}
          tone="muted"
          aria-label="Validating collection"
          aria-valuetext="1,284 of 1,528 records"
        />
        <span dir="auto">
          Validating records from a long document collection{' '}
          <span className="activity-muted">
            · <bdi>1,284 of 1,528 records</bdi>
          </span>
        </span>
      </div>
      <span className="activity-caption">
        Small usage fragments, not a new row component. Pause or failure keeps the amount and uses
        explanatory text; the glyph follows Spinner's inherit, neutral, muted or accent tones.
      </span>
    </div>
  ),
  handoff: () => <HandoffStudy />,
  overlay: () => (
    <div className="activity-overlay activity-study">
      <div className="activity-label">
        <ProgressCircle
          size="m"
          tone="accent"
          value={42}
          max={80}
          aria-label="Uploading archive"
          aria-valuetext="42 of 80 MB"
        />
        <span dir="auto">
          Uploading archive{' '}
          <span className="activity-muted">
            · <bdi>42 of 80 MB</bdi>
          </span>
        </span>
      </div>
      <div className="activity-label activity-muted">
        <ProgressCircle size="m" value={null} aria-label="Preparing documents" />
        <span dir="auto">Preparing documents…</span>
      </div>
    </div>
  ),
};

export default function Study({ section }: { readonly section: string }): ReactElement | null {
  return examples[section]?.() ?? null;
}
