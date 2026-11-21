import { useState } from 'react';
import { Indicator } from '@docouno/unica';

export default function IndicatorHiddenFixture() {
  const [count, setCount] = useState(1);
  const [hostActivations, setHostActivations] = useState(0);
  const [nativeActivations, setNativeActivations] = useState(0);

  return (
    <div style={{ padding: 32 }}>
      <button type="button" onClick={() => setCount(3)}>
        Update hidden counts
      </button>
      <div>
        <button type="button">Before wrapper</button>
        <Indicator count={count} data-testid="hidden-wrapper">
          <button type="button" aria-label="Wrapper hides this button">
            <span id="inside-wrapper">Find the data</span>
          </button>
        </Indicator>
        <a href="#inside-wrapper">Find inside wrapper</a>
      </div>
      <div>
        <button type="button">Before host</button>
        <Indicator count={count} data-testid="host-indicator">
          <button
            type="button"
            aria-label="Wrapped native button"
            onClick={() => setHostActivations((value) => value + 1)}
          >
            <span id="inside-host">Find the data</span>
          </button>
        </Indicator>
        <a href="#inside-host">Find inside host</a>
        <span data-testid="host-activations">{hostActivations}</span>
      </div>
      <div>
        <button type="button">Before reference</button>
        <button
          type="button"
          aria-label="Standalone native button"
          onClick={() => setNativeActivations((value) => value + 1)}
        >
          <span>Find the data</span>
        </button>
        <a href="#inside-host">After reference</a>
        <span data-testid="native-activations">{nativeActivations}</span>
      </div>
    </div>
  );
}
