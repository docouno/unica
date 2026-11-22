import { useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Tooltip,
  TooltipProvider,
} from '@docouno/unica';

const sides = ['top', 'bottom', 'start', 'end'] as const;
const alignments = ['start', 'center', 'end'] as const;

const targetStyle: CSSProperties = {
  position: 'fixed',
  left: 430,
  top: 320,
  width: 116,
  height: 24,
  padding: 0,
};

export default function HoverPreviewGeometryFixture() {
  const [side, setSide] = useState<(typeof sides)[number]>('bottom');
  const [align, setAlign] = useState<(typeof alignments)[number]>('center');
  const [open, setOpen] = useState<'placement' | 'tall' | 'avoid' | null>(null);
  const [avoid, setAvoid] = useState<HTMLDivElement | null>(null);
  const [date, setDate] = useState<HTMLButtonElement | null>(null);
  const [lastClose, setLastClose] = useState('');
  const native = useRef<HTMLDivElement>(null);
  const raised = useRef<HTMLButtonElement>(null);

  return (
    <main id="geometry">
      <label htmlFor="geometry-side">Side</label>
      <select
        id="geometry-side"
        value={side}
        onChange={(event) => setSide(event.target.value as (typeof sides)[number])}
      >
        {sides.map((value) => (
          <option key={value}>{value}</option>
        ))}
      </select>
      <label htmlFor="geometry-align">Align</label>
      <select
        id="geometry-align"
        value={align}
        onChange={(event) => setAlign(event.target.value as (typeof alignments)[number])}
      >
        {alignments.map((value) => (
          <option key={value}>{value}</option>
        ))}
      </select>
      <button type="button" onClick={() => setOpen('placement')}>
        Show placement
      </button>
      <button type="button" onClick={() => setOpen('tall')}>
        Show tall card
      </button>
      <button type="button" onClick={() => setOpen('avoid')}>
        Show rejected date
      </button>
      <button type="button" onClick={() => native.current?.showPopover()}>
        Show auto parent
      </button>
      <button type="button" onClick={() => raised.current?.showPopover()}>
        Raise anchor
      </button>
      <output id="geometry-close">{lastClose}</output>

      <TooltipProvider delay={0}>
        <Tooltip
          id="placement-panel"
          label="Placement preview"
          side={side}
          align={align}
          open={open === 'placement'}
          onOpenChange={(next) => {
            if (!next) {
              setOpen(null);
            }
          }}
        >
          <button type="button" id="placement-anchor" style={targetStyle}>
            Placement anchor
          </button>
        </Tooltip>

        <HoverCard
          open={open === 'tall'}
          onOpenChange={(next) => {
            if (!next) {
              setOpen(null);
            }
          }}
        >
          <HoverCardTrigger href="#geometry" id="tall-anchor" style={{ ...targetStyle, top: 204 }}>
            Tall preview anchor
          </HoverCardTrigger>
          <HoverCardContent id="tall-panel" side={side} align={align}>
            <div style={{ minHeight: 280 }}>Scrollable preview</div>
          </HoverCardContent>
        </HoverCard>

        <div
          ref={setAvoid}
          id="geometry-avoid"
          style={{ position: 'fixed', inset: '120px auto auto 350px', width: 240, height: 260 }}
        >
          <button
            ref={setDate}
            type="button"
            id="date-anchor"
            aria-disabled="true"
            style={{ position: 'absolute', inset: '100px auto auto 12px' }}
          >
            Rejected date
          </button>
          <Tooltip
            anchor={date}
            avoid={avoid}
            open={open === 'avoid' && date !== null}
            id="date-panel"
            label="The selected date is unavailable."
            side="bottom"
            align="center"
            onOpenChange={(next) => {
              if (!next) {
                setOpen(null);
              }
            }}
          />
        </div>

        <div
          style={{
            position: 'fixed',
            top: 475,
            left: 0,
            width: 90,
            height: 75,
            overflow: 'hidden',
            transform: 'translateZ(0)',
          }}
        >
          <div
            ref={native}
            id="geometry-native-auto"
            popover="auto"
            style={{ position: 'fixed', inset: '335px auto auto 520px', margin: 0, width: 164 }}
          >
            <div id="geometry-scrollport" style={{ height: 66, overflow: 'auto' }}>
              <Tooltip
                id="nested-panel"
                label="Lifted source preview"
                onOpenChange={(next, details) => {
                  if (!next) {
                    setLastClose(details.reason);
                  }
                }}
              >
                <button type="button" id="nested-anchor" style={{ width: 130, height: 30 }}>
                  Lifted source
                </button>
              </Tooltip>
              <div style={{ height: 300 }} />
            </div>
            <button
              type="button"
              id="nested-neighbor"
              aria-label="Neighboring action"
              style={{ position: 'absolute', top: 0, left: 142, width: 22, height: 22 }}
            />
          </div>

          <Tooltip id="raised-panel" label="Top-layer anchor preview">
            <button
              type="button"
              ref={raised}
              id="raised-anchor"
              popover="manual"
              style={{ position: 'fixed', inset: '190px auto auto 410px', margin: 0 }}
            >
              Raised source
            </button>
          </Tooltip>
        </div>
      </TooltipProvider>
    </main>
  );
}
