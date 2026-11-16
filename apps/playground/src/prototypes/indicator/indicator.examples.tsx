import { useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import {
  BellIcon,
  ChatCircleIcon,
  EnvelopeSimpleIcon,
  GearIcon,
  TrayIcon,
} from '@phosphor-icons/react';
import { Avatar } from '../avatar/avatar.proto.js';
import { Badge } from '../badge/badge.proto.js';
import { Button, IconButton } from '../button/button.proto.js';
import { Icon } from '../icon/icon.proto.js';
import { Indicator } from './indicator.proto.js';
import type { IndicatorPlacement, IndicatorSize, IndicatorStatus } from './indicator.proto.js';
import './indicator.examples.css';

const sizes: readonly IndicatorSize[] = ['s', 'm', 'l'];
const statuses: readonly IndicatorStatus[] = [
  'neutral',
  'accent',
  'info',
  'success',
  'warning',
  'danger',
];
const corners: readonly IndicatorPlacement[] = [
  'top-start',
  'top-end',
  'bottom-start',
  'bottom-end',
];

function Sample({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className="indicator-example-sample">
      <div className="indicator-example-object">{children}</div>
      <span className="indicator-example-label">{label}</span>
    </div>
  );
}

export function IndicatorOverview(): ReactElement {
  return (
    <div className="indicator-example-stack">
      <div className="indicator-example-use">
        <div className="indicator-example-toolbar">
          <Indicator count={3} size="s">
            <IconButton icon={BellIcon} aria-label="Notifications, 3 unread" />
          </Indicator>
          <IconButton icon={GearIcon} variant="ghost" aria-label="Settings" />
        </div>
        <div>
          <strong>Unread notifications</strong>
          <p>One small signal beside everyday actions.</p>
        </div>
      </div>
      <div className="indicator-example-use">
        <div className="indicator-example-object">
          <Indicator dot status="success" overlap="circular" placement="bottom-end">
            <Avatar src="/assets/avatar-portrait-wide.png" alt="Sample collaborator" />
          </Indicator>
        </div>
        <div>
          <strong>Available to collaborate</strong>
          <p>Presence keeps a visible text equivalent.</p>
        </div>
      </div>
      <div className="indicator-example-use">
        <div className="indicator-example-object">
          <Indicator count={12} size="s" status="neutral">
            <Button variant="secondary" tone="neutral" size="s" aria-label="Inbox, 12 unread">
              Inbox
            </Button>
          </Indicator>
        </div>
        <div>
          <strong>Waiting in your inbox</strong>
          <p>Known quantity, without an alarm color.</p>
        </div>
      </div>
    </div>
  );
}

export function IndicatorScale(): ReactElement {
  return (
    <div className="indicator-example-stack">
      {sizes.map((size) => (
        <div className="indicator-example-scale" key={size}>
          <span className="indicator-example-label">{size.toUpperCase()}</span>
          <Sample label="One digit">
            <Indicator count={4} size={size}>
              <IconButton icon={BellIcon} size={size} aria-label="Notifications, 4 unread" />
            </Indicator>
          </Sample>
          <Sample label="Capped">
            <Indicator count={105} size={size}>
              <IconButton icon={TrayIcon} size={size} aria-label="Inbox, 105 unread" />
            </Indicator>
          </Sample>
          <Sample label="Presence">
            <Indicator dot size={size} status="success" overlap="circular" placement="bottom-end">
              <Avatar size={size} initials="AL" aria-label="Sample collaborator, available" />
            </Indicator>
          </Sample>
        </div>
      ))}
    </div>
  );
}

export function IndicatorStatuses(): ReactElement {
  return (
    <div className="indicator-example-statuses">
      {statuses.map((status) => (
        <div className="indicator-example-status" key={status}>
          <span className="indicator-example-label">{status}</span>
          <Indicator count={8} size="s" status={status}>
            <IconButton
              icon={TrayIcon}
              size="s"
              aria-label={`${status} counter example, 8 items`}
            />
          </Indicator>
          <Indicator dot status={status} overlap="circular" placement="bottom-end">
            <Avatar size="s" initials="AL" aria-label={`${status} presence example`} />
          </Indicator>
        </div>
      ))}
    </div>
  );
}

export function IndicatorCorners(): ReactElement {
  const [dot, setDot] = useState(false);
  return (
    <div className="indicator-example-stack">
      <label className="indicator-example-choice">
        <input type="checkbox" checked={dot} onChange={(event) => setDot(event.target.checked)} />
        Show dots instead of counters
      </label>
      {(['rectangular', 'circular'] as const).map((overlap) => (
        <div key={overlap} className="indicator-example-stack">
          <span className="indicator-example-label">
            {overlap === 'circular' ? 'Avatar contour' : 'Control corners'}
          </span>
          <div className="indicator-example-corners">
            {corners.map((placement) => (
              <Sample key={placement} label={placement}>
                <Indicator dot={dot} count={3} size="s" overlap={overlap} placement={placement}>
                  {overlap === 'circular' ? (
                    <Avatar initials="AL" aria-label={`Avatar, ${placement} marker`} />
                  ) : (
                    <IconButton
                      icon={BellIcon}
                      aria-label={`Notifications, ${placement} marker, 3 unread`}
                    />
                  )}
                </Indicator>
              </Sample>
            ))}
          </div>
        </div>
      ))}
      <p className="indicator-example-note">
        Start and end follow the reading direction. The avatar anchor follows its outline in every
        material.
      </p>
    </div>
  );
}

export function IndicatorData(): ReactElement {
  const [count, setCount] = useState<number | null>(3);
  const [visible, setVisible] = useState(true);
  const [showZero, setShowZero] = useState(false);
  const [hostVisible, setHostVisible] = useState(true);
  const name =
    count === null ? 'Notifications, count unavailable' : `Notifications, ${count} unread`;
  return (
    <div className="indicator-example-stack">
      <div className="indicator-example-data-grid">
        {[
          { label: 'No data', count: null },
          { label: 'Zero · hidden', count: 0 },
          { label: 'Zero · shown', count: 0, showZero: true },
          { label: 'One digit', count: 9 },
          { label: 'Two digits', count: 10 },
          { label: 'At limit', count: 99 },
          { label: 'Over limit', count: 105 },
          { label: 'Limit 9', count: 12, max: 9 },
        ].map((sample) => (
          <Sample key={sample.label} label={sample.label}>
            <Indicator
              count={sample.count}
              showZero={sample.showZero ?? false}
              max={sample.max ?? 99}
              size="s"
            >
              <IconButton
                icon={BellIcon}
                aria-label={`Notifications, ${sample.count ?? 'unknown'} unread`}
              />
            </Indicator>
          </Sample>
        ))}
      </div>
      <div className="indicator-example-live">
        <div className="indicator-example-toolbar">
          <Indicator count={count} visible={visible} showZero={showZero}>
            <IconButton
              icon={BellIcon}
              aria-label={name}
              hidden={!hostVisible}
              onClick={() => setCount(0)}
            />
          </Indicator>
          <IconButton icon={GearIcon} variant="ghost" aria-label="Settings next to notifications" />
          <span className="indicator-example-label" role="status">
            {count === null ? 'Count unavailable' : `${count} unread`}
          </span>
        </div>
        <div className="indicator-example-actions">
          <Button
            variant="secondary"
            tone="neutral"
            size="s"
            onClick={() => setCount((value) => (value ?? 0) + 1)}
          >
            Add one
          </Button>
          <Button variant="ghost" tone="neutral" size="s" onClick={() => setCount(99)}>
            Set 99
          </Button>
          <Button variant="ghost" tone="neutral" size="s" onClick={() => setCount(105)}>
            Set 105
          </Button>
          <Button variant="ghost" tone="neutral" size="s" onClick={() => setCount(null)}>
            No data
          </Button>
        </div>
        <div className="indicator-example-actions">
          <label className="indicator-example-choice">
            <input
              type="checkbox"
              checked={visible}
              onChange={(event) => setVisible(event.target.checked)}
            />
            Show marker
          </label>
          <label className="indicator-example-choice">
            <input
              type="checkbox"
              checked={showZero}
              onChange={(event) => setShowZero(event.target.checked)}
            />
            Show zero
          </label>
          <label className="indicator-example-choice">
            <input
              type="checkbox"
              checked={hostVisible}
              onChange={(event) => setHostVisible(event.target.checked)}
            />
            Show host
          </label>
        </div>
        <p className="indicator-example-note">
          Live: activate the bell to mark all as read. Focus and the neighboring action stay in
          place.
        </p>
      </div>
    </div>
  );
}

function SurfacePair({ withBorder = true }: { readonly withBorder?: boolean }): ReactElement {
  return (
    <div className="indicator-example-surface-pair">
      <Indicator count={12} size="s" withBorder={withBorder}>
        <IconButton icon={BellIcon} aria-label="Notifications, 12 unread" />
      </Indicator>
      <Indicator
        dot
        status="success"
        overlap="circular"
        placement="bottom-end"
        withBorder={withBorder}
      >
        <Avatar src="/assets/avatar-portrait-wide.png" alt="Sample collaborator, available" />
      </Indicator>
      <Indicator count={3} size="s" withBorder={withBorder}>
        <Button size="s" aria-label="Inbox, 3 unread">
          Inbox
        </Button>
      </Indicator>
    </div>
  );
}

export function IndicatorSurfaces(): ReactElement {
  return (
    <div className="indicator-example-stack">
      {(['shell', 'canvas', 'surface'] as const).map((surface) => (
        <div key={surface} className="indicator-example-surface" data-ground={surface}>
          <div className="indicator-example-surface-row">
            <span className="indicator-example-label">{surface} · separated</span>
            <SurfacePair />
          </div>
          <div className="indicator-example-surface-row">
            <span className="indicator-example-label">without separator</span>
            <SurfacePair withBorder={false} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function IndicatorOverlay(): ReactElement {
  return (
    <div className="indicator-example-overlay" data-surface="overlay">
      <strong>Activity & availability</strong>
      <p className="indicator-example-note">Compact markers on a floating surface.</p>
      <SurfacePair />
      <div className="indicator-example-use">
        <Indicator dot status="success" overlap="circular" placement="bottom-end">
          <Avatar src="/assets/avatar-portrait-tall.png" alt="Sample collaborator" />
        </Indicator>
        <div>
          <strong>Available</strong>
          <p>Ready for a conversation</p>
        </div>
      </div>
      <div className="indicator-example-use">
        <Indicator dot status="warning" overlap="circular" placement="bottom-end">
          <Avatar initials="AL" aria-label="Sample collaborator" />
        </Indicator>
        <div>
          <strong>Away</strong>
          <p>Replies may take a little longer</p>
        </div>
      </div>
      <div className="indicator-example-use">
        <Indicator dot visible={false} status="neutral" overlap="circular" placement="bottom-end">
          <Avatar initials="RK" aria-label="Sample collaborator" />
        </Indicator>
        <div>
          <strong>Offline</strong>
          <p>Leave a message for later</p>
        </div>
      </div>
    </div>
  );
}

export function IndicatorHostStates(): ReactElement {
  return (
    <div className="indicator-example-stack">
      <div className="indicator-example-data-grid">
        {(['rest', 'hover', 'active', 'focus'] as const).map((state) => (
          <Sample key={state} label={state}>
            <Indicator count={12} size="s">
              <IconButton
                icon={BellIcon}
                aria-label="Notifications, 12 unread"
                previewState={state}
              />
            </Indicator>
          </Sample>
        ))}
        <Sample label="Disabled host">
          <Indicator count={12} size="s" status="neutral">
            <IconButton
              icon={BellIcon}
              aria-label="Notifications unavailable, 12 unread"
              disabled
            />
          </Indicator>
        </Sample>
        <Sample label="Busy host">
          <Indicator count={12} size="s">
            <IconButton
              icon={BellIcon}
              aria-label="Refreshing notifications, 12 unread"
              loading
              previewFocus
            />
          </Indicator>
        </Sample>
        <Sample label="Dot + focus">
          <Indicator dot>
            <IconButton
              icon={ChatCircleIcon}
              aria-label="Messages, new activity"
              previewState="focus"
            />
          </Indicator>
        </Sample>
        <Sample label="Count + focus">
          <Indicator count={105}>
            <IconButton icon={TrayIcon} aria-label="Inbox, 105 unread" previewState="focus" />
          </Indicator>
        </Sample>
      </div>
      <p className="indicator-example-note">
        Pinned host states for comparison. The marker has no hover, press, focus or loading state of
        its own. A known count can remain when its action is unavailable.
      </p>
      <div className="indicator-example-actions">
        <Indicator count={3} size="s">
          <Button variant="secondary" tone="neutral" size="s" aria-label="Open inbox, 3 unread">
            Open inbox
          </Button>
        </Indicator>
        <Button variant="ghost" tone="neutral" size="s">
          Next action
        </Button>
      </div>
      <p className="indicator-example-note">
        Live: Tab to Open inbox. Only the host receives focus; the marker is never a separate stop.
      </p>
    </div>
  );
}

export function IndicatorBoundaries(): ReactElement {
  return (
    <div className="indicator-example-stack">
      <div className="indicator-example-long">
        <Indicator count={105} size="s" width="full">
          <Button
            variant="secondary"
            tone="neutral"
            width="full"
            aria-label="Review all incoming collaboration requests, 105 unread"
          >
            Review all incoming collaboration requests
          </Button>
        </Indicator>
      </div>
      <p className="indicator-example-note">
        The host can wrap; the number stays on one line. Keep clearance outside the host for the
        largest marker.
      </p>
      <div className="indicator-example-contained">
        <span>Incoming requests</span>
        <Badge>
          <bdi dir="ltr">99+</bdi>
        </Badge>
      </div>
      <p className="indicator-example-note">
        In a clipped or crowded row, keep the quantity in flow with Badge.
      </p>
      <div className="indicator-example-actions">
        <span className="indicator-example-object">
          <Indicator dot size="s" withBorder={false}>
            <Icon icon={EnvelopeSimpleIcon} size="l" aria-label="Unread message" />
          </Indicator>
        </span>
        <span className="indicator-example-note">A bare glyph needs its own accessible name.</span>
      </div>
      <div className="indicator-example-directions">
        {(['ltr', 'rtl'] as const).map((direction) => (
          <div key={direction} dir={direction} className="indicator-example-direction">
            <span className="indicator-example-label">{direction.toUpperCase()}</span>
            <Indicator count={105} size="s">
              <IconButton icon={BellIcon} aria-label="Notifications, 105 unread" />
            </Indicator>
            <span className="indicator-example-label">top-end</span>
          </div>
        ))}
      </div>
    </div>
  );
}
