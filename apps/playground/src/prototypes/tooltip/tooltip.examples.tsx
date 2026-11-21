import { useState } from 'react';
import type { ReactElement } from 'react';
import {
  ArrowSquareOutIcon,
  GearIcon,
  MagnifyingGlassIcon,
  SidebarSimpleIcon,
  StarIcon,
} from '@phosphor-icons/react';
import { IconButton } from '../button/button.proto.js';
import { Kbd, KbdGroup } from '@docouno/unica';
import { Link } from '../link/link.proto.js';
import { Text } from '../text/text.proto.js';
import { Tooltip } from './tooltip.proto.js';
import type { HintAlign, HintSide } from './tooltip.proto.js';
import { HintPreview } from './tooltip.preview.js';
import { Study } from './tooltip.study.js';
import './tooltip.examples.css';

export function TooltipContentExamples(): ReactElement {
  return (
    <div className="hint-demo-stack">
      <Study label="Label">
        <div className="hint-demo-pair">
          <Tooltip>Preferences</Tooltip>
          <IconButton
            icon={GearIcon}
            aria-label="Preferences"
            variant="ghost"
            tone="neutral"
            size="s"
          />
        </div>
      </Study>
      <Study label="Label + shortcut">
        <Tooltip
          shortcut={
            <KbdGroup separator="">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          }
        >
          Search everywhere
        </Tooltip>
      </Study>
      <Study label="Additional explanation">
        <Tooltip>Keep this panel visible while you browse other documents.</Tooltip>
      </Study>
    </div>
  );
}

export function TooltipStateExamples(): ReactElement {
  return (
    <div className="hint-demo-stack">
      <Study label="Keyboard focus · Pinned appearance">
        <div className="hint-demo-pair">
          <Tooltip shortcut="⌘,">Preferences</Tooltip>
          <IconButton
            icon={GearIcon}
            aria-label="Preferences"
            variant="ghost"
            tone="neutral"
            size="s"
            previewState="focus"
          />
        </div>
      </Study>
      <Study label="Selected source · Pinned appearance">
        <div className="hint-demo-pair">
          <Tooltip>Remove from saved</Tooltip>
          <IconButton
            icon={StarIcon}
            aria-label="Remove from saved"
            variant="secondary"
            tone="neutral"
            size="s"
            pressed
          />
        </div>
      </Study>
      <Study label="Unavailable source · Explanation stays in the page">
        <div className="hint-demo-row">
          <IconButton
            icon={ArrowSquareOutIcon}
            aria-label="Publish"
            variant="ghost"
            tone="neutral"
            size="s"
            disabled
          />
          <Text size="body-s" color="secondary">
            Only editors can publish.
          </Text>
        </div>
      </Study>
    </div>
  );
}

export function TooltipOverflowExamples(): ReactElement {
  return (
    <div className="hint-demo-stack">
      <Study label="Wrap the label · Keep the shortcut whole">
        <div className="hint-demo-long">
          <Tooltip
            shortcut={
              <KbdGroup>
                <Kbd>Ctrl</Kbd>
                <Kbd>Shift</Kbd>
                <Kbd>F</Kbd>
              </KbdGroup>
            }
          >
            Search across all documents in this workspace
          </Tooltip>
        </div>
      </Study>
      <Study label="Full identifier · No ellipsis inside the hint">
        <Tooltip>
          <bdi dir="ltr">replica-eu-central-production-archive-2026</bdi>
        </Tooltip>
      </Study>
      <Study label="Long explanation · One compact measure">
        <Tooltip>
          Open this document in a separate window. Your current position and any unsaved changes
          stay in this tab.
        </Tooltip>
      </Study>
    </div>
  );
}

export function TooltipLiveExamples(): ReactElement {
  const [action, setAction] = useState('Hover or Tab to a control.');
  const [saved, setSaved] = useState(false);
  return (
    <div className="hint-demo-stack">
      <div className="hint-demo-row">
        <HintPreview
          shortcut="⌘K"
          trigger={(bindings) => (
            <IconButton
              {...bindings}
              icon={MagnifyingGlassIcon}
              aria-label="Search"
              variant="ghost"
              tone="neutral"
              size="m"
              onClick={(event) => {
                bindings.onClick?.(event);
                setAction('Search activated.');
              }}
            />
          )}
        >
          Search
        </HintPreview>
        <HintPreview
          shortcut="⌘,"
          trigger={(bindings) => (
            <IconButton
              {...bindings}
              icon={GearIcon}
              aria-label="Preferences"
              variant="ghost"
              tone="neutral"
              size="m"
              onClick={(event) => {
                bindings.onClick?.(event);
                setAction('Preferences activated.');
              }}
            />
          )}
        >
          Preferences
        </HintPreview>
        <HintPreview
          trigger={(bindings) => (
            <IconButton
              {...bindings}
              icon={StarIcon}
              aria-label={saved ? 'Remove from saved' : 'Save document'}
              pressed={saved}
              variant="ghost"
              tone="neutral"
              size="m"
              onClick={(event) => {
                bindings.onClick?.(event);
                setSaved(!saved);
                setAction(saved ? 'Removed from saved.' : 'Document saved.');
              }}
            />
          )}
        >
          {saved ? 'Remove from saved' : 'Save document'}
        </HintPreview>
      </div>
      <Text size="body-s" color="secondary" role="status">
        {action}
      </Text>
      <Study label="Extra description · Available to assistive technology while closed">
        <HintPreview
          description="Keep this panel visible while you browse other documents."
          trigger={(bindings) => (
            <IconButton
              {...bindings}
              icon={SidebarSimpleIcon}
              aria-label="Pin inspector"
              variant="secondary"
              tone="neutral"
              size="m"
            />
          )}
        >
          Keep this panel visible while you browse other documents.
        </HintPreview>
      </Study>
    </div>
  );
}

export function TooltipPlacementExamples(): ReactElement {
  const [side, setSide] = useState<HintSide>('top');
  const [align, setAlign] = useState<HintAlign>('center');
  const [anchor, setAnchor] = useState('center');
  return (
    <div className="hint-demo-stack">
      <div className="hint-demo-options">
        <label>
          Side
          <select value={side} onChange={(event) => setSide(event.target.value as HintSide)}>
            {['top', 'bottom', 'start', 'end'].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Align
          <select value={align} onChange={(event) => setAlign(event.target.value as HintAlign)}>
            {['start', 'center', 'end'].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Source
          <select value={anchor} onChange={(event) => setAnchor(event.target.value)}>
            {['center', 'top-start', 'bottom-end'].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="hint-demo-stage" data-anchor={anchor} data-hint-bounds>
        <span className="hint-demo-stage-label hint-demo-label">
          Hover or Tab · 8px gap · Flip and shift at edges
        </span>
        <div className="hint-demo-anchor">
          <HintPreview
            side={side}
            align={align}
            shortcut="⌘,"
            trigger={(bindings) => (
              <IconButton
                {...bindings}
                icon={GearIcon}
                aria-label="Preferences"
                variant="secondary"
                tone="neutral"
                size="m"
              />
            )}
          >
            Preferences
          </HintPreview>
        </div>
        <Link className="hint-demo-after" href="#after-tooltip">
          Next focus target
        </Link>
      </div>
    </div>
  );
}

export function TooltipContextExamples(): ReactElement {
  return (
    <div className="hint-demo-rail">
      <div className="hint-demo-rail-icons">
        <IconButton
          icon={MagnifyingGlassIcon}
          aria-label="Search"
          variant="ghost"
          tone="neutral"
          size="m"
        />
        <IconButton
          icon={StarIcon}
          aria-label="Saved documents"
          variant="ghost"
          tone="neutral"
          size="m"
        />
        <IconButton
          icon={GearIcon}
          aria-label="Preferences"
          variant="ghost"
          tone="neutral"
          size="m"
          previewState="hover"
        />
      </div>
      <Tooltip shortcut="⌘,">Preferences</Tooltip>
    </div>
  );
}
