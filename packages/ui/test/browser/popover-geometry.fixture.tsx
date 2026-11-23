import { useState } from 'react';
import type { JSX } from 'react';
import {
  Popover,
  PopoverBody,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverFooter,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '../../src/index.js';

const rows = Array.from({ length: 16 }, (_, index) => 'Setting ' + (index + 1));

export default function PopoverGeometryFixture(): JSX.Element {
  const [changes, setChanges] = useState<boolean[]>([]);
  const [actions, setActions] = useState(0);
  const [side, setSide] = useState<'bottom' | 'start'>('bottom');
  return (
    <>
      <style>{`
        .fixture-invisible { visibility: hidden; }
        .fixture-visible { visibility: visible; }
        .fixture-transparent { opacity: 0; }
      `}</style>
      <div id="visibility-witness" />
      <output id="geometry-log" data-actions={actions}>
        {JSON.stringify(changes)}
      </output>
      <button id="geometry-side" hidden type="button" onClick={() => setSide('start')}>
        Place inline
      </button>
      <Popover onOpenChange={(open) => setChanges((previous) => [...previous, open])}>
        <PopoverTrigger id="geometry-fallback" style={{ position: 'fixed', top: 10, right: 16 }}>
          Fallback anchor
        </PopoverTrigger>
        <div
          id="geometry-clip"
          style={{
            position: 'fixed',
            overflow: 'hidden',
            contain: 'paint',
            transform: 'translateX(0)',
            top: 72,
            left: 20,
            width: 140,
            height: 44,
            paddingBlockStart: 8,
          }}
        >
          <PopoverTrigger
            id="geometry-trigger"
            style={{ display: 'block', width: 112, height: 24 }}
          >
            Open details
          </PopoverTrigger>
          <div aria-hidden="true" style={{ height: 260 }} />
          <PopoverContent id="geometry-panel" size="l" side={side} style={{ inlineSize: '28rem' }}>
            <PopoverHeader id="geometry-header">
              <PopoverTitle>Document settings</PopoverTitle>
              <PopoverDescription>Choose the visible document details.</PopoverDescription>
              <PopoverClose />
            </PopoverHeader>
            <PopoverBody id="geometry-body">
              <button id="geometry-action" type="button" onClick={() => setActions(actions + 1)}>
                Panel action
              </button>
              {rows.map((name) => (
                <label key={name} style={{ display: 'block', paddingBlock: 8 }}>
                  <input type="checkbox" /> {name}
                </label>
              ))}
            </PopoverBody>
            <PopoverFooter id="geometry-footer">
              <button id="geometry-last" type="button" onClick={() => setActions(actions + 1)}>
                Keep settings
              </button>
            </PopoverFooter>
          </PopoverContent>
        </div>
      </Popover>
    </>
  );
}
