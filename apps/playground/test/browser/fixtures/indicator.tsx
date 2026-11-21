import { useState } from 'react';
import { Indicator } from '@docouno/unica';

export default function IndicatorFixture() {
  const [count, setCount] = useState(105);
  const [activations, setActivations] = useState(0);
  const [visible, setVisible] = useState(true);
  const [rootHidden, setRootHidden] = useState(false);
  const [hostHidden, setHostHidden] = useState(false);

  return (
    <div style={{ padding: 32, background: 'var(--bg-canvas)' }}>
      <button type="button">Before notifications</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32, padding: 24 }}>
        <div data-testid="notifications">
          <Indicator
            id="notification-indicator"
            count={count}
            visible={visible}
            hidden={rootHidden}
          >
            <button
              type="button"
              hidden={hostHidden}
              aria-label={`Notifications, ${count} unread`}
              onClick={() => {
                setActivations((current) => current + 1);
                setCount(0);
              }}
            >
              Notifications
            </button>
          </Indicator>
        </div>
        <button type="button">After notifications</button>
      </div>
      <div>
        <button type="button" onClick={() => setCount(3)}>
          Set three unread
        </button>
        <button type="button" onClick={() => setVisible((current) => !current)}>
          Toggle marker
        </button>
        <button type="button" onClick={() => setRootHidden((current) => !current)}>
          Toggle wrapper hidden
        </button>
        <button type="button" onClick={() => setHostHidden((current) => !current)}>
          Toggle host hidden
        </button>
        <span data-testid="activations">{activations}</span>
        <span role="status">{count} unread</span>
      </div>
      <form aria-label="Request">
        <input aria-label="Subject" name="subject" defaultValue="Draft" />
        <Indicator count={3} status="neutral">
          <button type="submit" name="action" value="blocked" disabled>
            Blocked
          </button>
        </Indicator>
        <Indicator count={3}>
          <button type="submit" name="action" value="send">
            Send
          </button>
        </Indicator>
        <Indicator dot>
          <button type="reset" name="reset">
            Reset
          </button>
        </Indicator>
      </form>
    </div>
  );
}
