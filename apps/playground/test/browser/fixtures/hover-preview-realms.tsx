import { useLayoutEffect, useRef } from 'react';
import type { JSX } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { Tooltip } from '@docouno/unica';
import type { HoverPreviewChangeDetails } from '@docouno/unica';
import {
  HoverCard as CopyHoverCard,
  HoverCardContent as CopyHoverCardContent,
  HoverCardTrigger as CopyHoverCardTrigger,
  Tooltip as CopyTooltip,
} from '../../../../../packages/ui/test/browser/hover-preview-copy.js';

function protocolKeys(document: Document): number {
  return Object.getOwnPropertySymbols(document).filter((key) =>
    Symbol.keyFor(key)?.startsWith('@docouno/unica'),
  ).length;
}

export default function HoverPreviewRealmsFixture(): JSX.Element {
  const container = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const fixture = container.current!;
    const document = fixture.ownerDocument;
    const mounts = new Map<string, Root>();
    const notices: string[] = [];
    const baseKeys = protocolKeys(document);
    const report = (id: string) => (open: boolean, details: HoverPreviewChangeDetails) => {
      notices.push(`${id}:${open}:${details.reason}`);
      fixture.dataset.notices = JSON.stringify(notices);
    };

    function mount(id: string): void {
      if (mounts.has(id)) {
        return;
      }
      const slot = fixture.querySelector<HTMLElement>(`#${id}-root`)!;
      const node =
        slot.localName === 'iframe' ? (slot as HTMLIFrameElement).contentDocument!.body : slot;
      const root = createRoot(node);
      mounts.set(id, root);
      const SourceTooltip = id.endsWith('a') ? Tooltip : CopyTooltip;
      root.render(
        <div style={{ margin: '55px 20px 0' }}>
          <SourceTooltip
            label={`Hint ${id}`}
            id={`${id}-preview`}
            defaultOpen={id.startsWith('frame')}
            onOpenChange={report(id)}
          >
            <button type="button" id={`${id}-source`}>
              Source {id}
            </button>
          </SourceTooltip>
          {id === 'b' ? (
            <CopyHoverCard onOpenChange={report('b-card')}>
              <CopyHoverCardTrigger id="b-card-source" href="#destination">
                Team link
              </CopyHoverCardTrigger>
              <CopyHoverCardContent id="b-card-preview">
                <p>Team preview from the second bundle</p>
              </CopyHoverCardContent>
            </CopyHoverCard>
          ) : null}
        </div>,
      );
    }

    for (const frame of fixture.querySelectorAll('iframe')) {
      const child = frame.contentDocument!;
      child.documentElement.dataset.theme = document.documentElement.dataset.theme;
      for (const style of document.head.querySelectorAll('style')) {
        child.head.appendChild(style.cloneNode(true));
      }
    }
    for (const id of ['a', 'b', 'frame-a', 'frame-b']) {
      mount(id);
    }
    fixture.dataset.distinct = String(Tooltip !== CopyTooltip);

    function onCommand(event: Event): void {
      const { type, id } = (event as CustomEvent<{ type: string; id: string }>).detail;
      if (type === 'mount') {
        mount(id);
      } else if (type === 'unmount') {
        mounts.get(id)?.unmount();
        mounts.delete(id);
      } else if (type === 'keys') {
        fixture.dataset.keys = String(protocolKeys(document) - baseKeys);
      }
    }

    fixture.addEventListener('test-command', onCommand);
    return () => {
      fixture.removeEventListener('test-command', onCommand);
      queueMicrotask(() => {
        for (const root of mounts.values()) {
          root.unmount();
        }
      });
    };
  }, []);

  return (
    <div ref={container} id="hover-preview-realms" style={{ padding: '10px 30px' }}>
      <div style={{ display: 'flex', gap: 20 }}>
        <div id="a-root" />
        <div id="b-root" />
      </div>
      <div style={{ display: 'flex', gap: 20, marginBlockStart: 50 }}>
        <iframe title="Preview frame A" id="frame-a-root" width={300} height={115} />
        <iframe title="Preview frame B" id="frame-b-root" width={300} height={115} />
      </div>
      <div id="destination">Team destination</div>
    </div>
  );
}
