import { Card, Skeleton, SkeletonText } from '@docouno/unica';
import { useRef } from 'react';
import type { ReactElement } from 'react';
import { PopoverContent } from '../../../src/prototypes/popover/popover.proto.js';

export default function SkeletonWaveFixture(): ReactElement {
  const overlay = useRef<HTMLDivElement>(null);

  return (
    <>
      <style>{`
        [data-wave-shifted] { translate: 32px; }
        [data-wave-moving] { animation: wave-fixture-enter 600ms linear both; }
        @keyframes wave-fixture-enter {
          from { translate: 32px; }
          to { translate: 80px; }
        }
        [data-wave-inset-moving] { animation: wave-fixture-inset 600ms linear both; }
        @keyframes wave-fixture-inset {
          from { left: 0px; top: 0px; }
          to { left: 48px; top: 36px; }
        }
      `}</style>
      <button
        type="button"
        onClick={() => {
          const panel = overlay.current;
          if (panel?.matches(':popover-open')) {
            panel.hidePopover();
          } else {
            panel?.showPopover();
          }
        }}
      >
        Toggle overlay
      </button>
      <Card
        data-testid="wave-card"
        style={{
          position: 'relative',
          maxInlineSize: 480,
          marginInline: 30,
          transform: 'translateX(24px) scale(1.125, 0.875)',
          transformOrigin: 'left',
        }}
      >
        <Skeleton data-wave-sample="" width={280} height={92} />
        <SkeletonText data-wave-text="" width={192} lines={2} style={{ marginInlineStart: 35 }} />
      </Card>
      <div
        data-testid="wave-scroll"
        style={{
          overflow: 'auto',
          inlineSize: 320,
          blockSize: 80,
          marginInline: 55,
          marginBlock: 16,
        }}
      >
        <div style={{ inlineSize: 700, blockSize: 144, paddingInline: 100, paddingBlock: 30 }}>
          <Skeleton data-wave-sample="" width={300} />
        </div>
      </div>
      <div style={{ display: 'flex', inlineSize: 500, blockSize: 28 }}>
        <img
          data-testid="wave-image"
          src="/wave-intrinsic.svg"
          alt=""
          style={{ alignSelf: 'start' }}
        />
        <Skeleton data-wave-intrinsic="" width={250} />
      </div>
      <PopoverContent
        ref={overlay}
        popover="manual"
        aria-label="Frost overlay"
        style={{ position: 'fixed', inset: 'auto', left: 125, top: 315, margin: 0 }}
      >
        <Skeleton data-wave-overlay="" width={215} />
      </PopoverContent>
    </>
  );
}
