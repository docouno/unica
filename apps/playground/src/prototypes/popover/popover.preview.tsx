import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { Button } from '../button/button.proto.js';
import { Input } from '../input/input.proto.js';
import { Text } from '@docouno/unica';
import {
  PopoverBody,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
} from './popover.proto.js';
import type { PopoverAlign, PopoverSide, PopoverSize } from './popover.proto.js';

interface CompactPreview {
  readonly size: PopoverSize;
  readonly subject: { readonly 'data-wb-subject': '' };
  readonly onOpenChange: (open: boolean) => void;
}

// A bounded design harness, not the library's positioning/focus implementation.
export function PlacementExamples({
  preview,
}: {
  readonly preview?: CompactPreview;
}): ReactElement {
  const id = useId();
  const stageRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const modality = useRef('keyboard');
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState<PopoverSide>('bottom');
  const [align, setAlign] = useState<PopoverAlign>('start');
  const [anchor, setAnchor] = useState('center');
  const [placed, setPlaced] = useState('');
  const [value, setValue] = useState('Release notes');
  const previewSize = preview?.size;

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const stage = stageRef.current;
    const trigger = triggerRef.current;
    if (!open || !panel || !stage || !trigger) {
      return;
    }
    const position = (): void => {
      const body = panel.querySelector<HTMLElement>('.popover-body-proto');
      const bodyScrollTop = body?.scrollTop ?? 0;
      // The live inspector uses a natural-size top layer even in a scaled artboard.
      // Only the placement study uses the stage edges as collision boundaries.
      const box = previewSize ? undefined : stage.getBoundingClientRect();
      const target = trigger.getBoundingClientRect();
      const viewport = window.visualViewport;
      const viewportTop = viewport?.offsetTop ?? 0;
      const viewportBottom = viewportTop + (viewport?.height ?? window.innerHeight);
      const viewportLeft = viewport?.offsetLeft ?? 0;
      const viewportRight = viewportLeft + (viewport?.width ?? window.innerWidth);
      const left = Math.max(viewportLeft, box?.left ?? viewportLeft) + 16;
      const right = Math.min(viewportRight, box?.right ?? viewportRight) - 16;
      const top = Math.max(viewportTop, box?.top ?? viewportTop) + 16;
      const bottom = Math.min(viewportBottom, box?.bottom ?? viewportBottom) - 16;
      if (target.bottom < viewportTop || target.top > viewportBottom) {
        panel.hidePopover();
        return;
      }
      const preferred = previewSize
        ? { s: 18, m: 22, l: 28 }[previewSize] *
          Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
        : 352;
      panel.style.width = `${Math.min(preferred, right - left)}px`;
      const width = panel.getBoundingClientRect().width;
      // Measure intrinsic height before choosing the side and constraining the body.
      panel.style.maxHeight = 'none';
      const height = panel.getBoundingClientRect().height;
      const rtl = getComputedStyle(stage).direction === 'rtl';
      const room = {
        top: target.top - top - 8,
        bottom: bottom - target.bottom - 8,
        left: target.left - left - 8,
        right: right - target.right - 8,
      };
      let physical: 'top' | 'bottom' | 'left' | 'right' =
        side === 'start'
          ? rtl
            ? 'right'
            : 'left'
          : side === 'end'
            ? rtl
              ? 'left'
              : 'right'
            : side;
      if (physical === 'left' || physical === 'right') {
        if (room[physical] < width) {
          const opposite = physical === 'left' ? 'right' : 'left';
          physical = room[opposite] >= width ? opposite : 'bottom';
        }
      }
      if (physical === 'top' || physical === 'bottom') {
        const opposite = physical === 'top' ? 'bottom' : 'top';
        if (room[physical] < height && room[opposite] > room[physical]) {
          physical = opposite;
        }
      }
      const available = physical === 'top' || physical === 'bottom' ? room[physical] : bottom - top;
      panel.style.maxHeight = `${Math.max(0, available)}px`;
      if (body) {
        body.scrollTop = bodyScrollTop;
      }
      const actualHeight = panel.getBoundingClientRect().height;
      const factor = align === 'center' ? 0.5 : align === 'start' ? 0 : 1;
      let x: number;
      let y: number;
      if (physical === 'top' || physical === 'bottom') {
        const logicalFactor = rtl ? 1 - factor : factor;
        x = target.left + (target.width - width) * logicalFactor;
        y = physical === 'top' ? target.top - actualHeight - 8 : target.bottom + 8;
      } else {
        x = physical === 'left' ? target.left - width - 8 : target.right + 8;
        y = target.top + (target.height - actualHeight) * factor;
      }
      panel.style.left = `${Math.max(left, Math.min(x, right - width))}px`;
      panel.style.top = `${Math.max(top, Math.min(y, bottom - actualHeight))}px`;
      panel.style.visibility = 'visible';
      const logicalSide =
        physical === 'left'
          ? rtl
            ? 'end'
            : 'start'
          : physical === 'right'
            ? rtl
              ? 'start'
              : 'end'
            : physical;
      setPlaced(`${logicalSide} · ${align}`);
    };
    position();
    // Touch opens without a keyboard. Other input focuses the meaningful control.
    if (modality.current === 'touch') {
      panel.focus({ preventScroll: true });
    } else {
      panel.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true });
    }
    const observer = new ResizeObserver(position);
    observer.observe(stage);
    const onOutsideScroll = (event: Event): void => {
      // Scrolling the body must not remeasure its unconstrained height and reset it.
      if (event.target instanceof Node && panel.contains(event.target)) {
        return;
      }
      position();
    };
    window.addEventListener('resize', position);
    window.addEventListener('scroll', onOutsideScroll, true);
    window.visualViewport?.addEventListener('resize', position);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', onOutsideScroll, true);
      window.visualViewport?.removeEventListener('resize', position);
    };
  }, [open, side, align, anchor, previewSize]);

  const close = (): void => {
    panelRef.current?.hidePopover();
    triggerRef.current?.focus();
  };
  return (
    <div className="popover-demo-stack">
      {!preview && (
        <div className="popover-demo-options">
          <label>
            Side
            <select value={side} onChange={(event) => setSide(event.target.value as PopoverSide)}>
              {(['top', 'bottom', 'start', 'end'] as const).map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Alignment
            <select
              value={align}
              onChange={(event) => setAlign(event.target.value as PopoverAlign)}
            >
              {(['start', 'center', 'end'] as const).map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Anchor
            <select value={anchor} onChange={(event) => setAnchor(event.target.value)}>
              <option value="center">Center</option>
              <option value="top-start">Top start</option>
              <option value="bottom-end">Bottom end</option>
            </select>
          </label>
        </div>
      )}
      {!preview && (
        <Text className="popover-demo-note" size="caption-l" color="secondary">
          Open Settings, press Escape or click outside. Tab can leave the panel. This framed area
          acts as the available viewport: 8px anchor gap, 16px edge clearance, flip and shift.
        </Text>
      )}
      <div
        ref={stageRef}
        className="popover-demo-live-stage"
        data-anchor={anchor}
        style={preview ? { blockSize: 320 } : undefined}
      >
        {!preview && (
          <Text className="popover-demo-live-label" size="caption-l" color="muted">
            {open ? `Placed ${placed}` : 'Open the panel to explore'}
          </Text>
        )}
        <Button
          {...preview?.subject}
          ref={triggerRef}
          className="popover-demo-live-trigger"
          variant="secondary"
          tone="neutral"
          popoverTarget={`${id}-live`}
          aria-haspopup="dialog"
          aria-expanded={open}
          onPointerDown={(event) => {
            modality.current = event.pointerType;
          }}
          onKeyDown={() => {
            modality.current = 'keyboard';
          }}
        >
          Settings
        </Button>
        <PopoverContent
          {...preview?.subject}
          size={preview?.size ?? 'm'}
          ref={panelRef}
          id={`${id}-live`}
          popover="auto"
          tabIndex={-1}
          className="popover-demo-native"
          aria-labelledby={`${id}-title`}
          aria-describedby={`${id}-description`}
          onToggle={(event) => {
            const next = event.newState === 'open';
            setOpen(next);
            preview?.onOpenChange(next);
          }}
          onBlur={(event) => {
            const next = event.relatedTarget;
            if (
              next instanceof Node &&
              !event.currentTarget.contains(next) &&
              next !== triggerRef.current
            ) {
              panelRef.current?.hidePopover();
            }
          }}
        >
          <PopoverHeader>
            <PopoverTitle id={`${id}-title`}>Page settings</PopoverTitle>
            <PopoverDescription id={`${id}-description`}>
              Changes apply as you type.
            </PopoverDescription>
          </PopoverHeader>
          <PopoverClose onClick={close} />
          <PopoverBody>
            <Input
              label="Display name"
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
            <Text size="caption-l" color="secondary">
              This name appears in search and page links.
            </Text>
          </PopoverBody>
        </PopoverContent>
        {!preview && (
          <Button className="popover-demo-after" variant="ghost" tone="neutral" size="s">
            Next focus target
          </Button>
        )}
      </div>
      {!preview && (
        <Text className="popover-demo-result" size="body-s">
          Current name: {value || 'Untitled page'}
        </Text>
      )}
    </div>
  );
}
