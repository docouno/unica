import type { ReactElement } from 'react';
import { Indicator } from '@docouno/unica';
import type { IndicatorPosition, IndicatorProps, IndicatorStatus } from '@docouno/unica';

const corners: readonly IndicatorPosition[] = [
  'top-start',
  'top-end',
  'bottom-start',
  'bottom-end',
];
const statuses: readonly IndicatorStatus[] = [
  'neutral',
  'accent',
  'info',
  'success',
  'warning',
  'danger',
];
const sizes: readonly NonNullable<IndicatorProps['size']>[] = ['s', 'm', 'l'];
const autoLayouts = {
  grid: { display: 'grid', inlineSize: 240 },
  column: { display: 'flex', flexDirection: 'column', inlineSize: 240 },
  row: { display: 'flex' },
  narrow: { inlineSize: 20 },
} as const;
const shellSeparator = { '--indicator-separator-color': 'var(--bg-shell)' };

function MarkerPair({
  status = 'accent',
  size = 'm',
  withBorder = true,
}: Pick<IndicatorProps, 'status' | 'size' | 'withBorder'>): ReactElement {
  return (
    <>
      <Indicator count={105} status={status} size={size} withBorder={withBorder}>
        <button type="button" aria-label="Inbox, 105 unread">
          Inbox
        </button>
      </Indicator>
      <Indicator dot status={status} size={size} withBorder={withBorder}>
        <span>Available</span>
      </Indicator>
    </>
  );
}

export default function IndicatorMaterialFixture() {
  return (
    <div style={{ padding: 32 }}>
      {(['ltr', 'rtl'] as const).map((direction) => (
        <div dir={direction === 'ltr' ? 'rtl' : 'ltr'} key={direction}>
          <div dir={direction} style={{ display: 'flex', flexWrap: 'wrap', gap: 24, padding: 24 }}>
            {(['rectangular', 'circular'] as const).flatMap((overlap) =>
              corners.map((position) => (
                <Indicator
                  key={`${overlap}-${position}`}
                  data-testid="corner"
                  data-direction={direction}
                  count={105}
                  overlap={overlap}
                  position={position}
                >
                  <button
                    type="button"
                    style={{
                      inlineSize: overlap === 'circular' ? 48 : 60,
                      blockSize: 48,
                      borderRadius: overlap === 'circular' ? 'var(--radius-full)' : undefined,
                    }}
                    aria-label="Notifications, 105 unread"
                  />
                </Indicator>
              )),
            )}
          </div>
        </div>
      ))}
      <div data-testid="width-container" style={{ inlineSize: 168 }}>
        <Indicator width="auto" data-testid="auto" count={105}>
          <button type="button">Inbox</button>
        </Indicator>
        <Indicator width="full" data-testid="full" count={105}>
          <button type="button">Inbox</button>
        </Indicator>
        <Indicator width="full" data-testid="wrapped" count={105}>
          <button type="button">Review all incoming collaboration requests</button>
        </Indicator>
      </div>
      {Object.entries(autoLayouts).map(([layout, style]) => (
        <div key={layout} style={style} data-testid="auto-layout">
          <Indicator count={105}>
            <button type="button">Inbox</button>
          </Indicator>
          {layout === 'row' && <span aria-hidden="true" style={{ blockSize: 100 }} />}
        </div>
      ))}
      <div data-testid="base" style={{ background: 'var(--bg-canvas)', padding: 24 }}>
        {statuses.map((status) => (
          <MarkerPair key={status} status={status} />
        ))}
      </div>
      <div
        style={{
          ...shellSeparator,
          backgroundImage: 'url(/assets/avatar-portrait-wide.png)',
          backgroundSize: 'cover',
        }}
      >
        <div
          data-testid="overlay"
          data-surface="overlay"
          style={{
            background: 'var(--bg-overlay)',
            backdropFilter: 'var(--_overlay-backdrop)',
            padding: 24,
          }}
        >
          {statuses.map((status) => (
            <MarkerPair key={status} status={status} />
          ))}
          <div
            data-testid="shell-override"
            style={{
              ...shellSeparator,
              background: 'var(--bg-shell)',
              padding: 24,
            }}
          >
            <MarkerPair />
            <div
              data-testid="nested-base"
              data-surface="base"
              style={{ background: 'var(--bg-canvas)', padding: 24 }}
            >
              <MarkerPair />
            </div>
          </div>
        </div>
      </div>
      <div data-testid="sizes" style={{ padding: 24 }}>
        {sizes.map((size) => (
          <MarkerPair key={size} size={size} />
        ))}
      </div>
      <div data-testid="borderless" style={{ padding: 24 }}>
        <MarkerPair withBorder={false} />
      </div>
    </div>
  );
}
