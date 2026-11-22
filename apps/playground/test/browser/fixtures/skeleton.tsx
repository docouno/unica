import { Skeleton, SkeletonText, Text } from '@docouno/unica';
import { useState } from 'react';
import type { CSSProperties, ReactElement } from 'react';
import { Avatar } from '../../../src/prototypes/avatar/avatar.proto.js';
import { Card } from '../../../src/prototypes/card/card.proto.js';
import { PopoverContent } from '../../../src/prototypes/popover/popover.proto.js';

function SurfaceSamples(): ReactElement {
  const swatch: CSSProperties = { inlineSize: 48, blockSize: 16, background: 'var(--fg-muted)' };
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Skeleton data-sample="actual" width={48} />
        <span data-sample="expected" style={{ ...swatch, opacity: 0.16 }} />
        <span data-sample="background" style={{ inlineSize: 48, blockSize: 16 }} />
      </div>
      <Text size="caption-l" color="muted" role="status">
        Loading…
      </Text>
    </>
  );
}

export default function SkeletonFixture(): ReactElement {
  const [avatar, setAvatar] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [updates, setUpdates] = useState(0);
  const [showProbes, setShowProbes] = useState(false);
  const displayStyles = [{ style: { display: 'grid' } }, { className: 'skeleton-test-grid' }];

  return (
    <div style={{ fontFamily: 'var(--font-family-base)' }}>
      <style>{'.skeleton-test-grid { display: grid; }'}</style>
      <div
        data-testid="surfaces"
        style={{ maxInlineSize: 340, background: 'var(--bg-canvas)', padding: 20 }}
      >
        <div data-test-surface="canvas" style={{ padding: 20 }}>
          <SurfaceSamples />
        </div>
        <Card data-test-surface="card">
          <SurfaceSamples />
        </Card>
        <PopoverContent role="presentation" data-test-surface="overlay">
          <SurfaceSamples />
        </PopoverContent>
      </div>
      <div data-testid="shapes" style={{ inlineSize: 160 }}>
        <Skeleton data-testid="rect" />
        <Skeleton data-testid="avatar-default" shape="circle" />
        <Skeleton data-testid="avatar-width" shape="circle" width={32} />
        <Skeleton data-testid="avatar-height" shape="circle" height={24} />
        <Skeleton data-testid="avatar-both" shape="circle" width={32} height={24} />
        <Skeleton data-testid="avatar-constrained" shape="circle" width={300} />
        <Skeleton data-testid="avatar-percentage" shape="circle" width="60%" />
        <Skeleton
          data-testid="rect-radius"
          width={20}
          style={{ borderRadius: 'var(--radius-xs)' }}
        />
        <SkeletonText data-testid="text-shape" />
      </div>
      <button type="button" onClick={() => setAvatar(true)}>
        Show avatar
      </button>
      {(['default', 'center'] as const).map((alignment) => (
        <div
          key={alignment}
          data-avatar-row={alignment}
          style={{
            display: 'flex',
            inlineSize: 180,
            gap: 8,
            alignItems: alignment === 'center' ? 'center' : undefined,
          }}
        >
          {avatar ? (
            <Avatar alt="" name="Design studio" size="m" />
          ) : (
            <Skeleton shape="circle" width={40} />
          )}
          <span style={{ flex: '0 1 160px', minInlineSize: 0, minBlockSize: 80 }}>
            Text next to avatar
          </span>
        </div>
      ))}
      <button type="button" onClick={() => setHidden(!hidden)}>
        Toggle hidden
      </button>
      {displayStyles.map((display, index) =>
        (['rect', 'text'] as const).map((kind) => (
          <div key={`${index}-${kind}`} data-hidden-row="" style={{ display: 'flex', gap: 8 }}>
            {kind === 'text' ? (
              <SkeletonText {...display} width={64} lines={1} hidden={hidden} />
            ) : (
              <Skeleton {...display} width={64} hidden={hidden} />
            )}
            <span>Neighbor</span>
          </div>
        )),
      )}
      <div data-testid="focus-host">
        <button type="button" onClick={() => setUpdates(updates + 1)}>
          Update {updates}
        </button>
        <Skeleton
          data-testid="motion"
          width={80}
          {...({
            role: 'button',
            tabIndex: 0,
            'aria-label': 'Decorative placeholder',
            contentEditable: true,
          } as object)}
        />
        <SkeletonText data-testid="motion-text" lines={1} width={80} />
        <button type="button">Next action</button>
      </div>
      <div data-testid="edit-host" contentEditable suppressContentEditableWarning>
        <Skeleton data-testid="editable-shape" />
        <SkeletonText data-testid="editable-text" lines={1} />
      </div>
      <div
        data-testid="forced-colors-reference"
        style={{ backgroundColor: 'Canvas', outlineColor: 'GrayText' }}
      />
      <button type="button" onClick={() => setShowProbes(true)}>
        Mount observer probes
      </button>
      {showProbes && (
        <section
          data-testid="observer-probes"
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          <div dir="auto" data-testid="overridden-auto-root">
            <div style={{ inlineSize: 240, blockSize: 24, overflow: 'hidden' }}>
              <span data-testid="unrelated-subtree">Initial unrelated text</span>
            </div>
            <main dir="ltr" data-testid="overridden-ltr-main">
              <Skeleton data-testid="probe-overridden-ltr" width={80} />
            </main>
          </div>
          <div data-testid="probe-many-row" style={{ display: 'flex', alignItems: 'center' }}>
            {Array.from({ length: 68 }, (_, index) => (
              <div
                key={index}
                data-probe-sibling={index}
                style={{ inlineSize: 4, blockSize: 16, flex: 'none' }}
              />
            ))}
            <Skeleton data-testid="probe-many-skel" width={60} />
          </div>
          <style>{'.probe-flat [data-testid="probe-toggle-wrap"] { display: contents; }'}</style>
          <div style={{ width: 680, height: 40 }}>
            <span data-testid="probe-inline-label">
              <em>Short</em>
            </span>
            <span style={{ display: 'inline-block', width: 60 }}>
              <Skeleton data-testid="probe-inline-skel" width={60} />
            </span>
          </div>
          <div data-testid="probe-contents-row" style={{ display: 'flex', alignItems: 'center' }}>
            <div data-testid="probe-contents-wrap" style={{ display: 'contents' }}>
              <div
                data-testid="probe-contents-child"
                style={{ inlineSize: 20, blockSize: 16, flex: 'none' }}
              />
            </div>
            <div
              data-testid="probe-toggle-wrap"
              style={{ inlineSize: 20, blockSize: 16, flex: 'none' }}
            >
              <div
                data-testid="probe-toggle-inner"
                style={{ inlineSize: 20, blockSize: 16, flex: 'none' }}
              />
            </div>
            <Skeleton data-testid="probe-contents-skel" width={60} />
          </div>
          <div data-testid="probe-dir-auto" dir="auto" style={{ inlineSize: 240 }}>
            <span data-testid="probe-dir-auto-text">Abc</span>
            <Skeleton data-testid="probe-dir-auto-skel" width={80} />
          </div>
          <div data-testid="probe-text-row" style={{ display: 'flex', alignItems: 'center' }}>
            Short
            <div
              data-testid="probe-margin-sibling"
              style={{ inlineSize: 16, blockSize: 16, flex: 'none' }}
            />
            <Skeleton data-testid="probe-text-skel" width={60} />
          </div>
        </section>
      )}
    </div>
  );
}
